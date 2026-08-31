# 🎯 TalentOS — Master Blueprint & Codex Prompt Guide

> **Operating System for Modern AI-Powered Talent Intelligence & Hiring**  
> *Initial Prototype Specification for OpenAI Codex & Subsequent Iterations with Google Gemini.*

---

## 📌 How to Use This File with Codex / Copilot / Gemini

When prompting your AI assistant in VS Code, Cursor, or Web Chat, reference this file using `@PROMPT.md` and execute in modular steps:

- **Step 1**: `@PROMPT.md Step 1: Scaffold Backend Foundation, Configuration, and Database Models`
- **Step 2**: `@PROMPT.md Step 2: Implement Pydantic Schemas, AI Engine Abstraction, and Mock Providers`
- **Step 3**: `@PROMPT.md Step 3: Implement Business Services and FastAPI REST Endpoints`
- **Step 4**: `@PROMPT.md Step 4: Create Docker Compose and Database Seed Script (scripts/seed_demo_data.py)`
- **Step 5**: `@PROMPT.md Step 5: Scaffold Next.js 14 App Router Frontend with Tailwind & Recruiter Dashboard`

---

## 🏗️ Master Project Specification

### 1. System Vision & Architecture
TalentOS is an open-source talent intelligence platform that bridges candidate tracking with AI resume understanding and hybrid matching (semantic embeddings + keyword/skills overlap).

```text
[ Next.js 14/15 App Router + TailwindCSS ] (Port 3000)
                     │
                     ▼ (REST / JSON)
[ FastAPI Backend Services (Python 3.11+) ] (Port 8000)
   ├── Candidate Service (CRUD, Resume Ingestion)
   ├── Job Service (Openings, Applications, Pipelines)
   ├── AI Engine (Resume Parser, Vector Embeddings)
   └── Matching Engine (Composite Scoring & Gap Analysis)
                     │
     ┌───────────────┼───────────────┐
     ▼               ▼               ▼
[ PostgreSQL 16 ]  [ Redis 7 ]   [ Qdrant Vector DB ]
 (Port 5432)       (Port 6379)    (Port 6333)
```

---

### 2. Complete File Directory Tree to Scaffold

