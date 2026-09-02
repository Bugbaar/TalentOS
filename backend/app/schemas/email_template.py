"""Email template API schemas."""

import uuid
import re
from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, field_validator


class EmailTemplateCreate(BaseModel):
    """Schema for creating a new email template."""

    name: str = Field(min_length=1, max_length=150)
    subject: str = Field(min_length=1, max_length=255)
    body: str = Field(min_length=1)
    category: str = Field(default="general", max_length=100)
    description: str | None = None
    is_active: bool = True

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        """Validate template name is alphanumeric/underscore only."""
        if not re.match(r"^[a-zA-Z0-9_\- ]+$", v):
            raise ValueError("Template name must contain only letters, numbers, spaces, hyphens, and underscores")
        return v


class EmailTemplateUpdate(BaseModel):
    """Schema for updating an email template."""

    name: str | None = Field(default=None, min_length=1, max_length=150)
    subject: str | None = Field(default=None, min_length=1, max_length=255)
    body: str | None = Field(default=None, min_length=1)
    category: str | None = Field(default=None, max_length=100)
    description: str | None = None
    is_active: bool | None = None


class EmailTemplateRead(BaseModel):
    """Serialized email template."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    subject: str
    body: str
    category: str
    variables: list[str]
    description: str | None
    is_active: bool
    use_count: int
    created_at: datetime
    updated_at: datetime


class EmailTemplatePreview(BaseModel):
    """Preview a template with provided variables."""

    template_id: uuid.UUID
    variables: dict[str, Any]
    rendered_subject: str
    rendered_body: str
