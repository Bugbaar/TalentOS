"""Shared async SQLite fixtures for backend tests."""

import os
import sys
from collections.abc import AsyncIterator
from pathlib import Path

import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///:memory:"
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.database import Base, get_db  # noqa: E402
from app.main import app  # noqa: E402
from app.services.ai_engine.factory import get_ai_provider  # noqa: E402
from app.services.ai_engine.mock_provider import MockAIProvider  # noqa: E402


@pytest_asyncio.fixture
async def db_session() -> AsyncIterator[AsyncSession]:
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)
    async with session_factory() as session:
        yield session
    await engine.dispose()


@pytest_asyncio.fixture
async def async_client(db_session: AsyncSession, monkeypatch) -> AsyncIterator[AsyncClient]:
    async def override_db() -> AsyncIterator[AsyncSession]:
        yield db_session

    app.dependency_overrides[get_db] = override_db
    monkeypatch.setattr("app.services.candidate_service.get_ai_provider", lambda: MockAIProvider())
    monkeypatch.setattr("app.services.matching_service.get_ai_provider", lambda: MockAIProvider())
    monkeypatch.setattr("app.api.v1.jobs.get_ai_provider", lambda: MockAIProvider())
    monkeypatch.setattr("app.api.v1.candidates.get_ai_provider", lambda: MockAIProvider(), raising=False)
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        yield client
    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def ai_provider(monkeypatch):
    provider = MockAIProvider()
    monkeypatch.setattr("app.services.matching_service.get_ai_provider", lambda: provider)
    return provider
