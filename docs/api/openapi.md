# 🔌 TalentOS REST API Reference

Base URL: `http://localhost:8000/api/v1`

---

## 1. Candidate Management

### `GET /candidates`
List all candidates with optional skill and experience filters.
- **Query Params**: `skip` (int), `limit` (int), `skill` (string), `search` (string)
- **Response**: `200 OK` - Array of `CandidateRead` objects.

### `POST /candidates`
Create a new candidate manually.
- **Request Body**: `CandidateCreate`
- **Response**: `201 Created` - `CandidateRead`

### `GET /candidates/{candidate_id}`
Retrieve full candidate profile, resumes, and application history.
- **Response**: `200 OK` - `CandidateDetailRead`

### `POST /candidates/upload-resume`
Upload a resume file (`multipart/form-data`) to automatically create or update a candidate profile via AI parsing.
- **Form Data**: `file` (UploadFile), `email` (optional string)
- **Response**: `200 OK` - `ParsedResumeResponse`

---

## 2. Job Management

### `GET /jobs`
List all job openings with status and department filters.
- **Query Params**: `status` (ACTIVE/CLOSED), `department` (string)
- **Response**: `200 OK` - Array of `JobRead` objects.

### `POST /jobs`
Create a new job opening.
- **Request Body**: `JobCreate`
- **Response**: `201 Created` - `JobRead`

### `GET /jobs/{job_id}`
Retrieve job details along with all active applicants.
- **Response**: `200 OK` - `JobDetailRead`

### `POST /jobs/{job_id}/apply`
Submit a candidate application for a job.
- **Request Body**: `{ "candidate_id": "uuid" }`
- **Response**: `201 Created` - `ApplicationRead` (includes computed AI fit score)

### `PATCH /applications/{application_id}/status`
Update an applicant's pipeline stage (`APPLIED` -> `SCREENING` -> `INTERVIEW` -> `OFFER` -> `HIRED` / `REJECTED`).
- **Request Body**: `{ "status": "INTERVIEW", "notes": "Passed technical screen" }`
- **Response**: `200 OK` - `ApplicationRead`

---

## 3. AI Matching & Gap Analysis

### `POST /matching/evaluate`
Evaluate match compatibility between any candidate and any job opening on-the-fly.
- **Request Body**: `{ "candidate_id": "uuid", "job_id": "uuid" }`
- **Response**: `200 OK`
  ```json
  {
    "overall_score": 88.5,
    "skill_score": 90.0,
    "experience_score": 100.0,
    "semantic_score": 75.0,
    "matched_skills": ["Python", "FastAPI", "Docker"],
    "missing_skills": ["Qdrant"],
    "ai_critique": "Candidate has strong backend foundations and matches 3 of 4 required skills."
  }
  ```

### `GET /matching/job/{job_id}/ranked-candidates`
Returns all candidates in the database ranked by AI compatibility for the specified job opening.
- **Query Params**: `limit` (int, default 10)
- **Response**: `200 OK` - Array of ranked candidate match summaries.

---

## 4. Analytics

### `GET /analytics/summary`
Returns recruiter dashboard metrics (Total candidates, active jobs, applications in pipeline, top in-demand skills).
- **Response**: `200 OK` - `AnalyticsSummary`
