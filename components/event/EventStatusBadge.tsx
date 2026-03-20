'use client'
import { useTranslation } from 'react-i18next'
import type { EffectiveStatus } from '@/types'

const styles: Record<EffectiveStatus, string> = {
  waiting:   'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  full:      'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300',
  ongoing:   'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
  ended:     'bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-zinc-400',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

export function EventStatusBadge({ status }: { status: EffectiveStatus }) {
  const { t } = useTranslation()
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
      {t(`eventStatus.${status}`)}
    </span>
  )
}
