"""Pydantic API validation and serialization schemas."""

from app.schemas.ai import MatchResultSchema, ParsedResumeSchema
from app.schemas.application import ApplicantSummary
from app.schemas.candidate import (
    CandidateBase,
    CandidateCreate,
    CandidateDetailRead,
    CandidateRead,
    CandidateUpdate,
    ResumeRead,
)
from app.schemas.job import (
    ApplicationCreate,
    ApplicationRead,
    ApplicationStatusUpdate,
    JobBase,
    JobCreate,
    JobDetailRead,
    JobRead,
    JobUpdate,
)

__all__ = [
    "CandidateBase", "CandidateCreate", "CandidateUpdate", "CandidateRead",
    "CandidateDetailRead", "ResumeRead", "JobBase", "JobCreate", "JobUpdate",
    "JobRead", "JobDetailRead", "ApplicationCreate", "ApplicationStatusUpdate",
    "ApplicationRead", "ApplicantSummary", "ParsedResumeSchema", "MatchResultSchema",
]
