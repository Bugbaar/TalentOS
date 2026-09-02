"""Application API schemas shared by candidate and job responses."""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.application import ApplicationStatus, InterviewRecommendation


class ApplicationRead(BaseModel):
    """Serialized application record."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    candidate_id: uuid.UUID
    job_id: uuid.UUID
    status: ApplicationStatus
    ai_match_score: float | None = Field(default=None, ge=0.0, le=100.0)
    ai_summary: str | None = None
    notes: str | None = None
    applied_at: datetime


class ApplicantSummary(BaseModel):
    """Compact applicant data embedded in a job detail response."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    candidate_id: uuid.UUID
    status: ApplicationStatus
    ai_match_score: float | None = Field(default=None, ge=0.0, le=100.0)
    applied_at: datetime
    candidate_name: str | None = None


class ScorecardCreate(BaseModel):
    interviewer_name: str = Field(min_length=1, max_length=150)
    round_name: str = Field(min_length=1, max_length=150)
    rating: int = Field(ge=1, le=5)
    recommendation: InterviewRecommendation
    notes: str


class ScorecardRead(ScorecardCreate):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    application_id: uuid.UUID
    created_at: datetime
