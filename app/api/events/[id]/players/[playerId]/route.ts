import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase/admin'
import { FieldValue } from 'firebase-admin/firestore'

async function validateHostToken(eventId: string, token: string | null): Promise<boolean> {
  if (!token) return false
  const snap = await db.collection('events').doc(eventId).collection('secret').doc('host').get()
  return snap.exists && snap.data()?.hostToken === token
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; playerId: string }> }
) {
  try {
    const { id, playerId } = await params
    const token = req.headers.get('x-host-token')
    if (!(await validateHostToken(id, token))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const eventRef = db.collection('events').doc(id)
    const snap = await eventRef.get()

    if (!snap.exists) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

    const event = snap.data()!
    const player = event.players.find((p: any) => p.id === playerId)

    if (!player) return NextResponse.json({ error: 'Player not found' }, { status: 404 })
    if (player.isHost) return NextResponse.json({ error: 'Cannot remove the host' }, { status: 400 })

    await eventRef.update({ players: FieldValue.arrayRemove(player) })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
