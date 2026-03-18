'use client'
import { useState, useEffect, useMemo } from 'react'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { useAuth } from '@/contexts/AuthContext'
import { EventListCard } from '@/components/event/EventListCard'
import { HomeHeader } from '@/components/layout/HomeHeader'
import { CreateEventCTA } from '@/components/layout/CreateEventCTA'
import { Spinner } from '@/components/ui/Spinner'
import { auth, db } from '@/lib/firebase/client'
import type { GameEvent } from '@/types'

type Tab = 'friends' | 'explore' | 'joined' | 'mine'

const TABS: { id: Tab; label: string; authOnly: boolean }[] = [
  { id: 'friends', label: 'Friends', authOnly: true },
  { id: 'explore', label: 'Explore', authOnly: false },
  { id: 'joined', label: 'Joined', authOnly: true },
  { id: 'mine', label: 'My Events', authOnly: true },
]

async function fetchPublicEvents(): Promise<GameEvent[]> {
  try {
    const res = await fetch('/api/events')
    if (!res.ok) return []
    const data = await res.json()
    return data.events ?? []
  } catch {
    return []
  }
}

async function fetchFriendUids(myUid: string): Promise<Set<string>> {
  try {
    const token = await auth.currentUser?.getIdToken()
    const res = await fetch('/api/friends', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    const data = await res.json()
    const friendships: any[] = data.friendships ?? []
    const uids = new Set<string>()
    for (const f of friendships) {
      if (f.status === 'accepted') {
        uids.add(f.fromUid === myUid ? f.toUid : f.fromUid)
      }
    }
    return uids
  } catch {
    return new Set()
  }
}

async function fetchUserEvents(uid: string): Promise<GameEvent[]> {
  const snap = await getDocs(
    query(collection(db, 'events'), where('playerUids', 'array-contains', uid))
  )
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as GameEvent))
}

export default function HomePage() {
  const { user, loading: authLoading } = useAuth()
  const [tab, setTab] = useState<Tab>('explore')
  const [publicEvents, setPublicEvents] = useState<GameEvent[]>([])
  const [userEvents, setUserEvents] = useState<GameEvent[]>([])
  const [friendUids, setFriendUids] = useState<Set<string>>(new Set())
  const [publicLoading, setPublicLoading] = useState(true)
  const [userLoading, setUserLoading] = useState(false)

  // Set default tab once auth resolves
  useEffect(() => {
    if (!authLoading) setTab(user ? 'friends' : 'explore')
  }, [authLoading]) // eslint-disable-line react-hooks/exhaustive-deps

  // Fall back to explore if user logs out on an auth-only tab
  useEffect(() => {
    if (!authLoading && !user) setTab('explore')
  }, [user, authLoading])

  useEffect(() => {
    fetchPublicEvents().then(setPublicEvents).finally(() => setPublicLoading(false))
  }, [])

  useEffect(() => {
    if (!user) { setUserEvents([]); setFriendUids(new Set()); return }
    setUserLoading(true)
    Promise.all([
      fetchFriendUids(user.uid).then(setFriendUids),
      fetchUserEvents(user.uid).then(setUserEvents),
    ]).finally(() => setUserLoading(false))
  }, [user])

  const friendsEvents = useMemo(
    () => publicEvents.filter((e) => friendUids.has(e.hostUid)),
    [publicEvents, friendUids]
  )

  const exploreEvents = useMemo(
    () => publicEvents.filter((e) => !friendUids.has(e.hostUid) && e.hostUid !== user?.uid),
    [publicEvents, friendUids, user]
  )

  const joinedEvents = useMemo(
    () =>
      userEvents
        .filter((e) => user && e.hostUid !== user.uid)
        .sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime()),
    [userEvents, user]
  )

  const myEvents = useMemo(
    () =>
      userEvents
        .filter((e) => user && e.hostUid === user.uid)
        .sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime()),
    [userEvents, user]
  )

  const visibleTabs = TABS.filter((t) => !t.authOnly || !!user)

  const activeEvents =
    tab === 'friends' ? friendsEvents
    : tab === 'explore' ? exploreEvents
    : tab === 'joined' ? joinedEvents
    : myEvents

  const isLoading =
    authLoading ||
    publicLoading ||
    (user && userLoading && (tab === 'joined' || tab === 'mine'))

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto px-4 pt-10 pb-4">
        <HomeHeader />
      </div>

      {/* Tab bar */}
      <div className="sticky top-0 z-40 bg-gray-50 border-b border-gray-200">
        <div className="max-w-lg mx-auto flex">
          {visibleTabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 py-3 text-sm font-semibold transition-colors relative ${
                tab === t.id ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {t.label}
              {tab === t.id && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-0.5 bg-gray-900 rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner className="h-7 w-7" />
          </div>
        ) : activeEvents.length === 0 ? (
          <EmptyState tab={tab} />
        ) : (
          <div className="space-y-3">
            {activeEvents.map((event) => (
              <EventListCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

function EmptyState({ tab }: { tab: Tab }) {
  if (tab === 'friends') return (
    <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
      <p className="text-3xl mb-3">👥</p>
      <p className="text-gray-700 font-medium">No events from friends yet</p>
      <p className="text-gray-500 text-sm mt-1">Add friends to see their upcoming game nights</p>
    </div>
  )
  if (tab === 'joined') return (
    <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
      <p className="text-3xl mb-3">🎟️</p>
      <p className="text-gray-700 font-medium">You haven&apos;t joined any events</p>
      <p className="text-gray-500 text-sm mt-1">Browse Explore to find a game night</p>
    </div>
  )
  if (tab === 'mine') return (
    <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
      <p className="text-4xl mb-3">🎲</p>
      <p className="text-gray-700 font-medium">No events yet</p>
      <p className="text-gray-500 text-sm mt-1">Organize your first game night!</p>
      <CreateEventCTA />
    </div>
  )
  return (
    <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
      <p className="text-4xl mb-3">🎲</p>
      <p className="text-gray-700 font-medium">No upcoming events</p>
      <p className="text-gray-500 text-sm mt-1">Be the first to organize a game night!</p>
      <CreateEventCTA />
    </div>
  )
}
