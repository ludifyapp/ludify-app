'use client'
import { useState, useEffect } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase/client'
import { GameEvent } from '@/types'

export function useEvent(eventId: string) {
  const [event, setEvent] = useState<GameEvent | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, 'events', eventId),
      (snap) => {
        if (snap.exists()) {
          setEvent({ id: snap.id, ...snap.data() } as GameEvent)
        } else {
          setError('Event not found')
        }
        setLoading(false)
      },
      () => {
        setError('Failed to load event')
        setLoading(false)
      }
    )
    return unsubscribe
  }, [eventId])

  return { event, loading, error }
}
