"""Candidate API endpoints."""

import uuid
import csv
from io import StringIO
from pathlib import Path
from typing import Any

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.ai import OutreachEmailRequest, OutreachEmailResponse
from app.schemas.candidate import CandidateCreate, CandidateDetailRead, CandidateRead
from app.services import candidate_service
from app.core.exceptions import ValidationError

router = APIRouter()

ALLOWED_UPLOAD_TYPES = {
    ".pdf": {"application/pdf"},
    ".docx": {"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},
    ".txt": {"text/plain"},
    ".md": {"text/plain", "text/markdown"},
}


@router.get("/", response_model=list[CandidateRead])
async def list_candidates(
    db: AsyncSession = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    skill_filter: str | None = None,
    search: str | None = None,
) -> list[CandidateRead]:
    return await candidate_service.get_candidates(db, skip, limit, skill_filter, search)


@router.post("/", response_model=CandidateRead, status_code=status.HTTP_201_CREATED)
async def create_candidate(candidate_in: CandidateCreate, db: AsyncSession = Depends(get_db)) -> CandidateRead:
    return await candidate_service.create_candidate(db, candidate_in)


@router.post("/upload-resume", response_model=CandidateDetailRead, status_code=status.HTTP_201_CREATED)
async def upload_resume(file: UploadFile = File(...), db: AsyncSession = Depends(get_db)) -> CandidateDetailRead:
    if not file.filename:
        raise HTTPException(status_code=400, detail="A filename is required")
    extension = Path(file.filename).suffix.lower()
    allowed_mimes = ALLOWED_UPLOAD_TYPES.get(extension)
    if allowed_mimes is None:
        raise HTTPException(status_code=415, detail="Unsupported file type; upload a PDF, DOCX, TXT, or Markdown file")
    if file.content_type not in allowed_mimes:
        expected = ", ".join(sorted(allowed_mimes))
        raise HTTPException(status_code=415, detail=f"Invalid MIME type for {extension}; expected {expected}")
    content = await file.read()
    try:
        return await candidate_service.parse_and_create_candidate_from_resume(db, content, file.filename)
    except ValidationError as exc:
        raise HTTPException(status_code=422, detail=exc.message) from exc
    except Exception as exc:
        await db.rollback()
        raise HTTPException(status_code=422, detail=f"Unable to process resume: {exc}") from exc


@router.get("/export/csv", response_class=StreamingResponse)
async def export_candidates_csv(db: AsyncSession = Depends(get_db)) -> StreamingResponse:
    """Stream candidate contact, experience, and skill data as CSV."""

    candidates = await candidate_service.get_candidates(db, skip=0, limit=100000)
    output = StringIO()
    writer = csv.writer(output)
    writer.writerow(["id", "first_name", "last_name", "email", "phone", "headline", "location", "experience_years", "skills"])
    for candidate in candidates:
        writer.writerow([
            candidate.id,
            candidate.first_name,
            candidate.last_name,
            candidate.email,
            candidate.phone or "",
            candidate.headline or "",
            candidate.location or "",
            candidate.experience_years,
            "; ".join(candidate.skills or [])
        ])
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=candidates.csv"}
    )


@router.post("/{candidate_id}/outreach-email", response_model=OutreachEmailResponse)
async def outreach_email(candidate_id: uuid.UUID, request: OutreachEmailRequest, db: AsyncSession = Depends(get_db)) -> OutreachEmailResponse:
    if request.candidate_id != candidate_id:
        raise HTTPException(status_code=400, detail="Request candidate_id does not match the URL")
    try:
        return await candidate_service.generate_outreach_email(db, candidate_id, request.job_id, request.tone, request.company_name)
    except ValidationError as exc:
        raise HTTPException(status_code=422, detail=exc.message) from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Unable to generate outreach email: {exc}") from exc


@router.get("/{candidate_id}", response_model=CandidateDetailRead)
async def get_candidate(candidate_id: uuid.UUID, db: AsyncSession = Depends(get_db)) -> CandidateDetailRead:
    candidate = await candidate_service.get_candidate_by_id(db, candidate_id)
    if candidate is None:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return candidate


@router.patch("/{candidate_id}", response_model=CandidateDetailRead)
async def update_candidate(
    candidate_id: uuid.UUID,
    update_data: dict[str, Any],
    db: AsyncSession = Depends(get_db)
) -> CandidateDetailRead:
    try:
        candidate = await candidate_service.update_candidate(db, candidate_id, update_data)
        return candidate
    except Exception as exc:
        await db.rollback()
        raise HTTPException(status_code=400, detail=f"Failed to update candidate: {exc}") from exc


@router.delete("/{candidate_id}")
async def delete_candidate(candidate_id: uuid.UUID, db: AsyncSession = Depends(get_db)) -> dict:
    try:
        await candidate_service.delete_candidate(db, candidate_id)
        return {"message": "Candidate deleted successfully"}
    except Exception as exc:
        await db.rollback()
        raise HTTPException(status_code=400, detail=f"Failed to delete candidate: {exc}") from exc
