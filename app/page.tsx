'use client'
import { useState, useEffect, useMemo } from 'react'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { useAuth } from '@/contexts/AuthContext'
import { EventListCard } from '@/components/event/EventListCard'
import { FriendsCarousel } from '@/components/event/FriendsCarousel'
import { HomeHeader } from '@/components/layout/HomeHeader'
import { CreateEventCTA } from '@/components/layout/CreateEventCTA'
import { Spinner } from '@/components/ui/Spinner'
import { auth, db } from '@/lib/firebase/client'
import type { GameEvent } from '@/types'

type Tab = 'friends' | 'explore' | 'joined' | 'mine'

function TabIcon({ id, active }: { id: Tab; active: boolean }) {
  const cls = `w-[18px] h-[18px] flex-shrink-0 transition-colors ${active ? 'fill-slate-900 dark:fill-white' : 'fill-slate-400 dark:fill-zinc-500'}`
  if (id === 'friends') return (
    <svg className={cls} viewBox="0 0 24 24">
      <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
    </svg>
  )
  if (id === 'explore') return (
    <svg className={cls} viewBox="0 0 24 24">
      <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
    </svg>
  )
  if (id === 'joined') return (
    <svg className={cls} viewBox="0 0 24 24">
      <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z" />
    </svg>
  )
  return (
    <svg className={cls} viewBox="0 0 24 24">
      <path d="M3 3h8v8H3zm0 10h8v8H3zM13 3h8v8h-8zm0 10h8v8h-8z" />
    </svg>
  )
}

