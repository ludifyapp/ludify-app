'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { getEffectiveStatus, formatDateTime } from '@/lib/utils'
import { Analytics } from '@/lib/analytics'
import i18n from 'i18next'
import type { GameEvent, Recap } from '@/types'

// Instagram story gradient (public events)
const IG_GRADIENT = 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)'
// Instagram close-friends green (private events)
const IG_GREEN = '#56C57E'
// Amber gradient for recaps
const RECAP_GRADIENT = 'linear-gradient(45deg, #f59e0b, #d97706, #b45309)'

type CarouselItem =
  | { type: 'event'; event: GameEvent }
  | { type: 'recap'; recap: Recap }

interface FriendsCarouselProps {
  events: GameEvent[]
  recaps?: Recap[]
}

export function FriendsCarousel({ events, recaps = [] }: FriendsCarouselProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const updateArrows = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 4)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    updateArrows()
    el.addEventListener('scroll', updateArrows, { passive: true })
    const ro = new ResizeObserver(updateArrows)
    ro.observe(el)
    return () => { el.removeEventListener('scroll', updateArrows); ro.disconnect() }
  }, [updateArrows])

  const scroll = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'left' ? -200 : 200, behavior: 'smooth' })
  }

  // Build event items, one per friend (soonest upcoming first)
  const seenUids = new Set<string>()
  const eventItems: CarouselItem[] = events
    .slice()
    .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime())
    .filter((e) => {
      if (seenUids.has(e.hostUid)) return false
      seenUids.add(e.hostUid)
      return true
    })
    .map((e) => ({ type: 'event', event: e }))

  // Recap items: only for friends without an upcoming event bubble, most recent first
  const recapSeen = new Set<string>(seenUids)
  const recapItems: CarouselItem[] = recaps
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .filter((r) => {
      if (recapSeen.has(r.hostUid)) return false
      recapSeen.add(r.hostUid)
      return true
    })
    .map((r) => ({ type: 'recap', recap: r }))

  const items = [...eventItems, ...recapItems]

  if (items.length === 0) return null

  return (
    <>
      <div className="relative -mx-4">
        {/* Left arrow */}
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-1 top-1/2 -translate-y-1/2 z-10 w-7 h-7 flex items-center justify-center rounded-full bg-surface-container text-on-surface-variant hover:bg-surface-container-high transition-colors"
            aria-label="Scroll left"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        )}

        {/* Right arrow */}
        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-1 top-1/2 -translate-y-1/2 z-10 w-7 h-7 flex items-center justify-center rounded-full bg-surface-container text-on-surface-variant hover:bg-surface-container-high transition-colors"
            aria-label="Scroll right"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        )}

        <div ref={scrollRef} className="overflow-x-auto scrollbar-hide px-4">
        <div className="flex gap-4 w-max py-2">
          {items.map((item, i) => {
            if (item.type === 'event') {
              const event = item.event
              const host = event.players.find((p) => p.isHost)
              const ongoing = getEffectiveStatus(event) === 'ongoing'
              const isPrivate = event.type === 'private'
              return (
                <button
                  key={event.id}
                  onClick={() => { setSelectedIndex(i); Analytics.carouselTapped({ event_id: event.id, game: event.boardGame.name, status: getEffectiveStatus(event) }) }}
                  className="relative flex-shrink-0 focus:outline-none"
                  aria-label={`${host?.name ?? 'Friend'}'s game night`}
                >
                  <div
                    className="w-[60px] h-[60px] rounded-full p-[2.5px]"
                    style={{ background: isPrivate ? IG_GREEN : IG_GRADIENT }}
                  >
                    <div className="w-full h-full rounded-full bg-surface p-[2px]">
                      {host?.photoURL ? (
                        <Image src={host.photoURL} alt={host.name} width={52} height={52} className="rounded-full w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full rounded-full bg-primary-container flex items-center justify-center text-sm font-semibold text-primary">
                          {host?.name?.[0]?.toUpperCase() ?? '?'}
                        </div>
                      )}
                    </div>
                  </div>
                  {ongoing && (
                    <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-tertiary rounded-full border-2 border-surface" />
                  )}
                </button>
              )
            }

            // Recap bubble
            const recap = item.recap
            return (
              <button
                key={recap.id}
                onClick={() => setSelectedIndex(i)}
                className="relative flex-shrink-0 focus:outline-none"
                aria-label={`${recap.hostName}'s recap`}
              >
                <div
                  className="w-[60px] h-[60px] rounded-full p-[2.5px]"
                  style={{ background: RECAP_GRADIENT }}
                >
                  <div className="w-full h-full rounded-full bg-surface p-[2px]">
                    {recap.hostPhoto ? (
                      <Image src={recap.hostPhoto} alt={recap.hostName} width={52} height={52} className="rounded-full w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-sm font-semibold text-amber-700 dark:text-amber-300">
                        {recap.hostName?.[0]?.toUpperCase() ?? '?'}
                      </div>
                    )}
                  </div>
                </div>
                {recap.winner && (
                  <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-amber-400 rounded-full border-2 border-surface flex items-center justify-center text-[7px]">🏆</span>
                )}
              </button>
            )
          })}
        </div>
        </div>
      </div>

      {selectedIndex !== null && (() => {
        const item = items[selectedIndex]
        const nav = {
          index: selectedIndex,
          total: items.length,
          onPrev: () => setSelectedIndex(selectedIndex > 0 ? selectedIndex - 1 : selectedIndex),
          onNext: () => setSelectedIndex(selectedIndex < items.length - 1 ? selectedIndex + 1 : selectedIndex),
          onClose: () => setSelectedIndex(null),
        }
        return item.type === 'event'
          ? <EventPreviewModal event={item.event} {...nav} />
          : <RecapPreviewModal recap={item.recap} {...nav} />
      })()}
    </>
  )
}

