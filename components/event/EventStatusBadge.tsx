'use client'
import { useTranslation } from 'react-i18next'
import type { EffectiveStatus } from '@/types'

const styles: Record<EffectiveStatus, string> = {
  waiting:   'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  full:      'bg-rose-100 text-rose-600 dark:bg-rose-900 dark:text-rose-300',
  ongoing:   'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
  ended:     'bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-zinc-400',
  cancelled: 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300',
}

export function EventStatusBadge({ status }: { status: EffectiveStatus }) {
  const { t } = useTranslation()
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${styles[status]}`}>
      {t(`eventStatus.${status}`)}
    </span>
  )
}
