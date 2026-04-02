import { NextRequest, NextResponse } from 'next/server'
import { db, adminAuth } from '@/lib/firebase/admin'
import { getDecodedToken } from '@/lib/api-auth'
import { createTTLCache } from '@/lib/server-cache'
import { z } from 'zod'

const postSchema = z.object({
  toUid: z.string().min(1),
})

function friendshipId(a: string, b: string) {
  return [a, b].sort().join('_')
}

export const friendshipCache = createTTLCache<Record<string, unknown>[]>()
const FRIENDSHIP_TTL = 2 * 60 * 1000 // 2 minutes

export async function GET(req: NextRequest) {
  const decoded = await getDecodedToken(req)
  if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const cached = friendshipCache.get(decoded.uid)
  if (cached) return NextResponse.json({ friendships: cached })

  const snap = await db
    .collection('friendships')
    .where('uids', 'array-contains', decoded.uid)
    .get()

  const friendships = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
  friendshipCache.set(decoded.uid, friendships, FRIENDSHIP_TTL)
  return NextResponse.json({ friendships })
}

export async function POST(req: NextRequest) {
  const decoded = await getDecodedToken(req)
  if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { toUid } = postSchema.parse(body)

  if (toUid === decoded.uid) {
    return NextResponse.json({ error: 'Cannot add yourself' }, { status: 400 })
  }

  const docId = friendshipId(decoded.uid, toUid)
  const docRef = db.collection('friendships').doc(docId)
  const existing = await docRef.get()
  if (existing.exists) {
    return NextResponse.json({ error: 'Friendship already exists' }, { status: 409 })
  }

  // Get recipient info from Firebase Auth
  let toName = 'Unknown'
  let toPhoto: string | undefined
  try {
    const toUser = await adminAuth.getUser(toUid)
    toName = toUser.displayName ?? 'Unknown'
    toPhoto = toUser.photoURL ?? undefined
  } catch {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const now = new Date().toISOString()
  const sorted = [decoded.uid, toUid].sort() as [string, string]
  await docRef.set({
    uids: sorted,
    fromUid: decoded.uid,
    toUid,
    status: 'pending',
    fromName: decoded.name ?? 'Unknown',
    fromPhoto: decoded.picture ?? undefined,
    toName,
    toPhoto,
    createdAt: now,
    updatedAt: now,
  })

  friendshipCache.delete(decoded.uid)
  return NextResponse.json({ success: true }, { status: 201 })
}
