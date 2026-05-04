'use client'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { GameThumbnail } from '@/components/ui/GameThumbnail'
import { TableStatusBadge } from '@/components/table/TableStatusBadge'
import { Avatar } from '@/components/ui/Avatar'
import { getEffectiveStatus } from '@/lib/utils'
import type { GameTable } from '@/types'

interface ActivityGridProps {
  hostedTables: GameTable[]
  joinedTables: GameTable[]
}

const MAX_VISIBLE_AVATARS = 3

function TableThumbnail({ table }: { table: GameTable }) {
  const status = getEffectiveStatus(table)

  const host = table.players.find((p) => p.isHost)
  const joinedPlayers = table.players.filter((p) => !p.isHost)
  const visiblePlayers = joinedPlayers.slice(0, MAX_VISIBLE_AVATARS)
  const hiddenCount = joinedPlayers.length - MAX_VISIBLE_AVATARS

  return (
    <Link href={`/table/${table.id}`} className="block">
      <div className="relative aspect-square rounded-2xl overflow-hidden bg-surface-container group">
        {/* Game thumbnail background */}
        <GameThumbnail
          src={table.boardGame.thumbnail}
          name={table.boardGame.name}
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
            <TableStatusBadge status={status} />
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

export function ActivityGrid({ hostedTables, joinedTables }: ActivityGridProps) {
  const { t } = useTranslation()
  const [currentDate, setCurrentDate] = useState(() => new Date())

  const allEvents = useMemo(() => {
    const seen = new Set<string>()
    const combined: GameTable[] = []
    for (const e of [...hostedTables, ...joinedTables]) {
      if (!seen.has(e.id)) {
        seen.add(e.id)
        combined.push(e)
      }
    }
    return combined.sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime())
  }, [hostedTables, joinedTables])

  const filteredTables = useMemo(() => {
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
      {filteredTables.length === 0 ? (
        <p className="text-sm text-on-surface-variant text-center py-8 italic">
          {t('profile.noActivityThisMonth')}
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {filteredTables.map((table) => (
            <TableThumbnail key={table.id} table={table} />
          ))}
        </div>
      )}
    </div>
  )
}
