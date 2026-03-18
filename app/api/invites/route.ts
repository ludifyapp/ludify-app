import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase/admin'
import { getDecodedToken } from '@/lib/api-auth'
import { z } from 'zod'
import type { GameEvent } from '@/types'

const postSchema = z.object({
  eventId: z.string().min(1),
  toUids: z.array(z.string().min(1)).min(1).max(20),
})

// Doc ID is deterministic to prevent duplicate invites
function inviteId(fromUid: string, eventId: string, toUid: string) {
  return `${fromUid}_${eventId}_${toUid}`
}

// GET /api/invites              → received invites for current user
// GET /api/invites?sent=true&eventId=xxx → UIDs already invited by me for this event
export async function GET(req: NextRequest) {
  const decoded = await getDecodedToken(req)
  if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const sent = searchParams.get('sent') === 'true'
  const eventId = searchParams.get('eventId')

  if (sent && eventId) {
    const snap = await db
      .collection('invites')
      .where('fromUid', '==', decoded.uid)
      .where('eventId', '==', eventId)
      .get()
    const toUids = snap.docs.map((d) => d.data().toUid as string)
    return NextResponse.json({ toUids })
  }

  const snap = await db
    .collection('invites')
    .where('toUid', '==', decoded.uid)
    .get()

  const invites = snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a: any, b: any) => b.createdAt.localeCompare(a.createdAt))
  return NextResponse.json({ invites })
}

// POST /api/invites → send invites { eventId, toUids }
export async function POST(req: NextRequest) {
  const decoded = await getDecodedToken(req)
  if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { eventId, toUids } = postSchema.parse(body)

  // Fetch event info server-side
  const eventSnap = await db.collection('events').doc(eventId).get()
  if (!eventSnap.exists) return NextResponse.json({ error: 'Event not found' }, { status: 404 })
  const event = eventSnap.data() as GameEvent

  const now = new Date().toISOString()
  const batch = db.batch()

  for (const toUid of toUids) {
    if (toUid === decoded.uid) continue
    const docRef = db.collection('invites').doc(inviteId(decoded.uid, eventId, toUid))
    batch.set(
      docRef,
      {
        eventId,
        fromUid: decoded.uid,
        toUid,
        status: 'pending',
        fromName: decoded.name ?? 'Someone',
        fromPhoto: decoded.picture ?? null,
        eventName: event.boardGame?.name ?? 'Game Night',
        eventDate: event.dateTime,
        eventAddress: event.address ?? '',
        createdAt: now,
      },
      { merge: true }
    )
  }

  await batch.commit()
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
