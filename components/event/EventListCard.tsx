import Link from 'next/link'
import Image from 'next/image'
import { GameEvent } from '@/types'
import { formatDateTime, getEffectiveStatus } from '@/lib/utils'
import { EventStatusBadge } from './EventStatusBadge'

export function EventListCard({ event }: { event: GameEvent }) {
  const effectiveStatus = getEffectiveStatus(event)
  const spotsLeft = event.maxPlayers - event.players.length
  const host = event.players.find((p) => p.isHost)
  const isOver = effectiveStatus === 'ended' || effectiveStatus === 'cancelled'

  return (
    <Link href={`/event/${event.id}`}>
      <div className="group bg-white dark:bg-zinc-900 rounded-2xl shadow-sm hover:shadow-md dark:shadow-none dark:hover:shadow-black/40 border border-slate-100 dark:border-zinc-800 transition-all duration-200 overflow-hidden flex gap-0 cursor-pointer">
        {/* Thumbnail */}
        <div className="flex-shrink-0 w-24 self-stretch relative">
          {event.boardGame.thumbnail ? (
            <Image
              src={event.boardGame.thumbnail}
              alt={event.boardGame.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-teal-100 to-teal-200 dark:from-teal-900/40 dark:to-teal-800/20 flex items-center justify-center">
              <span className="text-3xl">🎲</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 p-4 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <h3 className="font-bold text-slate-900 dark:text-white leading-tight">{event.boardGame.name}</h3>
              <EventStatusBadge status={effectiveStatus} />
            </div>
            <p className="text-sm text-slate-500 dark:text-zinc-400">{formatDateTime(event.dateTime)}</p>
            <p className="text-sm text-slate-400 dark:text-zinc-500 truncate">{event.addressLabel ?? event.address}</p>
            {host && <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">by {host.name}</p>}
          </div>

          {/* Spots */}
          {!isOver && effectiveStatus !== 'ongoing' && (
            <div className="flex-shrink-0 text-right">
              <span className={`text-sm font-bold ${spotsLeft === 0 ? 'text-sky-600 dark:text-sky-400' : 'text-teal-600 dark:text-teal-400'}`}>
                {event.players.length}/{event.maxPlayers}
              </span>
              <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5 whitespace-nowrap">
                {spotsLeft > 0 ? `${spotsLeft} left` : 'Full'}
              </p>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
