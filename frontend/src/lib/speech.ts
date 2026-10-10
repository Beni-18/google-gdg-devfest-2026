// Voice fallback chain (plan section 3.6):
//   speak:  Sarvam TTS (/api/tts) -> browser speechSynthesis -> text only
//   listen: Sarvam STT (/api/stt, via MediaRecorder) -> browser Web Speech API -> typed input
import { api } from './api'
import { langInfo, type Lang } from './langs'

let current: HTMLAudioElement | null = null

export function stopSpeaking() {
  current?.pause()
  current = null
  if ('speechSynthesis' in window) window.speechSynthesis.cancel()
}

export async function speak(text: string, lang: Lang, useServer: boolean): Promise<void> {
  stopSpeaking()
  if (useServer) {
    try {
      const url = URL.createObjectURL(await api.tts(text, lang))
      current = new Audio(url)
      current.onended = () => URL.revokeObjectURL(url)
      await current.play()
      return
    } catch {
      // fall through to the browser voice
    }
  }
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = langInfo(lang).bcp47
    utterance.rate = 0.9 // slower for numbers, dates and annexure names
    window.speechSynthesis.speak(utterance)
  }
}

// ---------------------------------------------------------------- listening

export const canRecord = () => typeof MediaRecorder !== 'undefined' && !!navigator.mediaDevices?.getUserMedia

/** Records until stop() is called. Resolves with the audio for /api/stt. */
export async function startRecording(): Promise<{ stop: () => Promise<Blob> }> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
  const recorder = new MediaRecorder(stream)
  const parts: Blob[] = []
  recorder.ondataavailable = (e) => parts.push(e.data)
  recorder.start()
  return {
    stop: () =>
      new Promise((resolve) => {
        recorder.onstop = () => {
          stream.getTracks().forEach((t) => t.stop())
          resolve(new Blob(parts, { type: recorder.mimeType }))
        }
        recorder.stop()
      }),
  }
}

// Web Speech API is not in TypeScript's DOM lib yet; declare the slice we use.
interface Recognition {
  lang: string
  interimResults: boolean
  maxAlternatives: number
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null
  onerror: ((e: { error: string }) => void) | null
  onend: (() => void) | null
  start(): void
  stop(): void
}
type RecognitionCtor = new () => Recognition

function recognitionCtor(): RecognitionCtor | undefined {
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition
}

export const canRecognizeInBrowser = () => !!recognitionCtor()

/** One utterance via the browser's recogniser. Rejects if unsupported or nothing was heard. */
export function recognizeInBrowser(lang: Lang): Promise<string> {
  const Ctor = recognitionCtor()
  if (!Ctor) return Promise.reject(new Error('speech_recognition_unsupported'))
  return new Promise((resolve, reject) => {
    const rec = new Ctor()
    rec.lang = langInfo(lang).bcp47
    rec.interimResults = false
    rec.maxAlternatives = 1
    let heard = ''
    rec.onresult = (e) => (heard = e.results[0]?.[0]?.transcript ?? '')
    rec.onerror = (e) => reject(new Error(e.error))
    rec.onend = () => (heard ? resolve(heard) : reject(new Error('no_speech')))
    rec.start()
  })
}
