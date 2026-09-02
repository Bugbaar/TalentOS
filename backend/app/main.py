"""FastAPI application entrypoint for TalentOS."""

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.database import Base, SessionLocal, engine
from app.core.exceptions import setup_exception_handlers
from app.core.rate_limit import RateLimitMiddleware
from app.models import Application, Candidate, EmailTemplate, JobOpening, Resume
from app.services.email_template_service import extract_variables


async def seed_default_templates(db: AsyncSession) -> None:
    """Seed the database with default email templates if they don't exist."""

    defaults = [
        {
            "name": "Initial Outreach",
            "subject": "Exciting {{job_title}} opportunity at {{company_name}}",
            "body": """Hi {{candidate_name}},

I came across your profile and was impressed by your experience with {{key_skill}}. We're currently hiring for a {{job_title}} role that seems like a strong match for your background.

Would you be open to a 15-minute conversation this week to learn more?

Best,
{{recruiter_name}}""",
            "category": "outreach",
            "description": "First-touch outreach to a passive candidate",
        },
        {
            "name": "Interview Invitation",
            "subject": "Next steps for {{job_title}} role",
            "body": """Hi {{candidate_name}},

Great news! We'd like to invite you to the next round of interviews for the {{job_title}} position.

The interview will be a {{interview_type}} session lasting approximately {{duration}} minutes. Please let me know your availability over the next few days.

Looking forward to speaking with you,
{{recruiter_name}}""",
            "category": "interview",
            "description": "Invite a candidate to schedule an interview",
        },
        {
            "name": "Offer Letter",
            "subject": "Offer: {{job_title}} at {{company_name}}",
            "body": """Hi {{candidate_name}},

We are delighted to extend an offer for the {{job_title}} position at {{company_name}}.

Compensation: {{salary}}
Start date: {{start_date}}

Please review the attached formal offer letter and let me know if you have any questions. We're excited to have you join the team!

Best,
{{recruiter_name}}""",
            "category": "offer",
            "description": "Extend a job offer to a successful candidate",
        },
        {
            "name": "Polite Rejection",
            "subject": "Update on your {{job_title}} application",
            "body": """Hi {{candidate_name}},

Thank you for taking the time to interview for the {{job_title}} position. After careful consideration, we've decided to move forward with other candidates whose experience more closely matches our current needs.

We were impressed by your background and encourage you to apply for future openings that match your interests.

Wishing you the best,
{{recruiter_name}}""",
            "category": "rejection",
            "description": "Decline a candidate after interview rounds",
        },
    ]

    for template_data in defaults:
        # Check if template exists
        existing = await db.execute(
            select(EmailTemplate).where(EmailTemplate.name == template_data["name"])
        )
        if existing.scalar_one_or_none() is not None:
            continue

        all_text = f"{template_data['subject']}\n{template_data['body']}"
        template = EmailTemplate(
            name=template_data["name"],
            subject=template_data["subject"],
            body=template_data["body"],
            category=template_data["category"],
            description=template_data["description"],
            variables=extract_variables(all_text),
        )
        db.add(template)

    await db.commit()


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    """Create missing tables, seed defaults, and release the engine at shutdown."""

    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)

    # Seed default email templates
    async with SessionLocal() as session:
        await seed_default_templates(session)

    yield
    await engine.dispose()


app = FastAPI(title="TalentOS API", version="1.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(RateLimitMiddleware)
app.include_router(api_router, prefix="/api/v1")
setup_exception_handlers(app)


@app.get("/health", tags=["health"])
async def health() -> dict[str, str]:
    """Return a lightweight liveness response."""

    return {"status": "ok"}
