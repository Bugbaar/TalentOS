"""Matching and interview-kit tests."""


async def test_composite_matching_and_interview_kit(async_client):
    candidate = await async_client.post("/api/v1/candidates/", json={"first_name": "Maya", "last_name": "Patel", "email": "maya@example.com", "skills": ["Python", "FastAPI"], "experience_years": 6})
    job = await async_client.post("/api/v1/jobs/", json={"title": "Lead Backend", "department": "Engineering", "location": "Remote", "description": "Build Python FastAPI services", "required_skills": ["Python", "FastAPI"], "min_experience_years": 4})
    result = await async_client.post("/api/v1/matching/evaluate", params={"candidate_id": candidate.json()["id"], "job_id": job.json()["id"]})
    assert result.status_code == 200
    assert result.json()["skill_score"] == 100
    assert result.json()["experience_score"] == 100
    kit = await async_client.post("/api/v1/matching/interview-kit", json={"candidate_id": candidate.json()["id"], "job_id": job.json()["id"]})
    assert kit.status_code == 200
    assert len(kit.json()["questions"]) == 5
