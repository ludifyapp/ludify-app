import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase/admin'
import { getDecodedToken } from '@/lib/api-auth'
import { sendPushToUser } from '@/lib/push'
import { z } from 'zod'
import type { GameTable } from '@/types'

const postSchema = z.object({
  tableId: z.string().min(1),
  toUids: z.array(z.string().min(1)).min(1).max(20),
})

// Doc ID is deterministic to prevent duplicate invites
function inviteId(fromUid: string, tableId: string, toUid: string) {
  return `${fromUid}_${tableId}_${toUid}`
}

// GET /api/invites              → received invites for current user
// GET /api/invites?sent=true&tableId=xxx → UIDs already invited by me for this table
export async function GET(req: NextRequest) {
  const decoded = await getDecodedToken(req)
  if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const sent = searchParams.get('sent') === 'true'
  const tableId = searchParams.get('tableId')

  if (sent && tableId) {
    const snap = await db
      .collection('invites')
      .where('fromUid', '==', decoded.uid)
      .where('tableId', '==', tableId)
      .get()
    const toUids = snap.docs.map((d) => d.data().toUid as string)
    return NextResponse.json({ toUids })
  }

  const snap = await db
    .collection('invites')
    .where('toUid', '==', decoded.uid)
    .get()

  type RawInvite = { id: string; tableId: string; createdAt: string } & Record<string, any>
  const rawInvites = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as RawInvite[]

  // Filter out invites for tables the user has already joined
  const tableIds = [...new Set(rawInvites.map((i) => i.tableId as string))]
  const tableSnaps = await Promise.all(
    tableIds.map((id) => db.collection('tables').doc(id).get())
  )
  const joinedEventIds = new Set(
    tableSnaps
      .filter((s) => s.exists && (s.data()?.playerUids ?? []).includes(decoded.uid))
      .map((s) => s.id)
  )

  const invites = rawInvites
    .filter((i) => !joinedEventIds.has(i.tableId))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  return NextResponse.json({ invites })
}

// POST /api/invites → send invites { tableId, toUids }
export async function POST(req: NextRequest) {
  const decoded = await getDecodedToken(req)
  if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { tableId, toUids } = postSchema.parse(body)

  // Fetch table info server-side
  const tableSnap = await db.collection('tables').doc(tableId).get()
  if (!tableSnap.exists) return NextResponse.json({ error: 'Table not found' }, { status: 404 })
  const table = tableSnap.data() as GameTable

  const now = new Date().toISOString()
  const batch = db.batch()

  for (const toUid of toUids) {
    if (toUid === decoded.uid) continue
    const docRef = db.collection('invites').doc(inviteId(decoded.uid, tableId, toUid))
    batch.set(
      docRef,
      {
        tableId,
        fromUid: decoded.uid,
        toUid,
        status: 'pending',
        fromName: decoded.name ?? 'Someone',
        fromPhoto: decoded.picture ?? null,
        tableName: table.boardGame?.name ?? 'Ludify',
        tableDate: table.dateTime,
        tableAddress: table.address ?? '',
        createdAt: now,
      },
      { merge: true }
    )
  }

  await batch.commit()

  // Fire push notifications (non-blocking)
  const fromName = decoded.name ?? 'Someone'
  const tableName = table.boardGame?.name ?? 'Ludify'
  const validUids = toUids.filter((uid) => uid !== decoded.uid)
  Promise.all(
    validUids.map((uid) =>
      sendPushToUser(uid, {
        title: '🎲 Ludify Invite',
        body: `${fromName} invited you to play ${tableName}`,
        url: `/invites`,
      }, 'invites')
    )
  ).catch(() => {})

  return NextResponse.json({ success: true }, { status: 201 })
}

// PATCH /api/invites → mark all received invites as seen
export async function PATCH(req: NextRequest) {
  const decoded = await getDecodedToken(req)
  if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const snap = await db
    .collection('invites')
    .where('toUid', '==', decoded.uid)
    .where('status', '==', 'pending')
    .get()

  if (snap.empty) return NextResponse.json({ success: true })

  const batch = db.batch()
  snap.docs.forEach((d) => batch.update(d.ref, { status: 'seen' }))
  await batch.commit()

  return NextResponse.json({ success: true })
}
