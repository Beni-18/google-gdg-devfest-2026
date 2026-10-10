import { useTranslation } from 'react-i18next'
import type { Confidence } from '../lib/types'

const STYLE: Record<Confidence, string> = {
  high: 'bg-green-100 text-green-900 border-green-300',
  medium: 'bg-amber-100 text-amber-900 border-amber-300',
  low: 'bg-red-100 text-red-900 border-red-300',
}

export default function ConfidenceBadge({ level }: { level: Confidence }) {
  const { t } = useTranslation()
  return (
    <span className={`inline-block rounded-full border px-3 py-1 text-sm font-semibold ${STYLE[level]}`}>
      {t(`answer.confidence.${level}`)}
    </span>
  )
}
