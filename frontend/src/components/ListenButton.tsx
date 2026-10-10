import { Volume2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { speak } from '../lib/speech'
import { useApp } from '../store/app'

/** Reads `text` aloud. Text is always shown alongside; never audio only (plan section 3.6). */
export default function ListenButton({ text }: { text: string }) {
  const { t } = useTranslation()
  const { lang, health } = useApp()
  return (
    <button
      type="button"
      onClick={() => void speak(text, lang, !!health?.sarvam)}
      className="inline-flex items-center gap-2 rounded-full border-2 border-brand px-4 py-2 font-medium text-brand hover:bg-brand-soft"
    >
      <Volume2 className="size-5" aria-hidden />
      {t('common.listen')}
    </button>
  )
}
