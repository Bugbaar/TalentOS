"""Candidate endpoint tests."""

import io


async def test_candidate_creation_and_search(async_client):
    response = await async_client.post("/api/v1/candidates/", json={"first_name": "Ada", "last_name": "Lovelace", "email": "ada@example.com", "skills": ["Python"], "experience_years": 5})
    assert response.status_code == 201
    response = await async_client.get("/api/v1/candidates/?search=ada")
    assert response.status_code == 200
    assert response.json()[0]["email"] == "ada@example.com"
    response = await async_client.get("/api/v1/candidates/?skill_filter=Python")
    assert len(response.json()) == 1


async def test_resume_ingestion(async_client):
    content = b"Jane Doe\njane.doe@example.com\nPython FastAPI PostgreSQL\n5 years experience"
    response = await async_client.post("/api/v1/candidates/upload-resume", files={"file": ("jane.txt", io.BytesIO(content), "text/plain")})
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "jane.doe@example.com"
    assert data["resumes"][0]["raw_text"].startswith("Jane Doe")
