"""intake: normalise input. PII is scrubbed at the API gateway; scrubbing again here is idempotent."""

from app.agent.state import CaseState
from app.pii import scrub


async def intake(state: CaseState) -> CaseState:
    # TODO(agent): detect language from text when it differs from the UI language.
    return {
        "raw_text": scrub(state["raw_text"]),
        "cart_issues": state.get("cart_issues", []),
        "clarify_count": state.get("clarify_count", 0),
        "retries": 0,
    }
