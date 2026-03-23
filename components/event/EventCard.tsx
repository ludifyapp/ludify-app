import { useState } from 'react'
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
    <div className="bg-surface-container rounded-[1.5rem] overflow-hidden">
      <div className="flex items-start gap-4 p-6">
        <GameThumbnail
          src={event.boardGame.thumbnail}
          name={event.boardGame.name}
          width={80}
          height={80}
          imgClassName="rounded-[1.5rem] object-cover flex-shrink-0"
          placeholderClassName="w-20 h-20 rounded-[1.5rem] bg-primary-container flex items-center justify-center flex-shrink-0 text-3xl"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <h1 className="text-xl font-extrabold text-on-surface tracking-[-0.02em]">{event.boardGame.name}</h1>
            <div className="flex items-center gap-2">
              {event.type === 'private' && (
                <span className="text-xs bg-surface-container-highest text-on-surface-variant/80 px-2 py-0.5 rounded-full font-medium">🔒 {t('eventCard.private')}</span>
              )}
              <EventStatusBadge status={effectiveStatus} />
            </div>
          </div>
          {event.boardGame.yearPublished && (
            <p className="text-sm text-on-surface-variant/60 font-meta mt-0.5">{event.boardGame.yearPublished}</p>
          )}
          {event.description && (
            <p className="text-sm text-on-surface-variant mt-2">{event.description}</p>
          )}
        </div>
      </div>
      <div>
        {event.endDateTime && !isSameDay(event.dateTime, event.endDateTime) ? (
          <>
            {/* Multi-day: Starting date */}
            <div className="px-6 py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-lg flex-shrink-0">📅</span>
                <div>
                  <p className="text-xs font-medium text-on-surface-variant/60 font-meta uppercase tracking-wide">{t('eventCard.startingDate')}</p>
                  <p className="text-sm text-on-surface-variant font-meta">{formatDateOnly(event.dateTime)}</p>
                </div>
              </div>
              <a
                href={googleCalendarUrl(event)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 flex-shrink-0 text-xs font-semibold text-on-primary-container bg-primary-container hover:brightness-110 px-2.5 py-1.5 rounded-[0.75rem] transition-all"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z"/>
                </svg>
                {t('eventCard.addToCalendar')}
              </a>
            </div>
            <div className="px-6 py-3 flex items-center gap-3">
              <span className="text-lg">🕐</span>
              <span className="text-sm text-on-surface-variant font-meta">{formatTimeOnly(event.dateTime)}</span>
            </div>
            {/* Multi-day: Ending date */}
            <div className="px-6 py-3 flex items-center gap-3">
              <span className="text-lg flex-shrink-0">📅</span>
              <div>
                <p className="text-xs font-semibold text-on-surface-variant/60 font-meta uppercase tracking-wide">{t('eventCard.endingDate')}</p>
                <p className="text-sm text-on-surface-variant font-meta">{formatDateOnly(event.endDateTime)}</p>
              </div>
            </div>
            <div className="px-6 py-3 flex items-center gap-3">
              <span className="text-lg">🕐</span>
              <span className="text-sm text-on-surface-variant font-meta">{formatTimeOnly(event.endDateTime)}</span>
            </div>
          </>
        ) : (
          <>
            {/* Same-day: date + calendar button */}
            <div className="px-6 py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-lg flex-shrink-0">📅</span>
                <span className="text-sm text-on-surface-variant font-meta">{formatDateOnly(event.dateTime)}</span>
              </div>
              <a
                href={googleCalendarUrl(event)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 flex-shrink-0 text-xs font-semibold text-on-primary-container bg-primary-container hover:brightness-110 px-2.5 py-1.5 rounded-[0.75rem] transition-all"
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
              <span className="text-sm text-on-surface-variant font-meta">
                {formatTimeOnly(event.dateTime)}
                {event.endDateTime && ` → ${formatTimeOnly(event.endDateTime)}`}
              </span>
            </div>
          </>
        )}
        <div
          className="px-6 py-3 flex items-center justify-between gap-3 cursor-pointer hover:bg-surface-container-high transition-colors group"
          onClick={() => setShowMap(!showMap)}
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-lg flex-shrink-0">📍</span>
            <div className="min-w-0">
              {event.addressLabel && (
                <p className="text-sm font-semibold text-on-surface truncate">{event.addressLabel}</p>
              )}
              <p className={`text-sm text-on-surface-variant font-meta ${showMap ? 'break-words line-clamp-2' : 'truncate'}`}>
                {event.address}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={handleCopyAddress}
              className="p-1.5 text-on-surface-variant hover:text-primary transition-colors relative"
              title={t('eventCard.copyAddress', 'Copy address')}
            >
              {copied ? (
                <svg className="w-4 h-4 text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                </svg>
              )}
            </button>
            <div className={`p-1.5 rounded-[0.75rem] transition-colors ${showMap ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant hover:text-on-surface'}`}>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z"/>
              </svg>
            </div>
          </div>
        </div>
        {showMap && (
          <div className="overflow-hidden">
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
          <span className="text-sm text-on-surface-variant font-meta">
            {event.minPlayers ?? 2}–{event.maxPlayers} {t('eventCard.players')}
          </span>
        </div>
        {onShareClick && (
          <div className="px-6 py-4 bg-surface-container-high/50">
            <ShareLink eventId={event.id} eventName={event.boardGame.name} onInviteFriends={onShareClick} />
          </div>
        )}
      </div>
    </div>
  )
}
