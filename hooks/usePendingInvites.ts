import { useEffect, useState } from 'react'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase/client'

export function usePendingInvites(uid: string | null | undefined): number {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!uid) { setCount(0); return }

    const q = query(
      collection(db, 'invites'),
      where('toUid', '==', uid),
      where('status', '==', 'pending')
    )

    const unsub = onSnapshot(q, (snap) => setCount(snap.size), () => {})
    return unsub
  }, [uid])

  return count
}
