'use client'
import Link from 'next/link'
import Image from 'next/image'
import { GameThumbnail } from '@/components/ui/GameThumbnail'
import { getEffectiveStatus } from '@/lib/utils'
import { useTranslation } from 'react-i18next'
import type { GameTable } from '@/types'

export function UpcomingTableCard({
  table,
  currentUserUid,
  className,
}: {
  table: GameTable
  currentUserUid?: string
  className?: string
}) {
  const { t, i18n } = useTranslation()
  const dateTime = new Date(table.dateTime)
  const now = new Date()
  const diffDays = Math.floor((dateTime.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  const timeLabel = dateTime.toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit' })

  const status = getEffectiveStatus(table)
  const statusStyles: Record<string, string> = {
    waiting:   'bg-amber-400/90 text-amber-950',
    full:      'bg-rose-500/90 text-white',
    ongoing:   'bg-emerald-500/90 text-white',
    ended:     'bg-white/15 text-white/60',
    cancelled: 'bg-rose-500/20 text-rose-200',
  }

  // Smart date: Today / Tomorrow / full weekday (future only) / Mon DD
  const dateLabel = diffDays === 0
    ? t('home.today')
    : diffDays === 1
      ? t('home.tomorrow')
      : diffDays > 1 && diffDays <= 6
        ? dateTime.toLocaleDateString(i18n.language, { weekday: 'long' })
        : dateTime.toLocaleDateString(i18n.language, { month: 'short', day: 'numeric' })

  const host = table.players.find(p => p.isHost)
  const nonHostPlayers = table.players
    .filter((p, i, arr) => !p.isHost && arr.findIndex(x => x.id === p.id) === i)
  const visiblePlayers = nonHostPlayers.slice(0, 3)
  const overflowCount = nonHostPlayers.length - visiblePlayers.length

  const isHost = !!currentUserUid && table.players.some(p => p.id === currentUserUid && p.isHost)
  const isJoined = !!currentUserUid && !isHost && table.players.some(p => p.id === currentUserUid)

  const shortAddress = table.addressLabel ?? table.address.split(',')[0]

  return (
    <Link href={`/table/${table.id}`} className={`rounded-[1.5rem] overflow-hidden group relative bg-surface-container-high ${className ?? 'w-full'}`}>
      {/* Hero art */}
      <div className="relative aspect-square bg-surface-container overflow-hidden">
        <GameThumbnail
          src={table.boardGame.thumbnail}
          name={table.boardGame.name}
          width={320}
          height={320}
          imgClassName="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          placeholderClassName="w-full h-full flex items-center justify-center text-5xl font-extrabold text-primary/20 bg-primary-container/10"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-surface-container-high via-surface-container-high/30 to-transparent" />
        {/* Status chip — top right */}
        <div className={`absolute top-3 right-3 px-2.5 py-1 rounded-full flex items-center ${statusStyles[status]}`}>
          <span className="text-[10px] font-bold leading-none">{t(`tableStatus.${status}`)}</span>
        </div>
        {/* Status pill — bottom left */}
        {(isHost || isJoined) && (
          <div className="absolute bottom-3 left-3">
            <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full backdrop-blur-sm border ${
              isHost
                ? 'bg-primary/90 text-white border-primary/40'
                : 'bg-emerald-500/90 text-white border-emerald-400/40'
            }`}>
              {isHost ? t('tableCard.hosting') : t('tableCard.joined')}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 pt-3 flex flex-col gap-1.5">
        <h3 className="text-base font-extrabold text-on-surface truncate tracking-tight">{table.boardGame.name}</h3>

        {/* Date */}
        <p className="text-xs font-semibold text-primary font-meta">{dateLabel} · {timeLabel}</p>

        {/* Address */}
        <p className="text-xs text-on-surface-variant font-meta truncate">📍 {shortAddress}</p>

        {/* Players row: avatars left, host right */}
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <div className="flex items-center gap-1.5 min-w-0">
            {visiblePlayers.length > 0 ? (
              <>
                <div className="flex -space-x-2 flex-shrink-0">
                  {visiblePlayers.map((p, i) => (
                    p.photoURL ? (
                      <Image key={p.id} src={p.photoURL} alt={p.name} width={28} height={28}
                        className="w-7 h-7 rounded-full object-cover border-2 border-surface-container-high"
                        style={{ zIndex: visiblePlayers.length - i }} />
                    ) : (
                      <div key={p.id} className="w-7 h-7 rounded-full bg-primary-container border-2 border-surface-container-high flex items-center justify-center text-[9px] font-bold text-on-primary-container"
                        style={{ zIndex: visiblePlayers.length - i }}>
                        {p.name[0]?.toUpperCase()}
                      </div>
                    )
                  ))}
                </div>
                {overflowCount > 0 && (
                  <span className="text-[10px] text-on-surface-variant/60 font-meta">+{overflowCount}</span>
                )}
              </>
            ) : (
              <span className="text-[11px] text-on-surface-variant font-meta">{t('nearby.noPlayersYet')}</span>
            )}
          </div>

          {/* Host — right, secondary */}
          {host && (
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {host.photoURL ? (
                <Image src={host.photoURL} alt={host.name} width={24} height={24} className="w-6 h-6 rounded-full object-cover" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-surface-container-highest flex items-center justify-center text-[9px] font-bold text-on-surface-variant">
                  {host.name[0]?.toUpperCase()}
                </div>
              )}
              <span className="text-xs font-semibold text-on-surface-variant font-meta truncate max-w-[80px]">{host.name.split(' ')[0]}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
