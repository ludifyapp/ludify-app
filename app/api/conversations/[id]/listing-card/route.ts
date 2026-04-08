import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase/admin'
import { getUidFromRequest } from '@/lib/api-auth'
import { Timestamp } from 'firebase-admin/firestore'

// POST /api/conversations/[id]/listing-card — insert a listing context card into the thread
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const uid = await getUidFromRequest(req)
    if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const convSnap = await db.collection('conversations').doc(id).get()
    if (!convSnap.exists) return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })

    const conv = convSnap.data()!
    if (!conv.participants.includes(uid)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { listingId, listingName, listingThumbnail } = body

    if (!listingId || typeof listingId !== 'string') {
      return NextResponse.json({ error: 'listingId required' }, { status: 400 })
    }
    if (!listingName || typeof listingName !== 'string') {
      return NextResponse.json({ error: 'listingName required' }, { status: 400 })
    }

    await db.collection('conversations').doc(id).collection('messages').add({
      uid: 'system',
      text: '',
      type: 'listing',
      listing: {
        id: listingId,
        name: listingName,
        thumbnail: listingThumbnail ?? '',
      },
      createdAt: Timestamp.now(),
    })

    return NextResponse.json({ ok: true }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
