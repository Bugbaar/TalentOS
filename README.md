# 🎯 TalentOS

> Open-source AI-powered Talent Intelligence & Hiring Infrastructure

TalentOS is an open-source platform designed to help organizations discover, evaluate, manage, and hire talent more effectively.

Our goal is to build the operating system for modern hiring by combining recruitment workflows, talent intelligence, and artificial intelligence into a single platform.

---

# Working MVP

This repository now includes a runnable product for the four MVP areas in this README:

1. **Candidate management** — profiles, resume paste/upload, notes, search
2. **Job management** — publish roles, recruiter dashboard, pipeline workflow
3. **Resume intelligence** — skill / education / experience extraction (offline, explainable)
4. **Matching engine** — ranked shortlists, skill gaps, job recommendations

The matcher is **auditable on purpose**. Recruiters get a weighted score *and* the reasons (matched skills, missing required skills, experience vs bar). Embeddings/Qdrant can wrap this contract later without hiding why someone ranked.

## Quick start

```bash
# API  →  http://localhost:8000/docs
cd backend
python -m venv .venv && .venv/Scripts/activate   # or source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# App  →  http://localhost:3000
cd ../frontend
npm install && npm run dev
```

Demo password for all seeded users: `TalentOS!2026`

- Recruiter: `priya@bugbaar.dev`
- Candidate: `aisha.rahman@example.com`

Full setup, architecture, and API notes live in [`docs/SETUP.md`](docs/SETUP.md).

---

# Why TalentOS?

Hiring is still fragmented.

Recruiters manage candidates across spreadsheets, emails, job boards, ATS platforms, and interview tools.

Candidates apply to dozens of jobs with little visibility into their progress.

TalentOS aims to create a transparent, intelligent, and scalable hiring infrastructure for both recruiters and candidates.

---

# Vision

We believe hiring should be:

* Faster
* More transparent
* Data-driven
* AI-assisted
* Community-powered

TalentOS is building an open ecosystem where talent and opportunities can connect more efficiently.

---

# MVP Scope

The first version of TalentOS focuses on four core areas:

## 1. Candidate Management

Manage candidate information throughout the hiring lifecycle.

### Features

* Candidate Profiles
* Resume Upload
* Application Tracking
* Candidate Notes
* Candidate Status Management

---

## 2. Job Management

Create and manage hiring pipelines.

### Features

* Create Job Openings
* Publish Jobs
* Track Applications
* Hiring Workflow Management
* Recruiter Dashboard

---

## 3. Resume Intelligence

AI-powered resume understanding.

### Features

* Resume Parsing
* Skill Extraction
* Experience Analysis
* Education Extraction
* Resume Scoring

---

## 4. Candidate Matching Engine

Match talent with opportunities.

### Features

* Skill Matching
* Candidate Ranking
* Job Recommendations
* Skill Gap Analysis

---

# Architecture

```text
Frontend (Next.js)

       ↓

Backend API (FastAPI)

       ↓

Business Services

├── Candidate Service
├── Job Service
├── Resume Service
├── Matching Service
└── Analytics Service

       ↓

PostgreSQL
Redis
Qdrant

       ↓

AI Layer

├── Resume Parser
├── Embedding Engine
├── Matching Engine
└── Recommendation Engine
```

---

# Technology Stack

## Frontend

* Next.js
* TypeScript
* TailwindCSS

## Backend

* Python
* FastAPI
* SQLAlchemy
* Pydantic

## Database

* PostgreSQL

## Cache

* Redis

## Vector Database

* Qdrant

## AI

* OpenAI
* Ollama
* Sentence Transformers

## Infrastructure

* Docker
* GitHub Actions

---

# Repository Structure

```text
TalentOS

├── frontend
├── backend
├── ai
├── docs
├── infrastructure
├── scripts
└── .github
```

---

# Current Development Areas

We are actively looking for contributors in:

### Backend

* Authentication
* Candidate APIs
* Job APIs
* Search APIs

### Frontend

* Landing Page
* Dashboard
* Candidate Screens
* Recruiter Screens

### AI

* Resume Parser
* Matching Engine
* Recommendation Engine
* Embeddings

### DevOps

* Docker Setup
* CI/CD
* Deployment Workflows

### Documentation

* API Documentation
* Architecture Documentation
* Contributor Guides

---

# Good First Issues

New contributors can start with:

* Documentation Improvements
* API Documentation
* UI Components
* Bug Fixes
* Unit Tests
* Setup Guides

Look for issues tagged:

* `good-first-issue`
* `help-wanted`
* `documentation`

---

# Contributing

We welcome:

* Backend Engineers
* Frontend Engineers
* AI Engineers
* DevOps Engineers
* Product Designers
* Technical Writers

To contribute:

1. Fork the repository
2. Create a feature branch
3. Implement your changes
4. Submit a Pull Request
5. Participate in discussions

---

# Long-Term Vision

TalentOS aims to become an open-source talent infrastructure layer that powers:

* Hiring Platforms
* Recruitment Agencies
* Universities
* Communities
* Startups
* Enterprises

We believe opportunities should be easier to discover and talent should be easier to identify.

---

# Join Us

If you're passionate about:

* Artificial Intelligence
* Hiring Technology
* Open Source
* Developer Tools
* Building Meaningful Products

We would love to build with you.

⭐ Star the repository

🐛 Open an issue

🚀 Submit a PR

🤝 Become a contributor

---

Built with ❤️ by the BugBaar Community.
