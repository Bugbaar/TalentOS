# 🎯 TalentOS

> **Open-Source Sovereign Talent Intelligence & Hiring Infrastructure**  
> Powered by **FastAPI**, **Next.js**, and **Groq Llama 3.3 / GPT-OSS AI Intelligence**.

---

## ⚡ Quickstart (Run Locally Without Docker)

### 1. Start the Backend API (FastAPI)
```powershell
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
- **API URL**: `http://localhost:8000`
- **Interactive Swagger Docs**: `http://localhost:8000/docs`

---

### 2. Start the Frontend (Next.js)
```powershell
cd frontend
npm install
npm run dev
```
- **Web Application**: `http://localhost:3000`

---

### 3. (Optional) Seed Demo Pipeline Data
```powershell
python scripts/seed_demo_data.py
```

---

## ✨ Features & Architecture

- **🏛️ Sarvam.ai Design System**: Clean, sovereign UI with soft off-white canvas, radial indigo ambient lighting, and signature pill controls.
- **📄 Native Resume Parsing**: Upload `.pdf`, `.docx`, or `.txt` resumes. AI automatically parses contact info, verified skills, and work history directly into the local SQLite database.
- **💼 AI Job Requisition Architect**: Draft rough notes and use **"AI Polish"** to auto-generate structured job descriptions, required skills, and salary bands.
- **⚡ AI Candidate Compatibility Engine**: Multi-factor candidate evaluation (50% Skills + 30% Experience + 20% Semantic) with structured critique.
- **⚖️ Side-by-Side Comparison Matrix**: Compare 2+ applicants on a job requisition with AI recommended picks, strengths, and gap breakdowns.
- **📋 Structured Interview Kit & Rubrics**: Auto-generate customized interview questions with scoring rubrics tailored to candidate gaps.
- **✉️ Recruiter Outreach Assistant**: Auto-generate personalized recruiter outreach emails with selectable tone (Friendly, Professional, Executive).
- **📝 Interview Scorecards**: Log interviewer ratings (1–5 stars), recommendation verdicts, and technical notes.
- **💾 Zero-Setup Local Persistence**: Fully persistent local SQLite database (`talentos.db`) with zero external service dependencies.
- **📥 CSV Data Streaming**: Stream talent pool and applicant pipeline data directly to CSV.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | Next.js 16 (Turbopack), React 19, TypeScript, TailwindCSS v3 (Sarvam.ai tokens), Lucide Icons |
| **Backend** | Python 3.11+, FastAPI, Async SQLAlchemy 2.0, Pydantic v2, Uvicorn |
| **AI Intelligence** | Groq Llama 3.3 70B / GPT-OSS 120B (High-throughput structured JSON inference) |
| **Document Parser** | `pypdf`, `python-docx` |
| **Database** | SQLite + `aiosqlite` (Zero-setup local) / PostgreSQL (Optional via Docker) |
| **Testing** | `pytest`, `pytest-asyncio`, `httpx` |

---

## 🧪 Running Tests

```powershell
cd backend
pytest -v
```

---

Built with ❤️ by BugBaar.
