from fastapi import APIRouter

from app import status
from app.schemas import StatusDecodeRequest, StatusDecodeResponse

router = APIRouter(tags=["status"])


@router.post("/status/decode", response_model=StatusDecodeResponse)
def decode(req: StatusDecodeRequest) -> StatusDecodeResponse:
    return status.decode(req.text)
