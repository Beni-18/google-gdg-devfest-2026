// Typed client for the FastAPI backend. Dev: same-origin /api via the Vite proxy.
// Deployed: set VITE_API_BASE to the backend origin.
import type { Lang } from './langs'
import { readSse } from './sse'
import type {
  CaseRequest,
  CaseResult,
  ClarifyEvent,
  ErrorEvent,
  Health,
  ProgressEvent,
  ResumeRequest,
  StatusDecodeResponse,
  SttResponse,
} from './types'

const BASE = import.meta.env.VITE_API_BASE ?? ''

export class ApiError extends Error {
  readonly status: number
  readonly detail: string
  constructor(status: number, detail: string) {
    super(`API ${status}: ${detail}`)
    this.status = status
    this.detail = detail
  }
}

/** 503 from /stt, /tts or /translate means "Sarvam unavailable, use the browser fallback". */
export const isUnavailable = (e: unknown) => e instanceof ApiError && e.status === 503

async function request(path: string, init: RequestInit): Promise<Response> {
  const res = await fetch(BASE + path, init)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new ApiError(res.status, typeof body.detail === 'string' ? body.detail : res.statusText)
  }
  return res
}

const postJson = (path: string, body: unknown, init: RequestInit = {}) =>
  request(path, { ...init, method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })

export interface CaseHandlers {
  onProgress: (e: ProgressEvent) => void
  onClarify: (e: ClarifyEvent) => void
  onResult: (r: CaseResult) => void
  onError: (e: ErrorEvent) => void
}

async function streamCase(path: string, body: unknown, h: CaseHandlers, signal?: AbortSignal) {
  try {
    const res = await postJson(path, body, { signal })
    for await (const { event, data } of readSse(res)) {
      const payload = JSON.parse(data)
      if (event === 'progress') h.onProgress(payload)
      else if (event === 'clarify') h.onClarify(payload)
      else if (event === 'result') h.onResult(payload)
      else if (event === 'error') h.onError(payload)
    }
  } catch (e) {
    if (signal?.aborted) return
    h.onError({ code: e instanceof ApiError ? e.detail : 'network', message: String(e) })
  }
}

export const api = {
  health: async (): Promise<Health> => (await request('/api/health', {})).json(),

  startCase: (req: CaseRequest, h: CaseHandlers, signal?: AbortSignal) => streamCase('/api/case', req, h, signal),

  resumeCase: (req: ResumeRequest, h: CaseHandlers, signal?: AbortSignal) =>
    streamCase('/api/case/resume', req, h, signal),

  stt: async (audio: Blob, langHint?: Lang): Promise<SttResponse> => {
    const form = new FormData()
    form.append('audio', audio, `speech.${audio.type.includes('ogg') ? 'ogg' : 'webm'}`)
    if (langHint) form.append('lang_hint', langHint)
    return (await request('/api/stt', { method: 'POST', body: form })).json()
  },

  /** Returns WAV audio. Throws ApiError(503) when Sarvam is not configured. */
  tts: async (text: string, lang: Lang): Promise<Blob> => (await postJson('/api/tts', { text, lang })).blob(),

  translate: async (text: string, targetLang: Lang): Promise<string> =>
    (await (await postJson('/api/translate', { text, target_lang: targetLang })).json()).text,

  decodeStatus: async (text: string): Promise<StatusDecodeResponse> =>
    (await postJson('/api/status/decode', { text })).json(),
}
