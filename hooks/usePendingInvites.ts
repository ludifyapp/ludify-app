import { useEffect, useState } from 'react'
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase/client'

const usingEmulator = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true'

export function usePendingInvites(uid: string | null | undefined): number {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!uid) { setCount(0); return }

    const q = query(
      collection(db, 'invites'),
      where('toUid', '==', uid),
      where('status', '==', 'pending')
    )

    if (usingEmulator) {
      // onSnapshot watch stream causes ca9 assertion on navigation in the emulator
      getDocs(q).then(snap => setCount(snap.size)).catch(() => {})
      return
    }

    const unsub = onSnapshot(q, (snap) => setCount(snap.size), () => {})
    return unsub
  }, [uid])

  return count
}
