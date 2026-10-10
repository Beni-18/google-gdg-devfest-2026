"""Answer localization (Lane D). The agent's localize node calls `localize_answer` and nothing else.

Translate only the user-facing text of an Answer into `lang`, using the locked glossary
(glossary.glossary_prompt_block). Never change citation ids, urls, dates, source titles,
form numbers or annexure names. Raise LocalizationUnavailable to fall back to English.
"""

from app.schemas import Answer, Lang


class LocalizationUnavailable(RuntimeError):
    pass


async def localize_answer(answer: Answer, lang: Lang) -> Answer:
    # TODO(voice): main-tier Claude via llm.structured(Answer, ...) with the glossary block,
    # or speech.translate per field. Native-speaker check the output before the demo.
    raise LocalizationUnavailable("localization not implemented yet")
