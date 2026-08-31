"""Job opening and application API schemas."""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.application import ApplicationStatus
from app.models.job import JobStatus, WorkplaceType
from app.schemas.application import ApplicantSummary


class JobBase(BaseModel):
    """Fields common to job creation and updates."""

    title: str = Field(min_length=1, max_length=200)
    department: str = Field(min_length=1, max_length=100)
    location: str = Field(min_length=1, max_length=150)
    workplace_type: WorkplaceType = WorkplaceType.REMOTE
    status: JobStatus = JobStatus.ACTIVE
    description: str = Field(min_length=1)
    required_skills: list[str] = Field(default_factory=list)
    nice_to_have_skills: list[str] = Field(default_factory=list)
    min_experience_years: float = Field(default=0.0, ge=0.0)
    salary_range: str | None = Field(default=None, max_length=100)


class JobCreate(JobBase):
    """Payload for creating a job opening."""


class JobUpdate(BaseModel):
    """Partial job opening update payload."""

    title: str | None = Field(default=None, min_length=1, max_length=200)
    department: str | None = Field(default=None, min_length=1, max_length=100)
    location: str | None = Field(default=None, min_length=1, max_length=150)
    workplace_type: WorkplaceType | None = None
    status: JobStatus | None = None
    description: str | None = Field(default=None, min_length=1)
    required_skills: list[str] | None = None
    nice_to_have_skills: list[str] | None = None
    min_experience_years: float | None = Field(default=None, ge=0.0)
    salary_range: str | None = Field(default=None, max_length=100)


class JobRead(JobBase):
    """Serialized job opening summary."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    created_at: datetime
    updated_at: datetime


class JobDetailRead(JobRead):
    """Job response including compact applicant records."""

    applicants: list[ApplicantSummary] = Field(
        default_factory=list,
        validation_alias="applications",
        serialization_alias="applicants",
    )


class ApplicationCreate(BaseModel):
    """Payload for applying a candidate to a job."""

    candidate_id: uuid.UUID
    notes: str | None = None


class ApplicationStatusUpdate(BaseModel):
    """Payload for moving an application through the hiring workflow."""

    status: ApplicationStatus
    notes: str | None = None


class ApplicationRead(BaseModel):
    """Serialized application record for job-facing APIs."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    candidate_id: uuid.UUID
    job_id: uuid.UUID
    status: ApplicationStatus
    ai_match_score: float | None = Field(default=None, ge=0.0, le=100.0)
    ai_summary: str | None = None
    notes: str | None = None
    applied_at: datetime
