'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { GameThumbnail } from '@/components/ui/GameThumbnail'
import { TableStatusBadge } from '@/components/table/TableStatusBadge'
import { getEffectiveStatus } from '@/lib/utils'
import type { FriendDisplayItem, GameTable, Recap } from '@/types'

interface FriendStoryOverlayProps {
  friends: FriendDisplayItem[]
  initialFriendIndex: number
  onClose: () => void
  onFriendSeen?: (tableIds: string[]) => void
}

// ─── Flanking preview card (desktop) ─────────────────────────────────────────

function FlankingCard({
  friend,
  onClick,
}: {
  friend: FriendDisplayItem
  onClick: () => void
}) {
  const table = friend.tables[0]
  const thumbnail = table?.boardGame.thumbnail ?? friend.recap?.game.thumbnail
  const gameName = table?.boardGame.name ?? friend.recap?.game.name ?? ''
  return (
    <button
      onClick={onClick}
      className="relative w-44 h-72 rounded-[1.5rem] overflow-hidden flex-shrink-0 focus:outline-none hover:scale-[1.02] transition-transform"
    >
      {thumbnail ? (
        <Image src={thumbnail} alt={gameName} fill className="object-cover" unoptimized />
      ) : (
        <div className="absolute inset-0 bg-zinc-800" />
      )}
      {/* Light top scrim */}
      <div className="absolute inset-0 bg-black/20" />
      {/* Dark bottom gradient for text legibility */}
      <div className="absolute bottom-0 left-0 right-0 h-2/3 bg-gradient-to-t from-black/90 via-black/55 to-transparent" />
      {/* Content anchored to bottom */}
      <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center pb-4 px-3 gap-1.5">
        {friend.photo ? (
          <Image src={friend.photo} alt={friend.name} width={44} height={44}
            className="w-11 h-11 rounded-full object-cover border-2 border-white/70" />
        ) : (
          <div className="w-11 h-11 rounded-full bg-primary-container flex items-center justify-center text-sm font-bold text-on-primary-container border-2 border-white/70">
            {friend.name[0]?.toUpperCase()}
          </div>
        )}
        <p
          className="text-white text-xs font-bold text-center truncate max-w-full"
          style={{ textShadow: '0 1px 6px rgba(0,0,0,0.9)' }}
        >
          {friend.name.split(' ')[0]}
        </p>
        {gameName && (
          <p
            className="text-white/90 text-[10px] text-center line-clamp-2 max-w-full"
            style={{ textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}
          >
            {gameName}
          </p>
        )}
      </div>
    </button>
  )
}

// ─── Recap story card ─────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const h = Math.floor((Date.now() - new Date(iso).getTime()) / 3_600_000)
  if (h < 1) return 'Just now'
  if (h < 24) return `${h}h ago`
  return 'Yesterday'
}

