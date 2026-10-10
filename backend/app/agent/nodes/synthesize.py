"""synthesize (main model): fill the Answer schema using only retrieved material, with citations."""

from xml.sax.saxutils import escape, quoteattr

from app import llm
from app.agent.prompts import SYNTHESIZE_SYSTEM
from app.agent.state import CaseState
from app.config import get_settings
from app.corpus import load_json
from app.schemas import Answer, RecommendedPath


async def synthesize(state: CaseState) -> CaseState:
    if get_settings().llm_is_mock:
        return {"answer": Answer.model_validate(load_json("fixtures/mock_answer.json")).model_dump()}

    user = (
        f"<context>\n{_format_context(state)}\n</context>\n\n"
        f"<triage>{state['triage']}</triage>\n\n"
        f"<problem>\n{state['raw_text']}\n</problem>"
    )
    if state.get("guard_issues"):
        user += "\n\nYour previous answer failed these checks; fix them:\n- " + "\n- ".join(state["guard_issues"])
    try:
        answer = await llm.structured(Answer, system=SYNTHESIZE_SYSTEM, user=user, tier="main")
    except llm.LLMRefusal:
        answer = abstain("This request can't be answered here. Please contact the Passport Office directly.")
    return {"answer": answer.model_dump()}


def _format_context(state: CaseState) -> str:
    hits = state.get("rule_hits", []) + state.get("case_hits", []) + state.get("web_hits", [])
    if not hits:
        return "(no sources found)"
    blocks = []
    for h in hits:
        m = h["metadata"]
        attrs = " ".join(
            f"{k}={quoteattr(str(v))}"
            for k, v in [
                ("id", h["id"]),
                ("title", m.get("title", "")),
                ("url", m.get("url", "")),
                ("source_type", m.get("source_type", "")),
                ("date", m.get("date", "")),
                ("reliability", m.get("reliability", "")),
            ]
        )
        blocks.append(f"<source {attrs}>\n{escape(h['text'])}\n</source>")
    return "\n".join(blocks)


def abstain(reason: str) -> Answer:
    return Answer(
        diagnosis=reason,
        likely_causes=[],
        recommended_path=RecommendedPath(
            name="Contact the Passport Office",
            steps=["Raise a grievance on passportindia.gov.in or visit your Regional Passport Office."],
            documents_needed=[],
            where="RPO grievance",
        ),
        alternatives=[],
        conflicts=[],
        similar_cases=[],
        citations=[],
        confidence="low",
        unknowns=[],
        escalation=["Passport Seva grievance", "CPGRAMS (pgportal.gov.in)"],
    )
