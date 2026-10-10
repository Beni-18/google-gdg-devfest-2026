import { FileCheck2, LifeBuoy, MessageSquareText, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import BigButton from '../../components/BigButton'
import { useApp } from '../../store/app'

export default function HomePage() {
  const { t } = useTranslation()
  const { assisted, setAssisted } = useApp()

  return (
    <div className="flex flex-col gap-4">
      <BigButton to="/cart" icon={FileCheck2} label={t('home.checkDocs')} hint={t('home.checkDocsHint')} />
      <BigButton to="/stuck" icon={LifeBuoy} label={t('home.stuck')} hint={t('home.stuckHint')} />
      <BigButton to="/status" icon={MessageSquareText} label={t('home.status')} hint={t('home.statusHint')} />

      <label className="mt-4 flex items-center gap-3 rounded-xl bg-white p-4 text-slate-700">
        <input
          type="checkbox"
          checked={assisted}
          onChange={(e) => setAssisted(e.target.checked)}
          className="size-5 accent-brand"
        />
        <Users className="size-5" aria-hidden />
        {assisted ? t('home.assistedOn') : t('home.assistedOff')}
      </label>
    </div>
  )
}
