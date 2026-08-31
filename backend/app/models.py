from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import JSON

from app.db import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class UserRole(str, Enum):
    recruiter = "recruiter"
    candidate = "candidate"


class JobStatus(str, Enum):
    draft = "draft"
    open = "open"
    paused = "paused"
    closed = "closed"


class ApplicationStatus(str, Enum):
    applied = "applied"
    screening = "screening"
    interview = "interview"
    offer = "offer"
    hired = "hired"
    rejected = "rejected"


ALLOWED_TRANSITIONS: dict[str, set[str]] = {
    "applied": {"screening", "rejected"},
    "screening": {"interview", "rejected", "applied"},
    "interview": {"offer", "rejected", "screening"},
    "offer": {"hired", "rejected", "interview"},
    "hired": set(),
    "rejected": {"screening"},
}


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    full_name: Mapped[str] = mapped_column(String(200))
    role: Mapped[str] = mapped_column(String(32), index=True)
    organization: Mapped[str | None] = mapped_column(String(200), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    candidate_profile: Mapped[CandidateProfile | None] = relationship(back_populates="user", uselist=False)
    jobs: Mapped[list[Job]] = relationship(back_populates="recruiter")
    notes: Mapped[list[Note]] = relationship(back_populates="author")


class CandidateProfile(Base):
    __tablename__ = "candidate_profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True)
    headline: Mapped[str | None] = mapped_column(String(240), nullable=True)
    location: Mapped[str | None] = mapped_column(String(160), nullable=True)
    years_experience: Mapped[float] = mapped_column(Float, default=0)
    education_level: Mapped[str] = mapped_column(String(40), default="Unknown")
    seniority: Mapped[str] = mapped_column(String(40), default="mid")
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    skills: Mapped[list] = mapped_column(JSON, default=list)
    education: Mapped[list] = mapped_column(JSON, default=list)
    experience: Mapped[list] = mapped_column(JSON, default=list)
    links: Mapped[list] = mapped_column(JSON, default=list)
    resume_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    parsed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    user: Mapped[User] = relationship(back_populates="candidate_profile")
    applications: Mapped[list[Application]] = relationship(back_populates="candidate")
    notes: Mapped[list[Note]] = relationship(back_populates="candidate")


class Job(Base):
    __tablename__ = "jobs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    recruiter_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    title: Mapped[str] = mapped_column(String(200), index=True)
    department: Mapped[str | None] = mapped_column(String(120), nullable=True)
    location: Mapped[str] = mapped_column(String(160), default="Remote")
    employment_type: Mapped[str] = mapped_column(String(40), default="full_time")
    seniority: Mapped[str] = mapped_column(String(40), default="mid")
    description: Mapped[str] = mapped_column(Text)
    required_skills: Mapped[list] = mapped_column(JSON, default=list)
    optional_skills: Mapped[list] = mapped_column(JSON, default=list)
    min_years_experience: Mapped[float] = mapped_column(Float, default=0)
    education_requirement: Mapped[str] = mapped_column(String(40), default="Unknown")
    status: Mapped[str] = mapped_column(String(32), default=JobStatus.open.value, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    recruiter: Mapped[User] = relationship(back_populates="jobs")
    applications: Mapped[list[Application]] = relationship(back_populates="job")


class Application(Base):
    __tablename__ = "applications"
    __table_args__ = (UniqueConstraint("job_id", "candidate_id", name="uq_job_candidate"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    job_id: Mapped[int] = mapped_column(ForeignKey("jobs.id"), index=True)
    candidate_id: Mapped[int] = mapped_column(ForeignKey("candidate_profiles.id"), index=True)
    status: Mapped[str] = mapped_column(String(32), default=ApplicationStatus.applied.value, index=True)
    cover_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    match_score: Mapped[int] = mapped_column(Integer, default=0, index=True)
    match_breakdown: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    job: Mapped[Job] = relationship(back_populates="applications")
    candidate: Mapped[CandidateProfile] = relationship(back_populates="applications")
    events: Mapped[list[PipelineEvent]] = relationship(back_populates="application")


class PipelineEvent(Base):
    __tablename__ = "pipeline_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    application_id: Mapped[int] = mapped_column(ForeignKey("applications.id"), index=True)
    actor_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    from_status: Mapped[str] = mapped_column(String(32))
    to_status: Mapped[str] = mapped_column(String(32))
    reason: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    application: Mapped[Application] = relationship(back_populates="events")


class Note(Base):
    __tablename__ = "notes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    candidate_id: Mapped[int] = mapped_column(ForeignKey("candidate_profiles.id"), index=True)
    author_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    job_id: Mapped[int | None] = mapped_column(ForeignKey("jobs.id"), nullable=True)
    body: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    candidate: Mapped[CandidateProfile] = relationship(back_populates="notes")
    author: Mapped[User] = relationship(back_populates="notes")
