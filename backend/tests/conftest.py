import os
import tempfile

# Must run before app modules read settings: force offline, deterministic behaviour.
os.environ.update(
    MOCK_LLM="true",
    ANTHROPIC_API_KEY="",
    SARVAM_API_KEY="",
    CHROMA_DIR=tempfile.mkdtemp(prefix="mitra-test-chroma-"),
)
