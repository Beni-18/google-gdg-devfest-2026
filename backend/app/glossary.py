"""Locked translations for official terms (plan section 3.6). Feeds the localize node's prompt."""

from functools import lru_cache

from app.corpus import load_json


@lru_cache
def load_glossary() -> dict[str, dict]:
    data = load_json("glossary.json")
    assert isinstance(data, dict)
    return {k: v for k, v in data.items() if not k.startswith("_")}


def glossary_prompt_block(lang: str) -> str:
    """Bullet list the localize prompt can paste in: how each official term must appear in `lang`."""
    lines = []
    for term, entry in load_glossary().items():
        if entry.get("keep_english") or lang not in entry:
            lines.append(f"- {term}: keep in English" + (f" ({entry['abbr']})" if entry.get("abbr") else ""))
        else:
            lines.append(f"- {term}: {entry[lang]}")
    return "\n".join(lines)
