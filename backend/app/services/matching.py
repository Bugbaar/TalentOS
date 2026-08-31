"""Explainable candidate-to-job matching engine.

Recruiters should never see a black-box number. Every score is a weighted
blend of skill coverage, experience, education, and seniority, returned with
matched skills, gaps, and a recommendation band.

Weights are documented so product and legal teams can audit fairness.
"""

from __future__ import annotations

from dataclasses import dataclass

from app.ai.skills import normalize_skill_list

WEIGHTS = {
    "required_skills": 0.45,
    "optional_skills": 0.15,
    "experience": 0.20,
    "education": 0.10,
    "seniority": 0.10,
}

SENIORITY_RANK = {
    "intern": 0,
    "junior": 1,
    "mid": 2,
    "senior": 3,
    "lead": 4,
    "staff": 4,
    "principal": 5,
}

EDUCATION_RANK = {
    "Unknown": 0,
    "Diploma": 1,
    "Bachelors": 2,
    "Masters": 3,
    "PhD": 4,
}


@dataclass
class MatchResult:
    score: int
    band: str
    required_coverage: float
    optional_coverage: float
    experience_score: float
    education_score: float
    seniority_score: float
    matched_required: list[str]
    missing_required: list[str]
    matched_optional: list[str]
    extra_skills: list[str]
    reasons: list[str]


def _clamp(value: float, lo: float = 0.0, hi: float = 1.0) -> float:
    return max(lo, min(hi, value))


def _band(score: int) -> str:
    if score >= 80:
        return "strong_match"
    if score >= 60:
        return "good_fit"
    if score >= 40:
        return "partial"
    return "weak"


def _experience_score(candidate_years: float, min_years: float) -> float:
    if min_years <= 0:
        return 1.0
    ratio = candidate_years / min_years
    if ratio >= 1:
        # Diminishing bonus above requirement; never penalize over-experience hard.
        return _clamp(1.0 + min((ratio - 1) * 0.05, 0.1), 0, 1)
    return _clamp(ratio)


def _education_score(candidate_rank: int, required_rank: int) -> float:
    if required_rank <= 0:
        return 1.0
    if candidate_rank >= required_rank:
        return 1.0
    if candidate_rank == 0:
        return 0.35
    return _clamp(candidate_rank / required_rank)


def _seniority_score(candidate: str, required: str) -> float:
    got = SENIORITY_RANK.get((candidate or "mid").lower(), 2)
    need = SENIORITY_RANK.get((required or "mid").lower(), 2)
    if got >= need:
        return 1.0
    delta = need - got
    return _clamp(1.0 - 0.25 * delta)


def match_candidate_to_job(
    *,
    candidate_skills: list[str] | None,
    candidate_years: float,
    candidate_education: str,
    candidate_seniority: str,
    required_skills: list[str] | None,
    optional_skills: list[str] | None,
    min_years: float,
    required_education: str,
    job_seniority: str,
) -> MatchResult:
    cand = set(normalize_skill_list(candidate_skills))
    required = normalize_skill_list(required_skills)
    optional = normalize_skill_list(optional_skills)

    matched_required = [s for s in required if s in cand]
    missing_required = [s for s in required if s not in cand]
    matched_optional = [s for s in optional if s in cand]
    extra = sorted(cand - set(required) - set(optional))

    required_coverage = 1.0 if not required else len(matched_required) / len(required)
    optional_coverage = 1.0 if not optional else len(matched_optional) / len(optional)
    exp_score = _experience_score(float(candidate_years or 0), float(min_years or 0))
    edu_score = _education_score(
        EDUCATION_RANK.get(candidate_education, 0),
        EDUCATION_RANK.get(required_education, 0),
    )
    sen_score = _seniority_score(candidate_seniority, job_seniority)

    raw = (
        WEIGHTS["required_skills"] * required_coverage
        + WEIGHTS["optional_skills"] * optional_coverage
        + WEIGHTS["experience"] * exp_score
        + WEIGHTS["education"] * edu_score
        + WEIGHTS["seniority"] * sen_score
    )
    score = int(round(_clamp(raw) * 100))

    reasons: list[str] = []
    if missing_required:
        reasons.append("Missing required skills: " + ", ".join(missing_required))
    else:
        reasons.append("All required skills are present.")
    if matched_optional:
        reasons.append("Bonus skills: " + ", ".join(matched_optional))
    if float(candidate_years or 0) < float(min_years or 0):
        reasons.append(
            f"Experience below target ({candidate_years:g}y vs {min_years:g}y required)."
        )
    elif min_years:
        reasons.append(f"Experience meets target ({candidate_years:g}y).")
    if extra[:6]:
        reasons.append("Additional relevant skills: " + ", ".join(extra[:6]))

    return MatchResult(
        score=score,
        band=_band(score),
        required_coverage=round(required_coverage, 3),
        optional_coverage=round(optional_coverage, 3),
        experience_score=round(exp_score, 3),
        education_score=round(edu_score, 3),
        seniority_score=round(sen_score, 3),
        matched_required=matched_required,
        missing_required=missing_required,
        matched_optional=matched_optional,
        extra_skills=extra,
        reasons=reasons,
    )


def to_breakdown(result: MatchResult) -> dict:
    return {
        "score": result.score,
        "band": result.band,
        "weights": WEIGHTS,
        "required_coverage": result.required_coverage,
        "optional_coverage": result.optional_coverage,
        "experience_score": result.experience_score,
        "education_score": result.education_score,
        "seniority_score": result.seniority_score,
        "matched_required": result.matched_required,
        "missing_required": result.missing_required,
        "matched_optional": result.matched_optional,
        "extra_skills": result.extra_skills,
        "reasons": result.reasons,
    }
