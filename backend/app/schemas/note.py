"""Team notes API schemas."""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class NoteCreate(BaseModel):
    """Schema for creating a candidate note."""

    author_name: str = Field(min_length=1, max_length=200)
    content: str = Field(min_length=1)


class NoteUpdate(BaseModel):
    """Schema for updating an existing note."""

    content: str = Field(min_length=1)


class NoteRead(BaseModel):
    """Serialized candidate note."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    candidate_id: uuid.UUID
    author_name: str
    content: str
    created_at: datetime
    updated_at: datetime
