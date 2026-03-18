import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase/admin'
import { z } from 'zod'
import { randomUUID } from 'crypto'

const schema = z.object({
  boardGame: z.object({
    bggId: z.string(),
    name: z.string(),
    thumbnail: z.string().optional().default(''),
    yearPublished: z.number().optional().nullable(),
  }),
  description: z.string().optional(),
  dateTime: z.string(),
  endDateTime: z.string().optional(),
  address: z.string().min(1),
  minPlayers: z.number().int().min(2).max(20),
  maxPlayers: z.number().int().min(2).max(20),
  type: z.enum(['public', 'private']).default('public'),
  hostName: z.string().min(1).max(50),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = schema.parse(body)

    if (data.minPlayers > data.maxPlayers) {
      return NextResponse.json({ error: 'minPlayers cannot exceed maxPlayers' }, { status: 400 })
    }

    const minAllowed = new Date(Date.now() + 10 * 60 * 1000)
    if (new Date(data.dateTime) < minAllowed) {
      return NextResponse.json({ error: 'Event must start at least 10 minutes from now' }, { status: 400 })
    }

    if (data.endDateTime && new Date(data.endDateTime) <= new Date(data.dateTime)) {
      return NextResponse.json({ error: 'End time must be after start time' }, { status: 400 })
    }

    const hostToken = randomUUID()
    const hostId = randomUUID()
    const now = new Date().toISOString()

    const eventRef = db.collection('events').doc()

    await eventRef.set({
      boardGame: data.boardGame,
      ...(data.description && { description: data.description }),
      dateTime: data.dateTime,
      ...(data.endDateTime && { endDateTime: data.endDateTime }),
      address: data.address,
      minPlayers: data.minPlayers,
      maxPlayers: data.maxPlayers,
      type: data.type,
      status: 'active',
      createdAt: now,
      players: [
        {
          id: hostId,
          name: data.hostName,
          isHost: true,
          joinedAt: now,
        },
      ],
    })

    await eventRef.collection('secret').doc('host').set({ hostToken })

    return NextResponse.json({ id: eventRef.id, hostToken }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    console.error('Create event error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
