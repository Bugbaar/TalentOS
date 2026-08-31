"""Candidate and resume API schemas."""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.application import ApplicationRead


class CandidateBase(BaseModel):
    """Fields common to candidate creation and updates."""

    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    email: str = Field(min_length=3, max_length=255)
    phone: str | None = Field(default=None, max_length=50)
    headline: str | None = Field(default=None, max_length=255)
    location: str | None = Field(default=None, max_length=150)
    bio: str | None = None
    experience_years: float = Field(default=0.0, ge=0.0)
    skills: list[str] = Field(default_factory=list)


class CandidateCreate(CandidateBase):
    """Payload for creating a candidate."""


class CandidateUpdate(BaseModel):
    """Partial candidate update payload."""

    first_name: str | None = Field(default=None, min_length=1, max_length=100)
    last_name: str | None = Field(default=None, min_length=1, max_length=100)
    email: str | None = Field(default=None, min_length=3, max_length=255)
    phone: str | None = Field(default=None, max_length=50)
    headline: str | None = Field(default=None, max_length=255)
    location: str | None = Field(default=None, max_length=150)
    bio: str | None = None
    experience_years: float | None = Field(default=None, ge=0.0)
    skills: list[str] | None = None


class ResumeRead(BaseModel):
    """Serialized resume record."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    candidate_id: uuid.UUID
    raw_text: str | None = None
    file_url: str | None = None
    parsed_skills: list[str] = Field(default_factory=list)
    work_history: list[dict] = Field(default_factory=list)
    education: list[dict] = Field(default_factory=list)
    embedding_vector_id: str | None = None
    created_at: datetime


class CandidateRead(CandidateBase):
    """Serialized candidate summary."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    created_at: datetime
    updated_at: datetime


class CandidateDetailRead(CandidateRead):
    """Candidate response including resumes and applications."""

    resumes: list[ResumeRead] = Field(default_factory=list)
    applications: list[ApplicationRead] = Field(default_factory=list)
