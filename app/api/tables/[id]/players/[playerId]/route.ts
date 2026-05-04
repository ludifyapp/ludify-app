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

    const tableRef = db.collection('tables').doc(id)
    const snap = await tableRef.get()
    if (!snap.exists) return NextResponse.json({ error: 'Table not found' }, { status: 404 })

    const table = snap.data()!
    const isHost = table.hostUid === uid
    const isSelf = playerId === uid

    if (!isHost && !isSelf) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const player = table.players.find((p: any) => p.id === playerId)
    if (!player) return NextResponse.json({ error: 'Player not found' }, { status: 404 })
    if (player.isHost) return NextResponse.json({ error: 'Cannot remove the host' }, { status: 400 })

    await tableRef.update({
      players: FieldValue.arrayRemove(player),
      playerUids: FieldValue.arrayRemove(player.id),
    })

    // Notify removed player if they have a UID (non-blocking)
    if (player.id && !player.id.includes('-')) {
      const tableName = table.boardGame?.name ?? 'a table'
      sendPushToUser(
        player.id,
        { title: '🎲 Removed from table', body: `You were removed from ${tableName}`, url: `/` },
        'joinLeave'
      ).catch(() => {})
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
