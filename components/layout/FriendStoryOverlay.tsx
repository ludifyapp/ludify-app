'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { GameThumbnail } from '@/components/ui/GameThumbnail'
import { getEffectiveStatus } from '@/lib/utils'
import type { FriendDisplayItem, GameEvent } from '@/types'

interface FriendStoryOverlayProps {
  friends: FriendDisplayItem[]
  initialFriendIndex: number
  onClose: () => void
}

// ─── Flanking preview card (desktop) ─────────────────────────────────────────

function FlankingCard({
  friend,
  onClick,
}: {
  friend: FriendDisplayItem
  onClick: () => void
}) {
  const event = friend.events[0]
  return (
    <button
      onClick={onClick}
      className="relative w-44 h-72 rounded-[1.5rem] overflow-hidden flex-shrink-0 focus:outline-none hover:scale-[1.02] transition-transform"
    >
      {event?.boardGame.thumbnail ? (
        <Image src={event.boardGame.thumbnail} alt={event.boardGame.name} fill className="object-cover" unoptimized />
      ) : (
        <div className="absolute inset-0 bg-zinc-800" />
      )}
      <div className="absolute inset-0 bg-black/40" />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-3">
        {friend.photo ? (
          <Image src={friend.photo} alt={friend.name} width={48} height={48}
            className="w-12 h-12 rounded-full object-cover border-2 border-white/60" />
        ) : (
          <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center text-sm font-bold text-on-primary-container border-2 border-white/60">
            {friend.name[0]?.toUpperCase()}
          </div>
        )}
        <p className="text-white text-xs font-bold text-center truncate max-w-full drop-shadow">{friend.name.split(' ')[0]}</p>
        {event && (
          <p className="text-white/80 text-[10px] text-center line-clamp-2 max-w-full drop-shadow">{event.boardGame.name}</p>
        )}
      </div>
    </button>
  )
}

// ─── Story card content ────────────────────────────────────────────────────────
// Navigation logic (Instagram-style):
//   Tap LEFT  third → prev event; if first event → prev friend
//   Tap RIGHT third → next event; if last event  → next friend
//   Progress dots   → jump to specific event

interface StoryCardProps {
  friend: FriendDisplayItem
  eventIndex: number
  onEventIndexChange: (i: number) => void
  onNextFriend: () => void
  onPrevFriend: () => void
}

