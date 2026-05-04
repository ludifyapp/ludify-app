import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase/admin'
import { getUidFromRequest } from '@/lib/api-auth'
import { FieldValue } from 'firebase-admin/firestore'

/** Toggle mute/unmute comment notifications for a specific table. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const uid = await getUidFromRequest(req)
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userRef = db.collection('users').doc(uid)
  const snap = await userRef.get()
  const mutedTables: string[] = snap.data()?.mutedTables ?? []

  const isMuted = mutedTables.includes(id)

  await userRef.set(
    { mutedTables: isMuted ? FieldValue.arrayRemove(id) : FieldValue.arrayUnion(id) },
    { merge: true },
  )

  return NextResponse.json({ muted: !isMuted })
}
