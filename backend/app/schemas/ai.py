"""Schemas exchanged with AI providers."""

import uuid
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class ParsedResumeSchema(BaseModel):
    """Structured information extracted from a resume."""

    model_config = ConfigDict(extra="ignore")

    first_name: str = ""
    last_name: str = ""
    email: str = ""
    phone: str | None = None
    headline: str | None = None
    experience_years: float = Field(default=0.0, ge=0.0)
    skills: list[str] = Field(default_factory=list)
    work_history: list[dict] = Field(default_factory=list)
    education: list[dict] = Field(default_factory=list)


class MatchResultSchema(BaseModel):
    """Normalized result of candidate-to-job matching."""

    overall_score: float = Field(ge=0.0, le=100.0)
    skill_score: float = Field(ge=0.0, le=100.0)
    experience_score: float = Field(ge=0.0, le=100.0)
    semantic_score: float = Field(ge=0.0, le=100.0)
    matched_skills: list[str] = Field(default_factory=list)
    missing_skills: list[str] = Field(default_factory=list)
    ai_critique: str


class InterviewQuestionSchema(BaseModel):
    """A structured interview question and its hiring rubric."""

    question: str
    question_type: Literal["TECHNICAL", "BEHAVIORAL", "SYSTEM_DESIGN"]
    target_skill: str
    expected_answer_points: list[str] = Field(default_factory=list)
    evaluation_rubric: str


class InterviewKitResponse(BaseModel):
    """Interview kit generated for one candidate and role."""

    candidate_name: str
    job_title: str
    questions: list[InterviewQuestionSchema] = Field(default_factory=list)


class InterviewKitRequest(BaseModel):
    """Identifiers used to generate an interview kit."""

    candidate_id: uuid.UUID
    job_id: uuid.UUID


class JobEnrichmentRequest(BaseModel):
    """Draft job text submitted for AI enrichment."""

    raw_text: str = Field(min_length=1, max_length=20000)
    seniority_level: str | None = None
    department: str | None = None


class JobEnrichmentResponse(BaseModel):
    """Polished job copy and normalized skill taxonomy."""

    title: str
    polished_description: str
    required_skills: list[str] = Field(default_factory=list)
    nice_to_have_skills: list[str] = Field(default_factory=list)
    recommended_min_experience: float = Field(ge=0.0)
    suggested_salary_range: str


class CandidateComparisonItem(BaseModel):
    candidate_id: uuid.UUID
    candidate_name: str
    fit_score: float = Field(ge=0, le=100)
    key_strengths: list[str] = Field(default_factory=list)
    potential_gaps: list[str] = Field(default_factory=list)
    verdict: str


class CompareCandidatesResponse(BaseModel):
    job_title: str
    comparisons: list[CandidateComparisonItem] = Field(default_factory=list)
    executive_summary: str
    recommended_candidate_id: uuid.UUID | None = None


class CompareCandidatesRequest(BaseModel):
    job_id: uuid.UUID
    candidate_ids: list[uuid.UUID] = Field(min_length=2, max_length=10)


class OutreachEmailRequest(BaseModel):
    candidate_id: uuid.UUID
    job_id: uuid.UUID | None = None
    tone: Literal["FRIENDLY", "PROFESSIONAL", "EXECUTIVE"] = "PROFESSIONAL"
    company_name: str = Field(min_length=1, max_length=200)


class OutreachEmailResponse(BaseModel):
    subject_line: str
    email_body: str
    key_highlights: list[str] = Field(default_factory=list)
