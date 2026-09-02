"""Job opening database model and enumerations."""

import enum
import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import DateTime, Enum, JSON, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.candidate import utcnow


class WorkplaceType(str, enum.Enum):
    """Available workplace arrangements."""

    REMOTE = "REMOTE"
    HYBRID = "HYBRID"
    ONSITE = "ONSITE"


class JobStatus(str, enum.Enum):
    """Job publication lifecycle states."""

    DRAFT = "DRAFT"
    ACTIVE = "ACTIVE"
    CLOSED = "CLOSED"


class JobOpening(Base):
    """A position available for candidate applications."""

    __tablename__ = "job_openings"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    department: Mapped[str] = mapped_column(String(100), nullable=False)
    location: Mapped[str] = mapped_column(String(150), nullable=False)
    workplace_type: Mapped[WorkplaceType] = mapped_column(
        Enum(WorkplaceType, name="workplace_type"), default=WorkplaceType.REMOTE, nullable=False
    )
    status: Mapped[JobStatus] = mapped_column(
        Enum(JobStatus, name="job_status"), default=JobStatus.ACTIVE, nullable=False
    )
    description: Mapped[str] = mapped_column(Text, nullable=False)
    required_skills: Mapped[list[Any]] = mapped_column(JSON, default=list, nullable=False)
    nice_to_have_skills: Mapped[list[Any]] = mapped_column(JSON, default=list, nullable=False)
    min_experience_years: Mapped[float] = mapped_column(default=0.0, nullable=False)
    salary_range: Mapped[str | None] = mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False
    )

    applications: Mapped[list["Application"]] = relationship(
        back_populates="job", cascade="all, delete-orphan"
    )
