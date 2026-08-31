from app.services.matching import match_candidate_to_job
from app.services.parser import parse_resume


def test_parser_extracts_core_fields():
    parsed = parse_resume(
        """
        Aisha Rahman
        Senior Backend Engineer
        aisha@example.com
        https://github.com/aisha
        B.Tech Computer Science. 6 years of experience.
        2021 - Present FastAPI PostgreSQL Docker Kubernetes AWS Redis
        Skills: Python, FastAPI, Postgres, k8s
        """
    )
    assert parsed.email == "aisha@example.com"
    assert "Python" in parsed.skills
    assert "FastAPI" in parsed.skills
    assert "PostgreSQL" in parsed.skills
    assert "Kubernetes" in parsed.skills
    assert parsed.years_experience >= 5
    assert parsed.education_level == "Bachelors"
    assert parsed.seniority == "senior"


def test_matching_penalizes_missing_required_skills():
    strong = match_candidate_to_job(
        candidate_skills=["Python", "FastAPI", "PostgreSQL", "Docker"],
        candidate_years=6,
        candidate_education="Bachelors",
        candidate_seniority="senior",
        required_skills=["Python", "FastAPI", "PostgreSQL", "Docker"],
        optional_skills=["Redis"],
        min_years=5,
        required_education="Bachelors",
        job_seniority="senior",
    )
    weak = match_candidate_to_job(
        candidate_skills=["HTML", "CSS"],
        candidate_years=1,
        candidate_education="Diploma",
        candidate_seniority="junior",
        required_skills=["Python", "FastAPI", "PostgreSQL", "Docker"],
        optional_skills=["Redis"],
        min_years=5,
        required_education="Bachelors",
        job_seniority="senior",
    )
    assert strong.score >= 85
    assert strong.missing_required == []
    assert weak.score < 50
    assert "Python" in weak.missing_required


def test_js_alias_matches_javascript():
    result = match_candidate_to_job(
        candidate_skills=["JS", "React.js"],
        candidate_years=3,
        candidate_education="Bachelors",
        candidate_seniority="mid",
        required_skills=["JavaScript", "React"],
        optional_skills=[],
        min_years=2,
        required_education="Bachelors",
        job_seniority="mid",
    )
    assert result.missing_required == []
    assert result.score >= 80
