'use client'
import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Spinner } from '@/components/ui/Spinner'
import { Button } from '@/components/ui/Button'
import { auth } from '@/lib/firebase/client'
import { formatDateTime, getEffectiveStatus } from '@/lib/utils'
import type { FriendshipStatus, GameEvent } from '@/types'

interface PublicUser {
  uid: string
  displayName: string | null
  photoURL: string | null
  bio: string | null
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
      setFriendStatus('pending_sent')
    } finally { setActionLoading(false) }
  }

  const acceptRequest = async () => {
    setActionLoading(true)
    try {
      await authedFetch(`/api/friends/${uid}`, { method: 'PATCH' })
      setFriendStatus('friends')
    } finally { setActionLoading(false) }
  }

  const unfriend = async () => {
    setActionLoading(true)
    try {
      await authedFetch(`/api/friends/${uid}`, { method: 'DELETE' })
      setFriendStatus('none')
    } finally { setActionLoading(false) }
  }

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
              <Image src={profile.photoURL} alt={displayName} width={72} height={72} className="rounded-full" />
            ) : (
              <div className="w-18 h-18 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center text-2xl font-semibold text-teal-700 dark:text-teal-300">
                {displayName[0] ?? '?'}
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">{displayName}</h1>
              {profile.bio && (
                <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">{profile.bio}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 divide-x divide-slate-100 dark:divide-zinc-800 border-t border-b border-slate-100 dark:border-zinc-800 py-4 mb-6">
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-xl font-bold text-slate-900 dark:text-white">{eventsLoading ? '—' : hostedEvents.length}</span>
              <span className="text-xs text-slate-500 dark:text-zinc-400">Hosted</span>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-xl font-bold text-slate-900 dark:text-white">{eventsLoading ? '—' : joinedEvents.length}</span>
              <span className="text-xs text-slate-500 dark:text-zinc-400">Played</span>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-xl font-bold text-slate-900 dark:text-white">{friendCount === null ? '—' : friendCount}</span>
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

        {/* Activity — friends only */}
        {friendStatus !== 'friends' ? (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800 p-6 text-center">
            <p className="text-slate-500 dark:text-zinc-400 text-sm">Add {displayName} as a friend to see their activity</p>
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
