import { useState } from 'react'
import Image from 'next/image'
import { GameThumbnail } from '@/components/ui/GameThumbnail'
import { useTranslation } from 'react-i18next'
import { GameEvent } from '@/types'
import { formatDateOnly, formatTimeOnly, isSameDay, getEffectiveStatus } from '@/lib/utils'
import { EventStatusBadge } from './EventStatusBadge'
import { ShareLink } from './ShareLink'

function googleCalendarUrl(event: GameEvent): string {
  const start = new Date(event.dateTime)
  const end = event.endDateTime
    ? new Date(event.endDateTime)
    : new Date(start.getTime() + 2 * 60 * 60 * 1000)

  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `Ludify: ${event.boardGame.name}`,
    dates: `${fmt(start)}/${fmt(end)}`,
    details: event.description ?? `Join us for a game of ${event.boardGame.name}!`,
    location: event.address,
  })

  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

interface EventCardProps {
  event: GameEvent
  onShareClick?: () => void
}

export function EventCard({ event, onShareClick }: EventCardProps) {
  const { t } = useTranslation()
  const [showMap, setShowMap] = useState(false)
  const [copied, setCopied] = useState(false)
  const effectiveStatus = getEffectiveStatus(event)

  const handleCopyAddress = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(event.address).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800 overflow-hidden shadow-sm">
      <div className="flex items-start gap-4 p-6">
        <GameThumbnail
          src={event.boardGame.thumbnail}
          name={event.boardGame.name}
          width={80}
          height={80}
          imgClassName="rounded-xl object-cover flex-shrink-0"
          placeholderClassName="w-20 h-20 rounded-xl bg-gradient-to-br from-teal-100 to-teal-200 dark:from-teal-900/40 dark:to-teal-800/20 flex items-center justify-center flex-shrink-0 text-3xl"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">{event.boardGame.name}</h1>
            <div className="flex items-center gap-2">
              {event.type === 'private' && (
                <span className="text-xs bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 px-2 py-0.5 rounded-full font-medium">🔒 {t('eventCard.private')}</span>
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
                  <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">{t('eventCard.startingDate')}</p>
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
                {t('eventCard.addToCalendar')}
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
                <p className="text-xs font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wide">{t('eventCard.endingDate')}</p>
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
                {t('eventCard.addToCalendar')}
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
        <div 
          className="px-6 py-3 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors group"
          onClick={() => setShowMap(!showMap)}
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-lg flex-shrink-0">📍</span>
            <div className="min-w-0">
              {event.addressLabel && (
                <p className="text-sm font-semibold text-slate-800 dark:text-zinc-200 truncate">{event.addressLabel}</p>
              )}
              <p className={`text-sm text-slate-600 dark:text-zinc-300 ${showMap ? 'break-words line-clamp-2' : 'truncate'}`}>
                {event.address}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={handleCopyAddress}
              className="p-1.5 text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors relative"
              title={t('eventCard.copyAddress', 'Copy address')}
            >
              {copied ? (
                <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                </svg>
              )}
            </button>
            <div className={`p-1.5 rounded-lg transition-colors ${showMap ? 'bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300'}`}>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z"/>
              </svg>
            </div>
          </div>
        </div>
        {showMap && (
          <div className="overflow-hidden border-t border-slate-100 dark:border-zinc-800">
            <iframe
              title={t('eventCard.eventLocation')}
              src={`https://maps.google.com/maps?q=${encodeURIComponent(event.address)}&output=embed`}
              className="w-full h-40 border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        )}
        <div className="px-6 py-3 flex items-center gap-3">
          <span className="text-lg">👥</span>
          <span className="text-sm text-slate-600 dark:text-zinc-300">
            {event.minPlayers ?? 2}–{event.maxPlayers} {t('eventCard.players')}
          </span>
        </div>
        {onShareClick && (
          <div className="px-6 py-4 border-t border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/30">
            <ShareLink eventId={event.id} eventName={event.boardGame.name} onInviteFriends={onShareClick} />
          </div>
        )}
      </div>
    </div>
  )
}
