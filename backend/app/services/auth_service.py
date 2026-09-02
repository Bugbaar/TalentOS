"""Authentication service for user management and token creation."""

import logging
import secrets
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions import ConflictError, NotFoundError, ValidationError
from app.core.security import (
    create_access_token,
    get_password_hash,
    verify_password,
)
from app.models.user import User, UserRole

logger = logging.getLogger(__name__)


class AuthResponse:
    """Standardized authentication response."""

    def __init__(self, access_token: str, refresh_token: str, user: dict) -> None:
        self.access_token = access_token
        self.refresh_token = refresh_token
        self.user = user


async def authenticate_user(
    db: AsyncSession,
    email: str,
    password: str,
) -> AuthResponse | None:
    """Authenticate a user with email and password.

    Returns AuthResponse if credentials are valid, None otherwise.
    """
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if user is None or not verify_password(password, user.hashed_password):
        return None

    if not user.is_active:
        return None

    # Update last login
    user.last_login = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(user)

    access_token = create_access_token(
        subject=str(user.id),
        role=user.role.value,
        email=user.email,
    )
    refresh_token = create_access_token(
        subject=str(user.id),
        role=user.role.value,
        email=user.email,
        expires_minutes=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60,
    )

    return AuthResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user={
            "id": str(user.id),
            "email": user.email,
            "username": user.username,
            "full_name": user.full_name,
            "role": user.role.value,
            "is_active": user.is_active,
            "created_at": user.created_at.isoformat(),
        },
    )


async def create_user(
    db: AsyncSession,
    email: str,
    username: str,
    full_name: str,
    password: str,
    role: UserRole = UserRole.RECRUITER,
) -> User:
    """Create a new user account."""
    # Check if user already exists
    result = await db.execute(select(User).where(User.email == email))
    if result.scalar_one_or_none():
        raise ConflictError(f"User with email {email} already exists")

    result = await db.execute(select(User).where(User.username == username))
    if result.scalar_one_or_none():
        raise ConflictError(f"Username {username} already exists")

    if len(password) < 8:
        raise ValidationError("Password must be at least 8 characters long")

    user = User(
        email=email,
        username=username,
        full_name=full_name,
        hashed_password=get_password_hash(password),
        role=role,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def get_user_by_id(db: AsyncSession, user_id: uuid.UUID) -> User | None:
    """Get a user by ID."""
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def get_user_by_id_or_raise(db: AsyncSession, user_id: uuid.UUID) -> User:
    """Get a user by ID or raise NotFoundError."""
    user = await get_user_by_id(db, user_id)
    if user is None:
        raise NotFoundError("User", str(user_id))
    return user


async def update_user(
    db: AsyncSession,
    user_id: uuid.UUID,
    update_data: dict,
) -> User:
    """Update user information."""
    user = await get_user_by_id_or_raise(db, user_id)
    for key, value in update_data.items():
        if value is not None:
            setattr(user, key, value)
    await db.commit()
    await db.refresh(user)
    return user


async def delete_user(db: AsyncSession, user_id: uuid.UUID) -> None:
    """Delete a user account."""
    user = await get_user_by_id_or_raise(db, user_id)
    await db.delete(user)
    await db.commit()


async def list_users(
    db: AsyncSession,
    skip: int = 0,
    limit: int = 100,
    role: UserRole | None = None,
) -> list[User]:
    """List all users with optional role filter."""
    query = select(User).order_by(User.created_at.desc())
    if role:
        query = query.where(User.role == role)
    query = query.offset(max(skip, 0)).limit(min(limit, 1000))
    result = await db.execute(query)
    return list(result.scalars().all())


async def create_admin_user(
    db: AsyncSession,
    email: str,
    username: str,
    full_name: str,
    password: str,
) -> User:
    """Create an admin user (first-run setup)."""
    return await create_user(
        db=db,
        email=email,
        username=username,
        full_name=full_name,
        password=password,
        role=UserRole.ADMIN,
    )


def generate_password() -> str:
    """Generate a random secure password."""
    return secrets.token_urlsafe(16)


async def verify_user_permissions(
    db: AsyncSession,
    user_id: uuid.UUID,
    required_role: UserRole,
) -> bool:
    """Verify if a user has the required role."""
    user = await get_user_by_id(db, user_id)
    if user is None or not user.is_active:
        return False
    return user.role == required_role