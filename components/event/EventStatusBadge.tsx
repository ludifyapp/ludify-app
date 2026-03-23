'use client'
import { useTranslation } from 'react-i18next'
import type { EffectiveStatus } from '@/types'

const styles: Record<EffectiveStatus, string> = {
  waiting:   'bg-primary-container text-on-primary-container',
  full:      'bg-secondary-container text-on-secondary-container',
  ongoing:   'bg-tertiary-container text-on-tertiary-container',
  ended:     'bg-surface-container-highest text-on-surface-variant/60',
  cancelled: 'bg-error-container text-error',
}

export function EventStatusBadge({ status }: { status: EffectiveStatus }) {
  const { t } = useTranslation()
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
      {t(`eventStatus.${status}`)}
    </span>
  )
}
