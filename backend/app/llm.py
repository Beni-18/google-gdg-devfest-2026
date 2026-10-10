"""Single entry point for Claude calls. Nodes call `structured(...)`; nothing else imports anthropic."""

from functools import lru_cache
from typing import Literal

import anthropic
from pydantic import BaseModel

from app.config import get_settings

Tier = Literal["main", "fast"]

# Models whose safety classifiers can decline; for these we opt into server-side fallback,
# which re-runs a declined request on an Anthropic-chosen model inside the same call.
_SERVER_FALLBACK_MODELS = {"claude-sonnet-5-5", "claude-opus-5-5", "claude-opus-5", "claude-fable-5-1"}


class LLMRefusal(RuntimeError):
    """The model (and its fallback) declined. Callers should abstain, not retry."""


@lru_cache
def _client() -> anthropic.AsyncAnthropic:
    settings = get_settings()
    return anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key, timeout=60.0, max_retries=2)


def model_for(tier: Tier) -> str:
    settings = get_settings()
    return settings.claude_model_main if tier == "main" else settings.claude_model_fast


async def structured[T: BaseModel](
    schema: type[T],
    *,
    system: str,
    user: str,
    tier: Tier = "main",
    max_tokens: int = 16000,
) -> T:
    """One Claude call whose output is validated against `schema` (a Pydantic model)."""
    model = model_for(tier)
    kwargs = {
        "model": model,
        "max_tokens": max_tokens,
        "system": system,
        "messages": [{"role": "user", "content": user}],
        "output_format": schema,
    }
    if model in _SERVER_FALLBACK_MODELS:
        response = await _client().beta.messages.parse(
            **kwargs, betas=["server-side-fallback-2026-07-01"], fallbacks="default"
        )
    else:
        response = await _client().messages.parse(**kwargs)

    if response.stop_reason == "refusal":
        raise LLMRefusal(f"{model} declined the request")
    if response.stop_reason == "max_tokens":
        raise ValueError(f"{model} hit max_tokens={max_tokens}; output truncated")
    if response.parsed_output is None:
        raise ValueError(f"{model} returned no parseable {schema.__name__}")
    return response.parsed_output
