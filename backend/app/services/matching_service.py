"""Candidate/job matching and ranking services."""

import math
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.candidate import Candidate
from app.models.job import JobOpening
from app.schemas.ai import CompareCandidatesResponse, InterviewKitResponse, MatchResultSchema
from app.services.ai_engine.factory import get_ai_provider


async def evaluate_candidate_for_job(
    db: AsyncSession, candidate_id: uuid.UUID, job_id: uuid.UUID
) -> MatchResultSchema:
    """Compute the weighted skill, experience, and semantic match score."""

    candidate = await db.get(Candidate, candidate_id)
    job = await db.get(JobOpening, job_id)
    if candidate is None:
        raise LookupError(f"Candidate {candidate_id} was not found")
    if job is None:
        raise LookupError(f"Job {job_id} was not found")

    candidate_skills = list(candidate.skills or [])
    required = list(job.required_skills or [])
    candidate_skill_map = {skill.casefold(): skill for skill in candidate_skills}
    matched = [skill for skill in required if skill.casefold() in candidate_skill_map]
    missing = [skill for skill in required if skill.casefold() not in candidate_skill_map]
    skill_score = len(matched) / len(required) * 100 if required else 100.0
    experience_score = (
        min(1.0, candidate.experience_years / job.min_experience_years) * 100
        if job.min_experience_years > 0
        else 100.0
    )

    provider = get_ai_provider()
    candidate_text = " ".join(candidate_skills) + f" {candidate.headline or ''} {candidate.bio or ''}"
    candidate_vector = await provider.get_embedding(candidate_text)
    job_vector = await provider.get_embedding(job.description)
    semantic_score = _cosine_similarity(candidate_vector, job_vector) * 100
    overall = 0.50 * skill_score + 0.30 * experience_score + 0.20 * semantic_score
    critique = await provider.generate_critique(
        candidate_skills, candidate.experience_years, required, job.min_experience_years, job.title
    )
    return MatchResultSchema(
        overall_score=round(overall, 2),
        skill_score=round(skill_score, 2),
        experience_score=round(experience_score, 2),
        semantic_score=round(semantic_score, 2),
        matched_skills=matched,
        missing_skills=missing,
        ai_critique=critique,
    )


async def rank_candidates_for_job(
    db: AsyncSession, job_id: uuid.UUID, limit: int = 20
) -> list[dict]:
    """Evaluate every candidate and return the highest-scoring candidates first."""

    if await db.get(JobOpening, job_id) is None:
        raise LookupError(f"Job {job_id} was not found")
    candidates = list((await db.execute(select(Candidate).order_by(Candidate.created_at))).scalars().all())
    ranked = []
    for candidate in candidates:
        match = await evaluate_candidate_for_job(db, candidate.id, job_id)
        ranked.append({"candidate": candidate, "match": match})
    ranked.sort(key=lambda item: item["match"].overall_score, reverse=True)
    return ranked[: max(0, min(limit, 1000))]


async def generate_interview_kit(
    db: AsyncSession, candidate_id: uuid.UUID, job_id: uuid.UUID
) -> InterviewKitResponse:
    """Build provider input from persisted records and generate interview questions."""

    candidate = await db.get(Candidate, candidate_id)
    job = await db.get(JobOpening, job_id)
    if candidate is None:
        raise LookupError(f"Candidate {candidate_id} was not found")
    if job is None:
        raise LookupError(f"Job {job_id} was not found")
    candidate_data = {
        "first_name": candidate.first_name,
        "last_name": candidate.last_name,
        "headline": candidate.headline,
        "bio": candidate.bio,
        "experience_years": candidate.experience_years,
        "skills": candidate.skills or [],
    }
    job_data = {
        "title": job.title,
        "department": job.department,
        "description": job.description,
        "required_skills": job.required_skills or [],
        "nice_to_have_skills": job.nice_to_have_skills or [],
        "min_experience_years": job.min_experience_years,
    }
    return await get_ai_provider().generate_interview_kit(candidate_data, job_data)


async def compare_candidates(db: AsyncSession, candidate_ids: list[uuid.UUID], job_id: uuid.UUID) -> CompareCandidatesResponse:
    """Compare selected candidates for a job through the configured provider."""

    job = await db.get(JobOpening, job_id)
    candidates = list((await db.execute(select(Candidate).where(Candidate.id.in_(candidate_ids)))).scalars().all())
    if job is None:
        raise LookupError(f"Job {job_id} was not found")
    if len(candidates) != len(set(candidate_ids)):
        raise LookupError("One or more candidates were not found")
    candidate_data = [{"id": candidate.id, "first_name": candidate.first_name, "last_name": candidate.last_name, "headline": candidate.headline, "experience_years": candidate.experience_years, "skills": candidate.skills or []} for candidate in candidates]
    job_data = {"title": job.title, "description": job.description, "required_skills": job.required_skills or [], "nice_to_have_skills": job.nice_to_have_skills or [], "min_experience_years": job.min_experience_years}
    return await get_ai_provider().compare_candidates(candidate_data, job_data)


def _cosine_similarity(left: list[float], right: list[float]) -> float:
    """Return cosine similarity clamped to the conventional [0, 1] range."""

    if not left or not right or len(left) != len(right):
        return 0.0
    denominator = math.sqrt(sum(value * value for value in left)) * math.sqrt(sum(value * value for value in right))
    if denominator == 0:
        return 0.0
    return max(0.0, min(1.0, (sum(a * b for a, b in zip(left, right, strict=True)) / denominator + 1.0) / 2.0))