function StoryCard({ friend, eventIndex, onEventIndexChange, onNextFriend, onPrevFriend }: StoryCardProps) {
  const router = useRouter()
  const { t } = useTranslation()
  const events = friend.events
  const event = events[eventIndex] as GameEvent | undefined

  function handleTapLeft() {
    if (eventIndex > 0) onEventIndexChange(eventIndex - 1)
    else onPrevFriend()
  }

  function handleTapRight() {
    if (eventIndex < events.length - 1) onEventIndexChange(eventIndex + 1)
    else onNextFriend()
  }

  if (!event) return null

  const now = new Date()
  const dateTime = new Date(event.dateTime)
  const diffDays = Math.floor((dateTime.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  const timeLabel = dateTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  const dateLabel =
    diffDays === 0 ? 'Today'
    : diffDays === 1 ? 'Tomorrow'
    : diffDays > 1 && diffDays <= 6
      ? dateTime.toLocaleDateString('en', { weekday: 'long' })
      : dateTime.toLocaleDateString('en', { month: 'short', day: 'numeric' })

  const status = getEffectiveStatus(event)
  const statusStyles: Record<string, string> = {
    waiting:   'bg-primary-container text-on-primary-container',
    full:      'bg-secondary-container text-on-secondary-container',
    ongoing:   'bg-tertiary-container text-on-tertiary-container',
    ended:     'bg-surface-container-highest text-on-surface-variant/60',
    cancelled: 'bg-error-container text-error',
  }

  const host = event.players.find(p => p.isHost)
  const nonHostPlayers = event.players.filter((p, i, arr) => !p.isHost && arr.findIndex(x => x.id === p.id) === i)
  const visiblePlayers = nonHostPlayers.slice(0, 3)
  const overflowCount = nonHostPlayers.length - visiblePlayers.length
  const shortAddress = event.addressLabel ?? event.address.split(',')[0]

  return (
    <div className="relative flex flex-col h-full bg-black overflow-hidden select-none">

      {/* ── Tap zones (full height, over everything except CTA) ── */}
      {/* Left: prev event / prev friend */}
      <button
        className="absolute left-0 top-0 bottom-20 w-[35%] z-20 focus:outline-none"
        aria-label="Previous"
        onClick={handleTapLeft}
      />
      {/* Right: next event / next friend */}
      <button
        className="absolute right-0 top-0 bottom-20 w-[35%] z-20 focus:outline-none"
        aria-label="Next"
        onClick={handleTapRight}
      />

      {/* ── Progress bars ── */}
      <div className="absolute top-3 left-4 right-4 flex gap-1 z-30 pointer-events-none">
        {events.map((_, i) => (
          <div
            key={i}
            className={`h-0.5 flex-1 rounded-full transition-colors ${i === eventIndex ? 'bg-white' : 'bg-white/30'}`}
          />
        ))}
      </div>
      {/* Dot indicators — clickable, sit above tap zones */}
      {events.length > 1 && (
        <div className="absolute top-2 left-4 right-4 flex gap-1 z-30">
          {events.map((_, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); onEventIndexChange(i) }}
              className="h-4 flex-1 opacity-0"
              aria-label={`Event ${i + 1}`}
            />
          ))}
        </div>
      )}

      {/* ── Top bar: friend info ── */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center gap-3 px-4 pt-8 pb-6 bg-gradient-to-b from-black/70 to-transparent pointer-events-none">
        <div className="flex-shrink-0">
          {friend.photo ? (
            <Image src={friend.photo} alt={friend.name} width={36} height={36}
              className="w-9 h-9 rounded-full object-cover border-2 border-white/30" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-primary-container flex items-center justify-center text-sm font-bold text-on-primary-container border-2 border-white/30">
              {friend.name[0]?.toUpperCase()}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm truncate">{friend.name.split(' ')[0]}</p>
          <p className="text-white/50 text-[11px]">
            {friend.activity === 'ongoing' ? t('friendActivity.playingNow') : t('friendActivity.upcomingGame')}
          </p>
        </div>
        {events.length > 1 && (
          <span className="text-white/50 text-xs font-semibold mr-8">{eventIndex + 1}/{events.length}</span>
        )}
      </div>

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-y-auto">
        {/* Hero */}
        <div className="relative w-full" style={{ height: '55%', minHeight: 240 }}>
          <GameThumbnail
            src={event.boardGame.thumbnail}
            name={event.boardGame.name}
            width={600}
            height={600}
            imgClassName="w-full h-full object-cover"
            placeholderClassName="w-full h-full flex items-center justify-center text-8xl font-extrabold text-white/10 bg-zinc-900"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent" />

          {/* Status chip — clear of tap zone and top bar */}
          <div className={`absolute top-14 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full z-10 ${statusStyles[status]}`}>
            <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100 8 4 4 0 000-8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
            </svg>
            <span className="text-[10px] font-bold">{t(`eventStatus.${status}`)} · {event.players.length}/{event.maxPlayers}</span>
          </div>

          {event.type === 'private' && (
            <div className="absolute bottom-4 left-4 z-10">
              <span className="text-[10px] font-bold text-green-300 bg-green-500/20 border border-green-500/40 px-2.5 py-1 rounded-full">
                {t('friendActivity.closeFriends')}
              </span>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="px-5 pt-4 pb-28 bg-black">
          <h2 className="text-xl font-extrabold text-white tracking-tight mb-1">{event.boardGame.name}</h2>
          <p className="text-sm font-semibold text-pink-400 font-meta mb-3" suppressHydrationWarning>
            {dateLabel} · {timeLabel}
          </p>

          {shortAddress && (
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-4 h-4 text-white/40 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
              </svg>
              <p className="text-sm text-white/60 truncate">{shortAddress}</p>
            </div>
          )}

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              {visiblePlayers.length > 0 ? (
                <>
                  <div className="flex -space-x-2 flex-shrink-0">
                    {visiblePlayers.map((p, i) => (
                      p.photoURL ? (
                        <Image key={p.id} src={p.photoURL} alt={p.name} width={28} height={28}
                          className="w-7 h-7 rounded-full object-cover border-2 border-black"
                          style={{ zIndex: visiblePlayers.length - i }} />
                      ) : (
                        <div key={p.id} className="w-7 h-7 rounded-full bg-primary-container border-2 border-black flex items-center justify-center text-[9px] font-bold text-on-primary-container"
                          style={{ zIndex: visiblePlayers.length - i }}>
                          {p.name[0]?.toUpperCase()}
                        </div>
                      )
                    ))}
                  </div>
                  {overflowCount > 0 && <span className="text-xs text-white/40 font-meta">+{overflowCount}</span>}
                </>
              ) : (
                <span className="text-xs text-white/30 font-meta">No players yet</span>
              )}
            </div>
            {host && (
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {host.photoURL ? (
                  <Image src={host.photoURL} alt={host.name} width={24} height={24} className="w-6 h-6 rounded-full object-cover" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center text-[9px] font-bold text-white/60">
                    {host.name[0]?.toUpperCase()}
                  </div>
                )}
                <span className="text-xs font-semibold text-white/60 font-meta truncate max-w-[80px]">{host.name.split(' ')[0]}</span>
              </div>
            )}
          </div>

          {event.description && (
            <p className="text-sm text-white/50 mt-4 leading-relaxed line-clamp-3">{event.description}</p>
          )}
        </div>
      </div>

      {/* ── CTA pinned to bottom ── */}
      <div className="absolute bottom-0 left-0 right-0 px-5 pb-6 pt-4 bg-gradient-to-t from-black to-transparent z-30">
        <button
          className="w-full bg-pink-500 hover:bg-pink-400 text-white font-bold py-3.5 rounded-full text-sm active:scale-95 transition-all"
          onClick={() => router.push(`/event/${event.id}`)}
        >
          {t('friendActivity.viewEvent')}
        </button>
      </div>
    </div>
  )
}

// ─── Main overlay ─────────────────────────────────────────────────────────────

export function FriendStoryOverlay({ friends, initialFriendIndex, onClose }: FriendStoryOverlayProps) {
  const [friendIndex, setFriendIndex] = useState(initialFriendIndex)
  const [eventIndex, setEventIndex] = useState(0)
  const touchStartY = useRef<number | null>(null)

  const friend = friends[friendIndex]

  useEffect(() => { setEventIndex(0) }, [friendIndex])

  const goNextFriend = useCallback(() => {
    if (friendIndex < friends.length - 1) setFriendIndex(i => i + 1)
    else onClose()
  }, [friendIndex, friends.length, onClose])

  const goPrevFriend = useCallback(() => {
    if (friendIndex > 0) setFriendIndex(i => i - 1)
  }, [friendIndex])

  // Keyboard: arrows navigate friends, Escape closes
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') goNextFriend()
      if (e.key === 'ArrowLeft') goPrevFriend()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose, goNextFriend, goPrevFriend])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  // Swipe-down only (left/right taps are handled inside StoryCard)
  function handleTouchStart(e: React.TouchEvent) {
    touchStartY.current = e.touches[0].clientY
  }
  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartY.current === null) return
    const dy = e.changedTouches[0].clientY - touchStartY.current
    if (dy > 90) onClose()
    touchStartY.current = null
  }

  if (!friend) return null

  const prevFriend = friendIndex > 0 ? friends[friendIndex - 1] : null
  const nextFriend = friendIndex < friends.length - 1 ? friends[friendIndex + 1] : null

  return (
    <div
      className="fixed inset-0 z-[70] bg-black flex items-center justify-center"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Backdrop click → close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* ── Left flanking card (desktop) ── */}
      <div className="hidden md:flex items-center justify-end z-10 w-52 mr-6 flex-shrink-0">
        {prevFriend && (
          <FlankingCard
            friend={prevFriend}
            onClick={() => goPrevFriend()}
          />
        )}
      </div>

      {/* ── Prev friend arrow (desktop) ── */}
      {prevFriend && (
        <button
          className="hidden md:flex absolute left-5 z-20 w-10 h-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          onClick={(e) => { e.stopPropagation(); goPrevFriend() }}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      )}

      {/* ── Center story card ── */}
      <div
        className="relative z-10 w-full h-full md:w-[390px] md:h-[680px] md:rounded-[2rem] md:overflow-hidden flex-shrink-0"
        onClick={e => e.stopPropagation()}
      >
        <StoryCard
          friend={friend}
          eventIndex={eventIndex}
          onEventIndexChange={setEventIndex}
          onNextFriend={goNextFriend}
          onPrevFriend={goPrevFriend}
        />
      </div>

      {/* ── Next friend arrow (desktop) ── */}
      {nextFriend && (
        <button
          className="hidden md:flex absolute right-5 z-20 w-10 h-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          onClick={(e) => { e.stopPropagation(); goNextFriend() }}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      )}

      {/* ── Right flanking card (desktop) ── */}
      <div className="hidden md:flex items-center justify-start z-10 w-52 ml-6 flex-shrink-0">
        {nextFriend && (
          <FlankingCard
            friend={nextFriend}
            onClick={() => goNextFriend()}
          />
        )}
      </div>

      {/* ── Close button ── */}
      <button
        className="absolute top-5 right-5 z-30 w-9 h-9 flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
        onClick={onClose}
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}
