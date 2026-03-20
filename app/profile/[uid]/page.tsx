'use client'
import { use, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Spinner } from '@/components/ui/Spinner'
import { Button } from '@/components/ui/Button'
import { auth } from '@/lib/firebase/client'
import { formatDateTime, getEffectiveStatus } from '@/lib/utils'
import { Analytics } from '@/lib/analytics'
import type { CollectionGame, FriendshipStatus, GameEvent } from '@/types'

interface PublicUser {
  uid: string
  displayName: string | null
  photoURL: string | null
  bio: string | null
  memberSince: number | null
  hostedCount: number
  ratingAvg: number | null
  ratingCount: number
}

async function authedFetch(path: string, options: RequestInit = {}) {
  const token = await auth.currentUser?.getIdToken()
  return fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers as Record<string, string>),
    },
  })
}

function EventRow({ event }: { event: GameEvent }) {
  const status = getEffectiveStatus(event)
  const statusColors: Record<string, string> = {
    waiting: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    full: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
    ongoing: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
    ended: 'bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-zinc-400',
    cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  }
  return (
    <Link href={`/event/${event.id}`}>
      <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors">
        {event.boardGame.thumbnail ? (
          <Image
            src={event.boardGame.thumbnail}
            alt={event.boardGame.name}
            width={40}
            height={40}
            className="rounded-lg object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-10 h-10 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center flex-shrink-0">
            <span className="text-lg">🎲</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-slate-900 dark:text-white text-sm">{event.boardGame.name}</p>
          <p className="text-xs text-slate-500 dark:text-zinc-400">{formatDateTime(event.dateTime)}</p>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${statusColors[status]}`}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      </div>
    </Link>
  )
}

export default function PublicProfilePage({ params }: { params: Promise<{ uid: string }> }) {
  const { uid } = use(params)
  const { user, loading } = useAuth()
  const router = useRouter()

  const [profile, setProfile] = useState<PublicUser | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [friendStatus, setFriendStatus] = useState<FriendshipStatus>('none')
  const [actionLoading, setActionLoading] = useState(false)
  const [hostedEvents, setHostedEvents] = useState<GameEvent[]>([])
  const [joinedEvents, setJoinedEvents] = useState<GameEvent[]>([])
  const [friendCount, setFriendCount] = useState<number | null>(null)
  const [eventsLoading, setEventsLoading] = useState(true)
  const [collection, setCollection] = useState<CollectionGame[]>([])

  useEffect(() => {
    if (!loading && user && user.uid === uid) router.replace('/profile')
  }, [user, loading, uid, router])

  useEffect(() => {
    fetch(`/api/users/${uid}`)
      .then((r) => r.json())
      .then((data) => { if (data.uid) setProfile(data) })
      .finally(() => setProfileLoading(false))

    fetch(`/api/users/${uid}/events`)
      .then((r) => r.json())
      .then((data) => {
        setHostedEvents(data.hosted ?? [])
        setJoinedEvents(data.joined ?? [])
        setFriendCount(data.friendCount ?? 0)
      })
      .finally(() => setEventsLoading(false))

    fetch(`/api/users/${uid}/collection`)
      .then((r) => r.json())
      .then((d) => setCollection(d.collection ?? []))
      .catch(() => {})
  }, [uid])

  useEffect(() => {
    if (!user) return
    authedFetch('/api/friends')
      .then((r) => r.json())
      .then((data) => {
        const friendships: any[] = data.friendships ?? []
        const match = friendships.find((f) => f.uids.includes(uid) && f.uids.includes(user.uid))
        if (!match) setFriendStatus('none')
        else if (match.status === 'accepted') setFriendStatus('friends')
        else if (match.fromUid === user.uid) setFriendStatus('pending_sent')
        else setFriendStatus('pending_received')
      })
  }, [user, uid])

  const sendRequest = async () => {
    setActionLoading(true)
    try {
      await authedFetch('/api/friends', { method: 'POST', body: JSON.stringify({ toUid: uid }) })
      Analytics.friendRequestSent({ to_uid: uid })
      setFriendStatus('pending_sent')
    } finally { setActionLoading(false) }
  }

  const acceptRequest = async () => {
    setActionLoading(true)
    try {
      await authedFetch(`/api/friends/${uid}`, { method: 'PATCH' })
      Analytics.friendRequestAccepted()
      setFriendStatus('friends')
    } finally { setActionLoading(false) }
  }

  const unfriend = async () => {
    setActionLoading(true)
    try {
      await authedFetch(`/api/friends/${uid}`, { method: 'DELETE' })
      Analytics.friendRemoved()
      setFriendStatus('none')
    } finally { setActionLoading(false) }
  }

  const upcomingHosted = useMemo(
    () => hostedEvents.filter((e) => ['waiting', 'full'].includes(getEffectiveStatus(e))),
    [hostedEvents]
  )

  const topGames = useMemo(() => {
    // Prefer collection; fall back to most-hosted game names
    if (collection.length > 0) return collection.slice(0, 3).map((g) => g.name)
    const counts: Record<string, number> = {}
    for (const e of hostedEvents) {
      counts[e.boardGame.name] = (counts[e.boardGame.name] ?? 0) + 1
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([name]) => name)
  }, [collection, hostedEvents])

  if (profileLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600 dark:text-zinc-400">User not found</p>
          <Link href="/" className="mt-4 inline-block text-teal-600 hover:underline">Back to home</Link>
        </div>
      </div>
    )
  }

  const displayName = profile.displayName ?? 'Unknown'

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-zinc-950 px-4 py-10">
      <div className="max-w-lg mx-auto space-y-4">
        <div>
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-zinc-200 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 px-3.5 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800 shadow-sm transition-colors">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            Home
          </Link>
        </div>

        {/* Profile card */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800 p-8">
          <div className="flex items-center gap-5 mb-6">
            {profile.photoURL ? (
              <Image src={profile.photoURL} alt={displayName} width={72} height={72} className="rounded-full flex-shrink-0" />
            ) : (
              <div className="w-18 h-18 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center text-2xl font-semibold text-teal-700 dark:text-teal-300 flex-shrink-0">
                {displayName[0] ?? '?'}
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">{displayName}</h1>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                {profile.memberSince && (
                  <p className="text-xs text-slate-400 dark:text-zinc-500">Member since {profile.memberSince}</p>
                )}
                {profile.ratingAvg !== null && profile.ratingCount > 0 && (
                  <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-medium">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                    </svg>
                    {profile.ratingAvg.toFixed(1)} <span className="text-slate-400 dark:text-zinc-500 font-normal">({profile.ratingCount})</span>
                  </span>
                )}
              </div>
              {profile.bio && (
                <p className="text-sm text-slate-600 dark:text-zinc-300 mt-2 leading-relaxed">{profile.bio}</p>
              )}
              {!eventsLoading && topGames.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {topGames.map((g) => (
                    <span key={g} className="text-xs bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300 border border-teal-100 dark:border-teal-800 px-2 py-0.5 rounded-full">
                      {g}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-4 divide-x divide-slate-100 dark:divide-zinc-800 border-t border-b border-slate-100 dark:border-zinc-800 py-4 mb-6">
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-lg font-bold text-slate-900 dark:text-white">{eventsLoading ? '—' : hostedEvents.length}</span>
              <span className="text-xs text-slate-500 dark:text-zinc-400">Hosted</span>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-lg font-bold text-slate-900 dark:text-white">{eventsLoading ? '—' : joinedEvents.length}</span>
              <span className="text-xs text-slate-500 dark:text-zinc-400">Played</span>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-lg font-bold text-slate-900 dark:text-white">{collection.length > 0 ? collection.length : '—'}</span>
              <span className="text-xs text-slate-500 dark:text-zinc-400">Games</span>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-lg font-bold text-slate-900 dark:text-white">{friendCount === null ? '—' : friendCount}</span>
              <span className="text-xs text-slate-500 dark:text-zinc-400">Friends</span>
            </div>
          </div>

          {user && (
            <div className="pt-2">
              {friendStatus === 'none' && (
                <Button onClick={sendRequest} loading={actionLoading} className="w-full">Add Friend</Button>
              )}
              {friendStatus === 'pending_sent' && (
                <Button variant="secondary" disabled className="w-full">Requested</Button>
              )}
              {friendStatus === 'pending_received' && (
                <div className="flex gap-3">
                  <Button onClick={acceptRequest} loading={actionLoading} className="flex-1">Accept Request</Button>
                  <Button variant="ghost" onClick={unfriend} loading={actionLoading} className="flex-1 text-gray-500">Decline</Button>
                </div>
              )}
              {friendStatus === 'friends' && (
                <Button variant="ghost" onClick={unfriend} loading={actionLoading} className="w-full text-red-500 hover:text-red-700 hover:bg-red-50">
                  Unfriend
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Upcoming hosted events — public */}
        {!eventsLoading && upcomingHosted.length > 0 && (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800 p-6">
            <h2 className="font-semibold text-slate-900 dark:text-white mb-3">Upcoming Events</h2>
            <div className="divide-y divide-slate-100 dark:divide-zinc-800">
              {upcomingHosted.slice(0, 3).map((e) => <EventRow key={e.id} event={e} />)}
            </div>
          </div>
        )}

        {/* Game collection — public */}
        {collection.length > 0 && (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800 p-6">
            <h2 className="font-semibold text-slate-900 dark:text-white mb-4">
              Collection
              <span className="ml-2 text-sm font-normal text-slate-400 dark:text-zinc-500">{collection.length} game{collection.length !== 1 ? 's' : ''}</span>
            </h2>
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
              {collection.map((game) => (
                <div key={game.bggId} className="group relative bg-slate-50 dark:bg-zinc-800 rounded-xl overflow-hidden aspect-square" title={game.name}>
                  {game.thumbnail ? (
                    <Image
                      src={game.thumbnail}
                      alt={game.name}
                      width={100}
                      height={100}
                      className="w-full h-full object-contain p-1.5"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl">🎲</div>
                  )}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-1">
                    <p className="text-white text-xs font-medium text-center leading-tight line-clamp-3">{game.name}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Activity — friends only */}
        {friendStatus !== 'friends' ? (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800 p-6 text-center">
            <p className="text-slate-500 dark:text-zinc-400 text-sm">Add {displayName} as a friend to see their full activity</p>
          </div>
        ) : (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800 p-6 space-y-6">
          <h2 className="font-semibold text-slate-900 dark:text-white">Activity</h2>

          {eventsLoading ? (
            <div className="flex justify-center py-6">
              <Spinner className="h-5 w-5" />
            </div>
          ) : (
            <>
              {/* Hosted */}
              <section>
                <h3 className="text-xs font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wide mb-2">
                  Hosted ({hostedEvents.length})
                </h3>
                {hostedEvents.length === 0 ? (
                  <p className="text-sm text-slate-400 dark:text-zinc-500 italic">No hosted events</p>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-zinc-800">
                    {hostedEvents.map((e) => <EventRow key={e.id} event={e} />)}
                  </div>
                )}
              </section>

              {/* Joined */}
              <section>
                <h3 className="text-xs font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wide mb-2">
                  Joined ({joinedEvents.length})
                </h3>
                {joinedEvents.length === 0 ? (
                  <p className="text-sm text-slate-400 dark:text-zinc-500 italic">No joined events</p>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-zinc-800">
                    {joinedEvents.map((e) => <EventRow key={e.id} event={e} />)}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
        )}
      </div>
    </main>
  )
}