```text
TalentOS/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                     # FastAPI entrypoint, CORS, exception handlers
│   │   ├── core/
│   │   │   ├── __init__.py
│   │   │   ├── config.py               # Pydantic Settings (ENV variables, DB URLs, Secrets)
│   │   │   └── database.py             # SQLAlchemy 2.0 async/sync engine, sessionmaker, Base
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── candidate.py            # Candidate, Resume, Experience, Education models
│   │   │   ├── job.py                  # JobOpening, JobRequirement models
│   │   │   ├── application.py          # Application & Workflow stage models
│   │   │   └── match.py                # MatchScore & SkillGap models
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   ├── candidate.py            # Pydantic schemas (Create, Read, Update, Filter)
│   │   │   ├── job.py                  # Pydantic schemas for Job postings
│   │   │   ├── application.py          # Pydantic schemas for Applications & Status updates
│   │   │   └── ai.py                   # ParsedResume, MatchEvaluation, SkillGapResponse
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── candidate_service.py    # Candidate CRUD & Resume parsing orchestration
│   │   │   ├── job_service.py          # Job posting & Application pipeline management
│   │   │   ├── matching_service.py     # Hybrid scoring (Skills Overlap + Vector Distance)
│   │   │   └── ai_engine/
│   │   │       ├── __init__.py
│   │   │       ├── base.py             # Abstract BaseAIProvider class
│   │   │       ├── mock_provider.py    # Zero-key heuristic/regex parser & local mock vectors
│   │   │       ├── gemini_provider.py  # Google Gemini 1.5/2.0 Flash integration
│   │   │       └── openai_provider.py  # OpenAI GPT-4o / Embeddings integration
│   │   └── api/
│   │       ├── __init__.py
│   │       └── v1/
│   │           ├── __init__.py
│   │           ├── router.py           # Master API v1 router
│   │           ├── candidates.py       # Candidate endpoints + /upload-resume
│   │           ├── jobs.py             # Job opening & application endpoints
│   │           ├── matching.py         # /match, /rank-candidates, /recommend-jobs
│   │           └── analytics.py        # Dashboard stats (total candidates, jobs, hire rate)
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx              # Root layout with sidebar navigation
│   │   │   ├── page.tsx                # Recruiter Overview Dashboard
│   │   │   ├── candidates/
│   │   │   │   ├── page.tsx            # Candidate directory table + search + filter
│   │   │   │   └── [id]/page.tsx       # Candidate profile, parsed resume & history
│   │   │   ├── jobs/
│   │   │   │   ├── page.tsx            # Job postings list & "Create Job" modal
│   │   │   │   └── [id]/page.tsx       # Job details & candidate application Kanban board
│   │   │   └── matching/
│   │   │       └── page.tsx            # Interactive Matcher: pick job + candidate -> AI analysis
│   │   ├── components/
│   │   │   ├── Navbar.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── ResumeUploader.tsx      # Drag-and-drop file upload with live parse preview
│   │   │   ├── MatchScoreCard.tsx      # Circular score progress + matched & missing skills badges
│   │   │   └── StatusBadge.tsx         # Color-coded badge for APPLIED, INTERVIEW, OFFER, etc.
│   │   ├── lib/
│   │   │   ├── api.ts                  # Typed fetch client for backend API
│   │   │   └── utils.ts                # Formatting helpers (dates, salaries, score colors)
│   │   └── types/
│   │       └── index.ts                # TypeScript data interfaces
│   ├── package.json
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── Dockerfile
├── scripts/
│   └── seed_demo_data.py               # Populates realistic mock candidates, jobs & applications
├── docker-compose.yml
├── pyproject.toml
└── .gitignore
```

---

### 3. Database Schema & Entities

#### A. `candidates`
- `id`: UUID (Primary Key, default uuid4)
- `first_name`: VARCHAR(100), not null
- `last_name`: VARCHAR(100), not null
- `email`: VARCHAR(255), unique, indexed, not null
- `phone`: VARCHAR(50), nullable
- `headline`: VARCHAR(255) (e.g., "Senior Full-Stack Engineer | React & Python")
- `location`: VARCHAR(150), nullable
- `bio`: TEXT, nullable
- `experience_years`: FLOAT, default 0.0
- `skills`: JSONB (List of strings, e.g. `["Python", "FastAPI", "PostgreSQL", "Docker"]`)
- `created_at`, `updated_at`: TIMESTAMP with timezone (default now())

#### B. `resumes`
- `id`: UUID (Primary Key)
- `candidate_id`: UUID (Foreign Key -> `candidates.id`, ondelete CASCADE)
- `raw_text`: TEXT, nullable
- `file_url`: VARCHAR(500), nullable
- `parsed_skills`: JSONB (List of strings)
- `work_history`: JSONB (List of `{ company, role, start_date, end_date, summary }`)
- `education`: JSONB (List of `{ institution, degree, field, graduation_year }`)
- `embedding_vector_id`: VARCHAR(100), nullable (Qdrant point ID)
- `created_at`: TIMESTAMP

#### C. `job_openings`
- `id`: UUID (Primary Key)
- `title`: VARCHAR(200), not null
- `department`: VARCHAR(100), not null
- `location`: VARCHAR(150), not null
- `workplace_type`: ENUM (`REMOTE`, `HYBRID`, `ONSITE`), default `REMOTE`
- `status`: ENUM (`DRAFT`, `ACTIVE`, `CLOSED`), default `ACTIVE`
- `description`: TEXT, not null
- `required_skills`: JSONB (List of strings)
- `nice_to_have_skills`: JSONB (List of strings)
- `min_experience_years`: FLOAT, default 0.0
- `salary_range`: VARCHAR(100), nullable (e.g. "$120,000 - $150,000")
- `created_at`, `updated_at`: TIMESTAMP

