'use client'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { GameThumbnail } from '@/components/ui/GameThumbnail'
import { EventStatusBadge } from '@/components/event/EventStatusBadge'
import { Avatar } from '@/components/ui/Avatar'
import { getEffectiveStatus } from '@/lib/utils'
import type { GameEvent } from '@/types'

interface ActivityGridProps {
  hostedEvents: GameEvent[]
  joinedEvents: GameEvent[]
}

const MAX_VISIBLE_AVATARS = 3

function EventThumbnail({ event }: { event: GameEvent }) {
  const status = getEffectiveStatus(event)

  const host = event.players.find((p) => p.isHost)
  const joinedPlayers = event.players.filter((p) => !p.isHost)
  const visiblePlayers = joinedPlayers.slice(0, MAX_VISIBLE_AVATARS)
  const hiddenCount = joinedPlayers.length - MAX_VISIBLE_AVATARS

  return (
    <Link href={`/event/${event.id}`} className="block">
      <div className="relative aspect-square rounded-2xl overflow-hidden bg-surface-container group">
        {/* Game thumbnail background */}
        <GameThumbnail
          src={event.boardGame.thumbnail}
          name={event.boardGame.name}
          width={200}
          height={200}
          imgClassName="w-full h-full object-cover"
          placeholderClassName="w-full h-full flex items-center justify-center text-3xl bg-primary-container"
        />

        {/* Gradient overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Status badge — top right (omit ended) */}
        {status !== 'ended' && (
          <div className="absolute top-1.5 right-1.5">
            <EventStatusBadge status={status} />
          </div>
        )}

        {/* Joined players — bottom left */}
        {joinedPlayers.length > 0 && (
          <div className="absolute bottom-1.5 left-1.5 flex items-center">
            {visiblePlayers.map((player, i) => (
              <Avatar
                key={player.id}
                photoURL={player.photoURL}
                name={player.name}
                size="sm"
                className={i > 0 ? '-ml-1.5 ring-1 ring-black/30' : 'ring-1 ring-black/30'}
              />
            ))}
            {hiddenCount > 0 && (
              <span className="ml-1 text-[10px] font-bold text-white drop-shadow-sm">
                +{hiddenCount}
              </span>
            )}
          </div>
        )}

        {/* Host avatar — bottom right */}
        {host && (
          <div className="absolute bottom-1.5 right-1.5">
            <Avatar
              photoURL={host.photoURL}
              name={host.name}
              size="sm"
              className="ring-2 ring-primary"
            />
          </div>
        )}
      </div>
    </Link>
  )
}

export function ActivityGrid({ hostedEvents, joinedEvents }: ActivityGridProps) {
  const { t } = useTranslation()
  const [currentDate, setCurrentDate] = useState(() => new Date())

  const allEvents = useMemo(() => {
    const seen = new Set<string>()
    const combined: GameEvent[] = []
    for (const e of [...hostedEvents, ...joinedEvents]) {
      if (!seen.has(e.id)) {
        seen.add(e.id)
        combined.push(e)
      }
    }
    return combined.sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime())
  }, [hostedEvents, joinedEvents])

  const filteredEvents = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    return allEvents.filter((e) => {
      const d = new Date(e.dateTime)
      return d.getFullYear() === year && d.getMonth() === month
    })
  }, [allEvents, currentDate])

  const monthKey = `months.${String(currentDate.getMonth()).padStart(2, '0')}`

  const goToPrevMonth = () => {
    setCurrentDate((prev) => {
      const d = new Date(prev)
      d.setMonth(d.getMonth() - 1)
      return d
    })
  }

  const goToNextMonth = () => {
    const now = new Date()
    setCurrentDate((prev) => {
      const d = new Date(prev)
      d.setMonth(d.getMonth() + 1)
      // Don't go beyond current month
      if (d.getFullYear() > now.getFullYear() || (d.getFullYear() === now.getFullYear() && d.getMonth() > now.getMonth())) {
        return prev
      }
      return d
    })
  }

  const isCurrentMonth =
    currentDate.getFullYear() === new Date().getFullYear() &&
    currentDate.getMonth() === new Date().getMonth()

  return (
    <div className="space-y-4">
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={goToNextMonth}
          disabled={isCurrentMonth}
          className="p-2 rounded-xl text-on-surface-variant hover:bg-surface-container-highest transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label={t('profile.nextMonth')}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <span className="text-sm font-semibold text-on-surface">
          {t(monthKey)} {currentDate.getFullYear()}
        </span>
        <button
          onClick={goToPrevMonth}
          className="p-2 rounded-xl text-on-surface-variant hover:bg-surface-container-highest transition-colors"
          aria-label={t('profile.previousMonth')}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>

      {/* Grid */}
      {filteredEvents.length === 0 ? (
        <p className="text-sm text-on-surface-variant text-center py-8 italic">
          {t('profile.noActivityThisMonth')}
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {filteredEvents.map((event) => (
            <EventThumbnail key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  )
}
