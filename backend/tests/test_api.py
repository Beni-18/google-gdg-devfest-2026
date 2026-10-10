import json

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.schemas import CaseResult

client = TestClient(app)


def sse_events(response) -> list[tuple[str, dict]]:
    events, name = [], None
    for line in response.text.splitlines():
        if line.startswith("event:"):
            name = line.split(":", 1)[1].strip()
        elif line.startswith("data:"):
            events.append((name, json.loads(line.split(":", 1)[1].strip())))
    return events


def test_health_reports_mock_and_fallbacks():
    body = client.get("/api/health").json()
    assert body == {"ok": True, "llm": "mock", "sarvam": False, "index_ready": False}


def test_case_requires_consent():
    r = client.post("/api/case", json={"text": "my passport is stuck in police verification", "consent": False})
    assert r.status_code == 400


def test_case_streams_progress_then_result():
    r = client.post(
        "/api/case",
        json={"lang": "hi", "text": "Name on my Aadhaar differs from my Class 10 certificate", "consent": True},
    )
    events = sse_events(r)
    names = [n for n, _ in events]
    assert names[-1] == "result"
    assert [d["node"] for n, d in events if n == "progress"][:2] == ["intake", "triage"]
    result = CaseResult.model_validate(events[-1][1])
    assert result.lang == "hi" and result.answer.disclaimer and result.answer.citations


def test_short_message_asks_one_question_then_resumes():
    events = sse_events(client.post("/api/case", json={"text": "passport stuck", "consent": True}))
    name, clarify = events[-1]
    assert name == "clarify" and clarify["question"]

    resumed = sse_events(
        client.post("/api/case/resume", json={"thread_id": clarify["thread_id"], "text": "on hold since 6 weeks"})
    )
    assert resumed[-1][0] == "result"


def test_resume_unknown_thread_is_404():
    r = client.post("/api/case/resume", json={"thread_id": "nope", "text": "hello"})
    assert r.status_code == 404


@pytest.mark.parametrize(
    "path,body",
    [("/api/tts", {"text": "hello", "lang": "en"}), ("/api/translate", {"text": "hello", "target_lang": "hi"})],
)
def test_speech_without_sarvam_signals_browser_fallback(path, body):
    assert client.post(path, json=body).status_code == 503


def test_status_decoder():
    hit = client.post("/api/status/decode", json={"text": "Police Verification Initiated"}).json()
    miss = client.post("/api/status/decode", json={"text": "something unusual"}).json()
    assert hit["matched"] is True and miss["matched"] is False
