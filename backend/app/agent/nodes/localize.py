"""localize: translate the English answer into the user's language using the locked glossary."""

from app.agent.state import CaseState


async def localize(state: CaseState) -> CaseState:
    if state["lang"] == "en":
        return {"answer_local": None, "localized": False}
    # TODO(voice): translate the text fields of `answer` (not ids, urls, dates, form/annexure names)
    # with glossary.glossary_prompt_block(lang) via the main model or speech.translate.
    # Until then the client receives English with localized=false.
    return {"answer_local": None, "localized": False}