#### D. `applications`
- `id`: UUID (Primary Key)
- `candidate_id`: UUID (Foreign Key -> `candidates.id`)
- `job_id`: UUID (Foreign Key -> `job_openings.id`)
- `status`: ENUM (`APPLIED`, `SCREENING`, `INTERVIEW`, `OFFER`, `HIRED`, `REJECTED`), default `APPLIED`
- `ai_match_score`: FLOAT, nullable (0.0 to 100.0)
- `ai_summary`: TEXT, nullable (Key strengths & gap analysis)
- `applied_at`: TIMESTAMP (default now())
- `notes`: TEXT, nullable

---

### 4. AI Engine & Matching Algorithm

#### Composite Score Formula (0 - 100%)
$$\text{Total Score} = (0.50 \times \text{Skill Match}) + (0.30 \times \text{Experience Match}) + (0.20 \times \text{Semantic Vector Match})$$

1. **Skill Match Score (50%)**:
   $$\text{Skill Score} = \frac{|\text{Candidate Skills} \cap \text{Job Required Skills}|}{|\text{Job Required Skills}|} \times 100$$
2. **Experience Match Score (30%)**:
   $$\text{Exp Score} = \min\left(1.0, \frac{\text{Candidate Exp Years}}{\text{Job Min Exp Years}}\right) \times 100$$
3. **Semantic Similarity Score (20%)**:
   Cosine similarity between Resume raw text / summary embedding and Job description embedding.

#### Abstract AI Provider Interface (`services/ai_engine/base.py`)
```python
from abc import ABC, abstractmethod
from typing import Dict, Any, List

class BaseAIProvider(ABC):
    @abstractmethod
    async def parse_resume(self, text_or_bytes: str) -> Dict[str, Any]:
        """Extracts structured candidate info, skills, work history, and education."""
        pass

    @abstractmethod
    async def generate_embedding(self, text: str) -> List[float]:
        """Generates dense vector representation for Qdrant storage & semantic similarity."""
        pass

    @abstractmethod
    async def generate_match_critique(self, candidate_data: dict, job_data: dict) -> str:
        """Generates AI executive summary of strengths and skill gaps."""
        pass
```

---

## 📑 Step-by-Step Prompting Commands for Codex

Copy and run these prompts one by one:

### 🔹 Prompt 1: Backend Foundation & Database Models
```text
@PROMPT.md
Task: Build Step 1 - Backend Core & Database Models.
1. Create pyproject.toml and backend/requirements.txt with fastapi, uvicorn, sqlalchemy[asyncio], asyncpg, psycopg2-binary, pydantic, pydantic-settings, python-multipart, python-dotenv, qdrant-client.
2. Create backend/app/core/config.py using pydantic-settings with DB credentials, CORS origins, and AI API keys.
3. Create backend/app/core/database.py with SQLAlchemy 2.0 engine, async session factory, and declarative Base.
4. Implement all models in backend/app/models/ (candidate.py, job.py, application.py, match.py) with all fields, foreign keys, relationships, and UUID primary keys as specified in @PROMPT.md.
Make sure the code is 100% complete with proper type hints and docstrings.
```

### 🔹 Prompt 2: Pydantic Schemas & AI Provider Layer
```text
@PROMPT.md @backend/app/models
Task: Build Step 2 - Schemas and AI Engine Abstraction.
1. Implement Pydantic v2 schemas in backend/app/schemas/:
   - candidate.py (CandidateCreate, CandidateRead, CandidateUpdate, ResumeRead)
   - job.py (JobCreate, JobRead, JobUpdate, ApplicationCreate, ApplicationRead, ApplicationStatusUpdate)
   - ai.py (ParsedResumeSchema, MatchResultSchema, SkillGapSchema)
2. Implement backend/app/services/ai_engine/:
   - base.py (BaseAIProvider abstract class)
   - mock_provider.py (Deterministic regex/heuristic parser & mock 384-dim embeddings so the app works without API keys)
   - gemini_provider.py (Google Gemini 1.5/2.0 implementation with structured outputs)
```

