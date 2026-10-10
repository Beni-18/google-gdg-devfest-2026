"""M4 endpoints. 503 means "use the browser fallback" (plan section 3.6 fallback chain)."""

from typing import Annotated

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import Response

from app import speech
from app.config import get_settings
from app.schemas import Lang, SttResponse, TranslateRequest, TranslateResponse, TtsRequest

router = APIRouter(tags=["speech"])


@router.post("/stt", response_model=SttResponse)
async def stt(
    audio: Annotated[UploadFile, File(description="webm/ogg/wav/mp3 recording")],
    lang_hint: Annotated[Lang | None, Form()] = None,
) -> SttResponse:
    data = await audio.read()
    if len(data) > get_settings().max_audio_bytes:
        raise HTTPException(status_code=413, detail="audio_too_long")
    try:
        text, lang = await speech.speech_to_text(
            data, audio.filename or "audio.webm", audio.content_type or "audio/webm", lang_hint
        )
    except speech.SpeechUnavailable as exc:
        raise HTTPException(status_code=503, detail="stt_unavailable") from exc
    return SttResponse(text=text, lang=lang)


@router.post("/tts", response_class=Response, responses={200: {"content": {"audio/wav": {}}}})
async def tts(req: TtsRequest) -> Response:
    try:
        audio = await speech.text_to_speech(req.text, req.lang)
    except speech.SpeechUnavailable as exc:
        raise HTTPException(status_code=503, detail="tts_unavailable") from exc
    return Response(content=audio, media_type="audio/wav")


@router.post("/translate", response_model=TranslateResponse)
async def translate(req: TranslateRequest) -> TranslateResponse:
    try:
        return TranslateResponse(text=await speech.translate(req.text, req.target_lang))
    except speech.SpeechUnavailable as exc:
        raise HTTPException(status_code=503, detail="translate_unavailable") from exc
