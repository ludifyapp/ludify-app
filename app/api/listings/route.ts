import { NextRequest, NextResponse } from 'next/server'
import { db, adminAuth } from '@/lib/firebase/admin'
import { z } from 'zod'
import type { Listing } from '@/types'

const schema = z.object({
  boardGame: z.object({
    bggId: z.string(),
    name: z.string(),
    thumbnail: z.string().optional().default(''),
    yearPublished: z.number().optional().nullable(),
  }),
  condition: z.enum(['new', 'like_new', 'good', 'fair', 'poor']),
  price: z.number().int().min(1).max(9999999), // cents
  description: z.string().max(500).default(''),
  location: z.string().min(1).max(200),
  whatsapp: z.string().min(7).max(20),
})

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') ?? 'active'
    const sellerUid = searchParams.get('sellerUid')
    const condition = searchParams.get('condition')
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')

    let q = db.collection('listings').where('status', '==', status) as FirebaseFirestore.Query

    if (sellerUid) q = q.where('sellerUid', '==', sellerUid)
    if (condition) q = q.where('condition', '==', condition)

    q = q.limit(100)

    const snap = await q.get()
    let listings = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Listing))

    // Apply price filters and sort in JS to avoid needing composite indexes
    if (minPrice) listings = listings.filter((l) => l.price >= parseInt(minPrice))
    if (maxPrice) listings = listings.filter((l) => l.price <= parseInt(maxPrice))
    listings.sort((a, b) => b.createdAt.localeCompare(a.createdAt))

    return NextResponse.json({ listings })
  } catch (error) {
    console.error('Fetch listings error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const header = req.headers.get('authorization')
    if (!header?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const decoded = await adminAuth.verifyIdToken(header.slice(7))
    const { uid, name: displayName, picture: photoURL } = decoded

    const body = await req.json()
    const data = schema.parse(body)

    const now = new Date().toISOString()
    const ref = db.collection('listings').doc()

    await ref.set({
      sellerUid: uid,
      sellerName: displayName ?? 'Seller',
      sellerPhoto: photoURL ?? null,
      boardGame: data.boardGame,
      condition: data.condition,
      price: data.price,
      description: data.description,
      location: data.location,
      whatsapp: data.whatsapp,
      status: 'active',
      soldAt: null,
      createdAt: now,
      updatedAt: now,
    })

    return NextResponse.json({ id: ref.id }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    console.error('Create listing error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
