"""Advanced matching API endpoints."""

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.ai import (
    AdvancedMatchResult,
    AdvancedMatchingRequest,
    BatchRankingRequest,
    BatchRankingResponse,
    BiasAuditResult,
)
from app.services import advanced_matching_service

router = APIRouter()


@router.post("/evaluate-advanced", response_model=AdvancedMatchResult)
async def evaluate_candidate_advanced(
    request: AdvancedMatchingRequest,
    db: AsyncSession = Depends(get_db),
) -> AdvancedMatchResult:
    """Evaluate a candidate against a job using advanced multi-factor matching.

    This endpoint provides:
    - Weighted multi-factor scoring (skill, experience, semantic, education, cultural)
    - Confidence intervals
    - Success probability prediction
    - Detailed skill gap analysis
    - Custom weight configuration
    """
    try:
        return await advanced_matching_service.evaluate_candidate_for_job_advanced(
            db, request.candidate_id, request.job_id, request.weights
        )
    except Exception as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.post("/rank-candidates-advanced", response_model=BatchRankingResponse)
async def rank_candidates_advanced(
    request: BatchRankingRequest,
    db: AsyncSession = Depends(get_db),
) -> BatchRankingResponse:
    """Rank all candidates for a job using advanced matching algorithm.

    Returns candidates sorted by overall match score with detailed analysis.
    """
    try:
        ranked = await advanced_matching_service.batch_rank_candidates_for_job(
            db, request.job_id, request.limit, request.min_score
        )
        return BatchRankingResponse(
            job_id=request.job_id,
            total_candidates=len(ranked),
            candidates=[
                {
                    "candidate": {
                        "id": str(item["candidate"].id),
                        "first_name": item["candidate"].first_name,
                        "last_name": item["candidate"].last_name,
                        "email": item["candidate"].email,
                        "headline": item["candidate"].headline,
                        "experience_years": item["candidate"].experience_years,
                        "skills": item["candidate"].skills or [],
                    },
                    "match": item["match"].model_dump(),
                }
                for item in ranked
            ],
        )
    except Exception as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.get("/bias-audit", response_model=BiasAuditResult)
async def get_bias_audit(
    job_id: uuid.UUID | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
) -> BiasAuditResult:
    """Audit the evaluation pipeline for bias across demographic groups.

    This endpoint analyzes the candidate pipeline for potential bias patterns
    and provides recommendations to improve fairness.
    """
    return await advanced_matching_service.detect_bias_in_evaluations(db, job_id)


@router.get("/weights/defaults", response_model=dict)
async def get_default_weights() -> dict:
    """Get the default scoring weights for the advanced matching algorithm."""
    return {
        "weights": {
            "skill": 0.40,
            "experience": 0.25,
            "semantic": 0.20,
            "education": 0.10,
            "cultural": 0.05,
        },
        "description": {
            "skill": "Skill overlap with required and nice-to-have skills",
            "experience": "Years of experience relative to job requirement",
            "semantic": "Semantic similarity between resume and job description",
            "education": "Educational background relevance",
            "cultural": "Cultural fit signals from bio and location",
        },
    }
