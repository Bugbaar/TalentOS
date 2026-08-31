"""Rule-based resume intelligence.

Hiring teams need *auditable* extraction: which skills were found, where
experience years came from, and which education level was inferred.
This parser is deterministic and offline. Embeddings can wrap it later
without changing the API contract.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field

from app.ai.skills import alias_phrases_longest_first

EMAIL_RE = re.compile(r"[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}", re.I)
PHONE_RE = re.compile(r"(?:\+?\d{1,3}[\s\-]?)?(?:\(?\d{2,4}\)?[\s\-]?)?\d{3,5}[\s\-]?\d{4}")
URL_RE = re.compile(r"https?://[^\s)]+|www\.[^\s)]+", re.I)
YEARS_RE = re.compile(r"(\d{1,2}(?:\.\d)?)\s*\+?\s*(?:years?|yrs?)\s+(?:of\s+)?(?:experience|exp)?", re.I)
RANGE_RE = re.compile(
    r"(20\d{2}|19\d{2})\s*[-–—]\s*(20\d{2}|19\d{2}|present|current|now)",
    re.I,
)

DEGREE_LEVELS: list[tuple[str, str, int]] = [
    ("phd", "PhD", 4),
    ("doctor of philosophy", "PhD", 4),
    ("m.tech", "Masters", 3),
    ("mtech", "Masters", 3),
    ("m.s.", "Masters", 3),
    ("ms ", "Masters", 3),
    ("m.sc", "Masters", 3),
    ("mba", "Masters", 3),
    ("master", "Masters", 3),
    ("b.tech", "Bachelors", 2),
    ("btech", "Bachelors", 2),
    ("b.e.", "Bachelors", 2),
    ("b.s.", "Bachelors", 2),
    ("b.sc", "Bachelors", 2),
    ("bachelor", "Bachelors", 2),
    ("undergraduate", "Bachelors", 2),
    ("diploma", "Diploma", 1),
]

SENIORITY_HINTS: list[tuple[str, str]] = [
    ("principal", "principal"),
    ("staff", "staff"),
    ("lead", "lead"),
    ("senior", "senior"),
    ("sr.", "senior"),
    ("mid-level", "mid"),
    ("mid level", "mid"),
    ("junior", "junior"),
    ("jr.", "junior"),
    ("intern", "intern"),
    ("entry", "junior"),
]


@dataclass
class ParsedResume:
    full_name: str | None = None
    email: str | None = None
    phone: str | None = None
    links: list[str] = field(default_factory=list)
    headline: str | None = None
    years_experience: float = 0.0
    education_level: str = "Unknown"
    education_rank: int = 0
    seniority: str = "mid"
    skills: list[str] = field(default_factory=list)
    summary: str = ""
    experience_spans: list[dict] = field(default_factory=list)


def _first_name_line(text: str) -> str | None:
    for raw in text.splitlines()[:8]:
        line = raw.strip()
        if not line or "@" in line or len(line) > 60:
            continue
        words = [w for w in re.split(r"\s+", line) if w]
        if 2 <= len(words) <= 4 and all(re.match(r"[A-Za-z][A-Za-z.\-']*$", w) for w in words):
            return " ".join(w.capitalize() for w in words)
    return None


def _extract_years(text: str) -> tuple[float, list[dict]]:
    explicit: list[float] = []
    for match in YEARS_RE.finditer(text):
        explicit.append(float(match.group(1)))

    spans: list[dict] = []
    from datetime import datetime, timezone

    now = datetime.now(timezone.utc).year
    computed = 0.0
    for match in RANGE_RE.finditer(text):
        start = int(match.group(1))
        end_raw = match.group(2).lower()
        end = now if end_raw in {"present", "current", "now"} else int(end_raw)
        if end < start or end - start > 40:
            continue
        years = float(end - start)
        computed += years
        spans.append({"start": start, "end": None if end_raw in {"present", "current", "now"} else end, "years": years})

    if explicit:
        return max(explicit), spans
    return round(computed, 1), spans


def _education(text: str) -> tuple[str, int]:
    lowered = text.lower()
    best = ("Unknown", 0)
    for needle, label, rank in DEGREE_LEVELS:
        if needle in lowered and rank > best[1]:
            best = (label, rank)
    return best


def _seniority(text: str) -> str:
    lowered = text.lower()
    for needle, level in SENIORITY_HINTS:
        if needle in lowered:
            return level
    return "mid"


def _skills(text: str) -> list[str]:
    lowered = text.lower()
    found: list[str] = []
    seen: set[str] = set()
    for alias, canonical in alias_phrases_longest_first():
        if canonical in seen:
            continue
        # Word-boundary-ish match so "go" does not hit "golang" twice, and "r" is careful.
        pattern = r"(?<![A-Za-z0-9+.#])" + re.escape(alias) + r"(?![A-Za-z0-9+.#])"
        if re.search(pattern, lowered):
            seen.add(canonical)
            found.append(canonical)
    return found


def parse_resume(text: str) -> ParsedResume:
    cleaned = (text or "").strip()
    if not cleaned:
        return ParsedResume()

    emails = EMAIL_RE.findall(cleaned)
    phones = [p.strip() for p in PHONE_RE.findall(cleaned) if len(re.sub(r"\D", "", p)) >= 10]
    links = list(dict.fromkeys(URL_RE.findall(cleaned)))
    years, spans = _extract_years(cleaned)
    education_level, education_rank = _education(cleaned)

    lines = [ln.strip() for ln in cleaned.splitlines() if ln.strip()]
    headline = None
    for line in lines[1:6]:
        if 8 <= len(line) <= 80 and "@" not in line and not line.lower().startswith("http"):
            headline = line
            break

    summary = " ".join(lines[:12])[:500]
    return ParsedResume(
        full_name=_first_name_line(cleaned),
        email=emails[0] if emails else None,
        phone=phones[0] if phones else None,
        links=links[:8],
        headline=headline,
        years_experience=years,
        education_level=education_level,
        education_rank=education_rank,
        seniority=_seniority(cleaned),
        skills=_skills(cleaned),
        summary=summary,
        experience_spans=spans,
    )
