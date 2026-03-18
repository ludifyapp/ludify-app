import { useState, useEffect, useCallback } from 'react'
import { auth } from '@/lib/firebase/client'
import type { FriendshipStatus } from '@/types'

interface RawFriendship {
  id: string
  uids: [string, string]
  fromUid: string
  toUid: string
  status: 'pending' | 'accepted'
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

export function useFriendships(myUid: string | null) {
  const [statuses, setStatuses] = useState<Record<string, FriendshipStatus>>({})
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    if (!myUid) return
    setLoading(true)
    try {
      const res = await authedFetch('/api/friends')
      const data = await res.json()
      const friendships: RawFriendship[] = data.friendships ?? []
      const map: Record<string, FriendshipStatus> = {}
      for (const f of friendships) {
        const otherId = f.fromUid === myUid ? f.toUid : f.fromUid
        if (f.status === 'accepted') {
          map[otherId] = 'friends'
        } else if (f.fromUid === myUid) {
          map[otherId] = 'pending_sent'
        } else {
          map[otherId] = 'pending_received'
        }
      }
      setStatuses(map)
    } catch {
      // silently ignore
    } finally {
      setLoading(false)
    }
  }, [myUid])

  useEffect(() => {
    refresh()
  }, [refresh])

  const sendRequest = async (toUid: string) => {
    await authedFetch('/api/friends', {
      method: 'POST',
      body: JSON.stringify({ toUid }),
    })
    setStatuses((prev) => ({ ...prev, [toUid]: 'pending_sent' }))
  }

  const cancelOrUnfriend = async (otherUid: string) => {
    await authedFetch(`/api/friends/${otherUid}`, { method: 'DELETE' })
    setStatuses((prev) => ({ ...prev, [otherUid]: 'none' }))
  }

  const accept = async (fromUid: string) => {
    await authedFetch(`/api/friends/${fromUid}`, { method: 'PATCH' })
    setStatuses((prev) => ({ ...prev, [fromUid]: 'friends' }))
  }

  return { statuses, loading, sendRequest, cancelOrUnfriend, accept, refresh }
}
