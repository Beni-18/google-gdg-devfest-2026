"""M3 status decoder: pattern match against data/status_map.json (plan section 3.5)."""

from functools import lru_cache

from app.corpus import load_json
from app.schemas import StatusDecodeResponse

NO_MATCH = StatusDecodeResponse(
    matched=False,
    meaning="We don't recognise this status message yet.",
    next_step="Use 'I'm stuck' and paste the status text, or check it on passportindia.gov.in.",
)


@lru_cache
def _status_map() -> list[dict]:
    data = load_json("status_map.json")
    assert isinstance(data, list)
    return data


def decode(text: str) -> StatusDecodeResponse:
    lowered = text.lower()
    for entry in _status_map():
        if entry["match"].lower() in lowered:
            return StatusDecodeResponse(
                matched=True, meaning=entry["meaning"], next_step=entry["next"], source=entry.get("source")
            )
    return NO_MATCH
