"""FastAPI application entrypoint for TalentOS."""

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.database import Base, engine
from app.core.exceptions import setup_exception_handlers
from app.core.rate_limit import RateLimitMiddleware
from app.models import Application, Candidate, JobOpening, Resume


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    """Create missing tables at startup and release the engine at shutdown."""

    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()


app = FastAPI(title="TalentOS API", version="1.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(RateLimitMiddleware)
app.include_router(api_router, prefix="/api/v1")
setup_exception_handlers(app)


@app.get("/health", tags=["health"])
async def health() -> dict[str, str]:
    """Return a lightweight liveness response."""

    return {"status": "ok"}
