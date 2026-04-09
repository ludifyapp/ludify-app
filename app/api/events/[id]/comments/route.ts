import { NextRequest, NextResponse } from 'next/server'
import { db, adminAuth } from '@/lib/firebase/admin'
import { getDecodedToken } from '@/lib/api-auth'
import { sendPushToUser } from '@/lib/push'
import { FieldValue } from 'firebase-admin/firestore'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const decoded = await getDecodedToken(req)
  if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const uid = decoded.uid

  const body = await req.json()
  const text = typeof body.text === 'string' ? body.text.trim() : ''
  if (!text || text.length > 500) {
    return NextResponse.json({ error: 'Text must be 1-500 characters' }, { status: 400 })
  }

  // Get user info for the comment
  let displayName = decoded.name ?? 'Anonymous'
  let photoURL: string | null = decoded.picture ?? null
  try {
    const authUser = await adminAuth.getUser(uid)
    displayName = authUser.displayName ?? displayName
    photoURL = authUser.photoURL ?? photoURL
  } catch {
    // fallback to token claims
  }

  // Save the comment
  const commentRef = db.collection('events').doc(id).collection('comments').doc()
  await commentRef.set({
    uid,
    name: displayName,
    photoURL,
    text,
    createdAt: FieldValue.serverTimestamp(),
    pinned: false,
  })

  // Send notifications (fire-and-forget)
  sendCommentNotifications(id, uid, displayName, text).catch(() => {})

  return NextResponse.json({ id: commentRef.id })
}

async function sendCommentNotifications(
  eventId: string,
  commenterUid: string,
  commenterName: string,
  commentText: string,
) {
  // 1. Get event data (host + joined players)
  const eventSnap = await db.collection('events').doc(eventId).get()
  if (!eventSnap.exists) return
  const event = eventSnap.data()!
  const hostUid: string = event.hostUid
  const playerUids: string[] = event.playerUids ?? []

  // 2. Get unique previous commenters on this event
  const commentsSnap = await db
    .collection('events')
    .doc(eventId)
    .collection('comments')
    .select('uid')
    .get()
  const commenterUids = new Set(commentsSnap.docs.map((d) => d.data().uid as string))

  // 3. Build recipient set: host + players + previous commenters, minus the author
  const recipientUids = new Set<string>([hostUid, ...playerUids, ...commenterUids])
  recipientUids.delete(commenterUid)
  if (recipientUids.size === 0) return

  // 4. Batch-fetch mutedEvents for all recipients
  const recipientArray = Array.from(recipientUids)
  const userDocs = await Promise.all(
    recipientArray.map((uid) => db.collection('users').doc(uid).get()),
  )
  const mutedSet = new Set<string>()
  userDocs.forEach((doc, i) => {
    const mutedEvents: string[] = doc.data()?.mutedEvents ?? []
    if (mutedEvents.includes(eventId)) {
      mutedSet.add(recipientArray[i])
    }
  })

  // 5. Send push to each non-muted recipient
  const shortText = commentText.length > 100 ? commentText.slice(0, 97) + '…' : commentText
  const payload = {
    title: `💬 ${commenterName} commented`,
    body: shortText,
    url: `/event/${eventId}`,
  }

  await Promise.allSettled(
    recipientArray
      .filter((uid) => !mutedSet.has(uid))
      .map((uid) => sendPushToUser(uid, payload, 'comments')),
  )
}
