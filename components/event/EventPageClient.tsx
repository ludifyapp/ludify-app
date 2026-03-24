'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { useEvent } from '@/hooks/useEvent'
import { useAuth } from '@/contexts/AuthContext'
import { EventCard } from '@/components/event/EventCard'
import { PlayerList } from '@/components/event/PlayerList'
import { ShareLink } from '@/components/event/ShareLink'
import { ShareWithFriendsModal } from '@/components/event/ShareWithFriendsModal'
import { Spinner } from '@/components/ui/Spinner'
import { Button } from '@/components/ui/Button'
import { getEffectiveStatus } from '@/lib/utils'
import { auth } from '@/lib/firebase/client'
import { Analytics } from '@/lib/analytics'
import { EventComments } from '@/components/event/EventComments'
import { HostRatingForm } from '@/components/event/HostRatingForm'
import { GameRecommendations } from '@/components/event/GameRecommendations'

// Removed standalone LeaveButton as it is now integrated into PlayerList

export function EventPageClient({ id }: { id: string }) {
  const { t } = useTranslation()
  const { event, loading, error } = useEvent(id)
  const { user } = useAuth()
  const [shareOpen, setShareOpen] = useState(false)
  const [justJoined, setJustJoined] = useState(false)

  // Track page view once event loads — must be before any early returns
  useEffect(() => {
    if (!event) return
    const effectiveStatus = getEffectiveStatus(event)
    Analytics.eventViewed({ event_id: id, game: event.boardGame.name, status: effectiveStatus })
  }, [id, event]) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600 dark:text-zinc-400">{error ?? t('event.notFound')}</p>
          <Link href="/" className="mt-4 inline-block text-teal-600 hover:underline">
            {t('event.backHome')}
          </Link>
        </div>
      </div>
    )
  }

  const effectiveStatus = getEffectiveStatus(event)
  const isHost = !!user && user.uid === event.hostUid
  const hasJoined = !!user && event.playerUids?.includes(user.uid)

  const handleLeave = async () => {
    if (!user) return
    const token = await auth.currentUser?.getIdToken()
    const res = await fetch(`/api/events/${id}/players/${user.uid}`, {
      method: 'DELETE',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error ?? 'Failed to leave')
    }
    setJustJoined(false)
    Analytics.eventLeft({ event_id: id, game: event.boardGame.name })
  }

  const handleRemovePlayer = async (playerId: string) => {
    const token = await auth.currentUser?.getIdToken()
    const res = await fetch(`/api/events/${id}/players/${playerId}`, {
      method: 'DELETE',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error ?? 'Failed to remove player')
    }
  }

  const handleJoin = async (name: string) => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    const token = await auth.currentUser?.getIdToken()
    if (token) headers['Authorization'] = `Bearer ${token}`

    const res = await fetch(`/api/events/${id}/players`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ name }),
    })
    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error ?? 'Failed to join')
    }
    setJustJoined(true)
    Analytics.eventJoined({ event_id: id, game: event.boardGame.name })
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-zinc-950 px-4 py-10">
      <div className="max-w-lg mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-zinc-200 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 px-3.5 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800 shadow-sm transition-colors">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            {t('event.home')}
          </Link>
          {isHost && (
            <Link href={`/event/${id}/manage`}>
              <Button variant="secondary" size="sm">{t('event.manageEvent')}</Button>
            </Link>
          )}
        </div>

        <EventCard 
          event={event} 
          onShareClick={user ? () => { setShareOpen(true); Analytics.shareModalOpened({ event_id: id }) } : undefined} 
        />

        <PlayerList 
          players={event.players} 
          maxPlayers={event.maxPlayers} 
          minPlayers={event.minPlayers}
          isHost={isHost}
          onJoin={!isHost && !hasJoined && !['ended', 'cancelled', 'full'].includes(effectiveStatus) ? handleJoin : undefined}
          onLeave={hasJoined && !isHost && effectiveStatus !== 'ended' ? handleLeave : undefined}
          onRemovePlayer={isHost ? handleRemovePlayer : undefined}
        />
        {justJoined && hasJoined && !isHost && effectiveStatus !== 'ended' && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
            <p className="text-green-800 dark:text-green-300 font-medium text-center">{t('event.youreGoing')}</p>
          </div>
        )}

        {/* Host rating — shown to attendees (not host) after event ends */}
        {hasJoined && !isHost && effectiveStatus === 'ended' && (
          <HostRatingForm
            eventId={id}
            hostName={event.players.find((p) => p.isHost)?.name ?? 'the host'}
          />
        )}

        {/* Game recommendations — shown to participants when event is upcoming or ongoing */}
        {(isHost || hasJoined) && (effectiveStatus === 'waiting' || effectiveStatus === 'full' || effectiveStatus === 'ongoing') && (
          <GameRecommendations eventId={id} />
        )}

        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800 px-6 py-6">
          <EventComments
            eventId={id}
            hostUid={event.hostUid}
            hostName={event.players.find((p) => p.isHost)?.name ?? 'Host'}
            canComment={isHost || (hasJoined && event.allowComments !== false)}
            allowComments={event.allowComments}
          />
        </div>
      </div>

      {user && (
        <ShareWithFriendsModal
          eventId={id}
          eventName={event.boardGame.name}
          isOpen={shareOpen}
          onClose={() => setShareOpen(false)}
        />
      )}
    </main>
  )
}
