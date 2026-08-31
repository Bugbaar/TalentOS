"""Abstract interface for resume parsing and candidate matching AI providers."""

from abc import ABC, abstractmethod

from app.schemas.ai import (CompareCandidatesResponse, InterviewKitResponse,
                            JobEnrichmentResponse, OutreachEmailResponse,
                            ParsedResumeSchema)


class BaseAIProvider(ABC):
    """Contract implemented by every AI backend used by TalentOS."""

    @abstractmethod
    async def parse_resume(self, text: str) -> ParsedResumeSchema:
        """Extract structured candidate information from resume text."""

    @abstractmethod
    async def get_embedding(self, text: str) -> list[float]:
        """Return a dense embedding for the supplied text."""

    @abstractmethod
    async def generate_critique(
        self,
        candidate_skills: list[str],
        candidate_exp: float,
        job_req_skills: list[str],
        job_min_exp: float,
        job_title: str,
    ) -> str:
        """Generate a concise candidate-to-job fit critique."""

    @abstractmethod
    async def generate_interview_kit(self, candidate_data: dict, job_data: dict) -> InterviewKitResponse:
        """Generate structured interview questions and evaluation rubrics."""

    @abstractmethod
    async def enrich_job_description(self, raw_text: str, seniority: str | None = None) -> JobEnrichmentResponse:
        """Polish a job draft and extract a normalized skill taxonomy."""

    @abstractmethod
    async def compare_candidates(self, candidates_data: list[dict], job_data: dict) -> CompareCandidatesResponse:
        """Compare multiple candidates for one job."""

    @abstractmethod
    async def generate_outreach_email(self, candidate: dict, job: dict | None, tone: str, company: str) -> OutreachEmailResponse:
        """Draft personalized recruiter outreach."""
