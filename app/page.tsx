import Link from 'next/link'
import { db } from '@/lib/firebase/admin'
import { GameEvent } from '@/types'
import { EventListCard } from '@/components/event/EventListCard'
import { Button } from '@/components/ui/Button'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const now = new Date().toISOString()

  const snapshot = await db
    .collection('events')
    .where('dateTime', '>=', now)
    .orderBy('dateTime', 'asc')
    .limit(20)
    .get()

  const events = snapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() } as GameEvent))
    .filter((e) => e.status === 'active' && e.type !== 'private')

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">🎲 Game Night</h1>
            <p className="text-gray-500 text-sm mt-1">Upcoming events</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/my-events" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
              My Events
            </Link>
            <Link href="/create">
              <Button size="sm">+ Create</Button>
            </Link>
          </div>
        </div>

        {events.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <p className="text-4xl mb-3">🎲</p>
            <p className="text-gray-700 font-medium">No upcoming events</p>
            <p className="text-gray-500 text-sm mt-1">Be the first to organize a game night!</p>
            <Link href="/create">
              <Button className="mt-5">Create Event</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((event) => (
              <EventListCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
