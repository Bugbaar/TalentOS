"""Demo dataset so reviewers can use the product immediately."""

from __future__ import annotations

from sqlalchemy.orm import Session

from app.models import Application, CandidateProfile, Job, PipelineEvent, User
from app.security import hash_password
from app.services.matching_apply import score_profile_against_job

DEMO_PASSWORD = "TalentOS!2026"

RESUMES = {
    "aisha": """
Aisha Rahman
Senior Backend Engineer
aisha.rahman@example.com
https://github.com/aisha

B.Tech Computer Science. 6 years of experience building APIs.

Experience
Senior Backend Engineer, Nimbus  2021 - Present
- Designed FastAPI services, PostgreSQL schemas, Redis caches
- Deployed Docker and Kubernetes workloads on AWS
Backend Engineer, Helix  2019 - 2021
- Node.js, Express, MongoDB, JWT authentication

Skills: Python, FastAPI, PostgreSQL, Redis, Docker, Kubernetes, AWS, SQL, REST, Git, CI/CD
""",
    "rohan": """
Rohan Mehta
Full Stack Engineer
rohan.mehta@example.com

Bachelor of Engineering. 4 years of experience.

2022 - Present  Full Stack Engineer
React, Next.js, TypeScript, Node.js, Tailwind CSS, PostgreSQL

2020 - 2022  Frontend Engineer
JavaScript, HTML, CSS, Redux

Skills: React, Next.js, TypeScript, Node.js, Tailwind CSS, PostgreSQL, Docker, Git
""",
    "neha": """
Neha Kapoor
Machine Learning Engineer
neha.kapoor@example.com

M.Tech Artificial Intelligence. 5 years of experience.

Senior ML Engineer 2021 - Present
PyTorch, NLP, RAG, LangChain, Python, FastAPI, Qdrant, Docker

Skills: Python, Machine Learning, Deep Learning, NLP, RAG, LangChain, PyTorch, FastAPI, Qdrant, Docker
""",
    "vikram": """
Vikram Singh
Junior Backend Developer
vikram.singh@example.com

B.Sc Computer Science. 1 year of experience.

2025 - Present Intern
Python, Flask, MySQL, Git

Skills: Python, Flask, MySQL, Git, HTML
""",
}


def seed_if_empty(db: Session) -> None:
    if db.query(User).first():
        return

    recruiter = User(
        email="priya@bugbaar.dev",
        hashed_password=hash_password(DEMO_PASSWORD),
        full_name="Priya Nair",
        role="recruiter",
        organization="BugBaar",
    )
    db.add(recruiter)
    db.flush()

    jobs_spec = [
        Job(
            recruiter_id=recruiter.id,
            title="Senior Backend Engineer",
            department="Platform",
            location="Bengaluru / Remote",
            employment_type="full_time",
            seniority="senior",
            description=(
                "Own TalentOS APIs, data model, and matching pipeline. "
                "You will design services that recruiters can trust in production."
            ),
            required_skills=["Python", "FastAPI", "PostgreSQL", "Docker"],
            optional_skills=["Redis", "Kubernetes", "AWS", "CI/CD"],
            min_years_experience=5,
            education_requirement="Bachelors",
            status="open",
        ),
        Job(
            recruiter_id=recruiter.id,
            title="Full Stack Engineer",
            department="Product",
            location="Remote",
            employment_type="full_time",
            seniority="mid",
            description="Build recruiter and candidate experiences in Next.js with a FastAPI backend.",
            required_skills=["React", "TypeScript", "Next.js", "Node.js"],
            optional_skills=["PostgreSQL", "Tailwind CSS", "Docker"],
            min_years_experience=3,
            education_requirement="Bachelors",
            status="open",
        ),
        Job(
            recruiter_id=recruiter.id,
            title="ML / Applied AI Engineer",
            department="Intelligence",
            location="Hyderabad / Remote",
            employment_type="full_time",
            seniority="senior",
            description="Improve resume intelligence and ranking quality. Explainability is a product requirement.",
            required_skills=["Python", "Machine Learning", "NLP", "RAG"],
            optional_skills=["LangChain", "PyTorch", "FastAPI", "Qdrant"],
            min_years_experience=4,
            education_requirement="Masters",
            status="open",
        ),
    ]
    db.add_all(jobs_spec)
    db.flush()

    people = [
        ("aisha.rahman@example.com", "Aisha Rahman", "aisha", "Bengaluru", "Senior Backend Engineer"),
        ("rohan.mehta@example.com", "Rohan Mehta", "rohan", "Pune", "Full Stack Engineer"),
        ("neha.kapoor@example.com", "Neha Kapoor", "neha", "Hyderabad", "ML Engineer"),
        ("vikram.singh@example.com", "Vikram Singh", "vikram", "Jaipur", "Junior Backend Developer"),
    ]
    profiles: dict[str, CandidateProfile] = {}
    for email, name, key, city, headline in people:
        user = User(
            email=email,
            hashed_password=hash_password(DEMO_PASSWORD),
            full_name=name,
            role="candidate",
        )
        db.add(user)
        db.flush()
        from app.services.parser import parse_resume

        parsed = parse_resume(RESUMES[key])
        profile = CandidateProfile(
            user_id=user.id,
            headline=headline,
            location=city,
            years_experience=parsed.years_experience,
            education_level=parsed.education_level,
            seniority=parsed.seniority,
            summary=parsed.summary,
            skills=parsed.skills,
            education=[{"level": parsed.education_level}],
            experience=parsed.experience_spans,
            links=parsed.links,
            resume_text=RESUMES[key].strip(),
        )
        db.add(profile)
        db.flush()
        profiles[key] = profile

    # Each candidate applies to roles that make product sense.
    apply_pairs = [
        ("aisha", jobs_spec[0]),
        ("aisha", jobs_spec[1]),
        ("rohan", jobs_spec[1]),
        ("rohan", jobs_spec[0]),
        ("neha", jobs_spec[2]),
        ("neha", jobs_spec[0]),
        ("vikram", jobs_spec[0]),
        ("vikram", jobs_spec[1]),
    ]
    for key, job in apply_pairs:
        profile = profiles[key]
        breakdown = score_profile_against_job(profile, job)
        app = Application(
            job_id=job.id,
            candidate_id=profile.id,
            cover_note=f"Excited to contribute to {job.title} at BugBaar.",
            match_score=breakdown["score"],
            match_breakdown=breakdown,
            status="applied" if key != "aisha" else "screening",
        )
        if key == "neha" and job.title.startswith("ML"):
            app.status = "interview"
        db.add(app)
        db.flush()
        db.add(
            PipelineEvent(
                application_id=app.id,
                actor_id=recruiter.id,
                from_status="none",
                to_status=app.status,
                reason="Seeded application",
            )
        )
    db.commit()
