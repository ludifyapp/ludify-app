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
    waiting: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
    active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    full: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    ongoing: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
    ended: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400',
    cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  }
  return (
    <Link href={`/event/${event.id}`}>
      <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
        {event.boardGame.thumbnail ? (
          <Image
            src={event.boardGame.thumbnail}
            alt={event.boardGame.name}
            width={40}
            height={40}
            className="rounded-lg object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
            <span className="text-lg">🎲</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 dark:text-white text-sm">{event.boardGame.name}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{formatDateTime(event.dateTime)}</p>
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
          <p className="text-gray-600 dark:text-gray-400">User not found</p>
          <Link href="/" className="mt-4 inline-block text-indigo-600 hover:underline">Back to home</Link>
        </div>
      </div>
    )
  }

  const displayName = profile.displayName ?? 'Unknown'

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 px-4 py-10">
      <div className="max-w-lg mx-auto space-y-4">
        <div>
          <Link href="/" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">← Home</Link>
        </div>

        {/* Profile card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8">
          <div className="flex items-center gap-5 mb-8">
            {profile.photoURL ? (
              <Image src={profile.photoURL} alt={displayName} width={72} height={72} className="rounded-full" />
            ) : (
              <div className="w-18 h-18 rounded-full bg-indigo-100 flex items-center justify-center text-2xl font-semibold text-indigo-700">
                {displayName[0] ?? '?'}
              </div>
            )}
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">{displayName}</h1>
          </div>

          {user && (
            <div className="pt-6 border-t border-gray-100 dark:border-gray-700">
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

        {/* Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 space-y-6">
          <h2 className="font-semibold text-gray-900 dark:text-white">Activity</h2>

          {eventsLoading ? (
            <div className="flex justify-center py-6">
              <Spinner className="h-5 w-5" />
            </div>
          ) : (
            <>
              {/* Hosted */}
              <section>
                <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">
                  Hosted ({hostedEvents.length})
                </h3>
                {hostedEvents.length === 0 ? (
                  <p className="text-sm text-gray-400 dark:text-gray-500 italic">No hosted events</p>
                ) : (
                  <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {hostedEvents.map((e) => <EventRow key={e.id} event={e} />)}
                  </div>
                )}
              </section>

              {/* Joined */}
              <section>
                <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">
                  Joined ({joinedEvents.length})
                </h3>
                {joinedEvents.length === 0 ? (
                  <p className="text-sm text-gray-400 dark:text-gray-500 italic">No joined events</p>
                ) : (
                  <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {joinedEvents.map((e) => <EventRow key={e.id} event={e} />)}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </div>
    </main>
  )
}
