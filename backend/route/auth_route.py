from fastapi import APIRouter,Depends,status
from sqlalchemy.ext.asyncio import AsyncSession

from backend.core.dependencies import get_db
from backend.schemas.candidate_schema import (
    CandidateRegister,
    CandidateLogin,
    TokenResponse
)
from backend.services.auth import (
    register_candidate,
    login_candidate
)


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


@router.post(
    "/register",
    status_code=status.HTTP_201_CREATED
)
async def register(
    data: CandidateRegister,
    db: AsyncSession = Depends(get_db)
):
    candidate = await register_candidate(
        db=db,
        email=data.email,
        password=data.password,
        full_name=data.full_name,
        phone=data.phone,
        location=data.location,
        skills=data.skills,
        bio=data.bio
    )

    return {
        "message": "Candidate registered successfully",
        "candidate_id": candidate.id
    }


@router.post("/login",response_model=TokenResponse)
async def login(
    data: CandidateLogin,
    db: AsyncSession = Depends(get_db)
):
    access_token = await login_candidate(
        db=db,
        email=data.email,
        password=data.password
    )

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }