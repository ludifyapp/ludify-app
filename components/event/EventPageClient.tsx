'use client'
import { useState } from 'react'
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

export function EventPageClient({ id }: { id: string }) {
  const { event, loading, error } = useEvent(id)
  const { user } = useAuth()
  const [shareOpen, setShareOpen] = useState(false)

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
          <p className="text-gray-600">{error ?? 'Event not found'}</p>
          <Link href="/" className="mt-4 inline-block text-indigo-600 hover:underline">
            Back to home
          </Link>
        </div>
      </div>
    )
  }

  const effectiveStatus = getEffectiveStatus(event)
  const isHost = !!user && user.uid === event.hostUid
  const hasJoined = !!user && event.playerUids?.includes(user.uid)

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
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="max-w-lg mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
            ← Home
          </Link>
          {isHost && (
            <Link href={`/event/${id}/manage`}>
              <Button variant="secondary" size="sm">Manage Event</Button>
            </Link>
          )}
        </div>

        <EventCard event={event} />

        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Share this event</h2>
            {user && (
              <button
                onClick={() => setShareOpen(true)}
                className="flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
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
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <p className="text-green-800 font-medium">You&apos;re going! 🎉</p>
          </div>
        )}
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
