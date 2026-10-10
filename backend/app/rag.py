"""Chroma + multilingual embeddings. Two collections: official rules and the case library."""

from functools import lru_cache
from typing import TYPE_CHECKING, TypedDict

import chromadb

from app.config import get_settings

if TYPE_CHECKING:
    from sentence_transformers import SentenceTransformer

RULES = "official_rules"
CASES = "case_library"


class Hit(TypedDict):
    id: str
    text: str
    metadata: dict
    score: float  # cosine similarity, higher is better


@lru_cache
def _embedder() -> "SentenceTransformer":
    from sentence_transformers import SentenceTransformer  # heavy import: only when retrieval runs

    name = get_settings().embedding_model
    try:
        return SentenceTransformer(name, local_files_only=True)  # cached: no network, works offline at the demo
    except Exception:
        return SentenceTransformer(name)  # first run: download


def _prefix(kind: str) -> str:
    # e5 models expect "query: " / "passage: " prefixes; other models do not.
    return f"{kind}: " if "e5" in get_settings().embedding_model else ""


def embed_passages(texts: list[str]) -> list[list[float]]:
    vectors = _embedder().encode([_prefix("passage") + t for t in texts], normalize_embeddings=True)
    return vectors.tolist()


def embed_query(text: str) -> list[float]:
    return _embedder().encode(_prefix("query") + text, normalize_embeddings=True, show_progress_bar=False).tolist()


def warm_up() -> None:
    """Load the model before the first user query (cold load takes several seconds)."""
    if index_ready():
        embed_query("warm up")


@lru_cache
def client() -> chromadb.ClientAPI:
    return chromadb.PersistentClient(path=str(get_settings().chroma_dir))


def collection(name: str) -> chromadb.Collection:
    # Embeddings are always passed explicitly, so Chroma's default embedding function never runs.
    return client().get_or_create_collection(name, configuration={"hnsw": {"space": "cosine"}})


def index_ready() -> bool:
    if not get_settings().chroma_dir.exists():
        return False
    try:
        return all(collection(name).count() > 0 for name in (RULES, CASES))
    except Exception:
        return False


def search(name: str, query: str, k: int, where: dict | None = None) -> list[Hit]:
    col = collection(name)
    if col.count() == 0:
        return []
    res = col.query(
        query_embeddings=[embed_query(query)],
        n_results=min(k, col.count()),
        where=where,
        include=["documents", "metadatas", "distances"],
    )
    rows = zip(res["ids"][0], res["documents"][0], res["metadatas"][0], res["distances"][0], strict=True)
    return [Hit(id=i, text=doc, metadata=meta or {}, score=1.0 - dist) for i, doc, meta, dist in rows]