### 🔹 Prompt 3: Business Services & FastAPI Endpoints
```text
@PROMPT.md @backend/app/schemas @backend/app/services/ai_engine
Task: Build Step 3 - Business Services and REST API Routes.
1. Implement backend/app/services/:
   - candidate_service.py (Create candidate, attach resume, extract skills via AI provider)
   - job_service.py (Job posting lifecycle, candidate application submission, stage updates)
   - matching_service.py (Hybrid composite score calculation, skill overlap detection, gap analysis)
2. Implement backend/app/api/v1/ routes:
   - candidates.py (GET /candidates, POST /candidates, POST /candidates/{id}/resume, GET /candidates/{id})
   - jobs.py (GET /jobs, POST /jobs, GET /jobs/{id}, POST /jobs/{id}/apply, PATCH /applications/{id}/status)
   - matching.py (POST /matching/evaluate, GET /matching/job/{job_id}/ranked-candidates)
   - analytics.py (GET /analytics/summary)
3. Implement backend/app/main.py with CORS middleware, lifespan events for database tables initialization, and router inclusion.
```

### 🔹 Prompt 4: Docker Compose & Demo Data Seeder
```text
@PROMPT.md @backend/app/main.py
Task: Build Step 4 - Infrastructure & Demo Seed Script.
1. Create docker-compose.yml orchestrating:
   - postgres (PostgreSQL 16 with healthcheck and persistent volume)
   - redis (Redis 7)
   - qdrant (Qdrant vector engine on port 6333)
   - backend (FastAPI service linked to db, redis, and qdrant)
   - frontend (Next.js service on port 3000)
2. Create scripts/seed_demo_data.py to automatically populate:
   - 6 diverse Job Openings (e.g. Senior Frontend Engineer, AI Research Engineer, Product Manager, DevOps Specialist)
   - 15 realistic Candidates with detailed resumes, work histories, and varied skill profiles
   - 20 Applications across different stages (Screening, Interview, Offer) with precomputed AI match scores.
```

### 🔹 Prompt 5: Next.js 14 Frontend UI
```text
@PROMPT.md @backend/app/schemas
Task: Build Step 5 - Next.js 14/15 App Router Frontend.
1. Setup package.json, tailwind.config.js, tsconfig.json with Lucide React and TailwindCSS.
2. Implement frontend/src/lib/api.ts with typed fetch functions connecting to backend API.
3. Build UI Components:
   - Navbar.tsx and Sidebar.tsx with clean modern layout
   - ResumeUploader.tsx (drag-and-drop file upload with live extraction preview)
   - MatchScoreCard.tsx (circular visual progress bar, matched vs missing skills pill badges)
4. Build App Router Pages:
   - app/page.tsx: Recruiter Dashboard with metrics (Active Jobs, Candidates, Top Matches)
   - app/candidates/page.tsx: Searchable candidate grid/table with instant skill tags
   - app/candidates/[id]/page.tsx: Full candidate dossier, parsed experience & resume view
   - app/jobs/page.tsx: Job Openings board with "Create Opening" modal
   - app/jobs/[id]/page.tsx: Job overview + Applicant stage Kanban board
   - app/matching/page.tsx: Matcher simulator (select candidate + select job -> live AI fit score & recommendations)
```

---

## 🌟 Future Gemini Iterations Roadmap

Once the Codex prototype is running:
1. **Gemini Multimodal Resume Parsing**: Send raw PDF/DOCX resumes directly to `gemini-2.0-flash` with Pydantic JSON schema constraints.
2. **AI Screening Agent**: Use Gemini to automatically generate personalized interview questions based on candidate-job skill gaps.
3. **Automated Recruiter Assistant**: Draft personalized candidate outreach emails and candidate evaluation summaries.