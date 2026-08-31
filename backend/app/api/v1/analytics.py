"""Recruiting analytics API endpoints."""

from collections import Counter

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.application import Application, ApplicationStatus
from app.models.candidate import Candidate
from app.models.job import JobOpening, JobStatus

router = APIRouter()


@router.get("/summary")
async def analytics_summary(db: AsyncSession = Depends(get_db)) -> dict:
    """Return hiring funnel counts and the most common candidate skills."""

    candidate_count = await db.scalar(select(func.count()).select_from(Candidate)) or 0
    active_job_count = await db.scalar(select(func.count()).select_from(JobOpening).where(JobOpening.status == JobStatus.ACTIVE)) or 0
    application_count = await db.scalar(select(func.count()).select_from(Application)) or 0
    stage_rows = await db.execute(select(Application.status, func.count()).group_by(Application.status))
    stages = {stage.value: 0 for stage in ApplicationStatus}
    stages.update({stage.value: count for stage, count in stage_rows.all()})
    candidate_skills = (await db.execute(select(Candidate.skills))).scalars().all()
    skill_counts: Counter[str] = Counter(skill for skills in candidate_skills for skill in (skills or []))
    return {
        "total_candidates": candidate_count,
        "active_jobs": active_job_count,
        "total_applications": application_count,
        "applications_by_stage": stages,
        "top_candidate_skills": [{"skill": skill, "count": count} for skill, count in skill_counts.most_common(10)],
    }
