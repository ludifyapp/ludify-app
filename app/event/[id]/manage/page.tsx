'use client'
import { use, useState, useRef } from 'react'
import Link from 'next/link'
import { useEvent } from '@/hooks/useEvent'
import { useHostToken } from '@/hooks/useHostToken'
import { EventCard } from '@/components/event/EventCard'
import { PlayerList } from '@/components/event/PlayerList'
import { ShareLink } from '@/components/event/ShareLink'
import { EditEventForm } from '@/components/forms/EditEventForm'
import { CancelEventButton } from '@/components/event/CancelEventButton'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Spinner } from '@/components/ui/Spinner'
import { GameEvent } from '@/types'
import { getEffectiveStatus } from '@/lib/utils'
import { Input } from '@/components/ui/Input'

export default function ManagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { event, loading, error } = useEvent(id)
  const { hostToken, checked: tokenChecked } = useHostToken(id)
  const [isEditing, setIsEditing] = useState(false)

  if (loading || !tokenChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  if (!hostToken) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">You don&apos;t have access to manage this event.</p>
          <Link href={`/event/${id}`} className="mt-4 inline-block text-indigo-600 hover:underline">
            View event page
          </Link>
        </div>
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">{error ?? 'Event not found'}</p>
      </div>
    )
  }

  const handleSave = async (data: Partial<GameEvent>) => {
    const res = await fetch(`/api/events/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-host-token': hostToken!,
      },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const body = await res.json()
      throw new Error(body.error ?? 'Failed to save')
    }
  }

  const handleCancelEvent = async () => {
    await handleSave({ status: 'cancelled' })
  }

  const handleAddGuest = async (name: string) => {
    const res = await fetch(`/api/events/${id}/players`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    if (!res.ok) {
      const body = await res.json()
      throw new Error(body.error ?? 'Failed to add guest')
    }
  }

  const handleRemovePlayer = async (playerId: string) => {
    const res = await fetch(`/api/events/${id}/players/${playerId}`, {
      method: 'DELETE',
      headers: { 'x-host-token': hostToken! },
    })
    if (!res.ok) {
      const body = await res.json()
      throw new Error(body.error ?? 'Failed to remove player')
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="max-w-lg mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link href={`/event/${id}`} className="text-sm text-gray-500 hover:text-gray-700">
            ← Event Page
          </Link>
          <span className="text-sm font-medium text-indigo-600">Host Dashboard</span>
        </div>

        {(() => {
          const effectiveStatus = getEffectiveStatus(event)
          const isActive = effectiveStatus === 'active'
          return (
            <>
              {isEditing ? (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h2 className="font-semibold text-gray-900 mb-4">Edit Event</h2>
                  <EditEventForm
                    event={event}
                    onSave={handleSave}
                    onClose={() => setIsEditing(false)}
                  />
                </div>
              ) : (
                <>
                  <EventCard event={event} />
                  {isActive && (
                    <Button variant="secondary" onClick={() => setIsEditing(true)} className="w-full">
                      Edit Event Details
                    </Button>
                  )}
                </>
              )}

              <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-3">
                <h2 className="font-semibold text-gray-900">Share Invite Link</h2>
                <ShareLink eventId={id} />
              </div>

              <PlayerList
                players={event.players}
                maxPlayers={event.maxPlayers}
                isHost
                onRemovePlayer={handleRemovePlayer}
              />

              {isActive && (
                <>
                  <AddGuestForm
                    onAdd={handleAddGuest}
                    isFull={event.players.length >= event.maxPlayers}
                  />
                  <div className="pt-2">
                    <CancelEventButton onCancel={handleCancelEvent} />
                  </div>
                </>
              )}
            </>
          )
        })()}
      </div>
    </main>
  )
}

function AddGuestForm({ onAdd, isFull }: { onAdd: (name: string) => Promise<void>; isFull: boolean }) {
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Please enter a name')
      return
    }
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      await onAdd(trimmed)
      setSuccess(`${trimmed} added!`)
      setName('')
      inputRef.current?.focus()
    } catch (err) {
      setError((err as Error).message || 'Failed to add guest')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="font-semibold text-gray-900 mb-4">Add Guest</h2>
      {isFull ? (
        <p className="text-sm text-gray-500">The event is full.</p>
      ) : (
        <form onSubmit={handleSubmit} className="flex gap-3">
          <div className="flex-1">
            <Input
              ref={inputRef}
              placeholder="Guest name"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(''); setSuccess('') }}
              error={error}
            />
          </div>
          <Button type="submit" loading={loading} className="self-start">
            Add
          </Button>
        </form>
      )}
      {success && <p className="text-sm text-green-600 mt-2">{success}</p>}
    </div>
  )
}
