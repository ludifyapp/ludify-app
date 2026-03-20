import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase/admin'
import { getUidFromRequest } from '@/lib/api-auth'
import { FieldValue, Timestamp } from 'firebase-admin/firestore'

// POST /api/conversations/[id]/messages — send a message
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

    const { text } = await req.json()
    if (!text || typeof text !== 'string' || !text.trim()) {
      return NextResponse.json({ error: 'Message text required' }, { status: 400 })
    }
    if (text.trim().length > 1000) {
      return NextResponse.json({ error: 'Message too long (max 1000 characters)' }, { status: 400 })
    }

    const now = new Date().toISOString()
    const msgRef = await db.collection('conversations').doc(id).collection('messages').add({
      uid,
      text: text.trim(),
      createdAt: Timestamp.now(),
    })

    // Find the other participant to increment their unread count
    const otherUid = conv.participants.find((p: string) => p !== uid)

    await db.collection('conversations').doc(id).update({
      lastMessage: text.trim().slice(0, 100),
      lastMessageAt: now,
      lastSenderUid: uid,
      ...(otherUid ? { [`unread.${otherUid}`]: FieldValue.increment(1) } : {}),
    })

    return NextResponse.json({
      message: { id: msgRef.id, uid, text: text.trim(), createdAt: now },
    }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
