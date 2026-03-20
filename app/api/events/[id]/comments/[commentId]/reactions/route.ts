import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase/admin'
import { getDecodedToken } from '@/lib/api-auth'
import { z } from 'zod'

const ALLOWED_EMOJIS = ['👍', '❤️', '😂', '😮', '🎲']

const schema = z.object({
  emoji: z.string().refine((e) => ALLOWED_EMOJIS.includes(e), { message: 'Invalid emoji' }),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  const decoded = await getDecodedToken(req)
  if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, commentId } = await params
  const body = await req.json()
  const { emoji } = schema.parse(body)

  const commentRef = db.collection('events').doc(id).collection('comments').doc(commentId)
  const snap = await commentRef.get()
  if (!snap.exists) return NextResponse.json({ error: 'Comment not found' }, { status: 404 })

  const reactions: Record<string, string[]> = snap.data()?.reactions ?? {}
  const uids: string[] = reactions[emoji] ?? []
  const already = uids.includes(decoded.uid)

  const updated = {
    ...reactions,
    [emoji]: already ? uids.filter((u) => u !== decoded.uid) : [...uids, decoded.uid],
  }
  // Remove key entirely if empty
  if (updated[emoji].length === 0) delete updated[emoji]

  await commentRef.update({ reactions: updated })
  return NextResponse.json({ reactions: updated })
}
