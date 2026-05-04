import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase/admin'
import { getEffectiveStatus } from '@/lib/utils'
import type { GameTable } from '@/types'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ uid: string }> }) {
  try {
    const { uid } = await params

    const snap = await db
      .collection('tables')
      .where('playerUids', 'array-contains', uid)
      .get()

    const tables = snap.docs.map((d) => ({ id: d.id, ...d.data() } as GameTable))

    const hosted = tables.filter((e) => e.hostUid === uid)
    const joined = tables.filter((e) => {
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
