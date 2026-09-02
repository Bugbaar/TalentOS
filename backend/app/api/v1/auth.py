"""Authentication API endpoints."""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Form, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.exceptions import ValidationError
from app.core.security import TokenData, create_access_token, verify_token
from app.services.auth_service import (
    authenticate_user,
    create_user,
    generate_password,
)
from app.models.user import User, UserRole

router = APIRouter()


class TokenResponse(BaseModel):
    """Token response."""

    access_token: str
    token_type: str = "bearer"


@router.post("/login", response_model=TokenResponse)
async def login(
    email: Annotated[str, Form()],
    password: Annotated[str, Form()],
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    """Authenticate user and return access token."""
    auth_response = await authenticate_user(db, email=email, password=password)
    if auth_response is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return TokenResponse(access_token=auth_response.access_token)


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(
    email: str,
    username: str,
    full_name: str,
    password: str,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    """Register a new user account."""
    try:
        await create_user(
            db=db,
            email=email,
            username=username,
            full_name=full_name,
            password=password,
        )
    except ValidationError as exc:
        raise HTTPException(status_code=422, detail=exc.message) from exc
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    auth_response = await authenticate_user(db, email, password)
    if auth_response is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create session",
        )
    return TokenResponse(access_token=auth_response.access_token)


@router.post("/register/admin", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register_admin(
    email: str,
    username: str,
    full_name: str,
    password: str,
    admin_api_key: str,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    """Create an admin user (requires admin API key)."""
    if admin_api_key != settings.ADMIN_API_KEY:
        raise HTTPException(status_code=403, detail="Invalid admin API key")

    try:
        await create_user(
            db=db,
            email=email,
            username=username,
            full_name=full_name,
            password=password,
            role=UserRole.ADMIN,
        )
    except ValidationError as exc:
        raise HTTPException(status_code=422, detail=exc.message) from exc
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    auth_response = await authenticate_user(db, email, password)
    if auth_response is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create session",
        )
    return TokenResponse(access_token=auth_response.access_token)


@router.get("/me", response_model=dict)
async def get_current_user(
    token: str = Depends(verify_token),
) -> dict:
    """Get current user profile."""
    return {
        "user_id": token.subject,
        "email": token.email,
        "role": token.role,
    }


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(token: str) -> TokenResponse:
    """Refresh an access token using a refresh token."""
    token_data = verify_token(token)
    if token_data is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )
    new_token = create_access_token(
        subject=token_data.subject,
        role=token_data.role,
        email=token_data.email,
    )
    return TokenResponse(access_token=new_token)


@router.get("/users", response_model=list[dict])
async def list_users(
    db: AsyncSession = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    role: str | None = None,
) -> list[dict]:
    """List all users (admin only)."""
    from app.services.auth_service import list_users

    users = await list_users(db, skip, limit, UserRole(role) if role else None)
    return [
        {
            "id": str(u.id),
            "email": u.email,
            "username": u.username,
            "full_name": u.full_name,
            "role": u.role.value,
            "is_active": u.is_active,
            "created_at": u.created_at.isoformat(),
        }
        for u in users
    ]


@router.get("/users/{user_id}", response_model=dict)
async def get_user(user_id: uuid.UUID, db: AsyncSession = Depends(get_db)) -> dict:
    """Get a user by ID."""
    user = await db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "id": str(user.id),
        "email": user.email,
        "username": user.username,
        "full_name": user.full_name,
        "role": user.role.value,
        "is_active": user.is_active,
        "created_at": user.created_at.isoformat(),
    }


@router.post("/generate-password")
async def generate_password_endpoint() -> dict:
    """Generate a random secure password."""
    return {"password": generate_password()}
