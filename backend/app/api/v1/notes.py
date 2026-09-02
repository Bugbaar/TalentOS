"""Candidate notes API endpoints."""

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.candidate import Candidate
from app.models.note import CandidateNote
from app.schemas.note import NoteCreate, NoteUpdate, NoteRead

router = APIRouter()


@router.get("/candidates/{candidate_id}/notes", response_model=list[NoteRead])
async def list_candidate_notes(
    candidate_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> list[NoteRead]:
    """Get all notes for a specific candidate, ordered by creation time (newest first)."""
    candidate = await db.get(Candidate, candidate_id)
    if candidate is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Candidate not found")

    result = await db.execute(
        select(CandidateNote)
        .where(CandidateNote.candidate_id == candidate_id)
        .order_by(CandidateNote.created_at.desc())
    )
    return list(result.scalars().all())


@router.post("/candidates/{candidate_id}/notes", response_model=NoteRead, status_code=status.HTTP_201_CREATED)
async def create_note(
    candidate_id: uuid.UUID,
    note_in: NoteCreate,
    db: AsyncSession = Depends(get_db),
) -> NoteRead:
    """Create a new note for a candidate."""
    candidate = await db.get(Candidate, candidate_id)
    if candidate is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Candidate not found")

    note = CandidateNote(
        candidate_id=candidate_id,
        author_name=note_in.author_name,
        content=note_in.content,
    )
    db.add(note)
    await db.commit()
    await db.refresh(note)
    return note


@router.patch("/notes/{note_id}", response_model=NoteRead)
async def update_note(
    note_id: uuid.UUID,
    note_in: NoteUpdate,
    db: AsyncSession = Depends(get_db),
) -> NoteRead:
    """Update an existing note."""
    note = await db.get(CandidateNote, note_id)
    if note is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")

    note.content = note_in.content
    await db.commit()
    await db.refresh(note)
    return note


@router.delete("/notes/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_note(
    note_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> None:
    """Delete a note."""
    note = await db.get(CandidateNote, note_id)
    if note is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")

    await db.delete(note)
    await db.commit()
