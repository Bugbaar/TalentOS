from __future__ import annotations

from collections import Counter

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import require_recruiter
from app.models import Application, Job, User

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.get("/overview")
def overview(user: User = Depends(require_recruiter), db: Session = Depends(get_db)) -> dict:
    jobs = db.query(Job).filter(Job.recruiter_id == user.id).all()
    job_ids = [job.id for job in jobs]
    apps = db.query(Application).filter(Application.job_id.in_(job_ids)).all() if job_ids else []
    status_counts = Counter(app.status for app in apps)
    scores = [app.match_score for app in apps]
    avg_score = round(sum(scores) / len(scores), 1) if scores else 0
    strong = sum(1 for s in scores if s >= 80)
    return {
        "open_jobs": sum(1 for job in jobs if job.status == "open"),
        "total_jobs": len(jobs),
        "total_applications": len(apps),
        "average_match_score": avg_score,
        "strong_matches": strong,
        "pipeline": dict(status_counts),
        "jobs": [
            {
                "id": job.id,
                "title": job.title,
                "status": job.status,
                "applications": len(job.applications or []),
            }
            for job in jobs
        ],
    }
