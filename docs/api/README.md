# API

Interactive docs: `http://localhost:8000/docs`

| Method | Path | Who |
|---|---|---|
| POST | `/api/auth/register` | Public |
| POST | `/api/auth/login` | Public |
| GET | `/api/auth/me` | Auth |
| GET/PUT | `/api/candidates/me` | Candidate |
| POST | `/api/candidates/me/parse-resume` | Candidate |
| POST | `/api/candidates/me/upload-resume` | Candidate |
| GET | `/api/candidates` | Recruiter |
| POST | `/api/jobs` | Recruiter |
| GET | `/api/jobs` | Auth |
| POST | `/api/applications` | Candidate |
| GET | `/api/applications/me` | Candidate |
| GET | `/api/applications/job/{id}` | Recruiter (ranked) |
| PATCH | `/api/applications/{id}` | Recruiter (pipeline) |
| GET | `/api/matching/recommendations` | Candidate |
| GET | `/api/analytics/overview` | Recruiter |

Authentication: `Authorization: Bearer <jwt>`
