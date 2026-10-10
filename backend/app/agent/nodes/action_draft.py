"""action_draft (main model): fill a letter or affidavit TEMPLATE. Unknown fields stay [____]."""

from app.agent.state import CaseState


async def action_draft(state: CaseState) -> CaseState:
    # TODO(agent): pick a template by triage.category (name affidavit, RPO representation, grievance);
    # fill only user-confirmed facts; never invent facts; return None when no template applies.
    return {"draft": None}
