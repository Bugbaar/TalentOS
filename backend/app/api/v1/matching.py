"""Candidate matching API endpoints."""

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.ai import (CompareCandidatesRequest, CompareCandidatesResponse,
                            InterviewKitRequest, InterviewKitResponse,
                            MatchResultSchema)
from app.services import matching_service

router = APIRouter()


@router.post("/evaluate", response_model=MatchResultSchema)
async def evaluate_candidate(candidate_id: uuid.UUID, job_id: uuid.UUID, db: AsyncSession = Depends(get_db)) -> MatchResultSchema:
    try:
        return await matching_service.evaluate_candidate_for_job(db, candidate_id, job_id)
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.post("/interview-kit", response_model=InterviewKitResponse)
async def interview_kit(request: InterviewKitRequest, db: AsyncSession = Depends(get_db)) -> InterviewKitResponse:
    try:
        return await matching_service.generate_interview_kit(db, request.candidate_id, request.job_id)
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.post("/compare", response_model=CompareCandidatesResponse)
async def compare(request: CompareCandidatesRequest, db: AsyncSession = Depends(get_db)) -> CompareCandidatesResponse:
    try:
        return await matching_service.compare_candidates(db, request.candidate_ids, request.job_id)
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.get("/job/{job_id}/ranked-candidates")
async def ranked_candidates(job_id: uuid.UUID, limit: int = Query(20, ge=1, le=1000), db: AsyncSession = Depends(get_db)) -> list[dict]:
    try:
        return await matching_service.rank_candidates_for_job(db, job_id, limit)
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
