"""localize: hand the English answer to translation.localize_answer; fall back to English on any failure."""

import logging

from app import translation
from app.agent.state import CaseState
from app.schemas import Answer

log = logging.getLogger("mitra.localize")


async def localize(state: CaseState) -> CaseState:
    if state["lang"] == "en":
        return {"answer_local": None, "localized": False}
    try:
        local = await translation.localize_answer(Answer.model_validate(state["answer"]), state["lang"])
    except translation.LocalizationUnavailable:
        return {"answer_local": None, "localized": False}
    except Exception as exc:  # the client shows English plus a note (plan 3.4)
        log.warning("localization failed: %s", type(exc).__name__)
        return {"answer_local": None, "localized": False}
    return {"answer_local": local.model_dump(), "localized": True}
