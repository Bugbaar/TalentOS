from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import require_candidate, require_recruiter
from app.models import CandidateProfile, Job, User
from app.schemas import RecommendationOut
from app.services.matching import match_candidate_to_job, to_breakdown
from app.services.matching_apply import score_profile_against_job

router = APIRouter(prefix="/api/matching", tags=["matching"])


@router.get("/jobs/{job_id}/preview/{candidate_id}")
def preview_match(
    job_id: int,
    candidate_id: int,
    user: User = Depends(require_recruiter),
    db: Session = Depends(get_db),
) -> dict:
    job = db.query(Job).filter(Job.id == job_id, Job.recruiter_id == user.id).first()
    profile = db.query(CandidateProfile).filter(CandidateProfile.id == candidate_id).first()
    if not job or not profile:
        raise HTTPException(status_code=404, detail="Job or candidate not found")
    return score_profile_against_job(profile, job)


@router.get("/recommendations", response_model=list[RecommendationOut])
def recommend_jobs(
    user: User = Depends(require_candidate),
    db: Session = Depends(get_db),
) -> list[RecommendationOut]:
    profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == user.id).first()
    if not profile or not (profile.skills or []):
        return []
    jobs = db.query(Job).filter(Job.status == "open").all()
    ranked: list[RecommendationOut] = []
    for job in jobs:
        result = match_candidate_to_job(
            candidate_skills=profile.skills or [],
            candidate_years=profile.years_experience or 0,
            candidate_education=profile.education_level or "Unknown",
            candidate_seniority=profile.seniority or "mid",
            required_skills=job.required_skills or [],
            optional_skills=job.optional_skills or [],
            min_years=job.min_years_experience or 0,
            required_education=job.education_requirement or "Unknown",
            job_seniority=job.seniority or "mid",
        )
        breakdown = to_breakdown(result)
        ranked.append(
            RecommendationOut(
                job_id=job.id,
                title=job.title,
                location=job.location,
                seniority=job.seniority,
                required_skills=job.required_skills or [],
                match_score=result.score,
                match_breakdown=breakdown,
                status=job.status,
            )
        )
    ranked.sort(key=lambda item: item.match_score, reverse=True)
    return ranked
