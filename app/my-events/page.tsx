'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { GameEvent } from '@/types'
import { formatDateTime, getEffectiveStatus } from '@/lib/utils'
import { getHostedEventIds, getJoinedEventIds } from '@/lib/hostToken'
import { Spinner } from '@/components/ui/Spinner'

type EventWithRole = GameEvent & { role: 'host' | 'guest' }

async function fetchEvent(id: string): Promise<GameEvent | null> {
  try {
    const r = await fetch(`/api/events/${id}`)
    return r.ok ? r.json() : null
  } catch {
    return null
  }
}

export default function MyEventsPage() {
  const [events, setEvents] = useState<EventWithRole[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const hostedIds = getHostedEventIds()
    const joinedIds = getJoinedEventIds().filter((id) => !hostedIds.includes(id))

    const allFetches = [
      ...hostedIds.map((id) => fetchEvent(id).then((e) => e ? { ...e, role: 'host' as const } : null)),
      ...joinedIds.map((id) => fetchEvent(id).then((e) => e ? { ...e, role: 'guest' as const } : null)),
    ]

    if (allFetches.length === 0) {
      setLoading(false)
      return
    }

    Promise.all(allFetches).then((results) => {
      const valid = (results.filter(Boolean) as EventWithRole[]).sort(
        (a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime()
      )
      setEvents(valid)
      setLoading(false)
    })
  }, [])

  const upcoming = events.filter((e) => getEffectiveStatus(e) === 'active')
  const past = events.filter((e) => getEffectiveStatus(e) === 'ended')
  const cancelled = events.filter((e) => getEffectiveStatus(e) === 'cancelled')

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">← Home</Link>
          <h1 className="text-2xl font-bold text-gray-900">My Events</h1>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner className="h-8 w-8" />
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <p className="text-4xl mb-3">🎲</p>
            <p className="text-gray-700 font-medium">No events yet</p>
            <p className="text-gray-500 text-sm mt-1">Events you create or join will appear here.</p>
            <Link href="/create">
              <button className="mt-5 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700">
                Create Event
              </button>
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {upcoming.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Upcoming</h2>
                <div className="space-y-2">
                  {upcoming.map((event) => (
                    <EventRow key={event.id} event={event} />
                  ))}
                </div>
              </section>
            )}
            {cancelled.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Cancelled</h2>
                <div className="space-y-2">
                  {cancelled.map((event) => (
                    <EventRow key={event.id} event={event} />
                  ))}
                </div>
              </section>
            )}
            {past.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Past</h2>
                <div className="space-y-2">
                  {past.map((event) => (
                    <EventRow key={event.id} event={event} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </main>
  )
}

function EventRow({ event }: { event: EventWithRole }) {
  const effectiveStatus = getEffectiveStatus(event)
  const badgeStyles = {
    active: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
    ended: 'bg-gray-100 text-gray-500',
  }
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
        <span className="text-lg">🎲</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-gray-900">{event.boardGame.name}</p>
          <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
            event.role === 'host' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500'
          }`}>
            {event.role === 'host' ? 'Host' : 'Guest'}
          </span>
        </div>
        <p className="text-xs text-gray-500">{formatDateTime(event.dateTime)}</p>
        <p className="text-xs text-gray-400 truncate">{event.address}</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badgeStyles[effectiveStatus]}`}>
          {effectiveStatus}
        </span>
        <Link
          href={event.role === 'host' ? `/event/${event.id}/manage` : `/event/${event.id}`}
          className="text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:underline"
        >
          {event.role === 'host' ? 'Manage →' : 'View →'}
        </Link>
      </div>
    </div>
  )
}
