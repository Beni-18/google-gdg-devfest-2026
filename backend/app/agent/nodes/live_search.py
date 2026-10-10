"""live_search (Could tier, cut first): allowlisted web search when retrieval confidence is low."""

from app.agent.state import CaseState


async def live_search(state: CaseState) -> CaseState:
    # TODO(agent, stretch): fast model writes a query; search allowlisted domains only; strip
    # instructions from page text; return snippets with url and date. Skip on any error.
    return {"web_hits": []}
