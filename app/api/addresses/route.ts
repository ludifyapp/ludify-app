import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase/admin'
import { getUidFromRequest } from '@/lib/api-auth'
import { FieldValue } from 'firebase-admin/firestore'
import { randomUUID } from 'crypto'

export async function GET(req: NextRequest) {
  const uid = await getUidFromRequest(req)
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const snap = await db.collection('users').doc(uid).get()
  const addresses = snap.data()?.savedAddresses ?? []
  return NextResponse.json({ addresses })
}

export async function POST(req: NextRequest) {
  const uid = await getUidFromRequest(req)
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { label, address } = await req.json()
  if (!label?.trim() || !address?.trim())
    return NextResponse.json({ error: 'Label and address are required' }, { status: 400 })
  if (label.length > 50 || address.length > 200)
    return NextResponse.json({ error: 'Input too long' }, { status: 400 })

  const newAddress = { id: randomUUID(), label: label.trim(), address: address.trim() }
  await db.collection('users').doc(uid).set(
    { savedAddresses: FieldValue.arrayUnion(newAddress) },
    { merge: true }
  )
  return NextResponse.json({ address: newAddress })
}
