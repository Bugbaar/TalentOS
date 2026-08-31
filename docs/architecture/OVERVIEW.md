# Architecture

TalentOS is a hiring product, not a generic CRUD demo. The interesting design
choice is that **ranking is deterministic and auditable**.

```text
Next.js (recruiter + candidate)
        |
        v
FastAPI  (auth, jobs, candidates, applications, matching, analytics)
        |
        +-- Resume parser   (skills, education, experience, seniority)
        +-- Matching engine (weighted, explainable)
        |
        v
SQLAlchemy  →  SQLite (local) or PostgreSQL (DATABASE_URL)
```

## Why not embeddings first?

The README lists Qdrant and OpenAI as future infrastructure. For a hiring
decision, a recruiter needs to defend a shortlist:

- Which required skills were present?
- Which were missing?
- Did experience actually meet the bar?

A vector similarity score cannot answer those questions. This MVP therefore
ships:

1. A canonical skill taxonomy with aliases (`JS` → `JavaScript`).
2. A weighted matcher whose breakdown is stored on every application.
3. A pipeline with illegal transitions rejected (you cannot jump `applied → hired`).

Embeddings can later *rank within* the same contract (`score` + `breakdown`)
without changing the product API.

## Services

| Service | Responsibility |
|---|---|
| Candidate | Profile, resume parse/upload, recruiter notes |
| Job | Role lifecycle: draft, open, paused, closed |
| Resume | Extraction of skills, years, education, seniority |
| Matching | Candidate↔job score, recommendations, skill gaps |
| Analytics | Recruiter pulse: pipeline counts and strong matches |

## AuthZ

- Recruiters create jobs and move their own pipeline.
- Candidates parse resumes and apply to **open** jobs only.
- Duplicate applications are rejected.
- Candidates cannot create jobs.

## Data

See `docs/database/SCHEMA.md`.
