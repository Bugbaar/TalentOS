from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.ai.skills import normalize_skill_list
from app.db import get_db
from app.deps import get_current_user, require_recruiter
from app.models import Job, User
from app.schemas import JobIn, JobOut

router = APIRouter(prefix="/api/jobs", tags=["jobs"])


def _job_out(job: Job) -> JobOut:
    return JobOut(
        id=job.id,
        recruiter_id=job.recruiter_id,
        title=job.title,
        department=job.department,
        location=job.location,
        employment_type=job.employment_type,
        seniority=job.seniority,
        description=job.description,
        required_skills=job.required_skills or [],
        optional_skills=job.optional_skills or [],
        min_years_experience=job.min_years_experience,
        education_requirement=job.education_requirement,
        status=job.status,
        created_at=job.created_at,
        application_count=len(job.applications or []),
    )


@router.get("", response_model=list[JobOut])
def list_jobs(
    status: str | None = Query(default=None),
    q: str | None = None,
    mine: bool = False,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[JobOut]:
    query = db.query(Job)
    if user.role == "recruiter":
        query = query.filter(Job.recruiter_id == user.id)
    else:
        query = query.filter(Job.status == "open")
    if mine and user.role == "recruiter":
        query = query.filter(Job.recruiter_id == user.id)
    if status:
        query = query.filter(Job.status == status)
    jobs = query.order_by(Job.created_at.desc()).all()
    if q:
        needle = q.lower()
        jobs = [
            job
            for job in jobs
            if needle in job.title.lower()
            or needle in (job.location or "").lower()
            or needle in " ".join(job.required_skills or []).lower()
        ]
    return [_job_out(job) for job in jobs]


@router.post("", response_model=JobOut, status_code=201)
def create_job(payload: JobIn, user: User = Depends(require_recruiter), db: Session = Depends(get_db)) -> JobOut:
    job = Job(
        recruiter_id=user.id,
        title=payload.title.strip(),
        department=payload.department,
        location=payload.location,
        employment_type=payload.employment_type,
        seniority=payload.seniority,
        description=payload.description.strip(),
        required_skills=normalize_skill_list(payload.required_skills),
        optional_skills=normalize_skill_list(payload.optional_skills),
        min_years_experience=payload.min_years_experience,
        education_requirement=payload.education_requirement,
        status=payload.status,
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return _job_out(job)


@router.get("/{job_id}", response_model=JobOut)
def get_job(job_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> JobOut:
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.status != "open" and user.role == "candidate":
        raise HTTPException(status_code=404, detail="Job not found")
    return _job_out(job)


@router.patch("/{job_id}", response_model=JobOut)
def update_job(
    job_id: int,
    payload: JobIn,
    user: User = Depends(require_recruiter),
    db: Session = Depends(get_db),
) -> JobOut:
    job = db.query(Job).filter(Job.id == job_id, Job.recruiter_id == user.id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    job.title = payload.title.strip()
    job.department = payload.department
    job.location = payload.location
    job.employment_type = payload.employment_type
    job.seniority = payload.seniority
    job.description = payload.description.strip()
    job.required_skills = normalize_skill_list(payload.required_skills)
    job.optional_skills = normalize_skill_list(payload.optional_skills)
    job.min_years_experience = payload.min_years_experience
    job.education_requirement = payload.education_requirement
    job.status = payload.status
    db.commit()
    db.refresh(job)
    return _job_out(job)
