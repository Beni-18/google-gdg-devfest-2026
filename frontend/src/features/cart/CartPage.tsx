import { Camera, CheckCircle2, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import ListenButton from '../../components/ListenButton'
import { useApp } from '../../store/app'
import { maskAadhaar } from './extract'
import { recognize } from './ocr'
import { useCart } from './store'
import { DOC_TYPES, type DocType } from './types'

/**
 * M1 Document Cart. Wired today: photo -> on-device OCR -> Aadhaar masked -> raw text.
 * TODO(cart): classify + extractFields -> confirm/edit screen (never cut) -> runChecks -> result card
 * with "Fix with Mitra" (useApp.setHandoff({text, cartIssues}) then navigate('/stuck')).
 */
export default function CartPage() {
  const { t } = useTranslation()
  const lang = useApp((s) => s.lang)
  const { docs, update } = useCart()

  async function read(type: DocType, file: File) {
    update(type, { status: 'reading', progress: 0 })
    try {
      const text = await recognize(file, lang, (progress) => update(type, { progress }))
      update(type, { status: 'review', rawText: maskAadhaar(text) })
    } catch {
      update(type, { status: 'error' })
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">{t('cart.title')}</h1>
      <div className="flex flex-wrap items-center gap-3 rounded-xl bg-green-50 p-4 text-green-900">
        <p className="flex-1">{t('cart.onDevice')}</p>
        <ListenButton text={t('cart.onDevice')} />
      </div>

      {DOC_TYPES.map((type) => {
        const doc = docs[type]
        return (
          <section key={type} className="rounded-2xl border-2 border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                {doc.status === 'review' && <CheckCircle2 className="size-5 text-green-600" aria-hidden />}
                {t(`cart.docs.${type}`)}
              </h2>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-brand px-4 py-2 font-medium text-white">
                {doc.status === 'reading' ? <Loader2 className="size-5 animate-spin" /> : <Camera className="size-5" />}
                {t('cart.addPhoto')}
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="sr-only"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) void read(type, file)
                    e.target.value = ''
                  }}
                />
              </label>
            </div>
            {doc.status === 'reading' && (
              <p className="mt-2 text-slate-600">{t('cart.reading', { pct: Math.round(doc.progress * 100) })}</p>
            )}
            {doc.status === 'error' && <p className="mt-2 text-red-700">{t('common.error')}</p>}
            {doc.rawText && (
              <details className="mt-3">
                <summary className="cursor-pointer text-slate-600">{t('cart.whatWeRead')}</summary>
                <pre className="mt-2 whitespace-pre-wrap rounded-lg bg-slate-100 p-3 text-sm">{doc.rawText}</pre>
              </details>
            )}
          </section>
        )
      })}
    </div>
  )
}
