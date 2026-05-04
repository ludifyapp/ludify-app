import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase/admin'
import { getUidFromRequest } from '@/lib/api-auth'
import { getEffectiveStatus } from '@/lib/utils'
import { FieldValue } from 'firebase-admin/firestore'
import type { GameTable } from '@/types'

// GET /api/tables/[id]/rating — returns current user's existing rating for this table (if any)
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const uid = await getUidFromRequest(req)
    if (!uid) return NextResponse.json({ rating: null })

    const snap = await db.collection('ratings')
      .where('tableId', '==', id)
      .where('raterUid', '==', uid)
      .limit(1)
      .get()

    if (snap.empty) return NextResponse.json({ rating: null })
    return NextResponse.json({ rating: { id: snap.docs[0].id, ...snap.docs[0].data() } })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/tables/[id]/rating — attendee submits a 1–5 star rating for the host
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const uid = await getUidFromRequest(req)
    if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const score = Number(body.score)
    if (!Number.isInteger(score) || score < 1 || score > 5) {
      return NextResponse.json({ error: 'Score must be 1–5' }, { status: 400 })
    }

    const tableSnap = await db.collection('tables').doc(id).get()
    if (!tableSnap.exists) return NextResponse.json({ error: 'Table not found' }, { status: 404 })

    const table = { id: tableSnap.id, ...tableSnap.data() } as GameTable
    const effectiveStatus = getEffectiveStatus(table)

    if (effectiveStatus !== 'ended') {
      return NextResponse.json({ error: 'Ratings can only be submitted after the table ends' }, { status: 400 })
    }
    if (table.hostUid === uid) {
      return NextResponse.json({ error: 'Hosts cannot rate themselves' }, { status: 400 })
    }
    if (!table.playerUids.includes(uid)) {
      return NextResponse.json({ error: 'Only attendees can rate the host' }, { status: 403 })
    }

    // Prevent duplicate ratings
    const existing = await db.collection('ratings')
      .where('tableId', '==', id)
      .where('raterUid', '==', uid)
      .limit(1)
      .get()
    if (!existing.empty) {
      return NextResponse.json({ rating: { id: existing.docs[0].id, ...existing.docs[0].data() } }, { status: 200 })
    }

    const rating = {
      tableId: id,
      hostUid: table.hostUid,
      raterUid: uid,
      score,
      createdAt: new Date().toISOString(),
    }

    const ref = await db.collection('ratings').add(rating)

    // Denormalize: increment running total on host's user doc for O(1) avg display
    await db.collection('users').doc(table.hostUid).set(
      { ratingTotal: FieldValue.increment(score), ratingCount: FieldValue.increment(1) },
      { merge: true }
    )

    return NextResponse.json({ rating: { id: ref.id, ...rating } }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
