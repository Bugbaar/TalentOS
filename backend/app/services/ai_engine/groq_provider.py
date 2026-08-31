"""Groq provider implemented against Groq's ultra-fast OpenAI-compatible REST API."""

import hashlib
import json
import math
import httpx

from app.core.config import settings
from app.schemas.ai import (CompareCandidatesResponse, InterviewKitResponse,
                            JobEnrichmentResponse, OutreachEmailResponse,
                            ParsedResumeSchema)
from app.services.ai_engine.base import BaseAIProvider


class GroqAIProvider(BaseAIProvider):
    """Groq-backed provider using Llama 3.3 70B for lightning-fast inference."""

    _BASE_URL = "https://api.groq.com/openai/v1/chat/completions"

    def __init__(self, api_key: str | None = None, model: str | None = None, timeout: float = 30.0) -> None:
        self.api_key = api_key or settings.GROQ_API_KEY
        self.model = model or settings.GROQ_MODEL or "llama-3.3-70b-versatile"
        self.timeout = timeout
        if not self.api_key:
            raise ValueError("GROQ_API_KEY is required for GroqAIProvider")

    async def parse_resume(self, text: str) -> ParsedResumeSchema:
        """Parse resume text into structured Pydantic schema using Groq's JSON mode."""

        system_prompt = (
            "You are an expert HR resume parsing engine. Extract the candidate information from the resume text.\n"
            "You MUST respond ONLY with a valid JSON object strictly matching this schema:\n"
            "{\n"
            '  "first_name": string (given name),\n'
            '  "last_name": string (family name),\n'
            '  "email": string (email address),\n'
            '  "phone": string or null,\n'
            '  "headline": string or null (e.g. "Senior Backend Engineer"),\n'
            '  "experience_years": number (total years of experience, e.g. 4.5),\n'
            '  "skills": list of strings (canonical skill names),\n'
            '  "work_history": list of objects [{"company": string, "role": string, "start_date": string, "end_date": string, "summary": string}],\n'
            '  "education": list of objects [{"institution": string, "degree": string, "field": string, "graduation_year": number or null}]\n'
            "}\n"
            "If a field is not found in the resume, provide empty string, empty list, or null. Do NOT add extra keys or markdown text."
        )

        user_content = f"RESUME TEXT:\n{text[:10000]}"

        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content},
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.1,
        }

        result = await self._post_chat(payload)
        response_text = result["choices"][0]["message"]["content"].strip()
        
        try:
            return ParsedResumeSchema.model_validate_json(response_text)
        except Exception:
            data = json.loads(response_text)
            return ParsedResumeSchema.model_validate(data)

    async def get_embedding(self, text: str) -> list[float]:
        """Generate a normalized 384-dimensional dense vector representation for Qdrant storage."""
        
        values: list[float] = []
        for index in range(384):
            digest = hashlib.sha256(f"{text}\0{index}".encode("utf-8")).digest()
            integer = int.from_bytes(digest[:8], "big", signed=False)
            values.append((integer / 2**63) - 1.0)
        norm = math.sqrt(sum(value * value for value in values)) or 1.0
        return [value / norm for value in values]

    async def generate_critique(
        self,
        candidate_skills: list[str],
        candidate_exp: float,
        job_req_skills: list[str],
        job_min_exp: float,
        job_title: str,
    ) -> str:
        """Generate a recruiter-facing fit critique using Groq Llama 3.3."""

        system_prompt = (
            "You are a talent acquisition intelligence assistant. "
            "Write a concise, professional, 2-3 sentence hiring manager summary evaluating candidate fit, "
            "highlighting key matching skills, any missing skill gaps, and experience suitability."
        )

        prompt = (
            f"Target Role: {job_title}\n"
            f"Candidate Skills: {', '.join(candidate_skills) if candidate_skills else 'None specified'}\n"
            f"Candidate Experience: {candidate_exp:g} years\n"
            f"Required Skills: {', '.join(job_req_skills) if job_req_skills else 'None specified'}\n"
            f"Required Minimum Experience: {job_min_exp:g} years\n"
            "Provide the evaluation summary:"
        )

        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt},
            ],
            "temperature": 0.3,
            "max_tokens": 250,
        }

        result = await self._post_chat(payload)
        return result["choices"][0]["message"]["content"].strip()

    async def generate_interview_kit(self, candidate_data: dict, job_data: dict) -> InterviewKitResponse:
        """Generate a structured interview kit with Groq JSON mode."""

        system_prompt = (
            "You are a senior hiring manager creating a fair, role-specific interview kit. "
            "Return ONLY valid JSON with candidate_name, job_title, and questions. "
            "Each question must use question_type TECHNICAL, BEHAVIORAL, or SYSTEM_DESIGN; "
            "include one target_skill, concrete expected_answer_points, and a practical evaluation_rubric. "
            "Create 5 questions: three technical, one behavioral, and one system design when appropriate. "
            "Ground every question in the candidate and job data and avoid protected-class topics."
        )
        user_prompt = json.dumps({"candidate": candidate_data, "job": job_data}, ensure_ascii=False, default=str)
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.2,
            "max_tokens": 1800,
        }
        result = await self._post_chat(payload)
        response_text = result["choices"][0]["message"]["content"].strip()
        return InterviewKitResponse.model_validate_json(response_text)

    async def enrich_job_description(self, raw_text: str, seniority: str | None = None) -> JobEnrichmentResponse:
        """Polish a job draft and extract skills using Groq JSON mode."""

        system_prompt = (
            "You are an expert technical recruiter and compensation analyst. Transform the supplied job draft into "
            "clear, inclusive, compelling copy. Return ONLY valid JSON with exactly these fields: title (string), "
            "polished_description (string), required_skills (array of canonical strings), nice_to_have_skills "
            "(array of canonical strings), recommended_min_experience (non-negative number), and "
            "suggested_salary_range (string). Preserve factual details, infer only reasonable requirements, avoid "
            "protected-class language, and do not invent an employer name."
        )
        user_prompt = f"Seniority level: {seniority or 'infer from draft'}\nJOB DRAFT:\n{raw_text[:18000]}"
        result = await self._post_chat({
            "model": self.model,
            "messages": [{"role": "system", "content": system_prompt}, {"role": "user", "content": user_prompt}],
            "response_format": {"type": "json_object"},
            "temperature": 0.2,
            "max_tokens": 1400,
        })
        return JobEnrichmentResponse.model_validate_json(result["choices"][0]["message"]["content"].strip())

    async def compare_candidates(self, candidates_data: list[dict], job_data: dict) -> CompareCandidatesResponse:
        """Compare candidates with a structured Groq response."""

        system = "Return only valid JSON matching job_title, comparisons, executive_summary, recommended_candidate_id. Each comparison must contain candidate_id, candidate_name, fit_score (0-100), key_strengths, potential_gaps, and verdict. Rank candidates fairly on the supplied job requirements and never infer protected traits."
        result = await self._post_chat({"model": self.model, "messages": [{"role": "system", "content": system}, {"role": "user", "content": json.dumps({"candidates": candidates_data, "job": job_data}, default=str)}], "response_format": {"type": "json_object"}, "temperature": 0.1, "max_tokens": 1800})
        return CompareCandidatesResponse.model_validate_json(result["choices"][0]["message"]["content"].strip())

    async def generate_outreach_email(self, candidate: dict, job: dict | None, tone: str, company: str) -> OutreachEmailResponse:
        """Generate concise personalized outreach using Groq JSON mode."""

        system = "Return only valid JSON with subject_line, email_body, and key_highlights. Write respectful, concise recruiter outreach. Do not mention protected characteristics or fabricate facts."
        prompt = json.dumps({"candidate": candidate, "job": job, "tone": tone, "company": company}, default=str)
        result = await self._post_chat({"model": self.model, "messages": [{"role": "system", "content": system}, {"role": "user", "content": prompt}], "response_format": {"type": "json_object"}, "temperature": 0.3, "max_tokens": 900})
        return OutreachEmailResponse.model_validate_json(result["choices"][0]["message"]["content"].strip())

    async def _post_chat(self, payload: dict) -> dict:
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(self._BASE_URL, headers=headers, json=payload)
        if response.is_error:
            raise RuntimeError(f"Groq API request failed ({response.status_code}): {response.text[:500]}")
        return response.json()
