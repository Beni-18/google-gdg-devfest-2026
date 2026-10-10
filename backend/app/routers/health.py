from fastapi import APIRouter

from app import rag
from app.config import get_settings
from app.schemas import HealthResponse

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    settings = get_settings()
    return HealthResponse(
        llm="mock" if settings.llm_is_mock else "live",
        sarvam=settings.sarvam_enabled,
        index_ready=rag.index_ready(),
    )
