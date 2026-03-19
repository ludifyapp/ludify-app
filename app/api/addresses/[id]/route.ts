import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase/admin'
import { getUidFromRequest } from '@/lib/api-auth'
import { FieldValue } from 'firebase-admin/firestore'

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const uid = await getUidFromRequest(req)
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const snap = await db.collection('users').doc(uid).get()
  const addresses: any[] = snap.data()?.savedAddresses ?? []
  const target = addresses.find((a) => a.id === id)
  if (!target) return NextResponse.json({ error: 'Address not found' }, { status: 404 })

  await db.collection('users').doc(uid).update({
    savedAddresses: FieldValue.arrayRemove(target),
  })
  return NextResponse.json({ success: true })
}
