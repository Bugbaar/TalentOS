"""Security utilities for authentication and password management."""

import time
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt as jose_jwt
from passlib.context import CryptContext

from app.core.config import settings

pwd_context = CryptContext(
    schemes=["argon2"],
    default="argon2",
)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash using Argon2."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Generate a password hash using Argon2."""
    return pwd_context.hash(password)


class TokenData:
    """Data extracted from a JWT token."""

    def __init__(self, subject: str, role: str, email: str) -> None:
        self.subject = subject
        self.role = role
        self.email = email


oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")


def create_access_token(
    subject: str,
    role: str,
    email: str,
    expires_minutes: Optional[int] = None,
) -> str:
    """Create a JWT access token."""
    expires = time.time() + (expires_minutes or settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60)
    to_encode = {
        "sub": str(subject),
        "role": role,
        "email": str(email),
        "exp": int(expires),
        "iat": int(time.time()),
    }
    encoded = jose_jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
    )
    return encoded


def verify_token(token: str) -> Optional[TokenData]:
    """Verify and decode a JWT token."""
    try:
        payload = jose_jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )
        subject: str = payload.get("sub")
        role: str = payload.get("role")
        email: str = payload.get("email")
        if subject is None or role is None or email is None:
            return None
        return TokenData(subject=subject, role=role, email=email)
    except JWTError:
        return None


async def get_current_user(
    token: str = Depends(oauth2_scheme),
) -> TokenData:
    """Dependency to get the current authenticated user from a JWT token."""
    token_data = verify_token(token)
    if token_data is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return token_data
