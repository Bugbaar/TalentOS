"""Seed TalentOS with realistic demo recruiting data.

Run from the repository root with::

    python scripts/seed_demo_data.py
"""

from __future__ import annotations

import asyncio
import sys
from pathlib import Path

from sqlalchemy import func, select

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))

from app.core.database import AsyncSessionLocal, Base, engine  # noqa: E402
from app.models import Application, Candidate, JobOpening, Resume  # noqa: E402
from app.models.application import ApplicationStatus  # noqa: E402
from app.models.job import JobStatus, WorkplaceType  # noqa: E402


JOBS = [
    {
        "title": "Lead Backend Engineer (FastAPI/Python)", "department": "Engineering", "location": "Remote",
        "workplace_type": WorkplaceType.REMOTE, "status": JobStatus.ACTIVE,
        "description": "Lead the design of reliable Python services, APIs, and data platforms used by a global hiring product. Mentor engineers and own technical delivery from architecture through production.",
        "required_skills": ["Python", "FastAPI", "PostgreSQL", "Docker", "SQLAlchemy"],
        "nice_to_have_skills": ["Kubernetes", "Redis", "AWS", "System Design"], "min_experience_years": 6.0, "salary_range": "$160,000 - $195,000",
    },
    {
        "title": "Senior Frontend Architect (Next.js/React)", "department": "Engineering", "location": "New York, NY",
        "workplace_type": WorkplaceType.HYBRID, "status": JobStatus.ACTIVE,
        "description": "Define frontend architecture for a fast, accessible recruiting platform. Build polished workflows with React and Next.js while setting standards for testing, performance, and design-system collaboration.",
        "required_skills": ["TypeScript", "React", "Next.js", "CSS", "Git"],
        "nice_to_have_skills": ["Redux", "Playwright", "Figma", "GraphQL"], "min_experience_years": 5.0, "salary_range": "$150,000 - $185,000",
    },
    {
        "title": "AI/ML Engineer (LLMs & Qdrant)", "department": "Applied AI", "location": "San Francisco, CA",
        "workplace_type": WorkplaceType.REMOTE, "status": JobStatus.ACTIVE,
        "description": "Develop retrieval-augmented AI features for talent intelligence, including resume understanding, embeddings, evaluation pipelines, and production vector search with Qdrant.",
        "required_skills": ["Python", "Machine Learning", "NLP", "PyTorch", "Qdrant"],
        "nice_to_have_skills": ["LLM", "OpenAI", "Hugging Face", "PostgreSQL"], "min_experience_years": 4.0, "salary_range": "$155,000 - $200,000",
    },
    {
        "title": "DevOps Specialist (Kubernetes/Docker)", "department": "Infrastructure", "location": "Austin, TX",
        "workplace_type": WorkplaceType.HYBRID, "status": JobStatus.ACTIVE,
        "description": "Improve deployment safety and platform reliability across cloud environments. Operate Kubernetes clusters, automate infrastructure, and build observable CI/CD systems for engineering teams.",
        "required_skills": ["Docker", "Kubernetes", "Terraform", "AWS", "CI/CD"],
        "nice_to_have_skills": ["Helm", "Prometheus", "Grafana", "Ansible"], "min_experience_years": 4.0, "salary_range": "$135,000 - $170,000",
    },
    {
        "title": "Product Manager (Technical)", "department": "Product", "location": "Boston, MA",
        "workplace_type": WorkplaceType.ONSITE, "status": JobStatus.ACTIVE,
        "description": "Own the roadmap for recruiter-facing intelligence products. Translate customer problems into measurable outcomes, align engineering and design, and communicate decisions clearly to executive stakeholders.",
        "required_skills": ["Product Management", "Agile", "Data Analysis", "Communication", "Leadership"],
        "nice_to_have_skills": ["SQL", "Figma", "Jira", "Machine Learning"], "min_experience_years": 5.0, "salary_range": "$125,000 - $165,000",
    },
    {
        "title": "Full-Stack Developer (TypeScript/Node)", "department": "Engineering", "location": "Remote",
        "workplace_type": WorkplaceType.REMOTE, "status": JobStatus.ACTIVE,
        "description": "Ship end-to-end product features across a TypeScript web application and Node services. Partner closely with product and design, write maintainable tests, and improve customer-facing performance.",
        "required_skills": ["TypeScript", "React", "Node.js", "PostgreSQL", "REST"],
        "nice_to_have_skills": ["Next.js", "Docker", "GraphQL", "Jest"], "min_experience_years": 3.0, "salary_range": "$120,000 - $155,000",
    },
]


