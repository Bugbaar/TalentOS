"""Canonical skill taxonomy and alias map for resume/job matching.

Hiring systems fail when "JS" and "JavaScript" are treated as different skills.
This module is the source of truth for normalization so matching is explainable
and fair, without requiring a paid embedding API for the MVP.
"""

from __future__ import annotations

# Canonical skill -> aliases (lowercase). Canonical names are Title-cased for display.
SKILL_ALIASES: dict[str, tuple[str, ...]] = {
    "Python": ("python", "py"),
    "JavaScript": ("javascript", "js", "ecmascript"),
    "TypeScript": ("typescript", "ts"),
    "Java": ("java"),
    "Go": ("golang", "go"),
    "Rust": ("rust"),
    "C++": ("c++", "cpp", "cplusplus"),
    "C#": ("c#", "csharp", "c sharp"),
    "Ruby": ("ruby", "rb"),
    "PHP": ("php"),
    "Kotlin": ("kotlin"),
    "Swift": ("swift"),
    "Scala": ("scala"),
    "R": ("r language", "rlang"),
    "SQL": ("sql", "t-sql", "plsql", "pl/sql"),
    "React": ("react", "react.js", "reactjs"),
    "Next.js": ("next.js", "nextjs", "next"),
    "Vue": ("vue", "vue.js", "vuejs"),
    "Angular": ("angular", "angular.js", "angularjs"),
    "Node.js": ("node.js", "nodejs", "node"),
    "Express": ("express", "express.js", "expressjs"),
    "FastAPI": ("fastapi", "fast api"),
    "Django": ("django"),
    "Flask": ("flask"),
    "Spring": ("spring", "spring boot", "springboot"),
    "NestJS": ("nestjs", "nest.js"),
    "GraphQL": ("graphql"),
    "REST": ("rest", "rest api", "restful"),
    "gRPC": ("grpc"),
    "PostgreSQL": ("postgresql", "postgres", "psql"),
    "MySQL": ("mysql"),
    "MongoDB": ("mongodb", "mongo"),
    "Redis": ("redis"),
    "SQLite": ("sqlite"),
    "Elasticsearch": ("elasticsearch", "elastic search", "elk"),
    "Qdrant": ("qdrant"),
    "Pinecone": ("pinecone"),
    "Kafka": ("kafka", "apache kafka"),
    "RabbitMQ": ("rabbitmq"),
    "Docker": ("docker"),
    "Kubernetes": ("kubernetes", "k8s"),
    "AWS": ("aws", "amazon web services"),
    "GCP": ("gcp", "google cloud", "google cloud platform"),
    "Azure": ("azure", "microsoft azure"),
    "Terraform": ("terraform"),
    "CI/CD": ("ci/cd", "cicd", "github actions", "gitlab ci"),
    "Linux": ("linux", "unix"),
    "Git": ("git", "github", "gitlab"),
    "Nginx": ("nginx"),
    "Pandas": ("pandas"),
    "NumPy": ("numpy"),
    "PyTorch": ("pytorch", "torch"),
    "TensorFlow": ("tensorflow", "tf"),
    "scikit-learn": ("scikit-learn", "sklearn", "scikit learn"),
    "LangChain": ("langchain"),
    "OpenAI": ("openai", "gpt", "chatgpt"),
    "RAG": ("rag", "retrieval augmented generation"),
    "LLM": ("llm", "large language model", "large language models"),
    "Machine Learning": ("machine learning", "ml"),
    "Deep Learning": ("deep learning", "dl"),
    "NLP": ("nlp", "natural language processing"),
    "Data Science": ("data science"),
    "HTML": ("html", "html5"),
    "CSS": ("css", "css3"),
    "Tailwind CSS": ("tailwind", "tailwindcss", "tailwind css"),
    "Redux": ("redux", "redux toolkit"),
    "JWT": ("jwt", "json web token"),
    "OAuth": ("oauth", "oauth2", "oauth 2.0"),
    "System Design": ("system design"),
    "Microservices": ("microservices", "micro-services"),
    "Testing": ("pytest", "jest", "cypress", "unit testing", "testing"),
    "Figma": ("figma"),
    "Product Management": ("product management", "product manager"),
}

# Multi-word aliases must be matched before single tokens.
_COMPILED_LOOKUP: dict[str, str] | None = None


def _build_lookup() -> dict[str, str]:
    lookup: dict[str, str] = {}
    for canonical, aliases in SKILL_ALIASES.items():
        lookup[canonical.lower()] = canonical
        if isinstance(aliases, str):
            aliases = (aliases,)
        for alias in aliases:
            lookup[alias.lower()] = canonical
    return lookup


def skill_lookup() -> dict[str, str]:
    global _COMPILED_LOOKUP
    if _COMPILED_LOOKUP is None:
        _COMPILED_LOOKUP = _build_lookup()
    return _COMPILED_LOOKUP


def canonicalize_skill(raw: str) -> str | None:
    """Return canonical skill name or None if unknown."""
    key = " ".join(raw.strip().lower().split())
    if not key:
        return None
    return skill_lookup().get(key)


def normalize_skill_list(skills: list[str] | None) -> list[str]:
    """Deduplicate and canonicalize a free-form skill list."""
    seen: set[str] = set()
    result: list[str] = []
    for skill in skills or []:
        canonical = canonicalize_skill(skill) or skill.strip()
        if not canonical:
            continue
        key = canonical.lower()
        if key in seen:
            continue
        seen.add(key)
        result.append(canonical)
    return result


def alias_phrases_longest_first() -> list[tuple[str, str]]:
    """(alias, canonical) pairs sorted by alias length so 'next.js' wins over 'next'."""
    pairs = [(alias, canonical) for alias, canonical in skill_lookup().items()]
    pairs.sort(key=lambda item: len(item[0]), reverse=True)
    return pairs
