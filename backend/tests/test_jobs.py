"""Job and application workflow tests."""


async def test_job_creation_and_application_pipeline(async_client):
    candidate = await async_client.post("/api/v1/candidates/", json={"first_name": "Grace", "last_name": "Hopper", "email": "grace@example.com", "skills": ["Python", "FastAPI"], "experience_years": 8})
    candidate_id = candidate.json()["id"]
    job = await async_client.post("/api/v1/jobs/", json={"title": "Backend Engineer", "department": "Engineering", "location": "Remote", "description": "Build Python APIs", "required_skills": ["Python", "FastAPI"], "min_experience_years": 3})
    job_id = job.json()["id"]
    application = await async_client.post(f"/api/v1/jobs/{job_id}/apply", json={"candidate_id": candidate_id})
    assert application.status_code == 201
    application_id = application.json()["id"]
    updated = await async_client.patch(f"/api/v1/jobs/applications/{application_id}/status", json={"status": "INTERVIEW", "notes": "Technical screen scheduled"})
    assert updated.json()["status"] == "INTERVIEW"


async def test_scorecard_crud(async_client):
    candidate = await async_client.post("/api/v1/candidates/", json={"first_name": "Lin", "last_name": "Chen", "email": "lin@example.com"})
    job = await async_client.post("/api/v1/jobs/", json={"title": "Designer", "department": "Design", "location": "Remote", "description": "Design products"})
    application = await async_client.post(f"/api/v1/jobs/{job.json()['id']}/apply", json={"candidate_id": candidate.json()["id"]})
    scorecard = await async_client.post(f"/api/v1/jobs/applications/{application.json()['id']}/scorecards", json={"interviewer_name": "Alex", "round_name": "Technical Round 1", "rating": 4, "recommendation": "YES", "notes": "Strong communication"})
    assert scorecard.status_code == 201
    assert len((await async_client.get(f"/api/v1/jobs/applications/{application.json()['id']}/scorecards")).json()) == 1