CANDIDATES = [
    ("Maya", "Patel", "maya.patel@example.com", 8.0, ["Python", "FastAPI", "PostgreSQL", "Docker", "SQLAlchemy", "AWS", "System Design"], "Lead platform engineer with a focus on resilient APIs and developer experience.", [{"company": "Northstar Labs", "role": "Staff Backend Engineer", "start_date": "2019-03", "end_date": "Present", "summary": "Led API modernization and mentored a team of eight."}], [{"institution": "Georgia Tech", "degree": "M.S.", "field": "Computer Science", "graduation_year": 2018}]),
    ("Liam", "Chen", "liam.chen@example.com", 6.0, ["TypeScript", "React", "Next.js", "Redux", "CSS", "Git", "GraphQL", "Playwright"], "Frontend architect building accessible, high-performance web applications.", [{"company": "Brightline", "role": "Senior Frontend Engineer", "start_date": "2020-01", "end_date": "Present", "summary": "Designed a shared component system used by five product squads."}], [{"institution": "University of Washington", "degree": "B.S.", "field": "Human Centered Design", "graduation_year": 2019}]),
    ("Sofia", "Martinez", "sofia.martinez@example.com", 5.0, ["Python", "Machine Learning", "NLP", "PyTorch", "Qdrant", "Hugging Face", "PostgreSQL"], "Machine learning engineer specializing in language systems and search relevance.", [{"company": "Vela AI", "role": "ML Engineer", "start_date": "2021-06", "end_date": "Present", "summary": "Built multilingual retrieval and evaluation pipelines."}], [{"institution": "Carnegie Mellon University", "degree": "M.S.", "field": "Machine Learning", "graduation_year": 2021}]),
    ("Ethan", "Williams", "ethan.williams@example.com", 7.0, ["Docker", "Kubernetes", "Terraform", "AWS", "CI/CD", "Helm", "Prometheus", "Grafana"], "Platform engineer helping teams deploy safely and operate reliable cloud systems.", [{"company": "CloudHarbor", "role": "Site Reliability Engineer", "start_date": "2018-08", "end_date": "Present", "summary": "Reduced deployment recovery time with Kubernetes automation."}], [{"institution": "Purdue University", "degree": "B.S.", "field": "Computer Engineering", "graduation_year": 2018}]),
    ("Aisha", "Rahman", "aisha.rahman@example.com", 6.0, ["Product Management", "Agile", "Data Analysis", "Communication", "Leadership", "SQL", "Figma", "Jira"], "Technical product manager turning complex data products into simple customer outcomes.", [{"company": "Orbit Recruiting", "role": "Senior Product Manager", "start_date": "2020-02", "end_date": "Present", "summary": "Owned an analytics roadmap that improved recruiter adoption."}], [{"institution": "University of Michigan", "degree": "B.S.", "field": "Information Science", "graduation_year": 2019}]),
    ("Noah", "Johnson", "noah.johnson@example.com", 4.0, ["TypeScript", "React", "Node.js", "PostgreSQL", "REST", "Next.js", "Docker", "Jest"], "Full-stack developer shipping thoughtful TypeScript products from database to browser.", [{"company": "Civic Stack", "role": "Full-Stack Developer", "start_date": "2021-09", "end_date": "Present", "summary": "Delivered workflow tools used by public-sector teams."}], [{"institution": "University of Texas at Austin", "degree": "B.S.", "field": "Computer Science", "graduation_year": 2021}]),
    ("Grace", "Kim", "grace.kim@example.com", 9.0, ["Python", "Django", "FastAPI", "PostgreSQL", "Redis", "Docker", "Kubernetes", "AWS", "System Design"], "Principal software engineer experienced in distributed services and technical leadership.", [{"company": "Atlas Commerce", "role": "Principal Engineer", "start_date": "2016-05", "end_date": "Present", "summary": "Set architecture direction for a high-volume commerce platform."}], [{"institution": "Stanford University", "degree": "M.S.", "field": "Computer Science", "graduation_year": 2016}]),
    ("Oliver", "Brown", "oliver.brown@example.com", 3.0, ["TypeScript", "React", "Node.js", "MongoDB", "REST", "Git", "Jest"], "Product-minded software developer who enjoys fast feedback and clean interfaces.", [{"company": "Mosaic Studio", "role": "Software Developer", "start_date": "2022-01", "end_date": "Present", "summary": "Built customer portals and internal APIs."}], [{"institution": "Northeastern University", "degree": "B.S.", "field": "Computer Science", "graduation_year": 2021}]),
    ("Priya", "Nair", "priya.nair@example.com", 7.0, ["Python", "Machine Learning", "Deep Learning", "TensorFlow", "NLP", "PyTorch", "OpenAI", "Qdrant"], "Applied AI researcher focused on trustworthy language and recommendation systems.", [{"company": "SignalForge", "role": "Senior Applied Scientist", "start_date": "2019-07", "end_date": "Present", "summary": "Launched embedding search and LLM evaluation programs."}], [{"institution": "University of Toronto", "degree": "Ph.D.", "field": "Computer Science", "graduation_year": 2019}]),
    ("Daniel", "Okafor", "daniel.okafor@example.com", 5.0, ["Docker", "Kubernetes", "AWS", "Terraform", "Ansible", "Jenkins", "Linux", "Nginx"], "DevOps engineer specializing in repeatable infrastructure and secure delivery pipelines.", [{"company": "FinPeak", "role": "DevOps Engineer", "start_date": "2020-11", "end_date": "Present", "summary": "Migrated services to containers and infrastructure as code."}], [{"institution": "University of Maryland", "degree": "B.S.", "field": "Information Systems", "graduation_year": 2020}]),
    ("Chloe", "Wilson", "chloe.wilson@example.com", 8.0, ["Product Management", "Agile", "Leadership", "Communication", "Data Analysis", "SQL", "Machine Learning"], "Product leader with a record of aligning technical teams around measurable customer value.", [{"company": "LatticeWorks", "role": "Group Product Manager", "start_date": "2018-04", "end_date": "Present", "summary": "Managed a portfolio of data-driven workflow products."}], [{"institution": "Duke University", "degree": "MBA", "field": "Technology Management", "graduation_year": 2018}]),
    ("Marcus", "Lee", "marcus.lee@example.com", 10.0, ["Python", "FastAPI", "PostgreSQL", "SQLAlchemy", "Docker", "Kubernetes", "AWS", "Redis", "Git"], "Backend technology leader building secure, observable systems at scale.", [{"company": "Pioneer Health", "role": "Engineering Manager", "start_date": "2015-02", "end_date": "Present", "summary": "Led platform engineering and service reliability initiatives."}], [{"institution": "University of Illinois Urbana-Champaign", "degree": "B.S.", "field": "Computer Science", "graduation_year": 2015}]),
    ("Isabella", "Rossi", "isabella.rossi@example.com", 2.0, ["TypeScript", "React", "CSS", "Figma", "Git", "Jest"], "Frontend developer passionate about inclusive design and delightful product details.", [{"company": "Kindred Design", "role": "Frontend Developer", "start_date": "2023-01", "end_date": "Present", "summary": "Implemented accessible design-system components."}], [{"institution": "Parsons School of Design", "degree": "BFA", "field": "Communication Design", "graduation_year": 2022}]),
    ("Henry", "Adams", "henry.adams@example.com", 6.0, ["Python", "Flask", "REST", "PostgreSQL", "Docker", "GCP", "Pandas", "SQL"], "Backend and data engineer delivering pragmatic services and reporting pipelines.", [{"company": "MarketGrid", "role": "Senior Software Engineer", "start_date": "2020-03", "end_date": "Present", "summary": "Built data APIs and automated operational reporting."}], [{"institution": "University of Colorado Boulder", "degree": "B.S.", "field": "Applied Mathematics", "graduation_year": 2019}]),
    ("Amara", "Thompson", "amara.thompson@example.com", 5.0, ["TypeScript", "React", "Next.js", "Node.js", "PostgreSQL", "GraphQL", "Cypress"], "Full-stack engineer focused on dependable customer workflows and team collaboration.", [{"company": "Evergreen Software", "role": "Full-Stack Engineer", "start_date": "2021-03", "end_date": "Present", "summary": "Owned features across React clients and Node APIs."}], [{"institution": "University of California, Irvine", "degree": "B.S.", "field": "Computer Science", "graduation_year": 2020}]),
]


