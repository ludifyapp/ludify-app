import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase/admin'
import { z } from 'zod'

async function validateHostToken(eventId: string, token: string | null): Promise<boolean> {
  if (!token) return false
  const snap = await db.collection('events').doc(eventId).collection('secret').doc('host').get()
  return snap.exists && snap.data()?.hostToken === token
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const snap = await db.collection('events').doc(id).get()
    if (!snap.exists) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ id: snap.id, ...snap.data() })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

const patchSchema = z.object({
  boardGame: z.object({
    bggId: z.string(),
    name: z.string(),
    thumbnail: z.string().optional().default(''),
    yearPublished: z.number().optional().nullable(),
  }).optional(),
  description: z.string().optional(),
  dateTime: z.string().optional(),
  endDateTime: z.string().optional().nullable(),
  address: z.string().min(1).optional(),
  minPlayers: z.number().int().min(2).max(20).optional(),
  maxPlayers: z.number().int().min(2).max(20).optional(),
  type: z.enum(['public', 'private']).optional(),
  status: z.enum(['cancelled']).optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const token = req.headers.get('x-host-token')
    if (!(await validateHostToken(id, token))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const data = patchSchema.parse(body)

    if (data.maxPlayers !== undefined || data.minPlayers !== undefined) {
      const snap = await db.collection('events').doc(id).get()
      const event = snap.data()
      if (event) {
        const newMax = data.maxPlayers ?? event.maxPlayers
        const newMin = data.minPlayers ?? event.minPlayers
        if (newMax < event.players.length) {
          return NextResponse.json(
            { error: `maxPlayers cannot be less than current player count (${event.players.length})` },
            { status: 400 }
          )
        }
        if (newMin > newMax) {
          return NextResponse.json({ error: 'minPlayers cannot exceed maxPlayers' }, { status: 400 })
        }
      }
    }

    await db.collection('events').doc(id).update(data)
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
