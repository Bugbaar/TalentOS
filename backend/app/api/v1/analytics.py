"""Advanced analytics API endpoints with comprehensive insights."""

import uuid
from collections import Counter
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.application import Application, ApplicationStatus
from app.models.candidate import Candidate
from app.models.job import JobOpening, JobStatus
from app.schemas.ai import (
    HiringFunnelAnalytics,
    SkillDemandAnalytics,
    TimeToHireAnalytics,
)

router = APIRouter()


@router.get("/summary")
async def analytics_summary(db: AsyncSession = Depends(get_db)) -> dict:
    """Return hiring funnel counts and the most common candidate skills."""

    candidate_count = await db.scalar(select(func.count()).select_from(Candidate)) or 0
    active_job_count = await db.scalar(
        select(func.count()).select_from(JobOpening).where(JobOpening.status == JobStatus.ACTIVE)
    ) or 0
    application_count = await db.scalar(select(func.count()).select_from(Application)) or 0

    stage_rows = await db.execute(
        select(Application.status, func.count()).group_by(Application.status)
    )
    stages = {stage.value: 0 for stage in ApplicationStatus}
    stages.update({stage.value: count for stage, count in stage_rows.all()})

    candidate_skills = (await db.execute(select(Candidate.skills))).scalars().all()
    skill_counts: Counter[str] = Counter(
        skill for skills in candidate_skills for skill in (skills or [])
    )

    return {
        "total_candidates": candidate_count,
        "active_jobs": active_job_count,
        "total_applications": application_count,
        "applications_by_stage": stages,
        "top_candidate_skills": [
            {"skill": skill, "count": count}
            for skill, count in skill_counts.most_common(10)
        ],
    }


@router.get("/funnel", response_model=list[HiringFunnelAnalytics])
async def get_hiring_funnel(
    job_id: Optional[uuid.UUID] = Query(default=None),
    days: int = Query(default=90, ge=1, le=365),
    db: AsyncSession = Depends(get_db),
) -> list[HiringFunnelAnalytics]:
    """Get hiring funnel analytics with conversion rates.

    Args:
        job_id: Optional specific job to analyze
        days: Number of days to look back

    Returns:
        List of stages with counts and conversion rates
    """
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)

    # Get applications count by stage
    query = (
        select(Application.status, func.count())
        .where(Application.applied_at >= cutoff)
    )
    if job_id:
        query = query.where(Application.job_id == job_id)
    query = query.group_by(Application.status)

    stage_rows = await db.execute(query)
    stage_counts = {stage.value: count for stage, count in stage_rows.all()}

    # Calculate conversion rates
    stages = [
        ApplicationStatus.APPLIED,
        ApplicationStatus.SCREENING,
        ApplicationStatus.INTERVIEW,
        ApplicationStatus.OFFER,
        ApplicationStatus.HIRED,
    ]

    result = []
    prev_count = 0
    for stage in stages:
        count = stage_counts.get(stage.value, 0)
        conversion_rate = None
        if prev_count > 0:
            conversion_rate = round((count / prev_count) * 100, 1)
        elif count > 0:
            conversion_rate = 100.0
        result.append(
            HiringFunnelAnalytics(
                stage=stage.value,
                count=count,
                conversion_rate=conversion_rate,
            )
        )
        prev_count = count if count > prev_count else prev_count

    return result


@router.get("/skills-demand", response_model=list[SkillDemandAnalytics])
async def get_skills_demand(
    db: AsyncSession = Depends(get_db),
    limit: int = Query(default=20, ge=1, le=100),
) -> list[SkillDemandAnalytics]:
    """Get skill demand analytics from active jobs.

    Returns skills sorted by demand (how many jobs require them).
    """
    # Get required skills from active jobs
    jobs = list(
        (await db.execute(select(JobOpening).where(JobOpening.status == JobStatus.ACTIVE)))
        .scalars()
        .all()
    )

    skill_demand: Counter[str] = Counter()
    for job in jobs:
        for skill in (job.required_skills or []):
            skill_demand[skill] += 1

    # Calculate average match score per skill
    skill_match_totals: dict[str, list[float]] = {}
    for job in jobs:
        for app in job.applications:
            if app.ai_match_score is not None:
                for skill in (job.required_skills or []):
                    if skill not in skill_match_totals:
                        skill_match_totals[skill] = []
                    skill_match_totals[skill].append(app.ai_match_score)

    result = []
    for skill, demand_count in skill_demand.most_common(limit):
        scores = skill_match_totals.get(skill, [])
        avg_score = sum(scores) / len(scores) if scores else 0.0
        result.append(
            SkillDemandAnalytics(
                skill=skill,
                demand_count=demand_count,
                avg_match_score=round(avg_score, 1),
            )
        )

    return result


