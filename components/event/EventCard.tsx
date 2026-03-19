import Image from 'next/image'
import { GameEvent } from '@/types'
import { formatDateOnly, formatTimeOnly, isSameDay, getEffectiveStatus } from '@/lib/utils'
import { EventStatusBadge } from './EventStatusBadge'

function googleCalendarUrl(event: GameEvent): string {
  const start = new Date(event.dateTime)
  const end = event.endDateTime
    ? new Date(event.endDateTime)
    : new Date(start.getTime() + 2 * 60 * 60 * 1000)

  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `Game Night: ${event.boardGame.name}`,
    dates: `${fmt(start)}/${fmt(end)}`,
    details: event.description ?? `Join us for a game of ${event.boardGame.name}!`,
    location: event.address,
  })

  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

interface EventCardProps {
  event: GameEvent
}

export function EventCard({ event }: EventCardProps) {
  const effectiveStatus = getEffectiveStatus(event)
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800 overflow-hidden shadow-sm">
      <div className="flex items-start gap-4 p-6">
        {event.boardGame.thumbnail ? (
          <Image
            src={event.boardGame.thumbnail}
            alt={event.boardGame.name}
            width={80}
            height={80}
            className="rounded-xl object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-teal-100 to-teal-200 dark:from-teal-900/40 dark:to-teal-800/20 flex items-center justify-center flex-shrink-0">
            <span className="text-3xl">🎲</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">{event.boardGame.name}</h1>
            <div className="flex items-center gap-2">
              {event.type === 'private' && (
                <span className="text-xs bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 px-2 py-0.5 rounded-full font-medium">🔒 Private</span>
              )}
              <EventStatusBadge status={effectiveStatus} />
            </div>
          </div>
          {event.boardGame.yearPublished && (
            <p className="text-sm text-slate-400 dark:text-zinc-500 mt-0.5">{event.boardGame.yearPublished}</p>
          )}
          {event.description && (
            <p className="text-sm text-slate-600 dark:text-zinc-300 mt-2">{event.description}</p>
          )}
        </div>
      </div>
      <div className="border-t border-slate-100 dark:border-zinc-800 divide-y divide-slate-100 dark:divide-zinc-800">
        {event.endDateTime && !isSameDay(event.dateTime, event.endDateTime) ? (
          <>
            {/* Multi-day: Starting date */}
            <div className="px-6 py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-lg flex-shrink-0">📅</span>
                <div>
                  <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">Starting date</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{formatDateOnly(event.dateTime)}</p>
                </div>
              </div>
              <a
                href={googleCalendarUrl(event)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 flex-shrink-0 text-xs font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-800 dark:hover:text-teal-300 bg-teal-50 dark:bg-teal-900/20 hover:bg-teal-100 dark:hover:bg-teal-900/40 px-2.5 py-1.5 rounded-xl transition-colors"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z"/>
                </svg>
                Add to Google Calendar
              </a>
            </div>
            <div className="px-6 py-3 flex items-center gap-3">
              <span className="text-lg">🕐</span>
              <span className="text-sm text-slate-600 dark:text-zinc-300">{formatTimeOnly(event.dateTime)}</span>
            </div>
            {/* Multi-day: Ending date */}
            <div className="px-6 py-3 flex items-center gap-3">
              <span className="text-lg flex-shrink-0">📅</span>
              <div>
                <p className="text-xs font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wide">Ending date</p>
                <p className="text-sm text-slate-600 dark:text-zinc-300">{formatDateOnly(event.endDateTime)}</p>
              </div>
            </div>
            <div className="px-6 py-3 flex items-center gap-3">
              <span className="text-lg">🕐</span>
              <span className="text-sm text-slate-600 dark:text-zinc-300">{formatTimeOnly(event.endDateTime)}</span>
            </div>
          </>
        ) : (
          <>
            {/* Same-day: date + calendar button */}
            <div className="px-6 py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-lg flex-shrink-0">📅</span>
                <span className="text-sm text-slate-600 dark:text-zinc-300">{formatDateOnly(event.dateTime)}</span>
              </div>
              <a
                href={googleCalendarUrl(event)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 flex-shrink-0 text-xs font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-800 dark:hover:text-teal-300 bg-teal-50 dark:bg-teal-900/20 hover:bg-teal-100 dark:hover:bg-teal-900/40 px-2.5 py-1.5 rounded-xl transition-colors"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z"/>
                </svg>
                Add to Google Calendar
              </a>
            </div>
            {/* Same-day: time row */}
            <div className="px-6 py-3 flex items-center gap-3">
              <span className="text-lg">🕐</span>
              <span className="text-sm text-slate-600 dark:text-zinc-300">
                {formatTimeOnly(event.dateTime)}
                {event.endDateTime && ` → ${formatTimeOnly(event.endDateTime)}`}
              </span>
            </div>
          </>
        )}
        <div className="px-6 py-3 flex items-center gap-3">
          <span className="text-lg flex-shrink-0">📍</span>
          <div>
            {event.addressLabel && (
              <p className="text-sm font-semibold text-slate-800 dark:text-zinc-200">{event.addressLabel}</p>
            )}
            <p className="text-sm text-slate-600 dark:text-zinc-300">{event.address}</p>
          </div>
        </div>
        <div className="px-6 py-3 flex items-center gap-3">
          <span className="text-lg">👥</span>
          <span className="text-sm text-slate-600 dark:text-zinc-300">
            {event.minPlayers ?? 2}–{event.maxPlayers} players
          </span>
        </div>
      </div>
    </div>
  )
}
