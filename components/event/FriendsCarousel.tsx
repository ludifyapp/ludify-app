'use client'
import Link from 'next/link'
import Image from 'next/image'
import { getEffectiveStatus } from '@/lib/utils'
import type { GameEvent } from '@/types'

interface FriendsCarouselProps {
  events: GameEvent[]
}

export function FriendsCarousel({ events }: FriendsCarouselProps) {
  if (events.length === 0) return null

  // One bubble per friend — their soonest upcoming event
  const seen = new Set<string>()
  const items = events
    .slice()
    .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime())
    .filter((e) => {
      if (seen.has(e.hostUid)) return false
      seen.add(e.hostUid)
      return true
    })

  return (
    <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
      <div className="flex gap-5 w-max py-2">
        {items.map((event) => {
          const host = event.players.find((p) => p.isHost)
          const ongoing = getEffectiveStatus(event) === 'ongoing'

          return (
            <Link
              key={event.id}
              href={`/event/${event.id}`}
              className="flex flex-col items-center gap-1.5 w-[60px] flex-shrink-0"
            >
              {/* Avatar with ring */}
              <div className="relative">
                <div
                  className={`w-[56px] h-[56px] rounded-full p-[2.5px] ${
                    ongoing
                      ? 'bg-green-400'
                      : 'bg-gradient-to-br from-teal-400 to-teal-600'
                  }`}
                >
                  <div className="w-full h-full rounded-full bg-slate-50 dark:bg-zinc-950 p-[2px]">
                    {host?.photoURL ? (
                      <Image
                        src={host.photoURL}
                        alt={host.name}
                        width={48}
                        height={48}
                        className="rounded-full w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center text-sm font-semibold text-teal-700 dark:text-teal-300">
                        {host?.name?.[0]?.toUpperCase() ?? '?'}
                      </div>
                    )}
                  </div>
                </div>

                {/* Green dot for ongoing */}
                {ongoing && (
                  <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-slate-50 dark:border-zinc-950" />
                )}
              </div>

              {/* First name */}
              <span className="text-xs text-slate-700 dark:text-zinc-200 font-medium text-center truncate w-full leading-tight">
                {host?.name?.split(' ')[0] ?? 'Friend'}
              </span>

              {/* Game name */}
              <span className="text-[10px] text-slate-400 dark:text-zinc-500 text-center truncate w-full leading-tight -mt-0.5">
                {event.boardGame.name}
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
