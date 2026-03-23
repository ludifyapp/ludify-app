'use client'
import { useTranslation } from 'react-i18next'
import type { ListingCondition } from '@/types'

const styles: Record<ListingCondition, string> = {
  new:      'bg-tertiary-container text-on-tertiary-container',
  like_new: 'bg-primary-container text-on-primary-container',
  good:     'bg-surface-container-highest text-on-surface-variant',
  fair:     'bg-secondary-container text-on-secondary-container',
  poor:     'bg-error-container text-error',
}

export function ConditionBadge({ condition }: { condition: ListingCondition }) {
  const { t } = useTranslation()
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${styles[condition]}`}>
      {t(`condition.${condition}`)}
    </span>
  )
}
