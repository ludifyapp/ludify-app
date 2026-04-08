import { NextRequest, NextResponse } from 'next/server'
import { db, adminAuth } from '@/lib/firebase/admin'
import { getUidFromRequest } from '@/lib/api-auth'

// GET /api/conversations — list the current user's conversations
export async function GET(req: NextRequest) {
  try {
    const uid = await getUidFromRequest(req)
    if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const snap = await db
      .collection('conversations')
      .where('participants', 'array-contains', uid)
      .orderBy('lastMessageAt', 'desc')
      .limit(50)
      .get()

    const conversations = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    return NextResponse.json({ conversations })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/conversations — create or get conversation with another user
export async function POST(req: NextRequest) {
  try {
    const uid = await getUidFromRequest(req)
    if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { toUid, listingId, listingName, listingThumbnail } = body

    if (!toUid || typeof toUid !== 'string') {
      return NextResponse.json({ error: 'toUid required' }, { status: 400 })
    }
    if (toUid === uid) {
      return NextResponse.json({ error: 'Cannot message yourself' }, { status: 400 })
    }

    // Stable conversation ID: sorted UIDs joined with _
    const participants = [uid, toUid].sort()
    const convId = participants.join('_')

    const ref = db.collection('conversations').doc(convId)
    const existing = await ref.get()

    if (existing.exists) {
      // If opened from a listing, always refresh the listing context so the banner shows
      if (listingId) {
        const update: Record<string, unknown> = {}
        if (listingId) update.listingId = listingId
        if (listingName) update.listingName = listingName
        if (listingThumbnail) update.listingThumbnail = listingThumbnail
        await ref.update(update)
      }
      return NextResponse.json({ conversationId: convId, created: false })
    }

    // Fetch both users' display info
    const [fromUser, toUser] = await Promise.all([
      adminAuth.getUser(uid).catch(() => null),
      adminAuth.getUser(toUid).catch(() => null),
    ])

    const participantNames: Record<string, string> = {
      [uid]: fromUser?.displayName ?? 'User',
      [toUid]: toUser?.displayName ?? 'User',
    }
    const participantPhotos: Record<string, string> = {
      [uid]: fromUser?.photoURL ?? '',
      [toUid]: toUser?.photoURL ?? '',
    }

    const now = new Date().toISOString()
    const data: Record<string, unknown> = {
      participants,
      participantNames,
      participantPhotos,
      lastMessage: '',
      lastMessageAt: now,
      lastSenderUid: '',
      unread: { [uid]: 0, [toUid]: 0 },
      createdAt: now,
    }
    if (listingId) data.listingId = listingId
    if (listingName) data.listingName = listingName
    if (listingThumbnail) data.listingThumbnail = listingThumbnail

    await ref.set(data)
    return NextResponse.json({ conversationId: convId, created: true }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
