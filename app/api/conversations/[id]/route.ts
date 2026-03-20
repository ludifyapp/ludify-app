import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase/admin'
import { getUidFromRequest } from '@/lib/api-auth'

// PATCH /api/conversations/[id] — mark as read (reset unread count for caller)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const uid = await getUidFromRequest(req)
    if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const convSnap = await db.collection('conversations').doc(id).get()
    if (!convSnap.exists) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (!convSnap.data()!.participants.includes(uid)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await db.collection('conversations').doc(id).update({ [`unread.${uid}`]: 0 })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
