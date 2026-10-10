"""Sarvam STT / TTS / translate (plan section 3.6).

Fallback chain lives in the frontend: when Sarvam is not configured or fails, these raise
SpeechUnavailable, the API returns 503, and the browser uses Web Speech / speechSynthesis.
Signatures were checked against sarvamai 0.1.36; not yet exercised against the live API.
"""

import base64
from functools import lru_cache

from sarvamai import AsyncSarvamAI

from app.config import get_settings
from app.schemas import Lang

SARVAM_CODE: dict[str, str] = {"en": "en-IN", "hi": "hi-IN", "ta": "ta-IN", "mr": "mr-IN", "bn": "bn-IN"}
_FROM_SARVAM = {v: k for k, v in SARVAM_CODE.items()}


class SpeechUnavailable(RuntimeError):
    pass


@lru_cache
def _client() -> AsyncSarvamAI:
    settings = get_settings()
    if not settings.sarvam_enabled:
        raise SpeechUnavailable("SARVAM_API_KEY not set")
    return AsyncSarvamAI(api_subscription_key=settings.sarvam_api_key)


async def text_to_speech(text: str, lang: Lang) -> bytes:
    """Returns WAV bytes."""
    settings = get_settings()
    extra = {"speaker": settings.sarvam_tts_speaker} if settings.sarvam_tts_speaker else {}
    try:
        resp = await _client().text_to_speech.convert(
            text=text,
            language_code=SARVAM_CODE[lang],
            model=settings.sarvam_tts_model,
            output_audio_codec="wav",
            enable_preprocessing=True,  # reads numbers and dates naturally
            **extra,
        )
    except SpeechUnavailable:
        raise
    except Exception as exc:
        raise SpeechUnavailable(f"Sarvam TTS failed: {type(exc).__name__}") from exc
    if not resp.audios:
        raise SpeechUnavailable("Sarvam TTS returned no audio")
    return base64.b64decode(resp.audios[0])


async def speech_to_text(
    audio: bytes, filename: str, content_type: str, lang_hint: Lang | None
) -> tuple[str, Lang | None]:
    settings = get_settings()
    try:
        resp = await _client().speech_to_text.transcribe(
            file=(filename, audio, content_type),
            model=settings.sarvam_stt_model,
            mode="transcribe",
            language_code=SARVAM_CODE[lang_hint] if lang_hint else "unknown",
        )
    except SpeechUnavailable:
        raise
    except Exception as exc:
        raise SpeechUnavailable(f"Sarvam STT failed: {type(exc).__name__}") from exc
    return resp.transcript, _FROM_SARVAM.get(resp.language_code or "")


async def translate(text: str, target: Lang) -> str:
    settings = get_settings()
    try:
        resp = await _client().text.translate(
            input=text,
            source_language_code="auto",
            target_language_code=SARVAM_CODE[target],
            model=settings.sarvam_translate_model,
        )
    except SpeechUnavailable:
        raise
    except Exception as exc:
        raise SpeechUnavailable(f"Sarvam translate failed: {type(exc).__name__}") from exc
    return resp.translated_text
