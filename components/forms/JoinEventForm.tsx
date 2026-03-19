'use client'
import { useState } from 'react'
import Image from 'next/image'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/contexts/AuthContext'
import type { EffectiveStatus } from '@/types'

interface JoinEventFormProps {
  onJoin: (name: string) => Promise<void>
  status: EffectiveStatus
}

export function JoinEventForm({ onJoin, status }: JoinEventFormProps) {
  const { user } = useAuth()
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [joined, setJoined] = useState(false)

  if (joined) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
        <p className="text-green-800 font-medium">You&apos;re in! 🎉</p>
        <p className="text-green-700 text-sm mt-1">You&apos;ve joined the game night.</p>
      </div>
    )
  }

  if (status === 'ended' || status === 'ongoing') {
    return (
      <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-center">
        <p className="text-gray-700 dark:text-gray-300 font-medium">
          {status === 'ongoing' ? 'This event is already ongoing.' : 'This event has ended.'}
        </p>
      </div>
    )
  }

  if (status === 'cancelled') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
        <p className="text-red-800 font-medium">This event has been cancelled.</p>
      </div>
    )
  }

  if (status === 'full') {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
        <p className="text-blue-800 font-medium">This event is full.</p>
        <p className="text-blue-700 text-sm mt-1">No more spots available.</p>
      </div>
    )
  }

  const handleJoin = async (joinName: string) => {
    setLoading(true)
    setError('')
    try {
      await onJoin(joinName)
      setJoined(true)
    } catch (err) {
      setError((err as Error).message || 'Failed to join. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Logged-in: one-click join using Google display name
  if (user) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
        <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Join this game night</h2>
        {status === 'waiting' && (
          <p className="text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 mb-4">
            This event needs more players before it&apos;s confirmed.
          </p>
        )}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {user.photoURL ? (
              <Image src={user.photoURL} alt={user.displayName ?? ''} width={36} height={36} className="rounded-full" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-medium text-indigo-700">
                {user.displayName?.[0] ?? '?'}
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{user.displayName}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
            </div>
          </div>
          <Button onClick={() => handleJoin(user.displayName ?? user.email ?? 'Guest')} loading={loading}>
            Join
          </Button>
        </div>
        {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
      </div>
    )
  }

  // Guest: name input form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { setError('Please enter your name'); return }
    await handleJoin(name.trim())
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
      <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Join this game night</h2>
      {status === 'waiting' && (
        <p className="text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 mb-4">
          This event needs more players before it&apos;s confirmed.
        </p>
      )}
      <div className="flex gap-3">
        <div className="flex-1">
          <Input
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={error}
          />
        </div>
        <Button type="submit" loading={loading} className="self-start mt-0">
          Join
        </Button>
      </div>
    </form>
  )
}