APPLICATIONS = [
    (0, 0, ApplicationStatus.INTERVIEW), (1, 1, ApplicationStatus.SCREENING), (2, 2, ApplicationStatus.OFFER),
    (3, 3, ApplicationStatus.INTERVIEW), (4, 4, ApplicationStatus.SCREENING), (5, 5, ApplicationStatus.OFFER),
    (6, 0, ApplicationStatus.SCREENING), (7, 1, ApplicationStatus.APPLIED), (8, 2, ApplicationStatus.INTERVIEW),
    (9, 3, ApplicationStatus.SCREENING), (10, 4, ApplicationStatus.INTERVIEW), (11, 0, ApplicationStatus.OFFER),
    (12, 1, ApplicationStatus.APPLIED), (13, 5, ApplicationStatus.SCREENING), (14, 2, ApplicationStatus.APPLIED),
    (0, 5, ApplicationStatus.SCREENING), (5, 0, ApplicationStatus.APPLIED), (2, 5, ApplicationStatus.INTERVIEW),
    (4, 2, ApplicationStatus.APPLIED), (8, 0, ApplicationStatus.OFFER),
]


def precomputed_score(candidate: Candidate, job: JobOpening) -> float:
    """Calculate a stable demo score before inserting an application."""

    candidate_skills = {skill.casefold() for skill in candidate.skills}
    required = {skill.casefold() for skill in job.required_skills}
    skill_score = len(candidate_skills & required) / len(required) * 100 if required else 100.0
    experience_score = min(1.0, candidate.experience_years / job.min_experience_years) * 100 if job.min_experience_years else 100.0
    return round((skill_score * 0.7) + (experience_score * 0.3), 2)


