'use client'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useTranslation } from 'react-i18next'
import { GameEvent, Player } from '@/types'
import { formatDateTime, getEffectiveStatus } from '@/lib/utils'
import { EventStatusBadge } from './EventStatusBadge'

export function EventListCard({ event, friendsInEvent }: { event: GameEvent; friendsInEvent?: Player[] }) {
  const { t } = useTranslation()
  const [imgError, setImgError] = useState(false)
  const effectiveStatus = getEffectiveStatus(event)
  const spotsLeft = event.maxPlayers - event.players.length
  const host = event.players.find((p) => p.isHost)
  const isOver = effectiveStatus === 'ended' || effectiveStatus === 'cancelled'

  return (
    <Link href={`/event/${event.id}`}>
      <div className="group bg-white dark:bg-zinc-900 rounded-2xl shadow-sm hover:shadow-md dark:shadow-none dark:hover:shadow-black/40 border border-slate-100 dark:border-zinc-800 transition-all duration-200 overflow-hidden flex gap-0 cursor-pointer">
        {/* Thumbnail */}
        <div className="flex-shrink-0 w-24 self-stretch relative">
          {event.boardGame.thumbnail && !imgError ? (
            <Image
              src={event.boardGame.thumbnail}
              alt={event.boardGame.name}
              fill
              className="object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-teal-100 to-teal-200 dark:from-teal-900/40 dark:to-teal-800/20 flex items-center justify-center">
              <span className="text-3xl">🎲</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 p-4 flex flex-col justify-center gap-2">
          <div className="flex items-center gap-3 w-full">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                <h3 className="font-bold text-slate-900 dark:text-white leading-tight">{event.boardGame.name}</h3>
                <EventStatusBadge status={effectiveStatus} />
              </div>
              <p className="text-sm text-slate-500 dark:text-zinc-400">{formatDateTime(event.dateTime)}</p>
              <p className="text-sm text-slate-400 dark:text-zinc-500 truncate">{event.addressLabel ?? event.address}</p>
              {host && (
                <div className="flex items-center gap-1.5 mt-1.5">
                  <div className="w-4 h-4 rounded-full overflow-hidden bg-slate-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0 border border-slate-200 dark:border-zinc-700">
                    {host.photoURL ? (
                      <Image src={host.photoURL} alt={host.name} width={16} height={16} className="object-cover w-full h-full" />
                    ) : (
                      <span className="text-[8px] font-bold text-slate-400">{host.name.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 dark:text-zinc-500">{t('eventCard.by', { name: host.name })}</p>
                </div>
              )}
            </div>

            {/* Spots */}
            {!isOver && effectiveStatus !== 'ongoing' && (
              <div className="flex-shrink-0 text-right">
                <span className={`text-sm font-bold ${spotsLeft === 0 ? 'text-sky-600 dark:text-sky-400' : 'text-teal-600 dark:text-teal-400'}`}>
                  {event.players.length}/{event.maxPlayers}
                </span>
              </div>
            )}
          </div>

          {/* Friends who joined */}
          {friendsInEvent && friendsInEvent.length > 0 && (
            <div className="flex items-center gap-2 mt-1">
              <div className="flex -space-x-1.5 flex-shrink-0">
                {friendsInEvent.slice(0, 3).map((friend, i) => (
                  <div key={friend.id} className="w-5 h-5 rounded-full border border-white dark:border-zinc-900 overflow-hidden bg-slate-100 relative" style={{ zIndex: 3 - i }}>
                    {friend.photoURL ? (
                      <Image src={friend.photoURL} alt={friend.name} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[9px] font-bold text-slate-400 dark:text-slate-500 bg-slate-200 dark:bg-zinc-800">
                        {friend.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400 truncate">
                {friendsInEvent.length === 1 && <span className="font-medium text-slate-700 dark:text-zinc-300">{friendsInEvent[0].name.split(' ')[0]}</span>}
                {friendsInEvent.length === 2 && <span><span className="font-medium text-slate-700 dark:text-zinc-300">{friendsInEvent[0].name.split(' ')[0]}</span> & <span className="font-medium text-slate-700 dark:text-zinc-300">{friendsInEvent[1].name.split(' ')[0]}</span></span>}
                {friendsInEvent.length > 2 && <span><span className="font-medium text-slate-700 dark:text-zinc-300">{friendsInEvent[0].name.split(' ')[0]}</span>, <span className="font-medium text-slate-700 dark:text-zinc-300">{friendsInEvent[1].name.split(' ')[0]}</span> +{friendsInEvent.length - 2}</span>}
                {' '}{t('home.joinedEvent', 'joined')}
              </p>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
