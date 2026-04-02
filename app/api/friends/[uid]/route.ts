import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase/admin'
import { getDecodedToken } from '@/lib/api-auth'
import { friendshipCache } from '../route'

function friendshipId(a: string, b: string) {
  return [a, b].sort().join('_')
}

// PATCH /api/friends/[uid] — accept a pending request from [uid]
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ uid: string }> }) {
  const decoded = await getDecodedToken(req)
  if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { uid: fromUid } = await params
  const docId = friendshipId(decoded.uid, fromUid)
  const docRef = db.collection('friendships').doc(docId)
  const snap = await docRef.get()

  if (!snap.exists) return NextResponse.json({ error: 'Request not found' }, { status: 404 })
  const data = snap.data()!

  if (data.toUid !== decoded.uid) {
    return NextResponse.json({ error: 'Not the recipient of this request' }, { status: 403 })
  }
  if (data.status === 'accepted') {
    return NextResponse.json({ error: 'Already friends' }, { status: 409 })
  }

  await docRef.update({ status: 'accepted', updatedAt: new Date().toISOString() })
  friendshipCache.delete(decoded.uid)
  friendshipCache.delete(fromUid)
  return NextResponse.json({ success: true })
}

// DELETE /api/friends/[uid] — unfriend, cancel, or decline
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ uid: string }> }) {
  const decoded = await getDecodedToken(req)
  if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { uid: otherUid } = await params
  const docId = friendshipId(decoded.uid, otherUid)
  const docRef = db.collection('friendships').doc(docId)
  const snap = await docRef.get()

  if (!snap.exists) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const data = snap.data()!

  if (!data.uids.includes(decoded.uid)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await docRef.delete()
  friendshipCache.delete(decoded.uid)
  friendshipCache.delete(otherUid)
  return NextResponse.json({ success: true })
}
