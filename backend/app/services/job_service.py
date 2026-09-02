"""Job opening and application workflow services."""

import logging
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import ValidationError
from app.models.application import Application, ApplicationStatus
from app.models.candidate import Candidate
from app.models.job import JobOpening, JobStatus
from app.schemas.ai import JobEnrichmentRequest, JobEnrichmentResponse
from app.schemas.job import JobCreate
from app.services.ai_engine.factory import get_ai_provider
from app.services.matching_service import evaluate_candidate_for_job

logger = logging.getLogger(__name__)


async def get_jobs(
    db: AsyncSession,
    status: JobStatus | None = None,
    department: str | None = None,
) -> list[JobOpening]:
    """Return job openings with optional status and department filters."""

    query = select(JobOpening).order_by(JobOpening.created_at.desc())
    if status:
        query = query.where(JobOpening.status == status)
    if department:
        query = query.where(JobOpening.department.ilike(f"%{department.strip()}%"))
    return list((await db.execute(query)).scalars().all())


async def create_job(db: AsyncSession, job_in: JobCreate) -> JobOpening:
    """Persist and return a validated job opening."""

    job = JobOpening(**job_in.model_dump())
    db.add(job)
    await db.commit()
    await db.refresh(job)
    return job


async def get_job_by_id(db: AsyncSession, job_id: uuid.UUID) -> JobOpening | None:
    """Return a job with its applications and candidates loaded."""

    result = await db.execute(
        select(JobOpening)
        .options(selectinload(JobOpening.applications).selectinload(Application.candidate))
        .where(JobOpening.id == job_id)
    )
    return result.scalar_one_or_none()


async def apply_for_job(db: AsyncSession, job_id: uuid.UUID, candidate_id: uuid.UUID) -> Application:
    """Create an application and calculate its AI match score and summary."""

    job = await db.get(JobOpening, job_id)
    candidate = await db.get(Candidate, candidate_id)
    if job is None:
        raise LookupError(f"Job {job_id} was not found")
    if candidate is None:
        raise LookupError(f"Candidate {candidate_id} was not found")
    existing = await db.scalar(select(Application).where(Application.job_id == job_id, Application.candidate_id == candidate_id))
    if existing:
        raise ValueError("Candidate has already applied to this job")
    match = await evaluate_candidate_for_job(db, candidate_id, job_id)
    application = Application(
        job_id=job_id,
        candidate_id=candidate_id,
        status=ApplicationStatus.APPLIED,
        ai_match_score=match.overall_score,
        ai_summary=match.ai_critique,
    )
    db.add(application)
    await db.commit()
    await db.refresh(application)
    return application


async def update_application_status(
    db: AsyncSession, application_id: uuid.UUID, status: ApplicationStatus, notes: str | None = None
) -> Application:
    """Update an application's workflow status and optional notes."""

    application = await db.get(Application, application_id)
    if application is None:
        raise LookupError(f"Application {application_id} was not found")
    application.status = status
    if notes is not None:
        application.notes = notes
    await db.commit()
    await db.refresh(application)
    return application


async def enrich_draft(request: JobEnrichmentRequest) -> JobEnrichmentResponse:
    """Polish a job draft using the configured AI provider."""

    if not request.raw_text or len(request.raw_text.strip()) < 3:
        raise ValidationError("Job draft text must be at least 3 characters long")
    raw_text = request.raw_text
    if request.department:
        raw_text = f"Department: {request.department}\n{raw_text}"
    return await get_ai_provider().enrich_job_description(raw_text, request.seniority_level)