const TABS: { id: Tab; label: string; authOnly: boolean }[] = [
  { id: 'friends', label: 'For you', authOnly: true },
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

  const [search, setSearch] = useState('')

  const activeEvents = useMemo(() => {
    const base =
      tab === 'friends' ? friendsEvents
      : tab === 'explore' ? exploreEvents
      : tab === 'joined' ? joinedEvents
      : myEvents
    if (!search.trim()) return base
    const q = search.trim().toLowerCase()
    return base.filter((e) => {
      const gameName = e.boardGame.name.toLowerCase()
      const hostName = e.players.find((p) => p.isHost)?.name.toLowerCase() ?? ''
      return gameName.includes(q) || hostName.includes(q)
    })
  }, [tab, friendsEvents, exploreEvents, joinedEvents, myEvents, search])

  const isLoading =
    authLoading ||
    publicLoading ||
    (user && userLoading && (tab === 'joined' || tab === 'mine'))

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-zinc-950">
      <div className="max-w-lg mx-auto px-4 pt-10 pb-4">
        <HomeHeader />
      </div>

      {/* Tab bar */}
      <div className="sticky top-0 z-40 bg-slate-50 dark:bg-zinc-950 border-b border-slate-200 dark:border-zinc-800">
        <div className="max-w-lg mx-auto flex">
          {visibleTabs.map((t) => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); setSearch('') }}
              className={`flex-1 py-3 flex flex-row items-center justify-center gap-2 text-sm font-semibold transition-colors relative ${
                tab === t.id ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300'
              }`}
            >
              <TabIcon id={t.id} active={tab === t.id} />
              {t.label}
              {tab === t.id && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-0.5 bg-teal-600 dark:bg-teal-400 rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Search — Explore only */}
      {tab === 'explore' && <div className="max-w-lg mx-auto px-4 pt-4">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-500 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by game or host…"
            className="w-full pl-9 pr-4 py-2 text-sm bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>}

      {/* Content */}
      <div className="max-w-lg mx-auto px-4 py-4 pb-24">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner className="h-7 w-7" />
          </div>
        ) : (
          <>
            {tab === 'friends' && <FriendsCarousel events={friendsEvents} />}

            {activeEvents.length === 0 ? (
              search.trim() ? (
                <div className="text-center py-16 px-6 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800">
                  <div className="flex justify-center mb-5">
                    <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                      <circle cx="40" cy="40" r="40" className="fill-teal-50 dark:fill-teal-900/20" />
                      <circle cx="36" cy="36" r="13" className="fill-teal-100 dark:fill-teal-800/40" />
                      <circle cx="36" cy="36" r="13" className="stroke-teal-400 dark:stroke-teal-500" strokeWidth="3" fill="none" />
                      <line x1="46" y1="46" x2="57" y2="57" className="stroke-teal-500 dark:stroke-teal-400" strokeWidth="4" strokeLinecap="round" />
                      <path d="M31 31l10 10M41 31l-10 10" className="stroke-teal-400 dark:stroke-teal-500" strokeWidth="2.5" strokeLinecap="round" />
                    </svg>
                  </div>
                  <p className="text-slate-700 dark:text-zinc-200 font-semibold">No results for &ldquo;{search.trim()}&rdquo;</p>
                  <p className="text-slate-500 dark:text-zinc-400 text-sm mt-1">Try a different game or host name</p>
                </div>
              ) : (
                <EmptyState tab={tab} />
              )
            ) : (
              <div className="flex flex-col gap-6">
                {activeEvents.map((event) => (
                  <EventListCard key={event.id} event={event} />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* FAB — Create Event */}
      {user && (
        <a
          href="/create"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-gradient-to-b from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 active:from-teal-700 active:to-teal-700 text-white font-semibold text-sm px-5 py-3.5 rounded-2xl shadow-lg shadow-teal-500/30 dark:shadow-teal-900/50 transition-all"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Create event
        </a>
      )}
    </main>
  )
}

function EmptyState({ tab }: { tab: Tab }) {
  if (tab === 'friends') return (
    <div className="text-center py-16 px-6 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800">
      <div className="flex justify-center mb-5">
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none" className="text-teal-500">
          <circle cx="40" cy="40" r="40" className="fill-teal-50 dark:fill-teal-900/20" />
          {/* Person 1 */}
          <circle cx="31" cy="30" r="8" className="fill-teal-200 dark:fill-teal-800/60" />
          <path d="M16 55c0-8.284 6.716-15 15-15h1c8.284 0 15 6.716 15 15" className="stroke-teal-300 dark:stroke-teal-700" strokeWidth="3" strokeLinecap="round" fill="none" />
          {/* Person 2 */}
          <circle cx="50" cy="28" r="7" className="fill-teal-400 dark:fill-teal-600/80" />
          <path d="M36 55c0-7.732 6.268-14 14-14h1c7.732 0 14 6.268 14 14" className="stroke-teal-500 dark:stroke-teal-500" strokeWidth="3" strokeLinecap="round" fill="none" />
        </svg>
      </div>
      <p className="text-slate-700 dark:text-zinc-200 font-semibold">No events from friends yet</p>
      <p className="text-slate-500 dark:text-zinc-400 text-sm mt-1">Add friends to see their upcoming game nights</p>
    </div>
  )
  if (tab === 'joined') return (
    <div className="text-center py-16 px-6 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800">
      <div className="flex justify-center mb-5">
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
          <circle cx="40" cy="40" r="40" className="fill-teal-50 dark:fill-teal-900/20" />
          {/* Ticket body */}
          <rect x="16" y="28" width="48" height="26" rx="5" className="fill-teal-100 dark:fill-teal-800/40" />
          <rect x="16" y="28" width="48" height="26" rx="5" className="stroke-teal-400 dark:stroke-teal-500" strokeWidth="2.5" fill="none" />
          {/* Perforation */}
          <line x1="34" y1="28" x2="34" y2="54" className="stroke-teal-300 dark:stroke-teal-600" strokeWidth="2" strokeDasharray="3 3" />
          {/* Star on stub */}
          <path d="M25 41l1.5-4.5 1.5 4.5-4-2.7h5z" className="fill-teal-400 dark:fill-teal-400" />
          {/* Lines on main body */}
          <rect x="39" y="35" width="18" height="2.5" rx="1.25" className="fill-teal-300 dark:fill-teal-600" />
          <rect x="39" y="41" width="12" height="2.5" rx="1.25" className="fill-teal-200 dark:fill-teal-700" />
        </svg>
      </div>
      <p className="text-slate-700 dark:text-zinc-200 font-semibold">You haven&apos;t joined any events</p>
      <p className="text-slate-500 dark:text-zinc-400 text-sm mt-1">Browse Explore to find a game night</p>
    </div>
  )
  if (tab === 'mine') return (
    <div className="text-center py-16 px-6 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800">
      <div className="flex justify-center mb-5">
        <DiceIllustration />
      </div>
      <p className="text-slate-700 dark:text-zinc-200 font-semibold">No events yet</p>
      <p className="text-slate-500 dark:text-zinc-400 text-sm mt-1">Organize your first game night!</p>
      <CreateEventCTA />
    </div>
  )
  return (
    <div className="text-center py-16 px-6 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800">
      <div className="flex justify-center mb-5">
        <DiceIllustration />
      </div>
      <p className="text-slate-700 dark:text-zinc-200 font-semibold">No upcoming events</p>
      <p className="text-slate-500 dark:text-zinc-400 text-sm mt-1">Be the first to organize a game night!</p>
      <CreateEventCTA />
    </div>
  )
}

function DiceIllustration() {
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
      <circle cx="40" cy="40" r="40" className="fill-teal-50 dark:fill-teal-900/20" />
      {/* Dice body */}
      <rect x="20" y="20" width="40" height="40" rx="8" className="fill-teal-100 dark:fill-teal-800/40" />
      <rect x="20" y="20" width="40" height="40" rx="8" className="stroke-teal-400 dark:stroke-teal-500" strokeWidth="2.5" fill="none" />
      {/* Dots — 5 pattern */}
      <circle cx="31" cy="31" r="3.5" className="fill-teal-500 dark:fill-teal-400" />
      <circle cx="49" cy="31" r="3.5" className="fill-teal-500 dark:fill-teal-400" />
      <circle cx="40" cy="40" r="3.5" className="fill-teal-500 dark:fill-teal-400" />
      <circle cx="31" cy="49" r="3.5" className="fill-teal-500 dark:fill-teal-400" />
      <circle cx="49" cy="49" r="3.5" className="fill-teal-500 dark:fill-teal-400" />
    </svg>
  )
}
