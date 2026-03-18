'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { GameEvent, EffectiveStatus } from '@/types'
import { formatDateTime, getEffectiveStatus } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { db } from '@/lib/firebase/client'
import { Spinner } from '@/components/ui/Spinner'

type EventWithRole = GameEvent & { role: 'host' | 'guest' }

export default function MyEventsPage() {
  const { user, loading: authLoading } = useAuth()
  const [events, setEvents] = useState<EventWithRole[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    if (!user) { setLoading(false); return }

    const load = async () => {
      // Single query: all events where the user is a player (host or guest)
      const snap = await getDocs(
        query(collection(db, 'events'), where('playerUids', 'array-contains', user.uid))
      )
      const all = snap.docs
        .map((d) => {
          const data = d.data() as Omit<GameEvent, 'id'>
          return {
            id: d.id,
            ...data,
            role: (data.hostUid === user.uid ? 'host' : 'guest') as 'host' | 'guest',
          }
        })
        .filter((e) => e.hostUid === user.uid)
        .sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime())

      setEvents(all)
      setLoading(false)
    }

    load()
  }, [user, authLoading])

  const upcoming = events.filter((e) => ['waiting', 'active', 'full'].includes(getEffectiveStatus(e)))
  const ongoing = events.filter((e) => getEffectiveStatus(e) === 'ongoing')
  const past = events.filter((e) => getEffectiveStatus(e) === 'ended')
  const cancelled = events.filter((e) => getEffectiveStatus(e) === 'cancelled')

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">← Home</Link>
          <h1 className="text-2xl font-bold text-gray-900">My Events</h1>
        </div>

        {loading || authLoading ? (
          <div className="flex justify-center py-16">
            <Spinner className="h-8 w-8" />
          </div>
        ) : !user ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <p className="text-gray-700 font-medium">Sign in to see your events</p>
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
            {ongoing.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-indigo-500 uppercase tracking-wide mb-3">Ongoing</h2>
                <div className="space-y-2">
                  {ongoing.map((event) => <EventRow key={event.id} event={event} />)}
                </div>
              </section>
            )}
            {upcoming.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Upcoming</h2>
                <div className="space-y-2">
                  {upcoming.map((event) => <EventRow key={event.id} event={event} />)}
                </div>
              </section>
            )}
            {cancelled.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Cancelled</h2>
                <div className="space-y-2">
                  {cancelled.map((event) => <EventRow key={event.id} event={event} />)}
                </div>
              </section>
            )}
            {past.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Past</h2>
                <div className="space-y-2">
                  {past.map((event) => <EventRow key={event.id} event={event} />)}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </main>
  )
}

const badgeStyles: Record<EffectiveStatus, string> = {
  waiting:   'bg-yellow-100 text-yellow-700',
  active:    'bg-green-100 text-green-700',
  full:      'bg-blue-100 text-blue-700',
  ongoing:   'bg-indigo-100 text-indigo-700',
  ended:     'bg-gray-100 text-gray-500',
  cancelled: 'bg-red-100 text-red-700',
}

const badgeLabels: Record<EffectiveStatus, string> = {
  waiting:   'Waiting',
  active:    'Active',
  full:      'Full',
  ongoing:   'Ongoing',
  ended:     'Ended',
  cancelled: 'Cancelled',
}

function EventRow({ event }: { event: EventWithRole }) {
  const effectiveStatus = getEffectiveStatus(event)
  const router = useRouter()
  return (
    <div
      role="button"
      onClick={() => router.push(`/event/${event.id}`)}
      className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3 hover:border-indigo-300 hover:shadow-sm transition-all cursor-pointer"
    >
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
      <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badgeStyles[effectiveStatus]}`}>
          {badgeLabels[effectiveStatus]}
        </span>
        {event.role === 'host' && (
          <Link
            href={`/event/${event.id}/manage`}
            className="text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:underline"
          >
            Manage →
          </Link>
        )}
      </div>
    </div>
  )
}
