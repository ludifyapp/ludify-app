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

    // Auth is optional — authenticated users get their UID tracked for My Tables
    const decoded = await getDecodedToken(req)
    const uid = decoded?.uid ?? null
    const photoURL = decoded?.picture ?? undefined

    const body = await req.json()
    const { name } = schema.parse(body)

    const tableRef = db.collection('tables').doc(id)
    const snap = await tableRef.get()

    if (!snap.exists) return NextResponse.json({ error: 'Table not found' }, { status: 404 })

    const table = snap.data()!

    if (uid && table.playerUids?.includes(uid)) {
      return NextResponse.json({ error: 'You have already joined this table' }, { status: 409 })
    }
    if (table.status === 'cancelled') {
      return NextResponse.json({ error: 'Table is cancelled' }, { status: 409 })
    }

    const now = new Date()
    const start = new Date(table.dateTime)
    const end = table.endDateTime
      ? new Date(table.endDateTime)
      : new Date(new Date(table.dateTime).setHours(23, 59, 59, 999))

    if (now >= end) {
      return NextResponse.json({ error: 'Table has already ended' }, { status: 409 })
    }
    if (now >= start) {
      return NextResponse.json({ error: 'Table is already ongoing' }, { status: 409 })
    }
    if (table.players.length >= table.maxPlayers) {
      return NextResponse.json({ error: 'Table is full' }, { status: 409 })
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

    await tableRef.update(update)

    // Notify host (non-blocking, skip if joiner is the host)
    if (table.hostUid && table.hostUid !== uid) {
      const tableName = table.boardGame?.name ?? 'your table'
      sendPushToUser(
        table.hostUid,
        { title: '🎲 New player joined', body: `${name} joined ${tableName}`, url: `/table/${id}/manage` },
        'joinLeave'
      ).catch(() => {})
    }

    // Confirm to the joiner (non-blocking, authenticated users only)
    if (uid) {
      const tableName = table.boardGame?.name ?? 'Ludify'
      const tableDate = new Date(table.dateTime).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
      sendPushToUser(
        uid,
        { title: `✅ You're in! ${tableName}`, body: `${tableDate} · ${table.address}`, url: `/table/${id}` }
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
