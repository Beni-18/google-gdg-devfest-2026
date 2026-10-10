"""verify (main model): check each community remedy against official rules; flag conflicts."""

from app.agent.state import CaseState


async def verify(state: CaseState) -> CaseState:
    # TODO(agent): for each remedy in case_hits, compare to rule_hits and set conflicts_with_official;
    # cluster contradicting remedies; feed agreement into confidence. Output schemas-style Remedy dicts.
    return {"remedies": []}
