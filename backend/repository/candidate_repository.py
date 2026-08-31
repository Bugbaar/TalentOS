from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models.candidate_model import Candidate


async def get_candidate_by_email(db: AsyncSession,email: str):
    result = await db.execute(
        select(Candidate).where(Candidate.email == email)
    )

    return result.scalar_one_or_none()


async def get_candidate_by_id(db: AsyncSession,candidate_id: int):
    result = await db.execute(
        select(Candidate).where(Candidate.id == candidate_id)
    )

    return result.scalar_one_or_none()


async def create_candidate(db: AsyncSession,candidate: Candidate):
    db.add(candidate)

    await db.commit()
    await db.refresh(candidate)

    return candidate