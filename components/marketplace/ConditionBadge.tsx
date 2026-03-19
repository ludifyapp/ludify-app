import type { ListingCondition } from '@/types'

const styles: Record<ListingCondition, string> = {
  new:      'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
  like_new: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
  good:     'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  fair:     'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  poor:     'bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-zinc-400',
}

const labels: Record<ListingCondition, string> = {
  new:      'New',
  like_new: 'Like New',
  good:     'Good',
  fair:     'Fair',
  poor:     'Poor',
}

export function ConditionBadge({ condition }: { condition: ListingCondition }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${styles[condition]}`}>
      {labels[condition]}
    </span>
  )
}

export { labels as conditionLabels }
