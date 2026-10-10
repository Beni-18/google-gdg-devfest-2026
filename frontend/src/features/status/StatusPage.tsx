import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import ListenButton from '../../components/ListenButton'
import { api } from '../../lib/api'
import type { StatusDecodeResponse } from '../../lib/types'

/** M3 status decoder. TODO(frontend): journey timeline and the PV-by-state chip (plan 3.5). */
export default function StatusPage() {
  const { t } = useTranslation()
  const [text, setText] = useState('')
  const [result, setResult] = useState<StatusDecodeResponse | null>(null)
  const [error, setError] = useState(false)

  async function decode() {
    setError(false)
    try {
      setResult(await api.decodeStatus(text))
    } catch {
      setError(true)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">{t('status.title')}</h1>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={t('status.placeholder')}
        rows={4}
        className="rounded-xl border-2 border-slate-300 p-3"
      />
      <button
        type="button"
        disabled={!text.trim()}
        onClick={() => void decode()}
        className="self-start rounded-full bg-brand px-6 py-2 font-semibold text-white disabled:opacity-40"
      >
        {t('status.explain')}
      </button>
      {error && <p className="text-red-700">{t('common.error')}</p>}
      {result && (
        <section className="flex flex-col gap-3 rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-slate-600">{t('status.meaning')}</h2>
          <p className="text-lg">{result.meaning}</p>
          <h2 className="font-semibold text-slate-600">{t('status.next')}</h2>
          <p className="text-lg">{result.next_step}</p>
          <ListenButton text={`${result.meaning} ${result.next_step}`} />
        </section>
      )}
    </div>
  )
}
