"""Redact identifiers before user text reaches the LLM, logs or the checkpointer (plan section 6)."""

import re

# Order matters: 12-digit Aadhaar before 10-digit phone numbers.
_PATTERNS: list[tuple[str, re.Pattern[str]]] = [
    ("[AADHAAR]", re.compile(r"(?<!\d)\d{4}[\s-]?\d{4}[\s-]?\d{4}(?!\d)")),
    ("[PAN]", re.compile(r"\b[A-Z]{5}\d{4}[A-Z]\b", re.IGNORECASE)),
    ("[PASSPORT_NO]", re.compile(r"\b[A-Z]\d{7}\b", re.IGNORECASE)),
    ("[PHONE]", re.compile(r"(?<!\d)(?:\+?91[\s-]?|0)?[6-9]\d{4}[\s-]?\d{5}(?!\d)")),
    ("[EMAIL]", re.compile(r"\b[\w.+-]+@[\w-]+\.[\w.-]+\b")),
]


def scrub(text: str) -> str:
    for token, pattern in _PATTERNS:
        text = pattern.sub(token, text)
    return text
