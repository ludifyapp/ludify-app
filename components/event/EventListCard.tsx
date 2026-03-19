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
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm dark:shadow-none hover:shadow-md dark:hover:shadow-black/30 transition-all flex items-center gap-4 cursor-pointer">
        {event.boardGame.thumbnail ? (
          <Image
            src={event.boardGame.thumbnail}
            alt={event.boardGame.name}
            width={80}
            height={80}
            className="rounded-xl object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-20 h-20 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center flex-shrink-0">
            <span className="text-2xl">🎲</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-gray-900 dark:text-white">{event.boardGame.name}</h3>
            <EventStatusBadge status={effectiveStatus} />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{formatDateTime(event.dateTime)}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{event.address}</p>
          {host && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Hosted by {host.name}</p>}
        </div>
        <div className="flex-shrink-0 text-right">
          {effectiveStatus === 'ended' || effectiveStatus === 'cancelled' || effectiveStatus === 'ongoing' ? null : (
            <>
              <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                {event.players.length}/{event.maxPlayers}
              </span>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                {spotsLeft > 0 ? `${spotsLeft} spot${spotsLeft !== 1 ? 's' : ''} left` : 'Full'}
              </p>
            </>
          )}
        </div>
      </div>
    </Link>
  )
}
