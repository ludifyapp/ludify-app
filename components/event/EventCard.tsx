import Image from 'next/image'
import { GameEvent } from '@/types'
import { formatDateTime, getEffectiveStatus } from '@/lib/utils'
import { EventStatusBadge } from './EventStatusBadge'

interface EventCardProps {
  event: GameEvent
}

export function EventCard({ event }: EventCardProps) {
  const effectiveStatus = getEffectiveStatus(event)
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="flex items-start gap-4 p-6">
        {event.boardGame.thumbnail ? (
          <Image
            src={event.boardGame.thumbnail}
            alt={event.boardGame.name}
            width={80}
            height={80}
            className="rounded-lg object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-20 h-20 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
            <span className="text-3xl">🎲</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-gray-900">{event.boardGame.name}</h1>
            <div className="flex items-center gap-2">
              {event.type === 'private' && (
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">🔒 Private</span>
              )}
              <EventStatusBadge status={effectiveStatus} />
            </div>
          </div>
          {event.boardGame.yearPublished && (
            <p className="text-sm text-gray-500 mt-0.5">{event.boardGame.yearPublished}</p>
          )}
          {event.description && (
            <p className="text-sm text-gray-600 mt-2">{event.description}</p>
          )}
        </div>
      </div>
      <div className="border-t border-gray-100 divide-y divide-gray-100">
        <div className="px-6 py-3 flex items-center gap-3">
          <span className="text-lg">📅</span>
          <div>
            <span className="text-sm text-gray-700">{formatDateTime(event.dateTime)}</span>
            {event.endDateTime && (
              <span className="text-sm text-gray-500"> → {formatDateTime(event.endDateTime)}</span>
            )}
          </div>
        </div>
        <div className="px-6 py-3 flex items-center gap-3">
          <span className="text-lg">📍</span>
          <span className="text-sm text-gray-700">{event.address}</span>
        </div>
        <div className="px-6 py-3 flex items-center gap-3">
          <span className="text-lg">👥</span>
          <span className="text-sm text-gray-700">
            {event.minPlayers ?? 2}–{event.maxPlayers} players
          </span>
        </div>
      </div>
    </div>
  )
}
