import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase/admin'
import { getUidFromRequest } from '@/lib/api-auth'
import { sendPushToUser } from '@/lib/push'
import { FieldValue } from 'firebase-admin/firestore'

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; playerId: string }> }
) {
  try {
    const { id, playerId } = await params
    const uid = await getUidFromRequest(req)
    if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const eventRef = db.collection('events').doc(id)
    const snap = await eventRef.get()
    if (!snap.exists) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

    const event = snap.data()!
    const isHost = event.hostUid === uid
    const isSelf = playerId === uid

    if (!isHost && !isSelf) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const player = event.players.find((p: any) => p.id === playerId)
    if (!player) return NextResponse.json({ error: 'Player not found' }, { status: 404 })
    if (player.isHost) return NextResponse.json({ error: 'Cannot remove the host' }, { status: 400 })

    await eventRef.update({
      players: FieldValue.arrayRemove(player),
      playerUids: FieldValue.arrayRemove(player.id),
    })

    // Notify removed player if they have a UID (non-blocking)
    if (player.id && !player.id.includes('-')) {
      const eventName = event.boardGame?.name ?? 'an event'
      sendPushToUser(
        player.id,
        { title: '🎲 Removed from event', body: `You were removed from ${eventName}`, url: `/` },
        'joinLeave'
      ).catch(() => {})
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
