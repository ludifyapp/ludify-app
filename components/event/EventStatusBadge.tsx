interface EventStatusBadgeProps {
  status: 'active' | 'cancelled' | 'ended'
}

export function EventStatusBadge({ status }: EventStatusBadgeProps) {
  const styles = {
    active: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    ended: 'bg-gray-100 text-gray-600',
  }
  const labels = {
    active: 'Active',
    cancelled: 'Cancelled',
    ended: 'Ended',
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  )
}
