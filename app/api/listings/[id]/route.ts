import { NextRequest, NextResponse } from 'next/server'
import { db, adminAuth } from '@/lib/firebase/admin'
import { z } from 'zod'

const patchSchema = z.object({
  status: z.enum(['active', 'sold']).optional(),
  price: z.number().int().min(1).max(9999999).optional(),
  description: z.string().max(500).optional(),
  location: z.string().min(1).max(200).optional(),
  condition: z.enum(['new', 'like_new', 'good', 'fair', 'poor']).optional(),
  whatsapp: z.string().min(7).max(20).optional(),
})

async function getUid(req: NextRequest): Promise<string | null> {
  const header = req.headers.get('authorization')
  if (!header?.startsWith('Bearer ')) return null
  try {
    const decoded = await adminAuth.verifyIdToken(header.slice(7))
    return decoded.uid
  } catch {
    return null
  }
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const doc = await db.collection('listings').doc(id).get()
  if (!doc.exists) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ listing: { id: doc.id, ...doc.data() } })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const uid = await getUid(req)
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const doc = await db.collection('listings').doc(id).get()
  if (!doc.exists) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (doc.data()?.sellerUid !== uid) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const data = patchSchema.parse(body)

  const update: Record<string, unknown> = { ...data, updatedAt: new Date().toISOString() }
  if (data.status === 'sold') update.soldAt = new Date().toISOString()
  if (data.status === 'active') update.soldAt = null

  await db.collection('listings').doc(id).update(update)
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const uid = await getUid(req)
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const doc = await db.collection('listings').doc(id).get()
  if (!doc.exists) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (doc.data()?.sellerUid !== uid) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await db.collection('listings').doc(id).delete()
  return NextResponse.json({ ok: true })
}
