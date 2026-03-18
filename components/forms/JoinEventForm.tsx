'use client'
import { useState } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

interface JoinEventFormProps {
  onJoin: (name: string) => Promise<void>
  isFull: boolean
  isCancelled: boolean
  isEnded: boolean
}

export function JoinEventForm({ onJoin, isFull, isCancelled, isEnded }: JoinEventFormProps) {
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

  if (isEnded) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
        <p className="text-gray-700 font-medium">This event has ended.</p>
      </div>
    )
  }

  if (isCancelled) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
        <p className="text-red-800 font-medium">This event has been cancelled.</p>
      </div>
    )
  }

  if (isFull) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
        <p className="text-yellow-800 font-medium">This event is full.</p>
        <p className="text-yellow-700 text-sm mt-1">No more spots available.</p>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Please enter your name')
      return
    }
    setLoading(true)
    setError('')
    try {
      await onJoin(name.trim())
      setJoined(true)
    } catch (err) {
      setError((err as Error).message || 'Failed to join. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-6">
      <h2 className="font-semibold text-gray-900 mb-4">Join this game night</h2>
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
