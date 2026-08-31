from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import get_current_user
from app.models import CandidateProfile, User
from app.schemas import LoginRequest, RegisterRequest, TokenResponse, UserOut
from app.security import create_access_token, hash_password, verify_password

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)) -> TokenResponse:
    existing = db.query(User).filter(User.email == payload.email.lower()).first()
    if existing:
        raise HTTPException(status_code=409, detail="An account with this email already exists")
    if payload.role == "recruiter" and not (payload.organization or "").strip():
        raise HTTPException(status_code=400, detail="Recruiters must provide an organization name")

    user = User(
        email=payload.email.lower(),
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name.strip(),
        role=payload.role,
        organization=(payload.organization or "").strip() or None,
    )
    db.add(user)
    db.flush()
    if payload.role == "candidate":
        db.add(CandidateProfile(user_id=user.id, skills=[], education=[], experience=[], links=[]))
    db.commit()
    db.refresh(user)
    token = create_access_token(user.email, user.role)
    return TokenResponse(access_token=token, role=user.role, full_name=user.full_name, email=user.email)


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    token = create_access_token(user.email, user.role)
    return TokenResponse(access_token=token, role=user.role, full_name=user.full_name, email=user.email)


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)) -> User:
    return user
