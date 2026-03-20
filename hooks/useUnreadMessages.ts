'use client'
import { useEffect, useState } from 'react'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase/client'

export function useUnreadMessages(uid: string | undefined): number {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!uid) { setCount(0); return }
    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', uid)
    )
    const unsub = onSnapshot(q, (snap) => {
      let total = 0
      snap.docs.forEach((d) => {
        const unread = d.data().unread ?? {}
        total += unread[uid] ?? 0
      })
      setCount(total)
    }, () => {})
    return unsub
  }, [uid])

  return count
}
