"""retrieve: official rules (k=6) and case library (k=8) in one node, no fan-out (plan 3.4)."""

import asyncio

from app import rag
from app.agent.state import CaseState


def _search(query: str) -> tuple[list[rag.Hit], list[rag.Hit]]:
    return rag.search(rag.RULES, query, k=6), rag.search(rag.CASES, query, k=8)


async def retrieve(state: CaseState) -> CaseState:
    if not rag.index_ready():
        return {"rule_hits": [], "case_hits": [], "retrieval_confidence": 0.0}

    query = state["triage"]["summary_en"]
    rule_hits, case_hits = await asyncio.to_thread(_search, query)
    # TODO(agent): also query with the original raw_text and merge; metadata filter by service/category;
    # re-weight by reliability and recency with an official boost; dedupe by url (plan 3.4 Retrieval design).
    # TODO(agent): real confidence = top similarity + agreement + reliability + recency.
    # e5 cosine scores cluster high (unrelated chunks still score ~0.77), so calibrate
    # graph.LOW_CONFIDENCE on real queries with scripts/query.py before trusting it.
    top = max((h["score"] for h in rule_hits + case_hits), default=0.0)
    return {"rule_hits": list(rule_hits), "case_hits": list(case_hits), "retrieval_confidence": top}
