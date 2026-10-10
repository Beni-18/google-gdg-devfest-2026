import { RotateCcw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { useApp } from '../../store/app'
import { resetAll } from '../../store/reset'

/** M5 assisted mode (plan 3.7): client counter and one-tap wipe between walk-in clients. */
export default function AssistedBar() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { clientNo, nextClient } = useApp()

  return (
    <div className="flex items-center justify-between bg-slate-800 px-4 py-2 text-white">
      <span className="font-semibold">{t('assisted.client', { n: clientNo })}</span>
      <button
        type="button"
        onClick={() => {
          resetAll()
          nextClient()
          navigate('/')
        }}
        className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-sm hover:bg-white/25"
      >
        <RotateCcw className="size-4" aria-hidden />
        {t('assisted.clearAll')}
      </button>
      {/* TODO(frontend): printable one-page summary (client initials, issues, fixes). */}
    </div>
  )
}
