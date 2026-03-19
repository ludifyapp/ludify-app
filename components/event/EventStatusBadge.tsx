import type { EffectiveStatus } from '@/types'

const styles: Record<EffectiveStatus, string> = {
  waiting:   'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  active:    'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  full:      'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  ongoing:   'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
  ended:     'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

const labels: Record<EffectiveStatus, string> = {
  waiting:   'Waiting for players',
  active:    'Active',
  full:      'Full',
  ongoing:   'Ongoing',
  ended:      'Done',
  cancelled: 'Cancelled',
}

export function EventStatusBadge({ status }: { status: EffectiveStatus }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  )
}
