import { Check, Loader2, Send } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import ListenButton from '../../components/ListenButton'
import MicButton from '../../components/MicButton'
import { api, type CaseHandlers } from '../../lib/api'
import type { CaseResult, ClarifyEvent } from '../../lib/types'
import { useApp } from '../../store/app'
import AnswerCard from './AnswerCard'

type Phase = 'ask' | 'running' | 'clarify' | 'done' | 'error'

/** M2 Stuck-Case Solver: one question at a time (plan 3.9 screens 4-6). */
export default function StuckPage() {
  const { t } = useTranslation()
  const { lang, handoff, setHandoff } = useApp()
  const [phase, setPhase] = useState<Phase>('ask')
  const [text, setText] = useState(handoff?.text ?? '')
  const [steps, setSteps] = useState<string[]>([])
  const [clarify, setClarify] = useState<ClarifyEvent | null>(null)
  const [result, setResult] = useState<CaseResult | null>(null)
  const abort = useRef<AbortController | null>(null)

  useEffect(() => () => abort.current?.abort(), [])

  const handlers: CaseHandlers = {
    onProgress: (e) => setSteps((s) => [...s, e.node]),
    onClarify: (e) => {
      setClarify(e)
      setText('')
      setPhase('clarify')
    },
    onResult: (r) => {
      setResult(r)
      setPhase('done')
    },
    onError: () => setPhase('error'),
  }

  function submit() {
    const message = text.trim()
    if (!message) return
    abort.current = new AbortController()
    setSteps([])
    setPhase('running')
    if (clarify) {
      void api.resumeCase({ thread_id: clarify.thread_id, text: message }, handlers, abort.current.signal)
    } else {
      void api.startCase(
        { lang, text: message, consent: true, cart_issues: handoff?.cartIssues ?? [] },
        handlers,
        abort.current.signal,
      )
      setHandoff(null)
    }
  }

  function restart() {
    setPhase('ask')
    setText('')
    setClarify(null)
    setResult(null)
  }

  if (phase === 'done' && result) {
    return (
      <div className="flex flex-col gap-4">
        <AnswerCard result={result} />
        <button type="button" onClick={restart} className="self-start font-semibold text-brand underline">
          {t('stuck.startAgain')}
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">{t('stuck.title')}</h1>

      {clarify && (
        <section className="rounded-2xl border-2 border-brand bg-brand-soft p-4">
          <p className="mb-1 text-sm font-semibold text-brand">{t('stuck.oneQuestion')}</p>
          <p className="mb-3 text-lg">{clarify.question}</p>
          <ListenButton text={clarify.question} />
        </section>
      )}

      {phase === 'running' ? (
        <ol className="flex flex-col gap-2 rounded-2xl bg-white p-4" aria-live="polite">
          {steps.map((node, i) => (
            <li key={`${node}-${i}`} className="flex items-center gap-2 text-slate-700">
              <Check className="size-5 text-green-600" aria-hidden />
              {t(`progress.${node}`, { defaultValue: node })}
            </li>
          ))}
          <li className="flex items-center gap-2 text-slate-500">
            <Loader2 className="size-5 animate-spin" aria-hidden />…
          </li>
        </ol>
      ) : (
        <div className="flex items-end gap-3">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={clarify ? t('stuck.answerPlaceholder') : t('stuck.placeholder')}
            rows={clarify ? 2 : 5}
            maxLength={2000}
            className="flex-1 rounded-xl border-2 border-slate-300 p-3"
          />
          <div className="flex flex-col gap-2">
            <MicButton onText={(heard) => setText((prev) => (prev ? `${prev} ${heard}` : heard))} />
            <button
              type="button"
              onClick={submit}
              disabled={!text.trim()}
              aria-label={t('stuck.send')}
              className="inline-flex size-14 items-center justify-center rounded-full bg-green-600 text-white shadow disabled:opacity-40"
            >
              <Send className="size-6" />
            </button>
          </div>
        </div>
      )}

      {phase === 'error' && <p className="text-red-700">{t('common.error')}</p>}
    </div>
  )
}
