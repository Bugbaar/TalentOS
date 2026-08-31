"""SQLAlchemy ORM models for TalentOS."""

from app.core.database import Base
from app.models.application import Application, InterviewScorecard
from app.models.candidate import Candidate, Resume
from app.models.job import JobOpening

__all__ = ["Base", "Candidate", "Resume", "JobOpening", "Application", "InterviewScorecard"]
