"""Runtime settings, read from the repo-root .env (see .env.example)."""

from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parent.parent
REPO_ROOT = BACKEND_DIR.parent
DATA_DIR = BACKEND_DIR / "data"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(REPO_ROOT / ".env", BACKEND_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Keys
    anthropic_api_key: str = ""
    sarvam_api_key: str = ""
    search_api_key: str = ""

    # Models (plan section 3.2: Sonnet for reasoning, Haiku for triage/extraction)
    claude_model_main: str = "claude-sonnet-5-5"
    claude_model_fast: str = "claude-haiku-4-5"

    # Force canned LLM answers even when a key is present (frontend dev, offline demo)
    mock_llm: bool = False

    # HTTP
    allowed_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    max_text_chars: int = 2000
    max_audio_bytes: int = 5_000_000  # roughly 60 s of compressed speech

    # Retrieval
    chroma_dir: Path = BACKEND_DIR / ".chroma"
    embedding_model: str = "intfloat/multilingual-e5-small"

    # Speech
    sarvam_tts_model: str = "bulbul:v3"
    sarvam_tts_speaker: str = ""  # empty = Sarvam default voice
    sarvam_stt_model: str = "saaras:v3"
    sarvam_translate_model: str = "sarvam-translate:v1"

    @property
    def llm_is_mock(self) -> bool:
        return self.mock_llm or not self.anthropic_api_key

    @property
    def sarvam_enabled(self) -> bool:
        return bool(self.sarvam_api_key)

    @property
    def origins(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
