"""Email template service layer."""

import re
import uuid
from typing import Any

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.email_template import EmailTemplate
from app.schemas.email_template import EmailTemplateCreate, EmailTemplateUpdate


def extract_variables(text: str) -> list[str]:
    """Extract variable placeholders from text. Format: {{variable_name}}"""
    pattern = r"\{\{(\w+)\}\}"
    matches = re.findall(pattern, text)
    return list(dict.fromkeys(matches))  # Remove duplicates while preserving order


def render_template(text: str, variables: dict[str, Any]) -> str:
    """Replace {{variable}} placeholders with actual values."""
    result = text
    for key, value in variables.items():
        result = result.replace(f"{{{{{key}}}}}", str(value))
    return result


async def get_templates(
    db: AsyncSession,
    category: str | None = None,
    active_only: bool = True,
) -> list[EmailTemplate]:
    """Get all email templates, optionally filtered by category."""

    query = select(EmailTemplate)
    if active_only:
        query = query.where(EmailTemplate.is_active == True)
    if category:
        query = query.where(EmailTemplate.category == category)
    query = query.order_by(EmailTemplate.name)

    result = await db.execute(query)
    return list(result.scalars().all())


async def get_template_by_id(db: AsyncSession, template_id: uuid.UUID) -> EmailTemplate | None:
    """Get a single template by ID."""

    return await db.get(EmailTemplate, template_id)


async def create_template(db: AsyncSession, template_in: EmailTemplateCreate) -> EmailTemplate:
    """Create a new email template and auto-extract variables."""

    # Extract variables from subject and body
    all_text = f"{template_in.subject}\n{template_in.body}"
    variables = extract_variables(all_text)

    template = EmailTemplate(
        name=template_in.name,
        subject=template_in.subject,
        body=template_in.body,
        category=template_in.category,
        variables=variables,
        description=template_in.description,
        is_active=template_in.is_active,
    )
    db.add(template)
    await db.commit()
    await db.refresh(template)
    return template


async def update_template(
    db: AsyncSession,
    template_id: uuid.UUID,
    update_in: EmailTemplateUpdate,
) -> EmailTemplate | None:
    """Update an existing template and recalculate variables if needed."""

    template = await db.get(EmailTemplate, template_id)
    if template is None:
        return None

    update_data = update_in.model_dump(exclude_unset=True)

    # Recalculate variables if subject or body changed
    new_subject = update_data.get("subject", template.subject)
    new_body = update_data.get("body", template.body)
    if "subject" in update_data or "body" in update_data:
        all_text = f"{new_subject}\n{new_body}"
        update_data["variables"] = extract_variables(all_text)

    for key, value in update_data.items():
        setattr(template, key, value)

    await db.commit()
    await db.refresh(template)
    return template


async def delete_template(db: AsyncSession, template_id: uuid.UUID) -> bool:
    """Delete a template. Returns True if deleted."""

    template = await db.get(EmailTemplate, template_id)
    if template is None:
        return False

    await db.delete(template)
    await db.commit()
    return True


async def increment_use_count(db: AsyncSession, template_id: uuid.UUID) -> None:
    """Increment the usage counter for a template."""

    await db.execute(
        update(EmailTemplate)
        .where(EmailTemplate.id == template_id)
        .values(use_count=EmailTemplate.use_count + 1)
    )
    await db.commit()


async def preview_template(
    db: AsyncSession,
    template_id: uuid.UUID,
    variables: dict[str, Any],
) -> tuple[EmailTemplate, str, str] | None:
    """Render a template preview with provided variables. Returns (template, rendered_subject, rendered_body)."""

    template = await db.get(EmailTemplate, template_id)
    if template is None:
        return None

    rendered_subject = render_template(template.subject, variables)
    rendered_body = render_template(template.body, variables)

    return template, rendered_subject, rendered_body
