from fastapi.testclient import TestClient


def _register(client: TestClient, role: str, email: str) -> str:
    response = client.post(
        "/api/auth/register",
        json={
            "email": email,
            "password": "password123",
            "full_name": f"Test {role}",
            "role": role,
            "organization": "Acme" if role == "recruiter" else None,
        },
    )
    assert response.status_code == 201, response.text
    return response.json()["access_token"]


def test_duplicate_application_rejected(client: TestClient):
    rec = _register(client, "recruiter", "rec@example.com")
    cand = _register(client, "candidate", "cand@example.com")

    job = client.post(
        "/api/jobs",
        headers={"Authorization": f"Bearer {rec}"},
        json={
            "title": "Backend Engineer",
            "description": "Build APIs and matching systems for TalentOS.",
            "required_skills": ["Python", "FastAPI"],
            "optional_skills": ["Docker"],
            "min_years_experience": 2,
            "seniority": "mid",
            "education_requirement": "Bachelors",
            "status": "open",
        },
    )
    assert job.status_code == 201, job.text
    job_id = job.json()["id"]

    parsed = client.post(
        "/api/candidates/me/parse-resume",
        headers={"Authorization": f"Bearer {cand}"},
        json={
            "resume_text": (
                "Test Candidate\nBackend Engineer\ntest@example.com\n"
                "B.Tech. 3 years of experience. Python FastAPI Docker PostgreSQL"
            )
        },
    )
    assert parsed.status_code == 200, parsed.text

    first = client.post(
        "/api/applications",
        headers={"Authorization": f"Bearer {cand}"},
        json={"job_id": job_id, "cover_note": "I would love this role."},
    )
    assert first.status_code == 201, first.text
    assert first.json()["match_score"] > 0

    dup = client.post(
        "/api/applications",
        headers={"Authorization": f"Bearer {cand}"},
        json={"job_id": job_id},
    )
    assert dup.status_code == 409

    illegal = client.patch(
        f"/api/applications/{first.json()['id']}",
        headers={"Authorization": f"Bearer {rec}"},
        json={"status": "hired"},
    )
    assert illegal.status_code == 409


def test_candidate_cannot_create_job(client: TestClient):
    cand = _register(client, "candidate", "onlycand@example.com")
    response = client.post(
        "/api/jobs",
        headers={"Authorization": f"Bearer {cand}"},
        json={
            "title": "Should fail",
            "description": "Candidates must not create jobs in this product.",
            "required_skills": ["Python"],
        },
    )
    assert response.status_code == 403