async def seed() -> None:
    """Create tables and insert the demo dataset once."""

    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)
    async with AsyncSessionLocal() as db:
        existing = await db.scalar(select(func.count()).select_from(Candidate))
        if existing:
            print("Seed skipped: candidates already exist.")
            return
        jobs = [JobOpening(**job) for job in JOBS]
        candidates = [
            Candidate(first_name=first, last_name=last, email=email, experience_years=years, skills=skills, bio=bio)
            for first, last, email, years, skills, bio, _, _ in CANDIDATES
        ]
        db.add_all(jobs + candidates)
        await db.flush()

        resumes = []
        for candidate, data in zip(candidates, CANDIDATES, strict=True):
            _, _, _, _, skills, _, work_history, education = data
            resumes.append(
                Resume(
                    candidate_id=candidate.id,
                    raw_text=f"{candidate.first_name} {candidate.last_name}\nSkills: {', '.join(skills)}",
                    parsed_skills=skills,
                    work_history=work_history,
                    education=education,
                )
            )
        db.add_all(resumes)

        applications = []
        for candidate_index, job_index, stage in APPLICATIONS:
            candidate, job = candidates[candidate_index], jobs[job_index]
            applications.append(
                Application(
                    candidate_id=candidate.id,
                    job_id=job.id,
                    status=stage,
                    ai_match_score=precomputed_score(candidate, job),
                    ai_summary=f"Precomputed demo evaluation for {job.title}.",
                    notes="Demo application",
                )
            )
        db.add_all(applications)
        await db.commit()
        print(f"Seeded {len(jobs)} jobs, {len(candidates)} candidates, and {len(APPLICATIONS)} applications.")
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed())
