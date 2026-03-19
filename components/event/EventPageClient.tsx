'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useEvent } from '@/hooks/useEvent'
import { useAuth } from '@/contexts/AuthContext'
import { EventCard } from '@/components/event/EventCard'
import { PlayerList } from '@/components/event/PlayerList'
import { ShareLink } from '@/components/event/ShareLink'
import { ShareWithFriendsModal } from '@/components/event/ShareWithFriendsModal'
import { JoinEventForm } from '@/components/forms/JoinEventForm'
import { Spinner } from '@/components/ui/Spinner'
import { Button } from '@/components/ui/Button'
import { getEffectiveStatus } from '@/lib/utils'
import { auth } from '@/lib/firebase/client'
import { Analytics } from '@/lib/analytics'
import { EventComments } from '@/components/event/EventComments'

function LeaveButton({ onLeave }: { onLeave: () => Promise<void> }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleClick = async () => {
    setLoading(true)
    setError(null)
    try {
      await onLeave()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to leave')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button variant="secondary" size="sm" onClick={handleClick} disabled={loading}>
        {loading ? 'Leaving…' : 'Leave event'}
      </Button>
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  )
}

export function EventPageClient({ id }: { id: string }) {
  const { event, loading, error } = useEvent(id)
  const { user } = useAuth()
  const [shareOpen, setShareOpen] = useState(false)

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
          <p className="text-slate-600 dark:text-zinc-400">{error ?? 'Event not found'}</p>
          <Link href="/" className="mt-4 inline-block text-teal-600 hover:underline">
            Back to home
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
    Analytics.eventLeft({ event_id: id, game: event.boardGame.name })
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
    Analytics.eventJoined({ event_id: id, game: event.boardGame.name })
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-zinc-950 px-4 py-10">
      <div className="max-w-lg mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-zinc-200 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 px-3.5 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800 shadow-sm transition-colors">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            Home
          </Link>
          {isHost && (
            <Link href={`/event/${id}/manage`}>
              <Button variant="secondary" size="sm">Manage Event</Button>
            </Link>
          )}
        </div>

        <EventCard event={event} />

        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800 p-6 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-900 dark:text-white">Share this event</h2>
            {user && (
              <button
                onClick={() => { setShareOpen(true); Analytics.shareModalOpened({ event_id: id }) }}
                className="flex items-center gap-1.5 text-sm font-medium text-teal-600 dark:text-teal-400 hover:text-teal-800 dark:hover:text-teal-300 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                Invite friends
              </button>
            )}
          </div>
          <ShareLink eventId={id} />
        </div>

        <PlayerList players={event.players} maxPlayers={event.maxPlayers} />

        {!isHost && !hasJoined && (
          <JoinEventForm onJoin={handleJoin} status={effectiveStatus} />
        )}
        {hasJoined && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 flex items-center justify-between">
            <p className="text-green-800 dark:text-green-300 font-medium">You&apos;re going! 🎉</p>
            <LeaveButton onLeave={handleLeave} />
          </div>
        )}

        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800 px-6 py-6">
          <EventComments
            eventId={id}
            hostUid={event.hostUid}
            hostName={event.players.find((p) => p.isHost)?.name ?? 'Host'}
            canComment={isHost || hasJoined}
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
