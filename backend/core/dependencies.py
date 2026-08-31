from backend.core.database  import SessionLocal
from jose import jwt , JWTError
from datetime import datetime , timedelta
from backend.core.config import settings
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession 
from fastapi import Depends , HTTPException
from backend.repository.candidate_repository import get_candidate_by_id
from sqlalchemy import select


ALGORITHM="HS256"
ACCESS_TOKEN_TIME=15
oauth2_scheme=OAuth2PasswordBearer(tokenUrl="/auth/login")
async def get_db():
    async with SessionLocal() as Session:
        yield Session

async def create_access_token(data:dict):
    to_encode=data.copy()
    expire= datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_TIME)
    to_encode.update({"exp":expire})
    token=jwt.encode(to_encode , settings.SECRET_KEY , algorithm=ALGORITHM)
    return token


async def get_current_candidate(token: str = Depends(oauth2_scheme),db: AsyncSession = Depends(get_db)):
    credentials_exception = HTTPException(status_code=401,detail="Could not validate credentials",headers={"WWW-Authenticate": "Bearer"},)

    try:
        payload = jwt.decode(token,settings.SECRET_KEY,algorithms=[ALGORITHM])

        candidate_id = payload.get("sub")
        if candidate_id is None:
            raise credentials_exception
        candidate_id = int(candidate_id)

    except (JWTError, ValueError, TypeError):
        raise credentials_exception
    candidate = await get_candidate_by_id(db,candidate_id)
    if candidate is None:
        raise credentials_exception
    return candidate
