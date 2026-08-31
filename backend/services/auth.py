from fastapi import HTTPException,status
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models.candidate_model import Candidate
from backend.repository.candidate_repository import (
    create_candidate,
    get_candidate_by_email
)
from backend.core.security import hash_password,verify_password
from backend.core.dependencies import create_access_token


async def register_candidate(
    db: AsyncSession,
    email: str,
    password: str,
    full_name: str,
    phone: str | None = None,
    location: str | None = None,
    skills: str | None = None,
    bio: str | None = None
):
    existing_candidate = await get_candidate_by_email(db,email)

    if existing_candidate:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered"
        )

    candidate = Candidate(
        email=email,
        hashed_password=hash_password(password),
        full_name=full_name,
        phone=phone,
        location=location,
        skills=skills,
        bio=bio
    )

    return await create_candidate(db,candidate)


async def login_candidate(
    db: AsyncSession,
    email: str,
    password: str
):
    candidate = await get_candidate_by_email(db,email)

    if not candidate or not verify_password(
        password,
        candidate.hashed_password
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"}
        )

    access_token = await create_access_token({
        "sub": str(candidate.id)
    })

    return access_token