import type { LucideIcon } from 'lucide-react'
import { Link } from 'react-router'

interface Props {
  to: string
  icon: LucideIcon
  label: string
  hint?: string
}

export default function BigButton({ to, icon: Icon, label, hint }: Props) {
  return (
    <Link
      to={to}
      className="flex items-center gap-4 rounded-2xl border-2 border-slate-200 bg-white p-5 shadow-sm transition hover:border-brand active:scale-[0.99]"
    >
      <span className="rounded-xl bg-brand-soft p-3 text-brand">
        <Icon className="size-8" aria-hidden />
      </span>
      <span>
        <span className="block text-xl font-semibold">{label}</span>
        {hint && <span className="block text-slate-600">{hint}</span>}
      </span>
    </Link>
  )
}
