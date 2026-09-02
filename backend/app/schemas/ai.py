"""Schemas exchanged with AI providers."""

import uuid
from typing import Literal, Optional

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


class SkillProficiency(BaseModel):
    """Skill proficiency assessment."""

    skill: str
    proficiency: Literal["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"]
    confidence: float = Field(ge=0.0, le=1.0)


class SkillGapAnalysis(BaseModel):
    """Detailed skill gap analysis between candidate and job."""

    skill_score: float = Field(ge=0.0, le=100.0)
    matched_skills: list[str] = Field(default_factory=list)
    missing_skills: list[str] = Field(default_factory=list)
    strong_skills: list[str] = Field(default_factory=list)
    weak_skills: list[str] = Field(default_factory=list)
    proficiency: list[SkillProficiency] = Field(default_factory=list)
    matched_required: list[str] = Field(default_factory=list)
    matched_nice_to_have: list[str] = Field(default_factory=list)
    experience_gap: float = Field(default=0.0)


class AdvancedMatchResult(BaseModel):
    """Advanced candidate-to-job matching result with multi-factor analysis."""

    overall_score: float = Field(ge=0.0, le=100.0)
    confidence: float = Field(ge=0.0, le=1.0, description="Confidence in the match score based on data completeness")
    success_probability: float = Field(ge=0.0, le=100.0, description="Predicted probability of candidate success")

    # Component scores
    skill_score: float = Field(ge=0.0, le=100.0)
    experience_score: float = Field(ge=0.0, le=100.0)
    semantic_score: float = Field(ge=0.0, le=100.0)
    education_score: float = Field(ge=0.0, le=100.0)
    cultural_score: float = Field(ge=0.0, le=100.0)

    # Skill analysis
    matched_skills: list[str] = Field(default_factory=list)
    missing_skills: list[str] = Field(default_factory=list)
    weak_skills: list[str] = Field(default_factory=list)
    strong_skills: list[str] = Field(default_factory=list)
    skill_proficiency: list[SkillProficiency] = Field(default_factory=list)
    matched_required: list[str] = Field(default_factory=list)
    matched_nice_to_have: list[str] = Field(default_factory=list)
    total_required: int = Field(default=0)
    total_nice_to_have: int = Field(default=0)
    experience_gap: float = Field(default=0.0)

    # Analysis
    ai_critique: str
    strengths: list[str] = Field(default_factory=list)
    concerns: list[str] = Field(default_factory=list)
    recommendation: Literal["STRONG_MATCH", "GOOD_MATCH", "MODERATE_MATCH", "WEAK_MATCH", "POOR_MATCH"]
    salary_fit: Optional[float] = Field(default=None, description="Salary expectation alignment score")
    weights_used: dict[str, float] = Field(default_factory=dict, description="Scoring weights used for this evaluation")


class BiasAuditResult(BaseModel):
    """Bias audit results for the evaluation pipeline."""

    total_candidates: int
    bias_detected: bool
    findings: list[str] = Field(default_factory=list)
    recommendations: list[str] = Field(default_factory=list)


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


class AdvancedMatchingRequest(BaseModel):
    """Request for advanced matching with custom weights."""

    candidate_id: uuid.UUID
    job_id: uuid.UUID
    weights: Optional[dict[str, float]] = Field(
        default=None,
        description="Custom weights for scoring (skill, experience, semantic, education, cultural)"
    )


class BatchRankingRequest(BaseModel):
    """Request for batch ranking of candidates for a job."""

    job_id: uuid.UUID
    limit: int = Field(default=20, ge=1, le=100)
    min_score: float = Field(default=0.0, ge=0.0, le=100.0)


class BatchRankingResponse(BaseModel):
    """Response for batch ranking."""

    job_id: uuid.UUID
    total_candidates: int
    candidates: list[dict] = Field(default_factory=list)


class HiringFunnelAnalytics(BaseModel):
    """Hiring funnel analytics data."""

    stage: str
    count: int
    conversion_rate: Optional[float] = None


class SkillDemandAnalytics(BaseModel):
    """Skill demand analytics."""

    skill: str
    demand_count: int
    avg_match_score: float


class TimeToHireAnalytics(BaseModel):
    """Time to hire analytics."""

    avg_days_to_hire: float
    avg_days_per_stage: dict[str, float]
    fastest_hires: list[dict]
    slowest_stages: list[str]
