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
  { params }: { params: Promise<{ id: string; messageId: string }> }
) {
  const decoded = await getDecodedToken(req)
  if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, messageId } = await params

  // Verify caller is a participant of this conversation
  const convSnap = await db.collection('conversations').doc(id).get()
  if (!convSnap.exists) return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
  const participants: string[] = convSnap.data()?.participants ?? []
  if (!participants.includes(decoded.uid)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { emoji } = schema.parse(body)

  const msgRef = db.collection('conversations').doc(id).collection('messages').doc(messageId)
  const snap = await msgRef.get()
  if (!snap.exists) return NextResponse.json({ error: 'Message not found' }, { status: 404 })

  const reactions: Record<string, string[]> = snap.data()?.reactions ?? {}
  const uids: string[] = reactions[emoji] ?? []
  const already = uids.includes(decoded.uid)

  const updated = { ...reactions }

  // Remove user from all existing emoji lists (one reaction per user)
  Object.keys(updated).forEach((e) => {
    updated[e] = updated[e].filter((u) => u !== decoded.uid)
    if (updated[e].length === 0) delete updated[e]
  })

  // If not toggling OFF the same emoji, add the new one
  if (!already) {
    updated[emoji] = [...(updated[emoji] ?? []), decoded.uid]
  }

  await msgRef.update({ reactions: updated })
  return NextResponse.json({ reactions: updated })
}
