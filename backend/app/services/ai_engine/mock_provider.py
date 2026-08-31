"""Deterministic, offline AI provider for development and testing."""

import hashlib
import math
import re

from app.schemas.ai import (CandidateComparisonItem, CompareCandidatesResponse,
                            InterviewKitResponse, JobEnrichmentResponse,
                            OutreachEmailResponse, ParsedResumeSchema)
from app.services.ai_engine.base import BaseAIProvider


class MockAIProvider(BaseAIProvider):
    """Provide predictable resume parsing, vectors, and hiring critiques."""

    SKILL_KEYWORDS: tuple[str, ...] = (
        "Python", "Java", "JavaScript", "TypeScript", "C", "C++", "C#", "Go", "Golang", "Rust",
        "Ruby", "PHP", "Kotlin", "Swift", "Scala", "R", "Dart", "Bash", "PowerShell", "SQL",
        "HTML", "CSS", "Sass", "Less", "React", "React Native", "Angular", "Vue", "Svelte",
        "Next.js", "Nuxt", "jQuery", "Redux", "MobX", "Tailwind CSS", "Bootstrap", "Material UI",
        "FastAPI", "Django", "Flask", "Pyramid", "Spring", "Spring Boot", "Express", "NestJS",
        "Laravel", "Ruby on Rails", "ASP.NET", ".NET", "GraphQL", "REST", "gRPC", "WebSockets",
        "PostgreSQL", "MySQL", "MariaDB", "SQLite", "Oracle", "SQL Server", "MongoDB", "Redis",
        "Elasticsearch", "DynamoDB", "Cassandra", "Neo4j", "Firebase", "Supabase", "Prisma",
        "SQLAlchemy", "Alembic", "Docker", "Kubernetes", "Helm", "Terraform", "Ansible", "Jenkins",
        "GitHub Actions", "GitLab CI", "CircleCI", "ArgoCD", "Prometheus", "Grafana", "Datadog",
        "AWS", "Azure", "Google Cloud", "GCP", "EC2", "S3", "Lambda", "ECS", "EKS", "RDS",
        "CloudFormation", "Vercel", "Netlify", "Linux", "Unix", "Nginx", "Apache", "Git",
        "GitHub", "GitLab", "Bitbucket", "Jira", "Confluence", "Figma", "Postman", "Swagger",
        "OpenAPI", "Pytest", "Jest", "Cypress", "Playwright", "Selenium", "Unit Testing",
        "Integration Testing", "TDD", "Machine Learning", "Deep Learning", "Artificial Intelligence",
        "Natural Language Processing", "NLP", "Computer Vision", "TensorFlow", "PyTorch", "Keras",
        "scikit-learn", "Pandas", "NumPy", "SciPy", "Matplotlib", "Hugging Face", "Transformers",
        "LangChain", "LLM", "OpenAI", "Gemini", "Qdrant", "Pinecone", "Chroma", "Vector Database",
        "Data Engineering", "Apache Spark", "Kafka", "Airflow", "dbt", "ETL", "Data Analysis",
        "Agile", "Scrum", "Kanban", "Product Management", "Project Management", "Leadership",
        "Communication", "System Design", "Microservices", "Event-Driven Architecture", "CI/CD",
        "OAuth", "JWT", "SAML", "Cybersecurity", "DevOps", "Site Reliability Engineering",
    )

    _EMAIL_RE = re.compile(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+")
    _PHONE_RE = re.compile(r"(?<!\d)(?:\+?\d[\d .()-]{7,}\d)(?!\d)")
    _YEARS_RE = re.compile(r"(?<!\d)(\d+(?:\.\d+)?)\s*\+?\s*(?:years?|yrs?)(?!\w)", re.I)
    _DATE_RANGE_RE = re.compile(
        r"\b(19\d{2}|20\d{2})\s*(?:-|–|—|to)\s*(19\d{2}|20\d{2}|present|current)\b", re.I
    )

    async def parse_resume(self, text: str) -> ParsedResumeSchema:
        """Extract common resume fields using deterministic regular expressions."""

        clean_text = text.strip()
        email_match = self._EMAIL_RE.search(clean_text)
        phone_match = self._PHONE_RE.search(clean_text)
        first_name, last_name = self._extract_name(clean_text, email_match)
        years = [float(match.group(1)) for match in self._YEARS_RE.finditer(clean_text)]
        date_years = []
        for match in self._DATE_RANGE_RE.finditer(clean_text):
            start = int(match.group(1))
            end = 2024 if match.group(2).lower() in {"present", "current"} else int(match.group(2))
            if end >= start:
                date_years.append(float(end - start))
        experience = max(years + date_years, default=0.0)
        skills = [skill for skill in self.SKILL_KEYWORDS if self._contains_skill(clean_text, skill)]
        headline = self._extract_headline(clean_text)

        return ParsedResumeSchema(
            first_name=first_name,
            last_name=last_name,
            email=email_match.group(0) if email_match else "",
            phone=self._normalise_phone(phone_match.group(0)) if phone_match else None,
            headline=headline,
            experience_years=experience,
            skills=skills,
            work_history=[],
            education=[],
        )

    async def get_embedding(self, text: str) -> list[float]:
        """Return a deterministic 384-dimensional unit vector."""

        values: list[float] = []
        for index in range(384):
            digest = hashlib.sha256(f"{text}\0{index}".encode("utf-8")).digest()
            integer = int.from_bytes(digest[:8], "big", signed=False)
            values.append((integer / 2**63) - 1.0)
        norm = math.sqrt(sum(value * value for value in values)) or 1.0
        return [value / norm for value in values]

    async def generate_critique(
        self,
        candidate_skills: list[str],
        candidate_exp: float,
        job_req_skills: list[str],
        job_min_exp: float,
        job_title: str,
    ) -> str:
        """Generate an actionable deterministic fit summary."""

        candidate_map = {skill.casefold(): skill for skill in candidate_skills}
        matched = [skill for skill in job_req_skills if skill.casefold() in candidate_map]
        missing = [skill for skill in job_req_skills if skill.casefold() not in candidate_map]
        skill_text = f"Matched required skills: {', '.join(matched)}." if matched else "No required skills matched."
        gap_text = f"Skill gaps: {', '.join(missing)}." if missing else "No required skill gaps identified."
        experience_text = (
            f"Experience meets the {job_min_exp:g}-year requirement ({candidate_exp:g} years)."
            if candidate_exp >= job_min_exp
            else f"Experience is below the {job_min_exp:g}-year requirement ({candidate_exp:g} years)."
        )
        return f"Candidate fit for {job_title}: {skill_text} {gap_text} {experience_text}"

    async def generate_interview_kit(self, candidate_data: dict, job_data: dict) -> InterviewKitResponse:
        """Generate useful offline questions without an external model."""

        name = f"{candidate_data.get('first_name', '')} {candidate_data.get('last_name', '')}".strip()
        title = str(job_data.get("title", "the role"))
        skills = list(candidate_data.get("skills", [])) or list(job_data.get("required_skills", []))
        required = list(job_data.get("required_skills", []))
        questions = [
            {"question": f"How would you use {skills[0]} to solve a difficult problem in {title}?", "question_type": "TECHNICAL", "target_skill": skills[0], "expected_answer_points": ["Explains a concrete implementation", "Discusses trade-offs and testing", "Connects the solution to measurable outcomes"], "evaluation_rubric": "Strong answers are specific, technically sound, and explain trade-offs clearly."},
            {"question": f"Describe a production system you built using {skills[min(1, len(skills) - 1)]}.", "question_type": "TECHNICAL", "target_skill": skills[min(1, len(skills) - 1)], "expected_answer_points": ["Clarifies personal ownership", "Covers reliability and observability", "Explains an incident or improvement"], "evaluation_rubric": "Strong answers demonstrate ownership, operational awareness, and evidence of impact."},
            {"question": f"How would you validate quality when delivering a feature for {title}?", "question_type": "TECHNICAL", "target_skill": required[0] if required else "Quality", "expected_answer_points": ["Defines acceptance criteria", "Uses appropriate automated tests", "Mentions monitoring and feedback"], "evaluation_rubric": "Strong answers use a deliberate quality strategy from development through production."},
            {"question": "Tell me about a time you changed your approach after receiving difficult stakeholder or teammate feedback.", "question_type": "BEHAVIORAL", "target_skill": "Communication", "expected_answer_points": ["Provides a specific situation", "Shows listening and adaptation", "Explains the outcome and lesson learned"], "evaluation_rubric": "Strong answers show self-awareness, accountability, and constructive collaboration."},
            {"question": f"Design a scalable architecture for the core workflow of {title}.", "question_type": "SYSTEM_DESIGN", "target_skill": "System Design", "expected_answer_points": ["Clarifies requirements and scale", "Explains data, API, and failure boundaries", "Addresses security, observability, and trade-offs"], "evaluation_rubric": "Strong answers are structured, scalable, and explicit about assumptions and trade-offs."},
        ]
        return InterviewKitResponse(candidate_name=name or "Candidate", job_title=title, questions=questions)

    async def enrich_job_description(self, raw_text: str, seniority: str | None = None) -> JobEnrichmentResponse:
        """Provide useful offline job enrichment using the shared taxonomy."""

        skills = [skill for skill in self.SKILL_KEYWORDS if self._contains_skill(raw_text, skill)]
        required = skills[: min(6, len(skills))]
        preferred = skills[min(6, len(skills)): min(10, len(skills))]
        level = (seniority or "").strip()
        years = {"junior": 1.0, "mid": 3.0, "mid-level": 3.0, "senior": 5.0, "lead": 7.0, "principal": 8.0}.get(level.casefold(), 3.0)
        title = next((line.strip() for line in raw_text.splitlines() if line.strip()), "Software Engineer")[:200]
        title = re.sub(r"^(job\s*(description|title)\s*[:\-]\s*)", "", title, flags=re.I) or "Software Engineer"
        description = raw_text.strip()
        if len(description) < 80:
            description = f"We are looking for a {title} to build reliable, high-quality products. {description}"
        return JobEnrichmentResponse(title=title, polished_description=description, required_skills=required, nice_to_have_skills=preferred, recommended_min_experience=years, suggested_salary_range="$120,000 - $160,000")

    async def compare_candidates(self, candidates_data: list[dict], job_data: dict) -> CompareCandidatesResponse:
        """Create a deterministic comparison suitable for offline demos."""

        required = {skill.casefold() for skill in job_data.get("required_skills", [])}
        comparisons = []
        for data in candidates_data:
            skills = list(data.get("skills", [])); skill_set = {skill.casefold() for skill in skills}
            score = len(skill_set & required) / len(required) * 100 if required else 100.0
            strengths = [skill for skill in skills if skill.casefold() in required][:4]
            gaps = [skill for skill in job_data.get("required_skills", []) if skill.casefold() not in skill_set]
            comparisons.append(CandidateComparisonItem(candidate_id=data["id"], candidate_name=f"{data.get('first_name', '')} {data.get('last_name', '')}".strip(), fit_score=round(score, 2), key_strengths=strengths or ["Relevant professional background"], potential_gaps=gaps[:4], verdict="Strong shortlist" if score >= 70 else "Review skill gaps"))
        comparisons.sort(key=lambda item: item.fit_score, reverse=True)
        recommended = comparisons[0].candidate_id if comparisons else None
        return CompareCandidatesResponse(job_title=job_data.get("title", "Role"), comparisons=comparisons, executive_summary=f"{comparisons[0].candidate_name} is the strongest skills-based match for {job_data.get('title', 'this role')}. Review the listed gaps during interviews." if comparisons else "No candidates were supplied.", recommended_candidate_id=recommended)

    async def generate_outreach_email(self, candidate: dict, job: dict | None, tone: str, company: str) -> OutreachEmailResponse:
        """Draft personalized offline outreach."""

        name = f"{candidate.get('first_name', '')} {candidate.get('last_name', '')}".strip() or "there"
        title = job.get("title", "an exciting opportunity") if job else "an opportunity"
        skills = list(candidate.get("skills", []))[:3]
        greeting = "Hi" if tone == "FRIENDLY" else "Hello"
        body = f"{greeting} {name},\n\nI came across your background in {', '.join(skills) or 'your field'} and thought you could be a strong fit for {title} at {company}. Your experience stood out to our team, and I would welcome a brief conversation to share more about the opportunity and learn what you are looking for next.\n\nBest,\nTalent Team"
        return OutreachEmailResponse(subject_line=f"Exploring {title} at {company}", email_body=body, key_highlights=skills or ["Relevant experience"])

    @classmethod
    def _contains_skill(cls, text: str, skill: str) -> bool:
        escaped = re.escape(skill).replace(r"\ ", r"\s+")
        return re.search(rf"(?<![\w+#.]){escaped}(?![\w+#.])", text, re.I) is not None

    @staticmethod
    def _extract_name(text: str, email_match: re.Match[str] | None) -> tuple[str, str]:
        first_line = next((line.strip() for line in text.splitlines() if line.strip()), "")
        if email_match and first_line.lower().find(email_match.group(0).lower()) >= 0:
            first_line = first_line.replace(email_match.group(0), "").strip(" |,-")
        words = re.findall(r"[A-Za-z][A-Za-z'-]*", first_line)
        if len(words) >= 2 and len(words) <= 4:
            return words[0], words[1]
        return "", ""

    @staticmethod
    def _extract_headline(text: str) -> str | None:
        lines = [line.strip() for line in text.splitlines() if line.strip()]
        return lines[1][:255] if len(lines) > 1 and "@" not in lines[1] else None

    @staticmethod
    def _normalise_phone(phone: str) -> str:
        return re.sub(r"\s+", " ", phone).strip()
