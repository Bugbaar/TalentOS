"""API v1 route aggregation."""

from fastapi import APIRouter

from app.api.v1 import analytics, candidates, jobs, matching

api_router = APIRouter()
api_router.include_router(candidates.router, prefix="/candidates", tags=["candidates"])
api_router.include_router(jobs.router, prefix="/jobs", tags=["jobs"])
api_router.include_router(matching.router, prefix="/matching", tags=["matching"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
