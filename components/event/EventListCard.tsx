import Link from 'next/link'
import Image from 'next/image'
import { GameEvent } from '@/types'
import { formatDateTime, getEffectiveStatus } from '@/lib/utils'
import { EventStatusBadge } from './EventStatusBadge'

export function EventListCard({ event }: { event: GameEvent }) {
  const effectiveStatus = getEffectiveStatus(event)
  const spotsLeft = event.maxPlayers - event.players.length
  const host = event.players.find((p) => p.isHost)

  return (
    <Link href={`/event/${event.id}`}>
      <div className="bg-white border border-gray-200 rounded-xl p-4 hover:border-indigo-300 hover:shadow-sm transition-all flex items-center gap-4 cursor-pointer">
        {event.boardGame.thumbnail ? (
          <Image
            src={event.boardGame.thumbnail}
            alt={event.boardGame.name}
            width={56}
            height={56}
            className="rounded-lg object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-14 h-14 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
            <span className="text-2xl">🎲</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-gray-900">{event.boardGame.name}</h3>
            <EventStatusBadge status={effectiveStatus} />
          </div>
          <p className="text-sm text-gray-500 mt-0.5">{formatDateTime(event.dateTime)}</p>
          <p className="text-sm text-gray-500 truncate">{event.address}</p>
          {host && <p className="text-xs text-gray-400 mt-0.5">Hosted by {host.name}</p>}
        </div>
        <div className="flex-shrink-0 text-right">
          {effectiveStatus === 'ended' || effectiveStatus === 'cancelled' || effectiveStatus === 'ongoing' ? null : (
            <>
              <span className="text-sm font-medium text-indigo-600">
                {event.players.length}/{event.maxPlayers}
              </span>
              <p className="text-xs text-gray-400">
                {spotsLeft > 0 ? `${spotsLeft} spot${spotsLeft !== 1 ? 's' : ''} left` : 'Full'}
              </p>
            </>
          )}
        </div>
      </div>
    </Link>
  )
}
