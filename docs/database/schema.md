# Database schema

| Table | Purpose |
|---|---|
| `users` | Recruiter or candidate identity |
| `candidate_profiles` | Parsed resume + skills |
| `jobs` | Roles owned by a recruiter |
| `applications` | Unique `(job_id, candidate_id)` with frozen match snapshot |
| `pipeline_events` | Audit log of status changes |
| `notes` | Recruiter notes on a candidate |

Match snapshots are stored on `applications.match_breakdown` so historical
ranking stays visible even if the candidate later updates their profile.
Live ranking on the job page re-scores against the current profile.
