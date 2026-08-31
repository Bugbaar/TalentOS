from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, EmailStr, Field


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    full_name: str
    email: EmailStr


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str = Field(min_length=2, max_length=200)
    role: Literal["recruiter", "candidate"]
    organization: str | None = Field(default=None, max_length=200)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    role: str
    organization: str | None

    model_config = {"from_attributes": True}


class CandidateProfileIn(BaseModel):
    headline: str | None = Field(default=None, max_length=240)
    location: str | None = Field(default=None, max_length=160)
    years_experience: float | None = Field(default=None, ge=0, le=50)
    education_level: str | None = None
    seniority: str | None = None
    summary: str | None = None
    skills: list[str] | None = None


class CandidateProfileOut(BaseModel):
    id: int
    user_id: int
    full_name: str | None = None
    email: str | None = None
    headline: str | None
    location: str | None
    years_experience: float
    education_level: str
    seniority: str
    summary: str | None
    skills: list[Any]
    education: list[Any]
    experience: list[Any]
    links: list[Any]
    parsed_at: datetime | None

    model_config = {"from_attributes": True}


class ResumeParseRequest(BaseModel):
    resume_text: str = Field(min_length=20, max_length=80_000)


class ResumeParseOut(BaseModel):
    full_name: str | None
    email: str | None
    phone: str | None
    links: list[str]
    headline: str | None
    years_experience: float
    education_level: str
    seniority: str
    skills: list[str]
    summary: str
    applied: bool = False


class JobIn(BaseModel):
    title: str = Field(min_length=2, max_length=200)
    department: str | None = None
    location: str = "Remote"
    employment_type: str = "full_time"
    seniority: str = "mid"
    description: str = Field(min_length=20)
    required_skills: list[str] = Field(min_length=1)
    optional_skills: list[str] = Field(default_factory=list)
    min_years_experience: float = Field(default=0, ge=0, le=40)
    education_requirement: str = "Unknown"
    status: Literal["draft", "open", "paused", "closed"] = "open"


class JobOut(BaseModel):
    id: int
    recruiter_id: int
    title: str
    department: str | None
    location: str
    employment_type: str
    seniority: str
    description: str
    required_skills: list[Any]
    optional_skills: list[Any]
    min_years_experience: float
    education_requirement: str
    status: str
    created_at: datetime
    application_count: int = 0

    model_config = {"from_attributes": True}


class ApplyRequest(BaseModel):
    job_id: int
    cover_note: str | None = Field(default=None, max_length=2000)


class ApplicationOut(BaseModel):
    id: int
    job_id: int
    candidate_id: int
    status: str
    cover_note: str | None
    match_score: int
    match_breakdown: dict[str, Any]
    created_at: datetime
    job_title: str | None = None
    candidate_name: str | None = None
    candidate_skills: list[Any] = []

    model_config = {"from_attributes": True}


class PipelineUpdate(BaseModel):
    status: Literal["applied", "screening", "interview", "offer", "hired", "rejected"]
    reason: str | None = Field(default=None, max_length=500)


class NoteIn(BaseModel):
    body: str = Field(min_length=1, max_length=4000)
    job_id: int | None = None


class NoteOut(BaseModel):
    id: int
    candidate_id: int
    author_id: int
    author_name: str | None = None
    job_id: int | None
    body: str
    created_at: datetime

    model_config = {"from_attributes": True}


class RankedCandidateOut(BaseModel):
    application_id: int
    candidate_id: int
    candidate_name: str
    headline: str | None
    years_experience: float
    skills: list[Any]
    status: str
    match_score: int
    match_breakdown: dict[str, Any]


class RecommendationOut(BaseModel):
    job_id: int
    title: str
    location: str
    seniority: str
    required_skills: list[Any]
    match_score: int
    match_breakdown: dict[str, Any]
    status: str
