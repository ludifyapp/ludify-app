import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase/admin'
import { getDecodedToken } from '@/lib/api-auth'
import { sendPushToUser } from '@/lib/push'
import { FieldValue } from 'firebase-admin/firestore'
import { z } from 'zod'
import { randomUUID } from 'crypto'

const schema = z.object({
  name: z.string().min(1).max(50),
})

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    // Auth is optional — authenticated users get their UID tracked for My Events
    const decoded = await getDecodedToken(req)
    const uid = decoded?.uid ?? null
    const photoURL = decoded?.picture ?? undefined

    const body = await req.json()
    const { name } = schema.parse(body)

    const eventRef = db.collection('events').doc(id)
    const snap = await eventRef.get()

    if (!snap.exists) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

    const event = snap.data()!

    if (uid && event.playerUids?.includes(uid)) {
      return NextResponse.json({ error: 'You have already joined this event' }, { status: 409 })
    }
    if (event.status === 'cancelled') {
      return NextResponse.json({ error: 'Event is cancelled' }, { status: 409 })
    }

    const now = new Date()
    const start = new Date(event.dateTime)
    const end = event.endDateTime
      ? new Date(event.endDateTime)
      : new Date(new Date(event.dateTime).setHours(23, 59, 59, 999))

    if (now >= end) {
      return NextResponse.json({ error: 'Event has already ended' }, { status: 409 })
    }
    if (now >= start) {
      return NextResponse.json({ error: 'Event is already ongoing' }, { status: 409 })
    }
    if (event.players.length >= event.maxPlayers) {
      return NextResponse.json({ error: 'Event is full' }, { status: 409 })
    }

    const playerId = uid ?? randomUUID()
    const update: Record<string, any> = {
      players: FieldValue.arrayUnion({
        id: playerId,
        name,
        isHost: false,
        joinedAt: new Date().toISOString(),
        ...(photoURL && { photoURL }),
      }),
    }
    if (uid) {
      update.playerUids = FieldValue.arrayUnion(uid)
    }

    await eventRef.update(update)

    // Notify host (non-blocking, skip if joiner is the host)
    if (event.hostUid && event.hostUid !== uid) {
      const eventName = event.boardGame?.name ?? 'your event'
      sendPushToUser(
        event.hostUid,
        { title: '🎲 New player joined', body: `${name} joined ${eventName}`, url: `/event/${id}/manage` },
        'joinLeave'
      ).catch(() => {})
    }

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
