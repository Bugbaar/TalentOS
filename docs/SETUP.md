# Setup

## Prerequisites

- Python 3.11+
- Node.js 20+
- Optional: Docker

## Backend

```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

## Frontend

```bash
cd frontend
npm install
npm run dev
```

App: http://localhost:3000

## Demo accounts

Password for all seeded users: `TalentOS!2026`

| Role | Email |
|---|---|
| Recruiter | priya@bugbaar.dev |
| Candidate (strong backend) | aisha.rahman@example.com |
| Candidate (full stack) | rohan.mehta@example.com |
| Candidate (ML) | neha.kapoor@example.com |
| Candidate (junior) | vikram.singh@example.com |

## Tests

```bash
cd backend
pytest -q
```

## Docker

From the repository root:

```bash
docker compose up --build
```
