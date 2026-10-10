"""Rebuild the Chroma index from data/rules/*.md and data/cases/*.json.

Idempotent: drops and recreates both collections. Fails loudly on any record missing
url, date or reliability. Run: `make ingest`.
"""

import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app import rag  # noqa: E402
from app.corpus import Chunk, CorpusError, load_case_chunks, load_rule_chunks  # noqa: E402


def rebuild(name: str, chunks: list[Chunk]) -> None:
    try:
        rag.client().delete_collection(name)
    except Exception:
        pass  # first run: nothing to delete
    col = rag.collection(name)
    if chunks:
        col.add(
            ids=[c.id for c in chunks],
            documents=[c.text for c in chunks],
            metadatas=[c.metadata for c in chunks],
            embeddings=rag.embed_passages([c.text for c in chunks]),
        )
    print(f"  {name:<16} {col.count():>4} chunks")


def main() -> int:
    try:
        rules, cases = load_rule_chunks(), load_case_chunks()
    except CorpusError as exc:
        print(f"INGEST FAILED\n{exc}", file=sys.stderr)
        return 1
    started = time.perf_counter()
    print("Embedding (first run downloads the model, ~500 MB)...")
    rebuild(rag.RULES, rules)
    rebuild(rag.CASES, cases)
    print(f"Done in {time.perf_counter() - started:.1f}s -> {rag.client().get_settings().persist_directory}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