@router.get("/time-to-hire", response_model=TimeToHireAnalytics)
async def get_time_to_hire(
    db: AsyncSession = Depends(get_db),
    days: int = Query(default=180, ge=1, le=365),
) -> TimeToHireAnalytics:
    """Calculate average time to hire and time per stage.

    Args:
        days: Number of days to analyze

    Returns:
        Time-to-hire metrics and stage-level breakdowns
    """
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)

    # Get hired applications
    hired_apps = list(
        (
            await db.execute(
                select(Application)
                .where(
                    Application.status == ApplicationStatus.HIRED,
                    Application.applied_at >= cutoff,
                )
                .order_by(Application.applied_at.desc())
            )
        )
        .scalars()
        .all()
    )

    if not hired_apps:
        return TimeToHireAnalytics(
            avg_days_to_hire=0.0,
            avg_days_per_stage={},
            fastest_hires=[],
            slowest_stages=[],
        )

    # Calculate time to hire
    total_days = 0
    stage_times: dict[str, list[float]] = {}
    fastest = []
    slowest_stages = []

    for app in hired_apps:
        hire_date = app.applied_at
        days_to_hire = (datetime.now(timezone.utc) - hire_date).days
        total_days += days_to_hire

        # Track stage times
        for status in ApplicationStatus:
            if status != ApplicationStatus.HIRED:
                if status.value not in stage_times:
                    stage_times[status.value] = []
                # Simplified: assume equal time per stage
                stage_times[status.value].append(days_to_hire / 6)

    avg_days_to_hire = total_days / len(hired_apps)
    avg_days_per_stage = {
        stage: round(sum(times) / len(times), 1)
        if times else 0.0
        for stage, times in stage_times.items()
    }

    # Find slowest stages
    if avg_days_per_stage:
        sorted_stages = sorted(avg_days_per_stage.items(), key=lambda x: x[1], reverse=True)
        slowest_stages = [stage for stage, _ in sorted_stages[:3]]

    return TimeToHireAnalytics(
        avg_days_to_hire=round(avg_days_to_hire, 1),
        avg_days_per_stage=avg_days_per_stage,
        fastest_hires=fastest,
        slowest_stages=slowest_stages,
    )


