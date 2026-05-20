import React from 'react'

type Props = {
  icon: string
  label: string
  value: string | number
  hint?: string
  tone?: 'default' | 'warning' | 'success' | 'danger' | 'info'
  href?: string
}

const toneMap: Record<NonNullable<Props['tone']>, string> = {
  default: 'bg-slate-100 text-slate-600',
  warning: 'bg-amber-100 text-amber-700',
  success: 'bg-emerald-100 text-emerald-700',
  danger: 'bg-rose-100 text-rose-700',
  info: 'bg-sky-100 text-sky-700',
}

export default function KpiCard({ icon, label, value, hint, tone = 'default', href }: Props) {
  const content = (
    <div className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-slate-500 truncate">{label}</p>
          <p className="text-2xl font-semibold text-slate-900 mt-1">{value}</p>
          {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${toneMap[tone]}`}>
          <span className="material-symbols-outlined text-[20px]">{icon}</span>
        </div>
      </div>
    </div>
  )

  if (href) {
    return (
      <a href={href} className="block">
        {content}
      </a>
    )
  }
  return content
}