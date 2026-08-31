"""Shared helpers to score a candidate against a job and persist the snapshot."""

from __future__ import annotations

from app.models import CandidateProfile, Job
from app.services.matching import match_candidate_to_job, to_breakdown


def score_profile_against_job(profile: CandidateProfile, job: Job) -> dict:
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
    return to_breakdown(result)
