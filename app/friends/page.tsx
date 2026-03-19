'use client'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Spinner } from '@/components/ui/Spinner'
import { Button } from '@/components/ui/Button'
import { auth } from '@/lib/firebase/client'
import type { Friendship } from '@/types'

type RawFriendship = Omit<Friendship, 'id'> & { id: string }

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

function Avatar({ name, photoURL, uid }: { name: string; photoURL?: string; uid: string }) {
  const initials = name.charAt(0).toUpperCase()
  return (
    <Link href={`/profile/${uid}`}>
      {photoURL ? (
        <Image
          src={photoURL}
          alt={name}
          width={40}
          height={40}
          className="rounded-full flex-shrink-0 hover:opacity-80 transition-opacity"
        />
      ) : (
        <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-semibold flex-shrink-0 hover:opacity-80 transition-opacity">
          {initials}
        </div>
      )}
    </Link>
  )
}

export default function FriendsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [friendships, setFriendships] = useState<RawFriendship[]>([])
  const [fetching, setFetching] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && !user) router.replace('/')
  }, [user, loading, router])

  const fetchFriendships = useCallback(async () => {
    if (!user) return
    setFetching(true)
    try {
      const res = await authedFetch('/api/friends')
      const data = await res.json()
      setFriendships(data.friendships ?? [])
    } finally {
      setFetching(false)
    }
  }, [user])

  useEffect(() => {
    if (user) fetchFriendships()
  }, [user, fetchFriendships])

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  const pendingReceived = friendships.filter(
    (f) => f.status === 'pending' && f.toUid === user.uid
  )
  const pendingSent = friendships.filter(
    (f) => f.status === 'pending' && f.fromUid === user.uid
  )
  const friends = friendships.filter((f) => f.status === 'accepted')

  const getOther = (f: RawFriendship) => {
    if (f.fromUid === user.uid) return { uid: f.toUid, name: f.toName, photo: f.toPhoto }
    return { uid: f.fromUid, name: f.fromName, photo: f.fromPhoto }
  }

  const accept = async (fromUid: string) => {
    setActionLoading(fromUid)
    try {
      await authedFetch(`/api/friends/${fromUid}`, { method: 'PATCH' })
      await fetchFriendships()
    } finally {
      setActionLoading(null)
    }
  }

  const remove = async (otherUid: string) => {
    setActionLoading(otherUid)
    try {
      await authedFetch(`/api/friends/${otherUid}`, { method: 'DELETE' })
      await fetchFriendships()
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 px-4 py-10">
      <div className="max-w-lg mx-auto space-y-6">
        <div className="mb-2">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-zinc-200 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 px-3.5 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800 shadow-sm transition-colors">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            Home
          </Link>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Friends</h1>

        {fetching ? (
          <div className="flex justify-center py-12">
            <Spinner className="h-6 w-6" />
          </div>
        ) : (
          <>
            {pendingReceived.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                  Friend Requests ({pendingReceived.length})
                </h2>
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
                  {pendingReceived.map((f) => {
                    const other = getOther(f)
                    return (
                      <div key={f.id} className="flex items-center gap-3 px-4 py-3">
                        <Avatar name={other.name} photoURL={other.photo} uid={other.uid} />
                        <span className="flex-1 font-medium text-gray-900 dark:text-white">{other.name}</span>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            loading={actionLoading === other.uid}
                            onClick={() => accept(other.uid)}
                          >
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            loading={actionLoading === other.uid}
                            onClick={() => remove(other.uid)}
                            className="text-gray-500"
                          >
                            Decline
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            )}

            {pendingSent.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                  Sent Requests
                </h2>
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
                  {pendingSent.map((f) => {
                    const other = getOther(f)
                    return (
                      <div key={f.id} className="flex items-center gap-3 px-4 py-3">
                        <Avatar name={other.name} photoURL={other.photo} uid={other.uid} />
                        <span className="flex-1 font-medium text-gray-900 dark:text-white">{other.name}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          loading={actionLoading === other.uid}
                          onClick={() => remove(other.uid)}
                          className="text-gray-500"
                        >
                          Cancel
                        </Button>
                      </div>
                    )
                  })}
                </div>
              </section>
            )}

            <section>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Friends {friends.length > 0 ? `(${friends.length})` : ''}
              </h2>
              {friends.length === 0 ? (
                <p className="text-gray-400 dark:text-gray-500 text-sm text-center py-8">No friends yet</p>
              ) : (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
                  {friends.map((f) => {
                    const other = getOther(f)
                    return (
                      <div key={f.id} className="flex items-center gap-3 px-4 py-3">
                        <Avatar name={other.name} photoURL={other.photo} uid={other.uid} />
                        <span className="flex-1 font-medium text-gray-900 dark:text-white">{other.name}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          loading={actionLoading === other.uid}
                          onClick={() => remove(other.uid)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          Unfriend
                        </Button>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  )
}
