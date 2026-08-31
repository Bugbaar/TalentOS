"""Google Gemini provider implemented against the Gemini REST API."""

import json
import httpx

from app.core.config import settings
from app.schemas.ai import (CompareCandidatesResponse, InterviewKitResponse,
                            JobEnrichmentResponse, OutreachEmailResponse,
                            ParsedResumeSchema)
from app.services.ai_engine.base import BaseAIProvider


class GeminiAIProvider(BaseAIProvider):
    """Gemini-backed provider with structured resume output."""

    _BASE_URL = "https://generativelanguage.googleapis.com/v1beta"
    _MODEL = "gemini-1.5-flash"
    _EMBEDDING_MODEL = "text-embedding-004"

    def __init__(self, api_key: str | None = None, timeout: float = 60.0) -> None:
        self.api_key = api_key or settings.GEMINI_API_KEY
        self.timeout = timeout
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY is required for GeminiAIProvider")

    async def parse_resume(self, text: str) -> ParsedResumeSchema:
        """Parse resume text with Gemini's JSON response schema enforcement."""

        prompt = (
            "Extract the candidate information from this resume. Return only data supported by the resume. "
            "Use an empty string or empty list when information is absent.\n\nRESUME:\n" + text
        )
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "responseMimeType": "application/json",
                "responseSchema": self._schema_for_gemini(),
                "temperature": 0,
            },
        }
        result = await self._post(f"models/{self._MODEL}:generateContent", payload)
        response_text = self._text_from_generation(result)
        return ParsedResumeSchema.model_validate_json(response_text)

    async def get_embedding(self, text: str) -> list[float]:
        """Generate an embedding using Gemini's embedding endpoint."""

        result = await self._post(
            f"models/{self._EMBEDDING_MODEL}:embedContent",
            {"content": {"parts": [{"text": text}]}},
        )
        try:
            values = result["embedding"]["values"]
            return [float(value) for value in values]
        except (KeyError, TypeError, ValueError) as exc:
            raise RuntimeError("Gemini returned an invalid embedding response") from exc

    async def generate_critique(
        self,
        candidate_skills: list[str],
        candidate_exp: float,
        job_req_skills: list[str],
        job_min_exp: float,
        job_title: str,
    ) -> str:
        """Generate a recruiter-facing fit critique with Gemini."""

        prompt = (
            f"Assess a candidate for the role '{job_title}'.\n"
            f"Candidate skills: {', '.join(candidate_skills)}\n"
            f"Candidate experience: {candidate_exp:g} years\n"
            f"Required skills: {', '.join(job_req_skills)}\n"
            f"Minimum experience: {job_min_exp:g} years\n"
            "Write a concise, balanced recruiter summary covering strengths, gaps, and experience fit."
        )
        result = await self._post(
            f"models/{self._MODEL}:generateContent",
            {"contents": [{"parts": [{"text": prompt}]}], "generationConfig": {"temperature": 0.2}},
        )
        return self._text_from_generation(result)

    async def generate_interview_kit(self, candidate_data: dict, job_data: dict) -> InterviewKitResponse:
        """Generate a structured interview kit with Gemini JSON output."""

        prompt = (
            "Create five fair, role-specific interview questions for this candidate and job. "
            "Return JSON with candidate_name, job_title, and questions. Each question needs question, "
            "question_type (TECHNICAL, BEHAVIORAL, or SYSTEM_DESIGN), target_skill, "
            "expected_answer_points, and evaluation_rubric.\n" +
            json.dumps({"candidate": candidate_data, "job": job_data}, default=str)
        )
        result = await self._post(
            f"models/{self._MODEL}:generateContent",
            {"contents": [{"parts": [{"text": prompt}]}], "generationConfig": {"responseMimeType": "application/json", "temperature": 0.2}},
        )
        return InterviewKitResponse.model_validate_json(self._text_from_generation(result))

    async def enrich_job_description(self, raw_text: str, seniority: str | None = None) -> JobEnrichmentResponse:
        """Enrich job copy with Gemini's JSON response mode."""

        prompt = "Return JSON fields title, polished_description, required_skills, nice_to_have_skills, recommended_min_experience, suggested_salary_range. Polish this job draft and extract canonical skills. Seniority: " + (seniority or "infer") + "\n" + raw_text
        result = await self._post(f"models/{self._MODEL}:generateContent", {"contents": [{"parts": [{"text": prompt}]}], "generationConfig": {"responseMimeType": "application/json", "temperature": 0.2}})
        return JobEnrichmentResponse.model_validate_json(self._text_from_generation(result))

    async def compare_candidates(self, candidates_data: list[dict], job_data: dict) -> CompareCandidatesResponse:
        """Generate a comparison using Gemini JSON output."""

        prompt = "Return JSON matching job_title, comparisons, executive_summary, recommended_candidate_id. Compare these candidates fairly for this role: " + json.dumps({"candidates": candidates_data, "job": job_data}, default=str)
        result = await self._post(f"models/{self._MODEL}:generateContent", {"contents": [{"parts": [{"text": prompt}]}], "generationConfig": {"responseMimeType": "application/json", "temperature": 0.1}})
        return CompareCandidatesResponse.model_validate_json(self._text_from_generation(result))

    async def generate_outreach_email(self, candidate: dict, job: dict | None, tone: str, company: str) -> OutreachEmailResponse:
        """Generate recruiter outreach using Gemini JSON output."""

        prompt = "Return JSON matching subject_line, email_body, and key_highlights. Draft respectful outreach in the requested tone: " + json.dumps({"candidate": candidate, "job": job, "tone": tone, "company": company}, default=str)
        result = await self._post(f"models/{self._MODEL}:generateContent", {"contents": [{"parts": [{"text": prompt}]}], "generationConfig": {"responseMimeType": "application/json", "temperature": 0.3}})
        return OutreachEmailResponse.model_validate_json(self._text_from_generation(result))

    async def _post(self, path: str, payload: dict) -> dict:
        url = f"{self._BASE_URL}/{path}"
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(url, params={"key": self.api_key}, json=payload)
        if response.is_error:
            raise RuntimeError(f"Gemini API request failed ({response.status_code}): {response.text[:500]}")
        return response.json()

    @staticmethod
    def _text_from_generation(response: dict) -> str:
        try:
            return response["candidates"][0]["content"]["parts"][0]["text"].strip()
        except (KeyError, IndexError, TypeError) as exc:
            raise RuntimeError("Gemini returned no generated content") from exc

    @staticmethod
    def _schema_for_gemini() -> dict:
        """Convert Pydantic's JSON Schema to Gemini's Schema representation."""

        schema = ParsedResumeSchema.model_json_schema()

        def convert(value: object) -> object:
            if isinstance(value, dict):
                if "anyOf" in value:
                    alternatives = value["anyOf"]
                    if isinstance(alternatives, list):
                        non_null = [item for item in alternatives if isinstance(item, dict) and item.get("type") != "null"]
                        if len(non_null) == 1:
                            return convert(non_null[0])
                converted = {key: convert(item) for key, item in value.items() if key not in {"title", "$defs"}}
                if isinstance(converted.get("type"), str):
                    converted["type"] = converted["type"].upper()
                return converted
            if isinstance(value, list):
                return [convert(item) for item in value]
            return value

        return convert(schema)
