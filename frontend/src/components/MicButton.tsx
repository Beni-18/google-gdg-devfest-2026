import { Mic, Square } from 'lucide-react'
import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '../lib/api'
import { canRecognizeInBrowser, canRecord, recognizeInBrowser, startRecording } from '../lib/speech'
import { useApp } from '../store/app'

/** Sarvam STT when the server has it, else the browser recogniser, else hidden (typing still works). */
export default function MicButton({ onText }: { onText: (text: string) => void }) {
  const { t } = useTranslation()
  const { lang, health } = useApp()
  const [busy, setBusy] = useState(false)
  const recording = useRef<{ stop: () => Promise<Blob> } | null>(null)

  const server = !!health?.sarvam && canRecord()
  if (!server && !canRecognizeInBrowser()) return null

  async function toggle() {
    if (server) {
      if (recording.current) {
        const audio = await recording.current.stop()
        recording.current = null
        try {
          onText((await api.stt(audio, lang)).text)
        } finally {
          setBusy(false)
        }
      } else {
        recording.current = await startRecording()
        setBusy(true)
      }
      return
    }
    setBusy(true)
    try {
      onText(await recognizeInBrowser(lang))
    } catch {
      // nothing heard or permission denied: the text box is still there
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      type="button"
      onClick={() => void toggle()}
      aria-label={busy ? t('common.stop') : t('common.speak')}
      className={`inline-flex size-14 shrink-0 items-center justify-center rounded-full text-white shadow ${busy ? 'animate-pulse bg-red-600' : 'bg-brand'}`}
    >
      {busy ? <Square className="size-6" /> : <Mic className="size-7" />}
    </button>
  )
}
