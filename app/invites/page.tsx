'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Spinner } from '@/components/ui/Spinner'
import { auth } from '@/lib/firebase/client'
import { formatDateTime } from '@/lib/utils'

interface Invite {
  id: string
  eventId: string
  fromUid: string
  fromName: string
  fromPhoto?: string | null
  eventName: string
  eventDate: string
  eventAddress: string
  status: 'pending' | 'seen'
  createdAt: string
}

async function authedFetch(path: string, options: RequestInit = {}) {
  const token = await auth.currentUser?.getIdToken()
  return fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
}

export default function InvitesPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [invites, setInvites] = useState<Invite[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) router.replace('/')
  }, [user, authLoading, router])

  useEffect(() => {
    if (!user) return
    const load = async () => {
      const res = await authedFetch('/api/invites')
      const data = await res.json()
      setInvites(data.invites ?? [])
      setLoading(false)
      authedFetch('/api/invites', { method: 'PATCH' })
    }
    load()
  }, [user])

  const removeInvite = (id: string) =>
    setInvites((prev) => prev.filter((i) => i.id !== id))

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  const newInvites = invites.filter((i) => i.status === 'pending')
  const seenInvites = invites.filter((i) => i.status === 'seen')

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 px-4 py-10">
      <div className="max-w-lg mx-auto space-y-6">
        <div>
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-zinc-200 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 px-3.5 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800 shadow-sm transition-colors">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            Home
          </Link>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Invites</h1>

        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner className="h-6 w-6" />
          </div>
        ) : invites.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <p className="text-3xl mb-3">✉️</p>
            <p className="text-gray-700 dark:text-gray-200 font-medium">No invites yet</p>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              When friends invite you to events, they&apos;ll show up here
            </p>
          </div>
        ) : (
          <>
            {newInvites.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3">
                  New ({newInvites.length})
                </h2>
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
                  {newInvites.map((invite) => (
                    <InviteRow
                      key={invite.id}
                      invite={invite}
                      isNew
                      user={user}
                      onRemove={removeInvite}
                    />
                  ))}
                </div>
              </section>
            )}

            {seenInvites.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3">
                  Earlier
                </h2>
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
                  {seenInvites.map((invite) => (
                    <InviteRow
                      key={invite.id}
                      invite={invite}
                      user={user}
                      onRemove={removeInvite}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  )
}

function InviteRow({
  invite,
  isNew,
  user,
  onRemove,
}: {
  invite: Invite
  isNew?: boolean
  user: { uid: string; displayName: string | null }
  onRemove: (id: string) => void
}) {
  const router = useRouter()
  const [accepting, setAccepting] = useState(false)
  const [declining, setDeclining] = useState(false)

  const accept = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setAccepting(true)
    try {
      const token = await auth.currentUser?.getIdToken()
      const res = await fetch(`/api/events/${invite.eventId}/players`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ name: user.displayName ?? 'Player' }),
      })
      if (res.ok) {
        router.push(`/event/${invite.eventId}`)
      } else {
        const data = await res.json()
        alert(data.error ?? 'Could not join event')
      }
    } finally {
      setAccepting(false)
    }
  }

  const decline = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setDeclining(true)
    try {
      await authedFetch(`/api/invites/${invite.id}`, { method: 'DELETE' })
      onRemove(invite.id)
    } finally {
      setDeclining(false)
    }
  }

  return (
    <div
      role="button"
      onClick={() => router.push(`/event/${invite.eventId}`)}
      className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
        isNew ? 'bg-indigo-50/40 dark:bg-indigo-900/10 hover:bg-indigo-50 dark:hover:bg-indigo-900/20' : ''
      }`}
    >
      {/* Sender avatar — clickable to profile */}
      <div className="relative flex-shrink-0" onClick={(e) => e.stopPropagation()}>
        <Link href={`/profile/${invite.fromUid}`}>
          {invite.fromPhoto ? (
            <Image
              src={invite.fromPhoto}
              alt={invite.fromName}
              width={44}
              height={44}
              className="rounded-full hover:opacity-80 transition-opacity"
            />
          ) : (
            <div className="w-11 h-11 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-semibold hover:opacity-80 transition-opacity">
              {invite.fromName.charAt(0).toUpperCase()}
            </div>
          )}
        </Link>
        {isNew && (
          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-indigo-500 rounded-full border-2 border-white dark:border-gray-800" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-900 dark:text-gray-100">
          <span className="font-semibold">{invite.fromName}</span>
          {' invited you to '}
          <span className="font-semibold">{invite.eventName}</span>
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{formatDateTime(invite.eventDate)}</p>
        {invite.eventAddress && (
          <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{invite.eventAddress}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={accept}
          disabled={accepting || declining}
          className="text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
        >
          {accepting ? '…' : 'Accept'}
        </button>
        <button
          onClick={decline}
          disabled={accepting || declining}
          className="text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
        >
          {declining ? '…' : 'Decline'}
        </button>
      </div>
    </div>
  )
}
