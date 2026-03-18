'use client'
import { use } from 'react'
import Link from 'next/link'
import { useEvent } from '@/hooks/useEvent'
import { useHostToken } from '@/hooks/useHostToken'
import { EventCard } from '@/components/event/EventCard'
import { PlayerList } from '@/components/event/PlayerList'
import { ShareLink } from '@/components/event/ShareLink'
import { JoinEventForm } from '@/components/forms/JoinEventForm'
import { Spinner } from '@/components/ui/Spinner'
import { Button } from '@/components/ui/Button'
import { getEffectiveStatus } from '@/lib/utils'
import { savePlayerId } from '@/lib/hostToken'

export default function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { event, loading, error } = useEvent(id)
  const { hostToken } = useHostToken(id)

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
            Create a new event
          </Link>
        </div>
      </div>
    )
  }

  const effectiveStatus = getEffectiveStatus(event)
  const isFull = event.players.length >= event.maxPlayers
  const isCancelled = effectiveStatus === 'cancelled'
  const isEnded = effectiveStatus === 'ended'

  const handleJoin = async (name: string) => {
    const res = await fetch(`/api/events/${id}/players`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error ?? 'Failed to join')
    }
    const data = await res.json()
    savePlayerId(id, data.playerId)
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="max-w-lg mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
            ← Home
          </Link>
          {hostToken && (
            <Link href={`/event/${id}/manage`}>
              <Button variant="secondary" size="sm">Manage Event</Button>
            </Link>
          )}
        </div>

        <EventCard event={event} />

        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-3">
          <h2 className="font-semibold text-gray-900">Share this event</h2>
          <ShareLink eventId={id} />
        </div>

        <PlayerList
          players={event.players}
          maxPlayers={event.maxPlayers}
        />

        {!hostToken && (
          <JoinEventForm
            onJoin={handleJoin}
            isFull={isFull}
            isCancelled={isCancelled}
            isEnded={isEnded}
          />
        )}
      </div>
    </main>
  )
}
