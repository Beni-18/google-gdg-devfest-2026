"""guardrail: last check before the answer leaves the server. One regenerate, then abstain."""

from app.agent.state import CaseState
from app.schemas import DISCLAIMER


async def guardrail(state: CaseState) -> CaseState:
    answer = {**state["answer"], "disclaimer": DISCLAIMER}  # the disclaimer is never optional
    issues: list[str] = []
    # TODO(agent): every citation id must exist in rule_hits/case_hits/web_hits; no outcome or
    # timeline guarantees; no instructions to forge or misrepresent. On failure append to `issues`.
    # On the second failure (retries >= 1), replace `answer` with a low-confidence abstention.
    ok = not issues
    return {
        "answer": answer,
        "guard_ok": ok,
        "guard_issues": issues,
        "retries": state.get("retries", 0) + (0 if ok else 1),
    }
