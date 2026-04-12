'use client'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useTranslation } from 'react-i18next'
import { GameEvent, Player } from '@/types'
import { formatDateTime, getEffectiveStatus } from '@/lib/utils'
import { EventStatusBadge } from './EventStatusBadge'

export function EventListCard({ event, friendsInEvent }: { event: GameEvent; friendsInEvent?: Player[] }) {
  const { t, i18n } = useTranslation()
  const [imgError, setImgError] = useState(false)
  const effectiveStatus = getEffectiveStatus(event)
  const spotsLeft = event.maxPlayers - event.players.length
  const host = event.players.find((p) => p.isHost)
  const isOver = effectiveStatus === 'ended' || effectiveStatus === 'cancelled'

  return (
    <Link href={`/event/${event.id}`}>
      <div className="group bg-surface-container-high rounded-[1.5rem] hover:bg-surface-container-highest transition-colors duration-200 overflow-hidden flex gap-0 cursor-pointer">
        {/* Thumbnail */}
        <div className="flex-shrink-0 w-36 self-stretch relative">
          {event.boardGame.thumbnail && !imgError ? (
            <Image
              src={event.boardGame.thumbnail}
              alt={event.boardGame.name}
              fill
              className="object-cover rounded-l-[1.5rem]"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="absolute inset-0 bg-surface-container-highest rounded-l-[1.5rem] flex items-center justify-center">
              <span className="text-2xl font-bold text-teal-600">{event.boardGame.name.charAt(0).toUpperCase()}</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 p-5 flex flex-col justify-center gap-2.5">
          <div className="flex items-start gap-3 w-full">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h3 className="text-base font-bold text-on-surface leading-tight tracking-[-0.02em]">{event.boardGame.name}</h3>
                <EventStatusBadge status={effectiveStatus} />
              </div>
              <p className="text-sm text-on-surface-variant/70 font-meta">{formatDateTime(event.dateTime, i18n.language)}</p>
              <p className="text-sm text-on-surface-variant/60 font-meta truncate mt-0.5">{event.addressLabel ?? event.address}</p>
              {host && (
                <div className="flex items-center gap-1.5 mt-2">
                  <div className="w-5 h-5 rounded-full overflow-hidden bg-surface-container-highest flex items-center justify-center flex-shrink-0">
                    {host.photoURL ? (
                      <Image src={host.photoURL} alt={host.name} width={20} height={20} className="object-cover w-full h-full" />
                    ) : (
                      <span className="text-[9px] font-bold text-on-surface-variant">{host.name.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <p className="text-xs text-on-surface-variant/60 font-meta">{t('eventCard.by', { name: host.name })}</p>
                </div>
              )}
            </div>

            {/* Spots */}
            {!isOver && effectiveStatus !== 'ongoing' && (
              <div className="flex-shrink-0 text-right">
                <span className={`text-base font-bold ${spotsLeft === 0 ? 'text-secondary' : 'text-primary'}`}>
                  {event.players.length}/{event.maxPlayers}
                </span>
              </div>
            )}
          </div>

          {/* Friends who joined */}
          {friendsInEvent && friendsInEvent.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex -space-x-1.5 flex-shrink-0">
                {friendsInEvent.slice(0, 3).map((friend, i) => (
                  <div key={friend.id} className="w-6 h-6 rounded-full border border-surface overflow-hidden bg-surface-container-highest relative" style={{ zIndex: 3 - i }}>
                    {friend.photoURL ? (
                      <Image src={friend.photoURL} alt={friend.name} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-on-surface-variant bg-surface-container-high">
                        {friend.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-on-surface-variant/60 font-meta truncate">
                {friendsInEvent.length === 1 && <span className="font-medium text-on-surface">{friendsInEvent[0].name.split(' ')[0]}</span>}
                {friendsInEvent.length === 2 && <span><span className="font-medium text-on-surface">{friendsInEvent[0].name.split(' ')[0]}</span> & <span className="font-medium text-on-surface">{friendsInEvent[1].name.split(' ')[0]}</span></span>}
                {friendsInEvent.length > 2 && <span><span className="font-medium text-on-surface">{friendsInEvent[0].name.split(' ')[0]}</span>, <span className="font-medium text-on-surface">{friendsInEvent[1].name.split(' ')[0]}</span> +{friendsInEvent.length - 2}</span>}
                {' '}{t('home.joinedEvent', 'joined')}
              </p>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