@router.get("/pipeline-health")
async def get_pipeline_health(
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Get overall pipeline health metrics.

    Returns:
        Pipeline health indicators including aging applications,
        bottleneck stages, and recommendations.
    """
    # Get application age distribution
    cutoff_30_days = datetime.now(timezone.utc) - timedelta(days=30)
    cutoff_60_days = datetime.now(timezone.utc) - timedelta(days=60)

    old_apps_count = await db.scalar(
        select(func.count())
        .select_from(Application)
        .where(Application.applied_at < cutoff_30_days)
    ) or 0

    very_old_apps_count = await db.scalar(
        select(func.count())
        .select_from(Application)
        .where(Application.applied_at < cutoff_60_days)
    ) or 0

    # Get rejected count
    rejected_count = await db.scalar(
        select(func.count())
        .select_from(Application)
        .where(Application.status == ApplicationStatus.REJECTED)
    ) or 0

    total_active = await db.scalar(
        select(func.count())
        .select_from(Application)
        .where(
            Application.status.notin_([ApplicationStatus.HIRED, ApplicationStatus.REJECTED])
        )
    ) or 0

    recommendations = []
    health_score = 100

    # Check for aging applications
    if old_apps_count > 10:
        health_score -= 10
        recommendations.append(
            f"{old_apps_count} applications are over 30 days old. Consider reviewing stale candidates."
        )

    # Check for bottleneck
    interview_count = await db.scalar(
        select(func.count())
        .select_from(Application)
        .where(Application.status == ApplicationStatus.INTERVIEW)
    ) or 0
    if interview_count > total_active * 0.4:
        health_score -= 15
        recommendations.append(
            "High concentration in Interview stage. Consider accelerating offers or rejections."
        )

    # Check conversion rate
    if total_active > 0 and rejected_count > total_active * 0.5:
        health_score -= 10
        recommendations.append(
            "High rejection rate. Review job requirements and candidate sourcing."
        )

    return {
        "health_score": max(0, health_score),
        "status": "healthy" if health_score >= 80 else "needs_attention" if health_score >= 50 else "critical",
        "total_active_applications": total_active,
        "applications_over_30_days": old_apps_count,
        "applications_over_60_days": very_old_apps_count,
        "total_rejections": rejected_count,
        "recommendations": recommendations,
    }


@router.get("/department-breakdown")
async def get_department_breakdown(
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Get application and hiring breakdown by department.

    Returns:
        Per-department metrics including open jobs, applications, and hire rate.
    """
    # Get all jobs with their applications
    jobs = list(
        (await db.execute(select(JobOpening))).scalars().all()
    )

    departments = {}
    for job in jobs:
        dept = job.department
        if dept not in departments:
            departments[dept] = {
                "department": dept,
                "total_jobs": 0,
                "active_jobs": 0,
                "total_applications": 0,
                "hired": 0,
                "rejected": 0,
                "in_progress": 0,
                "avg_match_score": 0.0,
                "total_scores": 0.0,
                "scores_count": 0,
            }

        departments[dept]["total_jobs"] += 1
        if job.status == JobStatus.ACTIVE:
            departments[dept]["active_jobs"] += 1

        for app in job.applications:
            departments[dept]["total_applications"] += 1
            if app.status == ApplicationStatus.HIRED:
                departments[dept]["hired"] += 1
            elif app.status == ApplicationStatus.REJECTED:
                departments[dept]["rejected"] += 1
            elif app.status not in [ApplicationStatus.HIRED, ApplicationStatus.REJECTED]:
                departments[dept]["in_progress"] += 1
            if app.ai_match_score is not None:
                departments[dept]["total_scores"] += app.ai_match_score
                departments[dept]["scores_count"] += 1

    # Calculate derived metrics
    for dept_data in departments.values():
        if dept_data["scores_count"] > 0:
            dept_data["avg_match_score"] = round(
                dept_data["total_scores"] / dept_data["scores_count"], 1
            )
        total_closed = dept_data["hired"] + dept_data["rejected"]
        if total_closed > 0:
            dept_data["hire_rate"] = round(
                dept_data["hired"] / total_closed * 100, 1
            )
        else:
            dept_data["hire_rate"] = 0.0
        del dept_data["total_scores"]
        del dept_data["scores_count"]

    return {
        "departments": list(departments.values()),
        "total_departments": len(departments),
    }


@router.get("/trend")
async def get_trend_analytics(
    db: AsyncSession = Depends(get_db),
    metric: str = Query(default="applications", regex="^(applications|candidates|hires)$"),
    period: str = Query(default="30d", regex="^(7d|30d|90d|1y)$"),
) -> dict:
    """Get trend analytics over a time period.

    Args:
        metric: Metric to analyze (applications, candidates, hires)
        period: Time period (7d, 30d, 90d, 1y)

    Returns:
        Daily data points for trend visualization.
    """
    period_days = {"7d": 7, "30d": 30, "90d": 90, "1y": 365}
    days = period_days.get(period, 30)
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)

    # Get data by day
    # Using a simplified approach - in production, use proper date grouping
    results = []
    for i in range(min(days, 30)):  # Limit to 30 data points
        day_start = cutoff + timedelta(days=i)
        day_end = day_start + timedelta(days=1)

        if metric == "applications":
            count = await db.scalar(
                select(func.count())
                .select_from(Application)
                .where(
                    Application.applied_at >= day_start,
                    Application.applied_at < day_end,
                )
            ) or 0
        elif metric == "candidates":
            count = await db.scalar(
                select(func.count())
                .select_from(Candidate)
                .where(
                    Candidate.created_at >= day_start,
                    Candidate.created_at < day_end,
                )
            ) or 0
        else:  # hires
            count = await db.scalar(
                select(func.count())
                .select_from(Application)
                .where(
                    Application.status == ApplicationStatus.HIRED,
                    Application.applied_at >= day_start,
                    Application.applied_at < day_end,
                )
            ) or 0

        results.append({
            "date": day_start.strftime("%Y-%m-%d"),
            "value": count,
        })

    return {
        "metric": metric,
        "period": period,
        "data": results,
        "total": sum(d["value"] for d in results),
    }
