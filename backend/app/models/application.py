"""Candidate application database model and status enumeration."""

import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.candidate import Candidate, utcnow
from app.models.job import JobOpening


class ApplicationStatus(str, enum.Enum):
    """Application workflow states."""

    APPLIED = "APPLIED"
    SCREENING = "SCREENING"
    INTERVIEW = "INTERVIEW"
    OFFER = "OFFER"
    HIRED = "HIRED"
    REJECTED = "REJECTED"


class InterviewRecommendation(str, enum.Enum):
    """Hiring recommendation from an interviewer."""

    STRONG_YES = "STRONG_YES"
    YES = "YES"
    NEUTRAL = "NEUTRAL"
    NO = "NO"
    STRONG_NO = "STRONG_NO"


class Application(Base):
    """A candidate's application to a job opening."""

    __tablename__ = "applications"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    candidate_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("candidates.id", ondelete="CASCADE"), nullable=False
    )
    job_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("job_openings.id", ondelete="CASCADE"), nullable=False
    )
    status: Mapped[ApplicationStatus] = mapped_column(
        Enum(ApplicationStatus, name="application_status"),
        default=ApplicationStatus.APPLIED,
        nullable=False,
    )
    ai_match_score: Mapped[float | None] = mapped_column(nullable=True)
    ai_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    applied_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)

    candidate: Mapped[Candidate] = relationship(back_populates="applications")
    job: Mapped[JobOpening] = relationship(back_populates="applications")
    scorecards: Mapped[list["InterviewScorecard"]] = relationship(
        back_populates="application", cascade="all, delete-orphan"
    )


class InterviewScorecard(Base):
    """Structured feedback submitted for an application interview round."""

    __tablename__ = "interview_scorecards"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    application_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("applications.id", ondelete="CASCADE"), nullable=False
    )
    interviewer_name: Mapped[str] = mapped_column(String(150), nullable=False)
    round_name: Mapped[str] = mapped_column(String(150), nullable=False)
    rating: Mapped[int] = mapped_column(nullable=False)
    recommendation: Mapped[InterviewRecommendation] = mapped_column(
        Enum(InterviewRecommendation, name="interview_recommendation"), nullable=False
    )
    notes: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)

    application: Mapped[Application] = relationship(back_populates="scorecards")
