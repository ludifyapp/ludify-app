import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase/admin'
import { getDecodedToken } from '@/lib/api-auth'
import { z } from 'zod'
import type { CollectionGame } from '@/types'

const addSchema = z.object({
  bggId: z.string().min(1),
  name: z.string().min(1).max(200),
  thumbnail: z.string().default(''),
  yearPublished: z.number().optional().nullable(),
})

export async function GET(_req: NextRequest, { params }: { params: Promise<{ uid: string }> }) {
  const { uid } = await params
  const snap = await db.collection('users').doc(uid).get()
  const collection: CollectionGame[] = snap.data()?.collection ?? []
  return NextResponse.json({ collection })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ uid: string }> }) {
  const decoded = await getDecodedToken(req)
  if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { uid } = await params
  if (decoded.uid !== uid) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const game = addSchema.parse(body)

  const ref = db.collection('users').doc(uid)
  const snap = await ref.get()
  const collection: CollectionGame[] = snap.data()?.collection ?? []

  if (collection.some((g) => g.bggId === game.bggId)) {
    return NextResponse.json({ error: 'Already in collection' }, { status: 409 })
  }

  const newGame: CollectionGame = {
    bggId: game.bggId,
    name: game.name,
    thumbnail: game.thumbnail,
    yearPublished: game.yearPublished ?? null,
    addedAt: new Date().toISOString(),
  }

  await ref.set({ collection: [...collection, newGame] }, { merge: true })
  return NextResponse.json({ game: newGame }, { status: 201 })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ uid: string }> }) {
  const decoded = await getDecodedToken(req)
  if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { uid } = await params
  if (decoded.uid !== uid) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const bggId = req.nextUrl.searchParams.get('bggId')
  if (!bggId) return NextResponse.json({ error: 'Missing bggId' }, { status: 400 })

  const ref = db.collection('users').doc(uid)
  const snap = await ref.get()
  const collection: CollectionGame[] = snap.data()?.collection ?? []

  await ref.set({ collection: collection.filter((g) => g.bggId !== bggId) }, { merge: true })
  return NextResponse.json({ success: true })
}
