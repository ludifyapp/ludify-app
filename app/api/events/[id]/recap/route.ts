import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase/admin'
import { getUidFromRequest } from '@/lib/api-auth'
import { getEffectiveStatus } from '@/lib/utils'
import type { GameEvent } from '@/types'
import { z } from 'zod'

const postSchema = z.object({
  note: z.string().max(500).optional().default(''),
})

// GET /api/events/[id]/recap — check if a recap exists for this event
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const snap = await db.collection('recaps').where('eventId', '==', id).limit(1).get()
    if (snap.empty) return NextResponse.json({ recap: null })
    const doc = snap.docs[0]
    return NextResponse.json({ recap: { id: doc.id, ...doc.data() } })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/events/[id]/recap — host posts a recap after event ends
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const uid = await getUidFromRequest(req)
    if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const eventSnap = await db.collection('events').doc(id).get()
    if (!eventSnap.exists) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

    const event = { id: eventSnap.id, ...eventSnap.data() } as GameEvent
    if (event.hostUid !== uid) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const effectiveStatus = getEffectiveStatus(event)
    if (effectiveStatus !== 'ended') {
      return NextResponse.json({ error: 'Recap can only be posted after the event has ended' }, { status: 400 })
    }

    // Only one recap per event
    const existing = await db.collection('recaps').where('eventId', '==', id).limit(1).get()
    if (!existing.empty) {
      return NextResponse.json({ recap: { id: existing.docs[0].id, ...existing.docs[0].data() } }, { status: 200 })
    }

    const body = postSchema.parse(await req.json())

    const host = event.players.find((p) => p.isHost)

    const recap = {
      eventId: id,
      hostUid: uid,
      hostName: host?.name ?? '',
      hostPhoto: host?.photoURL ?? '',
      game: {
        name: event.boardGame.name,
        thumbnail: event.boardGame.thumbnail ?? '',
        bggId: event.boardGame.bggId ?? '',
      },
      note: body.note,
      playerCount: event.players.length,
      createdAt: new Date().toISOString(),
    }

    const ref = await db.collection('recaps').add(recap)
    return NextResponse.json({ recap: { id: ref.id, ...recap } }, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues[0]?.message ?? 'Invalid input' }, { status: 400 })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
