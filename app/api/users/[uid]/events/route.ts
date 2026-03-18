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

    const events = snap.docs
      .map((d) => ({ id: d.id, ...d.data() } as GameEvent))
      .filter((e) => {
        if (e.type !== 'public') return false
        const s = getEffectiveStatus(e)
        return s !== 'ended' && s !== 'cancelled'
      })
      .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime())

    const hosted = events.filter((e) => e.hostUid === uid)
    const joined = events.filter((e) => e.hostUid !== uid)

    return NextResponse.json({ hosted, joined })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
