"""Sanity-check retrieval after ingest. Usage: uv run python scripts/query.py "name differs on aadhaar" """

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app import rag  # noqa: E402


def main() -> int:
    if len(sys.argv) < 2:
        print(__doc__)
        return 1
    query = " ".join(sys.argv[1:])
    for name, k in ((rag.RULES, 6), (rag.CASES, 8)):
        print(f"\n== {name}")
        for hit in rag.search(name, query, k):
            meta = hit["metadata"]
            source = f"[{meta.get('source_type')}, r={meta.get('reliability')}]"
            print(f"  {hit['score']:.3f}  {hit['id']:<28} {source}  {meta.get('title')}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
