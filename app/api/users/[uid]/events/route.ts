import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase/admin'
import { getEffectiveStatus } from '@/lib/utils'
import type { GameEvent } from '@/types'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ uid: string }> }) {
  try {
    const { uid } = await params

    const snap = await db
      .collection('events')
      .where('playerUids', 'array-contains', uid)
      .get()

    const events = snap.docs.map((d) => ({ id: d.id, ...d.data() } as GameEvent))

    const hosted = events.filter((e) => e.hostUid === uid)
    const joined = events.filter((e) => {
      if (e.hostUid === uid) return false
      return getEffectiveStatus(e) === 'ended'
    })

    const friendsSnap = await db
      .collection('friendships')
      .where('uids', 'array-contains', uid)
      .where('status', '==', 'accepted')
      .get()

    return NextResponse.json({ hosted, joined, friendCount: friendsSnap.size })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
