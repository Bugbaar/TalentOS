from contextlib import asynccontextmanager
from backend.route.auth_route import router as auth_router
from backend.core.database import engine , Base

from fastapi import FastAPI


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    yield

app = FastAPI(title="TalentOS",version="0.1",lifespan=lifespan)
app.include_router(auth_router)

@app.get("/health/")
async def health():
    return {
        "Message": "Server is Running"
    }