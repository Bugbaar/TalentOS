"""Email templates API endpoints."""

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.email_template import EmailTemplate
from app.schemas.email_template import (
    EmailTemplateCreate,
    EmailTemplateUpdate,
    EmailTemplateRead,
)
from app.services import email_template_service

router = APIRouter()


@router.get("/", response_model=list[EmailTemplateRead])
async def list_templates(
    db: AsyncSession = Depends(get_db),
    category: str | None = Query(default=None, alias="category"),
    active_only: bool = Query(default=True),
) -> list[EmailTemplateRead]:
    """Get all email templates, optionally filtered by category."""

    return await email_template_service.get_templates(db, category, active_only)


@router.get("/categories", response_model=list[str])
async def list_categories(db: AsyncSession = Depends(get_db)) -> list[str]:
    """Get all unique template categories."""

    result = await db.execute(
        "SELECT DISTINCT category FROM email_templates ORDER BY category"
    )
    return [row[0] for row in result.fetchall()]


@router.get("/{template_id}", response_model=EmailTemplateRead)
async def get_template(
    template_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> EmailTemplateRead:
    """Get a specific email template by ID."""

    template = await db.get(EmailTemplate, template_id)
    if template is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template not found")
    return template


@router.post("/", response_model=EmailTemplateRead, status_code=status.HTTP_201_CREATED)
async def create_template(
    template_in: EmailTemplateCreate,
    db: AsyncSession = Depends(get_db),
) -> EmailTemplateRead:
    """Create a new email template."""

    return await email_template_service.create_template(db, template_in)


@router.patch("/{template_id}", response_model=EmailTemplateRead)
async def update_template(
    template_id: uuid.UUID,
    update_in: EmailTemplateUpdate,
    db: AsyncSession = Depends(get_db),
) -> EmailTemplateRead:
    """Update an existing email template."""

    template = await email_template_service.update_template(db, template_id, update_in)
    if template is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template not found")
    return template


@router.delete("/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_template(
    template_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> None:
    """Delete an email template."""

    deleted = await email_template_service.delete_template(db, template_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template not found")


@router.post("/{template_id}/preview")
async def preview_template(
    template_id: uuid.UUID,
    variables: dict,
    db: AsyncSession = Depends(get_db),
):
    """Preview a template with provided variable values."""

    result = await email_template_service.preview_template(db, template_id, variables)
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template not found")

    template, rendered_subject, rendered_body = result
    return {
        "template_id": str(template.id),
        "name": template.name,
        "variables_detected": template.variables,
        "variables_provided": list(variables.keys()),
        "rendered_subject": rendered_subject,
        "rendered_body": rendered_body,
    }
