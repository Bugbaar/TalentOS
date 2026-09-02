"""Structured logging configuration for TalentOS."""

import logging
import sys
from typing import Any

from app.core.config import settings


def configure_logging() -> None:
    """Configure structured logging for the application."""

    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
        stream=sys.stdout,
    )

    # Silence noisy third-party loggers
    for noisy_logger in ("sqlalchemy.engine", "httpx", "asyncio"):
        logging.getLogger(noisy_logger).setLevel(logging.WARNING)

    # Ensure the app logger is at INFO level
    logging.getLogger("app").setLevel(logging.INFO)


def log_request(
    method: str,
    path: str,
    status_code: int,
    duration_ms: float,
    request_id: str | None = None,
    **extra: Any,
) -> None:
    """Log an HTTP request with structured metadata."""

    logger = logging.getLogger("app.request")
    extra_str = " ".join(f"{key}={value}" for key, value in extra.items())
    logger.info(
        "%s %s -> %d in %.2fms%s%s",
        method,
        path,
        status_code,
        duration_ms,
        f" request_id={request_id}" if request_id else "",
        f" {extra_str}" if extra_str else "",
    )


configure_logging()