import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase/admin'
import { getUidFromRequest } from '@/lib/api-auth'
import { getEffectiveStatus } from '@/lib/utils'
import type { GameTable } from '@/types'
import { z } from 'zod'

const postSchema = z.object({
  note: z.string().max(500).optional().default(''),
  winner: z.string().max(100).optional().default(''),
})

// GET /api/tables/[id]/recap — check if a recap exists for this table
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const snap = await db.collection('recaps').where('tableId', '==', id).limit(1).get()
    if (snap.empty) return NextResponse.json({ recap: null })
    const doc = snap.docs[0]
    return NextResponse.json({ recap: { id: doc.id, ...doc.data() } })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/tables/[id]/recap — host posts a recap after table ends
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const uid = await getUidFromRequest(req)
    if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const tableSnap = await db.collection('tables').doc(id).get()
    if (!tableSnap.exists) return NextResponse.json({ error: 'Table not found' }, { status: 404 })

    const table = { id: tableSnap.id, ...tableSnap.data() } as GameTable
    if (table.hostUid !== uid) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const effectiveStatus = getEffectiveStatus(table)
    if (effectiveStatus !== 'ended') {
      return NextResponse.json({ error: 'Recap can only be posted after the table has ended' }, { status: 400 })
    }

    // Only one recap per table
    const existing = await db.collection('recaps').where('tableId', '==', id).limit(1).get()
    if (!existing.empty) {
      return NextResponse.json({ recap: { id: existing.docs[0].id, ...existing.docs[0].data() } }, { status: 200 })
    }

    const body = postSchema.parse(await req.json())

    const host = table.players.find((p) => p.isHost)

    const recap: Record<string, unknown> = {
      tableId: id,
      hostUid: uid,
      hostName: host?.name ?? '',
      hostPhoto: host?.photoURL ?? '',
      game: {
        name: table.boardGame.name,
        thumbnail: table.boardGame.thumbnail ?? '',
        bggId: table.boardGame.bggId ?? '',
      },
      note: body.note,
      playerCount: table.players.length,
      createdAt: new Date().toISOString(),
    }
    if (body.winner) recap.winner = body.winner.trim()

    const ref = await db.collection('recaps').add(recap)
    return NextResponse.json({ recap: { id: ref.id, ...recap } }, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues[0]?.message ?? 'Invalid input' }, { status: 400 })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
