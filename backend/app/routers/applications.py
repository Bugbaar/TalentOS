from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import get_current_user, require_candidate, require_recruiter
from app.models import ALLOWED_TRANSITIONS, Application, CandidateProfile, Job, PipelineEvent, User
from app.schemas import ApplicationOut, ApplyRequest, PipelineUpdate, RankedCandidateOut
from app.services.matching_apply import score_profile_against_job

router = APIRouter(prefix="/api/applications", tags=["applications"])


def _app_out(app: Application) -> ApplicationOut:
    return ApplicationOut(
        id=app.id,
        job_id=app.job_id,
        candidate_id=app.candidate_id,
        status=app.status,
        cover_note=app.cover_note,
        match_score=app.match_score,
        match_breakdown=app.match_breakdown or {},
        created_at=app.created_at,
        job_title=app.job.title if app.job else None,
        candidate_name=app.candidate.user.full_name if app.candidate and app.candidate.user else None,
        candidate_skills=(app.candidate.skills or []) if app.candidate else [],
    )


@router.post("", response_model=ApplicationOut, status_code=201)
def apply(
    payload: ApplyRequest,
    user: User = Depends(require_candidate),
    db: Session = Depends(get_db),
) -> ApplicationOut:
    profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == user.id).first()
    if not profile:
        raise HTTPException(status_code=400, detail="Create a candidate profile before applying")
    if not (profile.skills or []):
        raise HTTPException(status_code=400, detail="Parse or add skills on your profile before applying")
    job = db.query(Job).filter(Job.id == payload.job_id).first()
    if not job or job.status != "open":
        raise HTTPException(status_code=404, detail="This role is not open for applications")
    existing = (
        db.query(Application)
        .filter(Application.job_id == job.id, Application.candidate_id == profile.id)
        .first()
    )
    if existing:
        raise HTTPException(status_code=409, detail="You have already applied to this role")

    breakdown = score_profile_against_job(profile, job)
    app = Application(
        job_id=job.id,
        candidate_id=profile.id,
        cover_note=payload.cover_note,
        match_score=breakdown["score"],
        match_breakdown=breakdown,
        status="applied",
    )
    db.add(app)
    db.flush()
    db.add(
        PipelineEvent(
            application_id=app.id,
            actor_id=user.id,
            from_status="none",
            to_status="applied",
            reason="Candidate applied",
        )
    )
    db.commit()
    db.refresh(app)
    return _app_out(app)


@router.get("/me", response_model=list[ApplicationOut])
def my_applications(user: User = Depends(require_candidate), db: Session = Depends(get_db)) -> list[ApplicationOut]:
    profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == user.id).first()
    if not profile:
        return []
    apps = (
        db.query(Application)
        .filter(Application.candidate_id == profile.id)
        .order_by(Application.created_at.desc())
        .all()
    )
    return [_app_out(a) for a in apps]


@router.get("/job/{job_id}", response_model=list[RankedCandidateOut])
def ranked_for_job(
    job_id: int,
    user: User = Depends(require_recruiter),
    db: Session = Depends(get_db),
) -> list[RankedCandidateOut]:
    job = db.query(Job).filter(Job.id == job_id, Job.recruiter_id == user.id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    apps = sorted(job.applications, key=lambda a: (-a.match_score, a.created_at))
    ranked: list[RankedCandidateOut] = []
    for app in apps:
        # Refresh scores if profile changed after apply.
        breakdown = score_profile_against_job(app.candidate, job)
        if breakdown["score"] != app.match_score:
            app.match_score = breakdown["score"]
            app.match_breakdown = breakdown
        ranked.append(
            RankedCandidateOut(
                application_id=app.id,
                candidate_id=app.candidate_id,
                candidate_name=app.candidate.user.full_name,
                headline=app.candidate.headline,
                years_experience=app.candidate.years_experience,
                skills=app.candidate.skills or [],
                status=app.status,
                match_score=app.match_score,
                match_breakdown=app.match_breakdown or {},
            )
        )
    db.commit()
    return ranked


@router.patch("/{application_id}", response_model=ApplicationOut)
def update_pipeline(
    application_id: int,
    payload: PipelineUpdate,
    user: User = Depends(require_recruiter),
    db: Session = Depends(get_db),
) -> ApplicationOut:
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app or app.job.recruiter_id != user.id:
        raise HTTPException(status_code=404, detail="Application not found")
    allowed = ALLOWED_TRANSITIONS.get(app.status, set())
    if payload.status != app.status and payload.status not in allowed:
        raise HTTPException(
            status_code=409,
            detail=f"Cannot move from {app.status} to {payload.status}. Allowed: {sorted(allowed) or 'none'}",
        )
    if payload.status == "rejected" and not (payload.reason or "").strip():
        raise HTTPException(status_code=400, detail="A reason is required when rejecting a candidate")
    event = PipelineEvent(
        application_id=app.id,
        actor_id=user.id,
        from_status=app.status,
        to_status=payload.status,
        reason=payload.reason,
    )
    app.status = payload.status
    db.add(event)
    db.commit()
    db.refresh(app)
    return _app_out(app)


@router.get("/{application_id}", response_model=ApplicationOut)
def get_application(
    application_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ApplicationOut:
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    if user.role == "recruiter" and app.job.recruiter_id != user.id:
        raise HTTPException(status_code=403, detail="Not your hiring pipeline")
    if user.role == "candidate" and app.candidate.user_id != user.id:
        raise HTTPException(status_code=403, detail="Not your application")
    return _app_out(app)
