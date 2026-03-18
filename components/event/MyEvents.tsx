'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { GameEvent } from '@/types'
import { formatDateTime } from '@/lib/utils'

const TOKEN_PREFIX = 'host_token_'

export function MyEvents() {
  const [events, setEvents] = useState<GameEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const eventIds: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith(TOKEN_PREFIX)) {
        eventIds.push(key.replace(TOKEN_PREFIX, ''))
      }
    }

    if (eventIds.length === 0) {
      setLoading(false)
      return
    }

    Promise.all(
      eventIds.map((id) =>
        fetch(`/api/events/${id}`)
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null)
      )
    ).then((results) => {
      const valid = results
        .filter(Boolean)
        .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime())
      setEvents(valid)
      setLoading(false)
    })
  }, [])

  if (loading || events.length === 0) return null

  return (
    <div className="mb-8">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">My Events</h2>
      <div className="space-y-2">
        {events.map((event) => (
          <div
            key={event.id}
            className="bg-white border border-amber-200 rounded-xl p-4 flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
              <span className="text-lg">🎲</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900">{event.boardGame.name}</p>
              <p className="text-xs text-gray-500">{formatDateTime(event.dateTime)}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                event.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {event.status}
              </span>
              <Link
                href={`/event/${event.id}/manage`}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:underline"
              >
                Manage →
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