function EventPreviewModal({ event, index, total, onPrev, onNext, onClose }: {
  event: GameEvent
  index: number
  total: number
  onPrev: () => void
  onNext: () => void
  onClose: () => void
}) {
  const host = event.players.find((p) => p.isHost)
  const status = getEffectiveStatus(event)
  const ongoing = status === 'ongoing'
  const isPrivate = event.type === 'private'
  const touchStartX = useRef(0)

  // Keyboard navigation (desktop)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft')  onPrev()
      else if (e.key === 'ArrowRight') onNext()
      else if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onPrev, onNext, onClose])

  // Swipe navigation (mobile)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }
  const handleTouchEnd = (e: React.TouchEvent) => {
    const delta = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(delta) > 50) delta > 0 ? onNext() : onPrev()
  }

  return (
    // z-[60] sits above the FAB (z-50)
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm px-4 pb-6 sm:pb-0"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-surface-container rounded-[1.5rem] card-shadow overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Header */}
        <div className="px-5 pt-4 pb-4">
          {/* Nav row: prev · dots · next · close */}
          <div className="flex items-center gap-2 mb-3">
            <button
              onClick={onPrev}
              disabled={index === 0}
              className="w-7 h-7 flex items-center justify-center rounded-full bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest disabled:opacity-30 transition-colors"
              aria-label="Previous"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>

            {/* Dot indicator */}
            <div className="flex items-center gap-1 flex-1 justify-center">
              {Array.from({ length: total }).map((_, i) => (
                <span
                  key={i}
                  className={`rounded-full transition-all ${i === index ? 'w-4 h-1.5 bg-primary' : 'w-1.5 h-1.5 bg-on-surface-variant/30'}`}
                />
              ))}
            </div>

            <button
              onClick={onNext}
              disabled={index === total - 1}
              className="w-7 h-7 flex items-center justify-center rounded-full bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest disabled:opacity-30 transition-colors"
              aria-label="Next"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>

            <div className="w-px h-4 bg-on-surface-variant/20 mx-0.5" />

            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-full bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest transition-colors"
              aria-label="Close"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="pr-8 flex items-start gap-2 flex-wrap mb-1.5">
            {ongoing && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-white bg-emerald-500/90 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                Happening now
              </span>
            )}
            {isPrivate && (
              <span className="text-xs font-medium text-on-surface-variant bg-surface-container-highest px-2 py-0.5 rounded-full">
                🔒 Private
              </span>
            )}
          </div>
          <h2 className="text-xl font-extrabold text-on-surface pr-8 tracking-[-0.02em]">{event.boardGame.name}</h2>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-3.5">
          {/* Host */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-primary-container flex-shrink-0 flex items-center justify-center">
              {host?.photoURL ? (
                <Image src={host.photoURL} alt={host.name ?? ''} width={32} height={32} className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs font-semibold text-primary">{host?.name?.[0]}</span>
              )}
            </div>
            <div>
              <p className="text-xs text-on-surface-variant/60 font-meta">Hosted by</p>
              <p className="text-sm font-semibold text-on-surface">{host?.name ?? 'Unknown'}</p>
            </div>
          </div>

          {/* Date */}
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-on-surface-variant" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-on-surface-variant/60 font-meta">When</p>
              <p className="text-sm font-medium text-on-surface leading-snug font-meta">{formatDateTime(event.dateTime, i18n.language)}</p>
            </div>
          </div>

          {/* Location */}
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-on-surface-variant" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" /><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-on-surface-variant/60 font-meta">Where</p>
              <p className="text-sm font-medium text-on-surface leading-snug font-meta">{event.addressLabel ?? event.address}</p>
              {event.addressLabel && <p className="text-xs text-on-surface-variant/50 font-meta mt-0.5">{event.address}</p>}
            </div>
          </div>

          {/* Players */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-on-surface-variant" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-on-surface-variant/60 font-meta">Players</p>
              <p className="text-sm font-medium text-on-surface font-meta">
                {event.players.length} / {event.maxPlayers}
                <span className="text-on-surface-variant/50 font-normal"> · min {event.minPlayers}</span>
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="px-5 pb-5">
          <Link
            href={`/event/${event.id}`}
            onClick={onClose}
            className="flex items-center justify-center gap-1.5 w-full bg-secondary hover:brightness-110 text-on-secondary font-semibold text-sm py-3 rounded-[0.75rem] transition-all"
          >
            View Event
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  )
}

