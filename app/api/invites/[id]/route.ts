import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase/admin'
import { getDecodedToken } from '@/lib/api-auth'

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const decoded = await getDecodedToken(req)
  if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const docRef = db.collection('invites').doc(id)
  const snap = await docRef.get()

  if (!snap.exists) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (snap.data()!.toUid !== decoded.uid) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await docRef.delete()
  return NextResponse.json({ success: true })
}
