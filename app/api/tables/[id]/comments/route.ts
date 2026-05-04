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
  const commentRef = db.collection('tables').doc(id).collection('comments').doc()
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
  tableId: string,
  commenterUid: string,
  commenterName: string,
  commentText: string,
) {
  // 1. Get table data (host + joined players)
  const tableSnap = await db.collection('tables').doc(tableId).get()
  if (!tableSnap.exists) return
  const table = tableSnap.data()!
  const hostUid: string = table.hostUid
  const playerUids: string[] = table.playerUids ?? []

  // 2. Get unique previous commenters on this table
  const commentsSnap = await db
    .collection('tables')
    .doc(tableId)
    .collection('comments')
    .select('uid')
    .get()
  const commenterUids = new Set(commentsSnap.docs.map((d) => d.data().uid as string))

  // 3. Build recipient set: host + players + previous commenters, minus the author
  const recipientUids = new Set<string>([hostUid, ...playerUids, ...commenterUids])
  recipientUids.delete(commenterUid)
  if (recipientUids.size === 0) return

  // 4. Batch-fetch mutedTables for all recipients
  const recipientArray = Array.from(recipientUids)
  const userDocs = await Promise.all(
    recipientArray.map((uid) => db.collection('users').doc(uid).get()),
  )
  const mutedSet = new Set<string>()
  userDocs.forEach((doc, i) => {
    const mutedTables: string[] = doc.data()?.mutedTables ?? []
    if (mutedTables.includes(tableId)) {
      mutedSet.add(recipientArray[i])
    }
  })

  // 5. Send push to each non-muted recipient
  const shortText = commentText.length > 100 ? commentText.slice(0, 97) + '…' : commentText
  const payload = {
    title: `💬 ${commenterName} commented`,
    body: shortText,
    url: `/table/${tableId}`,
  }

  await Promise.allSettled(
    recipientArray
      .filter((uid) => !mutedSet.has(uid))
      .map((uid) => sendPushToUser(uid, payload, 'comments')),
  )
}
