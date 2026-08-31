"""AI provider selection."""

from app.core.config import settings
from app.services.ai_engine.base import BaseAIProvider
from app.services.ai_engine.mock_provider import MockAIProvider


def get_ai_provider() -> BaseAIProvider:
    """Return Groq (default free LLM) or Gemini when configured, otherwise use offline mock provider."""

    if settings.GROQ_API_KEY:
        from app.services.ai_engine.groq_provider import GroqAIProvider

        return GroqAIProvider()

    if settings.GEMINI_API_KEY:
        from app.services.ai_engine.gemini_provider import GeminiAIProvider

        return GeminiAIProvider()

    return MockAIProvider()
