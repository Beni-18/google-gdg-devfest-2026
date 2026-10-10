# Backend image for Cloud Run / Render / Railway. Build from backend/: docker build -t mitra-api .
FROM python:3.12-slim

COPY --from=ghcr.io/astral-sh/uv:0.12 /uv /usr/local/bin/uv
ENV UV_COMPILE_BYTECODE=1 UV_LINK_MODE=copy HF_HOME=/app/.hf PYTHONUNBUFFERED=1
WORKDIR /app

COPY pyproject.toml uv.lock .python-version ./
RUN uv sync --frozen --no-dev

COPY app ./app
COPY data ./data
COPY scripts ./scripts
# Bake the embedding model and the Chroma index into the image: no cold-start download.
RUN uv run --no-sync python scripts/ingest.py

ENV PORT=8000
EXPOSE 8000
CMD ["sh", "-c", "uv run --no-sync uvicorn app.main:app --host 0.0.0.0 --port ${PORT}"]