function RecapPreviewModal({ recap, index, total, onPrev, onNext, onClose }: {
  recap: Recap
  index: number
  total: number
  onPrev: () => void
  onNext: () => void
  onClose: () => void
}) {
  const touchStartX = useRef(0)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') onPrev()
      else if (e.key === 'ArrowRight') onNext()
      else if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onPrev, onNext, onClose])

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm px-4 pb-6 sm:pb-0"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-surface-container rounded-[1.5rem] card-shadow overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX }}
        onTouchEnd={(e) => {
          const delta = touchStartX.current - e.changedTouches[0].clientX
          if (Math.abs(delta) > 50) delta > 0 ? onNext() : onPrev()
        }}
      >
        {/* Header */}
        <div className="px-5 pt-4 pb-4">
          <div className="flex items-center gap-2 mb-3">
            <button onClick={onPrev} disabled={index === 0} className="w-7 h-7 flex items-center justify-center rounded-full bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest disabled:opacity-30 transition-colors" aria-label="Previous">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
            </button>
            <div className="flex items-center gap-1 flex-1 justify-center">
              {Array.from({ length: total }).map((_, i) => (
                <span key={i} className={`rounded-full transition-all ${i === index ? 'w-4 h-1.5 bg-primary' : 'w-1.5 h-1.5 bg-on-surface-variant/30'}`} />
              ))}
            </div>
            <button onClick={onNext} disabled={index === total - 1} className="w-7 h-7 flex items-center justify-center rounded-full bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest disabled:opacity-30 transition-colors" aria-label="Next">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
            </button>
            <div className="w-px h-4 bg-on-surface-variant/20 mx-0.5" />
            <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest transition-colors" aria-label="Close">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 rounded-full mb-1.5">
            🎲 Game recap
          </span>
          <h2 className="text-xl font-extrabold text-on-surface tracking-[-0.02em]">{recap.game.name}</h2>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-3.5">
          {/* Host */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-primary-container flex-shrink-0 flex items-center justify-center">
              {recap.hostPhoto ? (
                <Image src={recap.hostPhoto} alt={recap.hostName} width={32} height={32} className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs font-semibold text-primary">{recap.hostName?.[0]}</span>
              )}
            </div>
            <div>
              <p className="text-xs text-on-surface-variant/60 font-meta">Hosted by</p>
              <p className="text-sm font-semibold text-on-surface">{recap.hostName}</p>
            </div>
          </div>

          {/* Winner */}
          {recap.winner && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0 text-base">🏆</div>
              <div>
                <p className="text-xs text-on-surface-variant/60 font-meta">Winner</p>
                <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">{recap.winner}</p>
              </div>
            </div>
          )}

          {/* Note */}
          {recap.note && (
            <p className="text-sm text-on-surface-variant leading-relaxed line-clamp-3">{recap.note}</p>
          )}

          {/* Players */}
          <p className="text-xs text-on-surface-variant/50 font-meta">{recap.playerCount} players · {new Date(recap.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}</p>
        </div>

        {/* CTA */}
        <div className="px-5 pb-5">
          <Link
            href={`/event/${recap.eventId}`}
            onClick={onClose}
            className="flex items-center justify-center gap-1.5 w-full bg-secondary hover:brightness-110 text-on-secondary font-semibold text-sm py-3 rounded-[0.75rem] transition-all"
          >
            View Event
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  )
}