function RecapStoryCard({
  friend,
  recap,
  onNext,
  onPrev,
}: {
  friend: FriendDisplayItem
  recap: Recap
  onNext: () => void
  onPrev: () => void
}) {
  const router = useRouter()
  const { t } = useTranslation()
  const surface = '#040d22'

  const [pillVisible, setPillVisible] = useState(false)
  const pillDismissRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const longPressRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const wasLongPress = useRef(false)

  function showPill() {
    setPillVisible(true)
    clearTimeout(pillDismissRef.current)
    pillDismissRef.current = setTimeout(() => setPillVisible(false), 3500)
  }

  function handlePointerDown() {
    wasLongPress.current = false
    longPressRef.current = setTimeout(() => { wasLongPress.current = true; showPill() }, 500)
  }
  function handlePointerUp() { clearTimeout(longPressRef.current) }

  function handleTapLeft()   { if (wasLongPress.current) { wasLongPress.current = false; return } onPrev() }
  function handleTapRight()  { if (wasLongPress.current) { wasLongPress.current = false; return } onNext() }
  function handleCenterTap() { if (!wasLongPress.current) showPill() }

  return (
    <div
      className="relative flex flex-col h-full overflow-hidden select-none"
      style={{ background: surface }}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onContextMenu={(e) => e.preventDefault()}
    >

      {/* ── Tap zones ── */}
      <button className="absolute left-0 inset-y-0 w-[35%] z-20 focus:outline-none" aria-label="Previous" onClick={handleTapLeft} />
      <button className="absolute right-0 inset-y-0 w-[35%] z-20 focus:outline-none" aria-label="Next" onClick={handleTapRight} />
      <button className="absolute left-[35%] right-[35%] inset-y-0 z-20 focus:outline-none" aria-label="View table" onClick={handleCenterTap} />

      {/* ── Single filled progress bar (no auto-advance for recaps) ── */}
      <div className="absolute top-3 left-4 right-4 flex gap-1 z-30 pointer-events-none">
        <div className="h-[3px] flex-1 rounded-full bg-white/60" />
      </div>

      {/* ── Top bar ── */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center gap-2.5 px-4 pt-7 pb-10 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.55) 60%, transparent 100%)' }}>
        <div className="flex-shrink-0">
          {friend.photo ? (
            <Image src={friend.photo} alt={friend.name} width={32} height={32}
              className="w-8 h-8 rounded-full object-cover border-2 border-white/40" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-xs font-bold text-on-primary-container border-2 border-white/40">
              {friend.name[0]?.toUpperCase()}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm leading-tight truncate"
            style={{ textShadow: '0 1px 4px rgba(0,0,0,0.7)' }}>
            {friend.name.split(' ')[0]}
          </p>
          <p className="text-white/75 text-[10px] leading-tight"
            style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
            {t('friendActivity.playedRecently')}
          </p>
        </div>
      </div>

      {/* ── Hero image ── */}
      <div className="relative w-full flex-shrink-0" style={{ height: '56%', minHeight: 220 }}>
        <GameThumbnail
          src={recap.game.thumbnail}
          name={recap.game.name}
          width={600}
          height={600}
          imgClassName="w-full h-full object-cover"
          placeholderClassName="w-full h-full flex items-center justify-center text-8xl font-extrabold text-white/10 bg-[#0f1c36]"
        />
        <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom, transparent 40%, ${surface} 100%)` }} />
      </div>

      {/* ── Date + status strip ── */}
      <div className="flex items-end justify-between px-5 -mt-8 relative z-10 mb-3">
        <div>
          <p className="font-extrabold leading-none tracking-tight text-[#a3a6ff]" style={{ fontSize: 28 }}>
            {timeAgo(recap.createdAt)}
          </p>
          <p className="text-white/55 font-medium mt-1" style={{ fontSize: 13 }}>
            {t('friendActivity.gameNight')}
          </p>
        </div>
        <span className="text-xs font-bold px-3 py-1.5 rounded-full flex-shrink-0 bg-white/10 text-white/70">
          {t('friendActivity.recap')} · {recap.playerCount} {t('friendActivity.players')}
        </span>
      </div>

      {/* ── Content ── */}
      <div className="px-5 pb-6 flex-1" style={{ background: surface }}>
        <h2 className="text-[19px] font-extrabold text-white tracking-tight leading-tight mb-3">
          {recap.game.name}
        </h2>

        {/* Winner */}
        {recap.winner && (
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base">🏆</span>
            <span className="text-[13px] font-bold text-[#a3a6ff]">{recap.winner}</span>
          </div>
        )}

        {/* Note */}
        {recap.note && (
          <p className="text-[12px] text-white/50 leading-relaxed line-clamp-3">{recap.note}</p>
        )}
      </div>

      {/* ── View Table pill (tap center or long-press) ── */}
      {pillVisible && (
        <div
          className="absolute left-1/2 z-40 pointer-events-none"
          style={{ animation: 'pill-appear 0.2s ease forwards', transform: 'translateX(-50%)', top: 'calc(56% - 3.5rem)' }}
        >
          <button
            className="pointer-events-auto flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-semibold text-white whitespace-nowrap active:scale-95 transition-transform"
            style={{ background: 'rgba(0,0,0,0.62)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}
            onClick={() => router.push(`/table/${recap.tableId}`)}
          >
            {t('friendActivity.viewTable')}
            <svg className="w-3.5 h-3.5 opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Story card content ────────────────────────────────────────────────────────
// Navigation logic (Instagram-style):
//   Tap LEFT  third → prev table; if first table → prev friend
//   Tap RIGHT third → next table; if last table  → next friend
//   Progress dots   → jump to specific table

interface StoryCardProps {
  friend: FriendDisplayItem
  tableIndex: number
  onTableIndexChange: (i: number) => void
  onNextFriend: () => void
  onPrevFriend: () => void
}

function StoryCard({ friend, tableIndex, onTableIndexChange, onNextFriend, onPrevFriend }: StoryCardProps) {
  const router = useRouter()
  const { t, i18n } = useTranslation()
  const tables = friend.tables
  const table = tables[tableIndex] as GameTable | undefined

  // ── View-table pill ───────────────────────────────────────────────
  const [pillVisible, setPillVisible] = useState(false)
  const pillDismissRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const longPressRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const wasLongPress = useRef(false)

  function showPill() {
    setPillVisible(true)
    clearTimeout(pillDismissRef.current)
    pillDismissRef.current = setTimeout(() => setPillVisible(false), 3500)
  }

  function handlePointerDown() {
    wasLongPress.current = false
    longPressRef.current = setTimeout(() => { wasLongPress.current = true; showPill() }, 500)
  }
  function handlePointerUp() { clearTimeout(longPressRef.current) }

  function handleTapLeft() {
    if (wasLongPress.current) { wasLongPress.current = false; return }
    if (tableIndex > 0) onTableIndexChange(tableIndex - 1)
    else onPrevFriend()
  }

  function handleTapRight() {
    if (wasLongPress.current) { wasLongPress.current = false; return }
    if (tableIndex < tables.length - 1) onTableIndexChange(tableIndex + 1)
    else onNextFriend()
  }

  function handleCenterTap() {
    if (!wasLongPress.current) showPill()
  }

  // Auto-advance after 4 s; paused while pill is visible
  useEffect(() => {
    if (pillVisible) return
    const timer = setTimeout(() => {
      if (tableIndex < tables.length - 1) onTableIndexChange(tableIndex + 1)
      else onNextFriend()
    }, 4000)
    return () => clearTimeout(timer)
  }, [tableIndex, tables.length, friend.uid, pillVisible, onTableIndexChange, onNextFriend])

  if (!table) return null

  const now = new Date()
  const dateTime = new Date(table.dateTime)
  const diffDays = Math.floor((dateTime.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  const timeLabel = dateTime.toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit' })
  const dateLabel =
    diffDays === 0 ? t('home.today')
    : diffDays === 1 ? t('home.tomorrow')
    : diffDays > 1 && diffDays <= 6
      ? dateTime.toLocaleDateString(i18n.language, { weekday: 'long' })
      : dateTime.toLocaleDateString(i18n.language, { month: 'short', day: 'numeric' })

  const status = getEffectiveStatus(table)

  const nonHostPlayers = table.players.filter((p, i, arr) => !p.isHost && arr.findIndex(x => x.id === p.id) === i)
  const visiblePlayers = nonHostPlayers.slice(0, 3)
  const overflowCount = nonHostPlayers.length - visiblePlayers.length
  const shortAddress = table.addressLabel ?? table.address.split(',')[0]

  // Surface color matching app's design system (#040d22)
  const surface = '#040d22'


  return (
    <div
      className="relative flex flex-col h-full overflow-hidden select-none"
      style={{ background: surface }}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onContextMenu={(e) => e.preventDefault()}
    >

      {/* ── Tap zones ── */}
      <button className="absolute left-0 inset-y-0 w-[35%] z-20 focus:outline-none" aria-label="Previous" onClick={handleTapLeft} />
      <button className="absolute right-0 inset-y-0 w-[35%] z-20 focus:outline-none" aria-label="Next" onClick={handleTapRight} />
      <button className="absolute left-[35%] right-[35%] inset-y-0 z-20 focus:outline-none" aria-label="View table" onClick={handleCenterTap} />

      {/* ── Progress bars ── */}
      <div className="absolute top-3 left-4 right-4 flex gap-1 z-30 pointer-events-none">
        {tables.map((_, i) => (
          <div key={i} className="h-[3px] flex-1 rounded-full overflow-hidden bg-white/25">
            {i < tableIndex && <div className="h-full w-full bg-white" />}
            {i === tableIndex && (
              <div
                className="h-full bg-white"
                style={{ animation: 'story-progress 4s linear forwards', width: '0%' }}
              />
            )}
          </div>
        ))}
      </div>
      {/* Invisible hit targets for progress bar taps */}
      {tables.length > 1 && (
        <div className="absolute top-1.5 left-4 right-4 flex gap-1 z-30">
          {tables.map((_, i) => (
            <button key={i} onClick={(e) => { e.stopPropagation(); onTableIndexChange(i) }}
              className="h-5 flex-1 opacity-0" aria-label={`Table ${i + 1}`} />
          ))}
        </div>
      )}

      {/* ── Top bar: friend info (floats over hero with gradient) ── */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center gap-2.5 px-4 pt-7 pb-10 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.55) 60%, transparent 100%)' }}>
        <div className="flex-shrink-0">
          {friend.photo ? (
            <Image src={friend.photo} alt={friend.name} width={32} height={32}
              className="w-8 h-8 rounded-full object-cover border-2 border-[#9bffce]/60" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-xs font-bold text-on-primary-container border-2 border-[#9bffce]/60">
              {friend.name[0]?.toUpperCase()}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm leading-tight truncate"
            style={{ textShadow: '0 1px 4px rgba(0,0,0,0.7)' }}>
            {friend.name.split(' ')[0]}
          </p>
          <p className="text-white/75 text-[10px] leading-tight"
            style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
            {friend.activity === 'ongoing' ? t('friendActivity.playingNow') : t('friendActivity.upcomingGame')}
          </p>
        </div>
      </div>

      {/* ── Hero image — full bleed, covers entire card ── */}
      <div className="absolute inset-0">
        <GameThumbnail
          src={table.boardGame.thumbnail}
          name={table.boardGame.name}
          width={600}
          height={900}
          imgClassName="w-full h-full object-cover"
          placeholderClassName="w-full h-full flex items-center justify-center text-8xl font-extrabold text-white/10 bg-[#0f1c36]"
        />
        {/* Strong bottom gradient for content legibility */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 30%, rgba(4,13,34,0.7) 55%, rgba(4,13,34,0.97) 75%, #040d22 100%)' }} />
      </div>

      {/* ── Bottom content block — absolute, anchored to bottom ── */}
      <div className="absolute bottom-0 left-0 right-0 px-5 pb-6 flex flex-col gap-2 z-10">

        {/* Private badge */}
        {table.type === 'private' && (
          <span className="self-start text-[10px] font-bold text-[#9bffce] bg-[#9bffce]/10 px-2.5 py-1 rounded-full">
            {t('friendActivity.closeFriends')}
          </span>
        )}

        {/* Date + status row */}
        <div className="flex items-center justify-between">
          <div>
            <p className="font-extrabold leading-none tracking-tight uppercase text-[#a3a6ff]" style={{ fontSize: 42 }}>
              {dateLabel}
            </p>
            <p className="text-white/55 font-medium mt-1.5" style={{ fontSize: 13 }}>
              {timeLabel}
            </p>
          </div>
          <TableStatusBadge status={status} />
        </div>

        {/* Game title */}
        <h2 className="text-[26px] font-extrabold text-white tracking-tight leading-tight">
          {table.boardGame.name}
        </h2>

        {/* Location */}
        {shortAddress && (
          <div className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-white/50 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
            </svg>
            <p className="text-[12px] text-white/55 truncate">{shortAddress}</p>
          </div>
        )}

        {/* Players row */}
        <div className="flex items-center gap-2 min-w-0">
          {visiblePlayers.length > 0 && (
            <div className="flex -space-x-2 flex-shrink-0">
              {visiblePlayers.map((p, i) => (
                p.photoURL ? (
                  <Image key={p.id} src={p.photoURL} alt={p.name} width={28} height={28}
                    className="w-7 h-7 rounded-full object-cover"
                    style={{ zIndex: visiblePlayers.length - i, outline: `2px solid ${surface}` }} />
                ) : (
                  <div key={p.id} className="w-7 h-7 rounded-full bg-primary-container flex items-center justify-center text-[9px] font-bold text-on-primary-container"
                    style={{ zIndex: visiblePlayers.length - i, outline: `2px solid ${surface}` }}>
                    {p.name[0]?.toUpperCase()}
                  </div>
                )
              ))}
            </div>
          )}
          {overflowCount > 0 && <span className="text-[11px] text-white/50 font-meta">+{overflowCount}</span>}
        </div>
      </div>

      {/* ── View Table pill (tap center or long-press) ── */}
      {pillVisible && (
        <div
          className="absolute left-1/2 z-40 pointer-events-none"
          style={{ animation: 'pill-appear 0.2s ease forwards', transform: 'translateX(-50%)', top: 'calc(56% - 3.5rem)' }}
        >
          <button
            className="pointer-events-auto flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-semibold text-white whitespace-nowrap active:scale-95 transition-transform"
            style={{ background: 'rgba(0,0,0,0.62)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}
            onClick={() => router.push(`/table/${table.id}`)}
          >
            {t('friendActivity.viewTable')}
            <svg className="w-3.5 h-3.5 opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Main overlay ─────────────────────────────────────────────────────────────

export function FriendStoryOverlay({ friends, initialFriendIndex, onClose, onFriendSeen }: FriendStoryOverlayProps) {
  const [friendIndex, setFriendIndex] = useState(initialFriendIndex)
  const [tableIndex, setEventIndex] = useState(0)
  const touchStartY = useRef<number | null>(null)

  const friend = friends[friendIndex]

  useEffect(() => { setEventIndex(0) }, [friendIndex])

  const goNextFriend = useCallback(() => {
    onFriendSeen?.(friends[friendIndex].tables.map(e => e.id))
    if (friendIndex < friends.length - 1) setFriendIndex(i => i + 1)
    else onClose()
  }, [friendIndex, friends, onClose, onFriendSeen])

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
        {friend.activity === 'recap' && friend.recap
          ? <RecapStoryCard friend={friend} recap={friend.recap} onNext={goNextFriend} onPrev={goPrevFriend} />
          : <StoryCard
              friend={friend}
              tableIndex={tableIndex}
              onTableIndexChange={setEventIndex}
              onNextFriend={goNextFriend}
              onPrevFriend={goPrevFriend}
            />
        }
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
