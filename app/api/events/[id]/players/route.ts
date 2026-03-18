import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase/admin'
import { FieldValue } from 'firebase-admin/firestore'
import { z } from 'zod'
import { randomUUID } from 'crypto'

const schema = z.object({
  name: z.string().min(1).max(50),
})

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const { name } = schema.parse(body)

    const eventRef = db.collection('events').doc(id)
    const snap = await eventRef.get()

    if (!snap.exists) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

    const event = snap.data()!

    if (event.status === 'cancelled') {
      return NextResponse.json({ error: 'Event is cancelled' }, { status: 409 })
    }
    if (new Date(event.dateTime) < new Date()) {
      return NextResponse.json({ error: 'Event has already ended' }, { status: 409 })
    }
    if (event.players.length >= event.maxPlayers) {
      return NextResponse.json({ error: 'Event is full' }, { status: 409 })
    }

    const playerId = randomUUID()
    await eventRef.update({
      players: FieldValue.arrayUnion({
        id: playerId,
        name,
        isHost: false,
        joinedAt: new Date().toISOString(),
      }),
    })

    return NextResponse.json({ playerId }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
