from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import get_current_user, require_candidate, require_recruiter
from app.models import CandidateProfile, Note, User
from app.schemas import CandidateProfileIn, CandidateProfileOut, NoteIn, NoteOut, ResumeParseOut, ResumeParseRequest
from app.services.parser import parse_resume

router = APIRouter(prefix="/api/candidates", tags=["candidates"])


def _profile_out(profile: CandidateProfile) -> CandidateProfileOut:
    return CandidateProfileOut(
        id=profile.id,
        user_id=profile.user_id,
        full_name=profile.user.full_name if profile.user else None,
        email=profile.user.email if profile.user else None,
        headline=profile.headline,
        location=profile.location,
        years_experience=profile.years_experience,
        education_level=profile.education_level,
        seniority=profile.seniority,
        summary=profile.summary,
        skills=profile.skills or [],
        education=profile.education or [],
        experience=profile.experience or [],
        links=profile.links or [],
        parsed_at=profile.parsed_at,
    )


def _get_or_create_profile(db: Session, user: User) -> CandidateProfile:
    profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == user.id).first()
    if not profile:
        profile = CandidateProfile(user_id=user.id, skills=[], education=[], experience=[], links=[])
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile


@router.get("/me", response_model=CandidateProfileOut)
def my_profile(user: User = Depends(require_candidate), db: Session = Depends(get_db)) -> CandidateProfileOut:
    profile = _get_or_create_profile(db, user)
    profile.user = user
    return _profile_out(profile)


@router.put("/me", response_model=CandidateProfileOut)
def update_profile(
    payload: CandidateProfileIn,
    user: User = Depends(require_candidate),
    db: Session = Depends(get_db),
) -> CandidateProfileOut:
    profile = _get_or_create_profile(db, user)
    data = payload.model_dump(exclude_unset=True)
    for key, value in data.items():
        setattr(profile, key, value)
    db.commit()
    db.refresh(profile)
    profile.user = user
    return _profile_out(profile)


def _apply_parse(profile: CandidateProfile, text: str, user: User) -> ResumeParseOut:
    parsed = parse_resume(text)
    profile.resume_text = text
    profile.headline = parsed.headline or profile.headline
    profile.years_experience = parsed.years_experience
    profile.education_level = parsed.education_level
    profile.seniority = parsed.seniority
    profile.summary = parsed.summary
    profile.skills = parsed.skills
    profile.experience = parsed.experience_spans
    profile.links = parsed.links
    profile.education = [{"level": parsed.education_level}] if parsed.education_level != "Unknown" else []
    profile.parsed_at = datetime.now(timezone.utc)
    if parsed.full_name and user.full_name.lower() in {"demo candidate", "candidate"}:
        user.full_name = parsed.full_name
    return ResumeParseOut(
        full_name=parsed.full_name,
        email=parsed.email,
        phone=parsed.phone,
        links=parsed.links,
        headline=parsed.headline,
        years_experience=parsed.years_experience,
        education_level=parsed.education_level,
        seniority=parsed.seniority,
        skills=parsed.skills,
        summary=parsed.summary,
        applied=True,
    )


@router.post("/me/parse-resume", response_model=ResumeParseOut)
def parse_my_resume(
    payload: ResumeParseRequest,
    user: User = Depends(require_candidate),
    db: Session = Depends(get_db),
) -> ResumeParseOut:
    profile = _get_or_create_profile(db, user)
    result = _apply_parse(profile, payload.resume_text, user)
    db.commit()
    return result


@router.post("/me/upload-resume", response_model=ResumeParseOut)
async def upload_resume(
    file: UploadFile = File(...),
    user: User = Depends(require_candidate),
    db: Session = Depends(get_db),
) -> ResumeParseOut:
    raw = await file.read()
    if len(raw) > 2_000_000:
        raise HTTPException(status_code=413, detail="Resume must be under 2MB")
    name = (file.filename or "").lower()
    if name.endswith(".pdf"):
        try:
            from pypdf import PdfReader
            import io

            reader = PdfReader(io.BytesIO(raw))
            text = "\n".join(page.extract_text() or "" for page in reader.pages)
        except Exception as exc:
            raise HTTPException(status_code=400, detail=f"Could not read PDF: {exc}") from exc
    else:
        try:
            text = raw.decode("utf-8")
        except UnicodeDecodeError as exc:
            raise HTTPException(status_code=400, detail="Upload a UTF-8 text file or PDF") from exc
    if len(text.strip()) < 20:
        raise HTTPException(status_code=400, detail="Could not extract enough text from the file")
    profile = _get_or_create_profile(db, user)
    result = _apply_parse(profile, text, user)
    db.commit()
    return result


@router.get("", response_model=list[CandidateProfileOut])
def list_candidates(
    q: str | None = None,
    skill: str | None = None,
    user: User = Depends(require_recruiter),
    db: Session = Depends(get_db),
) -> list[CandidateProfileOut]:
    del user
    query = db.query(CandidateProfile)
    profiles = query.all()
    results: list[CandidateProfileOut] = []
    for profile in profiles:
        out = _profile_out(profile)
        blob = " ".join(
            [
                out.full_name or "",
                out.headline or "",
                out.location or "",
                " ".join(out.skills or []),
            ]
        ).lower()
        if q and q.lower() not in blob:
            continue
        if skill and skill.lower() not in [s.lower() for s in (out.skills or [])]:
            continue
        results.append(out)
    return results


@router.get("/{candidate_id}", response_model=CandidateProfileOut)
def get_candidate(
    candidate_id: int,
    user: User = Depends(require_recruiter),
    db: Session = Depends(get_db),
) -> CandidateProfileOut:
    del user
    profile = db.query(CandidateProfile).filter(CandidateProfile.id == candidate_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return _profile_out(profile)


@router.post("/{candidate_id}/notes", response_model=NoteOut, status_code=201)
def add_note(
    candidate_id: int,
    payload: NoteIn,
    user: User = Depends(require_recruiter),
    db: Session = Depends(get_db),
) -> NoteOut:
    profile = db.query(CandidateProfile).filter(CandidateProfile.id == candidate_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Candidate not found")
    note = Note(candidate_id=candidate_id, author_id=user.id, job_id=payload.job_id, body=payload.body.strip())
    db.add(note)
    db.commit()
    db.refresh(note)
    return NoteOut(
        id=note.id,
        candidate_id=note.candidate_id,
        author_id=note.author_id,
        author_name=user.full_name,
        job_id=note.job_id,
        body=note.body,
        created_at=note.created_at,
    )


@router.get("/{candidate_id}/notes", response_model=list[NoteOut])
def list_notes(
    candidate_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[NoteOut]:
    profile = db.query(CandidateProfile).filter(CandidateProfile.id == candidate_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Candidate not found")
    if user.role == "candidate" and profile.user_id != user.id:
        raise HTTPException(status_code=403, detail="Cannot view another candidate's notes")
    notes = db.query(Note).filter(Note.candidate_id == candidate_id).order_by(Note.created_at.desc()).all()
    return [
        NoteOut(
            id=n.id,
            candidate_id=n.candidate_id,
            author_id=n.author_id,
            author_name=n.author.full_name if n.author else None,
            job_id=n.job_id,
            body=n.body,
            created_at=n.created_at,
        )
        for n in notes
    ]
