# Passport Mitra

**Check before you book. Fix it when you're stuck.**

Passport and visa paperwork help for India. Voice-first, regional-language, privacy-first. Built for GDG DevFest 2026.

- **Document Cart (M1):** photograph your documents, read them on the phone (nothing is uploaded), catch name/DOB/address mismatches before you book.
- **Stuck-Case Solver (M2):** describe your problem in any supported language. A LangGraph agent finds the official rules and similar cases, flags where sources disagree, and answers with citations and a confidence level.
- **Status Decoder (M3), Voice (M4), Assisted Mode (M5)** for cyber cafés and CSC operators.

The full plan (problem, evidence, architecture, data, hour-by-hour build) is in [docs/implementation.md](docs/implementation.md). This README covers how to run and split the code.

---

## Quick start

Prerequisites: [uv](https://docs.astral.sh/uv/) (installs Python 3.12 for you) and Node 20.19+ (or 22.12+).

```bash
make setup
```

```bash
make ingest
```

```bash
make dev
```

| What | Where |
|---|---|
| Web app | http://localhost:5173 |
| API + interactive docs | http://localhost:8000/docs |

Port 8000 busy? Run `make dev API_PORT=8010` instead. `make ingest` downloads the embedding model (~500 MB) the first time. Run it again after any change in `backend/data/rules` or `backend/data/cases`. `make help` lists every command.

**No keys needed to start.** Without `ANTHROPIC_API_KEY` the agent returns a sample answer, and the UI shows a "Demo mode" banner. Without `SARVAM_API_KEY` the speech endpoints return 503 and the app uses the browser's own speech. Add keys to `.env` when you have them.

Before you push, run:

```bash
make check
```

CI runs the same checks on every PR.

---

## Repository layout

```
├─ docs/implementation.md        The plan. Section numbers below refer to it.
├─ backend/                      Python 3.12, FastAPI, LangGraph (uv project)
│  ├─ app/
│  │  ├─ main.py                 FastAPI app; mounts routers under /api
│  │  ├─ schemas.py              ★ API contract (mirrored in frontend/src/lib/types.ts)
│  │  ├─ config.py               Settings from .env
│  │  ├─ llm.py                  The only place that calls Claude: structured(Schema, ...)
│  │  ├─ rag.py                  Chroma + multilingual-e5 embeddings
│  │  ├─ corpus.py               Loads and validates rules/*.md and cases/*.json
│  │  ├─ pii.py                  Redacts Aadhaar/PAN/passport/phone/email from user text
│  │  ├─ speech.py               Sarvam STT, TTS, translate
│  │  ├─ glossary.py, status.py  Locked translations; status decoder
│  │  ├─ agent/
│  │  │  ├─ graph.py             LangGraph wiring and routing rules
│  │  │  ├─ state.py             CaseState
│  │  │  ├─ prompts.py           System prompts
│  │  │  └─ nodes/               One file per node: intake, triage, clarify, retrieve, ...
│  │  └─ routers/                health, case (SSE), speech, status
│  ├─ data/
│  │  ├─ rules/*.md              Official rules (YAML front matter + text). See _TEMPLATE.md
│  │  ├─ cases/*.json            Case cards. See _TEMPLATE.json
│  │  ├─ glossary.json, status_map.json, eval_cases.json
│  │  ├─ reference/              Sourced figures from the plan: PV backlog by state, national stats, e-Visa rules
│  │  └─ fixtures/mock_answer.json  What mock mode returns
│  ├─ scripts/ingest.py, query.py
│  └─ tests/
├─ frontend/                     Vite, React 19, TypeScript, Tailwind 4, i18next, PWA
│  └─ src/
│     ├─ lib/                    api.ts (typed client), types.ts ★, sse.ts, speech.ts, langs.ts
│     ├─ i18n/{en,hi,ta,mr,bn}.json
│     ├─ store/                  App state (zustand) and the assisted-mode reset registry
│     ├─ components/             Layout, BigButton, MicButton, ListenButton, ConfidenceBadge
│     └─ features/
│        ├─ onboarding/          Language picker + spoken privacy promise + consent
│        ├─ home/
│        ├─ cart/                M1: ocr.ts, extract.ts, checks.ts, types.ts, store.ts, CartPage
│        ├─ stuck/               M2: StuckPage (chat), AnswerCard
│        ├─ status/              M3
│        └─ assisted/            M5
├─ .env.example                  Every setting, with defaults
├─ Makefile                      setup, dev, ingest, query, test, lint, check
└─ .github/workflows/ci.yml
```

---

## How it fits together

```mermaid
flowchart LR
  subgraph Phone["Browser (PWA)"]
    UI[React + i18n] --- CART[Tesseract OCR + checks<br/>documents never leave the device]
  end
  UI -- "text, consent" --> CASE["/api/case (SSE)"]
  UI -- audio --> STT["/api/stt"]
  UI -- text --> TTS["/api/tts"]
  CASE --> G[LangGraph agent] --> CH[(Chroma: rules + cases)]
  G --> C[Claude]
  STT & TTS --> S[Sarvam]
```

**Agent graph** (`backend/app/agent/graph.py`, plan 3.4, both retrievers in one node):

```
intake → triage ─┬─ clarify (asks ONE question, pauses) → triage   max 2 rounds
                 └─ retrieve ─┬─ live_search (low confidence + enabled) ─┐
                              └──────────────────────────────────────────┴─ verify → synthesize
→ action_draft → guardrail ─┬─ synthesize (one regenerate)
                            └─ localize → END
```

### API contract

`backend/app/schemas.py` is the source of truth and `frontend/src/lib/types.ts` mirrors it. **If you change one, change the other in the same PR.**

| Endpoint | Body | Returns |
|---|---|---|
| `GET /api/health` | | `{ok, llm: "live"\|"mock", sarvam, index_ready}` |
| `POST /api/case` | `{thread_id?, lang, text, cart_issues?, consent, search_enabled?}` | SSE stream (below) |
| `POST /api/case/resume` | `{thread_id, text}` | SSE stream; 404 if nothing is pending |
| `POST /api/stt` | multipart `audio`, `lang_hint?` | `{text, lang}`; 503 means use the browser |
| `POST /api/tts` | `{text, lang}` | `audio/wav`; 503 means use the browser |
| `POST /api/translate` | `{text, target_lang}` | `{text}`; 503 if Sarvam is off |
| `POST /api/status/decode` | `{text}` | `{matched, meaning, next_step, source}` |

SSE events: `progress {node}` once per finished node, then exactly one of `clarify {thread_id, question}`, `result CaseResult` or `error {code, message}`. `lang` is one of `en hi ta mr bn`.

---

## Workstreams (team of four)

The code is split so each lane mostly touches its own folders. Search for the lane's tag (for example `TODO(cart)`) to find every stub.

| Lane | Owns | Tag | First "done when" (plan 7.2) |
|---|---|---|---|
| **1. Agent** | `backend/app/agent/`, `llm.py`, `rag.py` scoring | `TODO(agent)` | A typed problem returns a cited answer with a real confidence score |
| **2. Document Cart** | `frontend/src/features/cart/` | `TODO(cart)` | OCR → extract → confirm/edit → checks → "Not ready / Almost / Ready" card with "Fix with Mitra" |
| **3. Frontend & UX** | `frontend/src/{components,features/stuck,status,assisted,home,onboarding}` | `TODO(frontend)` | Journeys A and B work end to end; status timeline; printable assisted summary |
| **4. Data, voice & eval** | `backend/data/`, `speech.py`, `glossary.py`, `localize` node, `i18n/*.json` | `TODO(voice)` | 6–8 rule files + 15 case cards ingested, glossary reviewed, hi/ta strings translated, eval run |

Contract changes (`schemas.py` ↔ `types.ts`) need a heads-up to the whole team.

### What already works and what's stubbed

| Area | Working now | Stubbed (owner) |
|---|---|---|
| API | All endpoints, SSE streaming, consent check, PII scrub, input caps, CORS | Rate limiting (agent) |
| Agent | Graph wiring, clarify interrupt + resume, mock mode. Triage (Haiku) and synthesize (Sonnet) are wired with structured output; request building is verified, but they have not run with a real key yet | First live run with a key, verify, action_draft, guardrail checks, localize, live_search, real confidence (agent, voice) |
| Retrieval | Ingest with validation, multilingual embeddings, Chroma search, `make query` | Re-weighting, filters, dedupe (agent) |
| Speech | Sarvam STT/TTS/translate wrappers, browser fallbacks, mic and listen buttons | Live Sarvam test with a key (voice) |
| Cart | Photo → on-device OCR (lazy language data) → Aadhaar masked → raw text | Preprocessing, classify, extract, confirm/edit screen, checks, result card (cart) |
| UI | Language + consent, home, chat with progress and clarify, answer card, status decoder, assisted counter + clear-all, PWA | Translations, journey timeline, PV chip, share as image (frontend, voice) |
| Data | 1 rule file (e-Visa), 1 case card, glossary seed, 2 status patterns, 2 unsafe eval prompts, all reference figures | The data sprint (voice) |

---

## Rules we don't break

From the plan (sections 6 and 7.3). Never cut these:

1. **The confirm/edit screen** before any document check runs.
2. **Citations, the confidence badge and the disclaimer** on every answer.
3. **Aadhaar masking.** Mask on extraction (`maskAadhaar` in `cart/extract.ts`), keep only the last 4 digits.
4. **Documents stay on the device.** Only user text (scrubbed by `pii.scrub`) and mismatch *types* go to the server.
5. **No user text or document values in logs.** Log node names, latency and error types only.
6. **Never promise outcomes.** "Commonly causes problems", never "will be rejected". Drafts are templates with `[____]` blanks.

---

## Corrections to the plan found during setup

- **Claude model IDs:** `claude-haiku-5-5` does not exist. The fast model is `claude-haiku-4-5`. Main stays `claude-sonnet-5-5`. Both are set in `.env`.
- **Sarvam TTS voice:** `meera` is not a Bulbul voice in the current SDK. We use Sarvam's default voice unless you set `SARVAM_TTS_SPEAKER`.
- **Sarvam TTS languages** (open item in plan 11): Bengali, English, Gujarati, Hindi, Kannada, Malayalam, Marathi, Odia, Punjabi, Tamil and Telugu. That covers all five of our languages.
- **Retrieval confidence:** multilingual-e5 similarity scores bunch up high. Unrelated chunks still score about 0.77, so the plan's 0.5 "low confidence" threshold will never trigger. Calibrate `LOW_CONFIDENCE` in `graph.py` using `make query`.
- **PV backlog table** (plan 4.2) was checked: the 36 state rows add up exactly to the stated 277,929.

---

## Deploying

- **Backend:** `backend/Dockerfile` (Cloud Run, Render or Railway). It bakes the model and index into the image. Set the same env vars as `.env`, and add the frontend's URL to `ALLOWED_ORIGINS`. *Not yet test-built.*
- **Frontend:** `npm run build` in `frontend/` → static `dist/`. Set `VITE_API_BASE` to the backend URL at build time. `vercel.json` handles SPA routes on Vercel.
- **Demo fallback:** `MOCK_LLM=true` serves the sample answer with no network calls to Claude.
