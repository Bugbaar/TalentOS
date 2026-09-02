"""Job and application API endpoints."""

import uuid
import csv
from io import StringIO

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.job import JobStatus
from app.models.application import Application, InterviewScorecard, ApplicationActivity
from app.models.candidate import Candidate
from app.schemas.application import ScorecardCreate, ScorecardRead
from app.schemas.ai import JobEnrichmentRequest, JobEnrichmentResponse
from app.schemas.job import ApplicationCreate, ApplicationRead, ApplicationStatusUpdate, JobCreate, JobDetailRead, JobRead, BulkStatusUpdate
from app.services import job_service
from app.core.exceptions import ValidationError

router = APIRouter()


@router.get("/", response_model=list[JobRead])
async def list_jobs(
    db: AsyncSession = Depends(get_db),
    status_filter: JobStatus | None = Query(default=None, alias="status"),
    department: str | None = None,
) -> list[JobRead]:
    return await job_service.get_jobs(db, status_filter, department)


@router.post("/", response_model=JobRead, status_code=status.HTTP_201_CREATED)
async def create_job(job_in: JobCreate, db: AsyncSession = Depends(get_db)) -> JobRead:
    return await job_service.create_job(db, job_in)


@router.post("/enrich-draft", response_model=JobEnrichmentResponse)
async def enrich_draft(request: JobEnrichmentRequest) -> JobEnrichmentResponse:
    """Polish draft copy and extract a normalized skill taxonomy."""

    raw_text = request.raw_text
    if request.department:
        raw_text = f"Department: {request.department}\n{raw_text}"
    try:
        return await job_service.enrich_draft(request)
    except ValidationError as exc:
        raise HTTPException(status_code=422, detail=exc.message) from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Unable to enrich job draft: {exc}") from exc


@router.get("/{job_id}", response_model=JobDetailRead)
async def get_job(job_id: uuid.UUID, db: AsyncSession = Depends(get_db)) -> JobDetailRead:
    job = await job_service.get_job_by_id(db, job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@router.post("/applications/{application_id}/scorecards", response_model=ScorecardRead, status_code=status.HTTP_201_CREATED)
async def create_scorecard(
    application_id: uuid.UUID,
    scorecard_in: ScorecardCreate,
    db: AsyncSession = Depends(get_db),
) -> ScorecardRead:
    if await db.get(Application, application_id) is None:
        raise HTTPException(status_code=404, detail="Application not found")
    scorecard = InterviewScorecard(application_id=application_id, **scorecard_in.model_dump())
    db.add(scorecard)
    await db.commit()
    await db.refresh(scorecard)
    return scorecard


@router.get("/applications/{application_id}/scorecards", response_model=list[ScorecardRead])
async def list_scorecards(
    application_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> list[ScorecardRead]:
    if await db.get(Application, application_id) is None:
        raise HTTPException(status_code=404, detail="Application not found")
    return list(
        (await db.execute(select(InterviewScorecard).where(InterviewScorecard.application_id == application_id).order_by(InterviewScorecard.created_at.desc())))
        .scalars()
        .all()
    )


@router.get("/{job_id}/applicants/export/csv", response_class=StreamingResponse)
async def export_job_applicants_csv(job_id: uuid.UUID, db: AsyncSession = Depends(get_db)) -> StreamingResponse:
    job = await db.get(JobOpening, job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")
    result = await db.execute(select(Application, Candidate).join(Candidate, Candidate.id == Application.candidate_id).where(Application.job_id == job_id).order_by(Application.applied_at.desc()))
    output = StringIO()
    writer = csv.writer(output)
    writer.writerow(["application_id", "candidate_id", "candidate_name", "email", "stage", "ai_match_score", "applied_at"])
    for application, candidate in result.all():
        writer.writerow([
            application.id,
            candidate.id,
            f"{candidate.first_name} {candidate.last_name}",
            candidate.email,
            application.status.value,
            application.ai_match_score if application.ai_match_score is not None else "",
            application.applied_at.isoformat()
        ])
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=job-{job_id}-applicants.csv"}
    )


@router.post("/{job_id}/apply", response_model=ApplicationRead, status_code=status.HTTP_201_CREATED)
async def apply_for_job(job_id: uuid.UUID, application_in: ApplicationCreate, db: AsyncSession = Depends(get_db)) -> ApplicationRead:
    try:
        application = await job_service.apply_for_job(db, job_id, application_in.candidate_id)
        if application_in.notes is not None:
            application.notes = application_in.notes
            await db.commit()
            await db.refresh(application)
        return application
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc


@router.patch("/applications/{application_id}/status", response_model=ApplicationRead)
async def update_application_status(
    application_id: uuid.UUID,
    update: ApplicationStatusUpdate,
    db: AsyncSession = Depends(get_db),
) -> ApplicationRead:
    try:
        return await job_service.update_application_status(db, application_id, update.status, update.notes)
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.post("/bulk-status", response_model=list[ApplicationRead])
async def bulk_update_application_status(
    update: BulkStatusUpdate,
    db: AsyncSession = Depends(get_db),
) -> list[ApplicationRead]:
    """Bulk update status for multiple applications. Used by Kanban board."""
    results = []
    for app_id in update.application_ids:
        try:
            result = await job_service.update_application_status(db, app_id, update.status)
            results.append(result)
        except LookupError:
            pass  # Skip applications that don't exist
    return results


@router.get("/{job_id}/pipeline", response_model=dict)
async def get_job_pipeline(
    job_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Get all applications for a job organized by pipeline stage."""
    job = await db.get(JobOpening, job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")

    result = await db.execute(
        select(Application, Candidate)
        .join(Candidate, Candidate.id == Application.candidate_id)
        .where(Application.job_id == job_id)
        .order_by(Application.applied_at.desc())
    )

    applications_by_stage = {status.value: [] for status in ApplicationStatus}
    for application, candidate in result.all():
        app_data = {
            "id": str(application.id),
            "candidate_id": str(application.candidate_id),
            "status": application.status.value,
            "ai_match_score": application.ai_match_score,
            "applied_at": application.applied_at.isoformat(),
            "candidate": {
                "id": str(candidate.id),
                "first_name": candidate.first_name,
                "last_name": candidate.last_name,
                "email": candidate.email,
                "headline": candidate.headline,
                "location": candidate.location,
                "skills": candidate.skills or [],
                "experience_years": candidate.experience_years,
            }
        }
        applications_by_stage[application.status.value].append(app_data)

    return {
        "job_id": str(job_id),
        "stages": list(applications_by_stage.keys()),
        "pipeline": applications_by_stage,
    }


@router.get("/applications/{application_id}/activities")
async def get_application_activities(
    application_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> list[dict]:
    """Get the activity timeline for an application."""
    if await db.get(Application, application_id) is None:
        raise HTTPException(status_code=404, detail="Application not found")
    activities = await job_service.get_application_activities(db, application_id)
    return [
        {
            "id": str(a.id),
            "activity_type": a.activity_type,
            "description": a.description,
            "from_status": a.from_status,
            "to_status": a.to_status,
            "created_at": a.created_at.isoformat(),
        }
        for a in activities
    ]