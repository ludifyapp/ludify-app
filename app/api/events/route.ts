import { NextRequest, NextResponse } from 'next/server'
import { db, adminAuth } from '@/lib/firebase/admin'
import { z } from 'zod'
import { getEffectiveStatus } from '@/lib/utils'
import type { GameEvent } from '@/types'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const playerUid = searchParams.get('player')
    const limitParam = searchParams.get('limit')
    const limit = limitParam ? parseInt(limitParam, 10) : 15
    const cursor = searchParams.get('cursor')

    let snapshot
    if (playerUid) {
      // Fetch all events the user is a player in (no date filter — caller filters)
      snapshot = await db
        .collection('events')
        .where('playerUids', 'array-contains', playerUid)
        .get()
    } else {
      const now = new Date().toISOString()
      let query = db
        .collection('events')
        .where('dateTime', '>=', now)
        .orderBy('dateTime', 'asc')

      if (cursor) {
        query = query.startAfter(cursor)
      }

      snapshot = await query.limit(limit).get()
    }

    const events = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as GameEvent))

    if (!playerUid) {
      const filtered = events.filter((e) => {
        const s = getEffectiveStatus(e)
        return e.type !== 'private' && s !== 'cancelled' && s !== 'ended'
      })
      const nextCursor = events.length === limit ? events[events.length - 1].dateTime : null
      return NextResponse.json({ events: filtered, nextCursor })
    }

    return NextResponse.json({ events })
  } catch (error) {
    console.error('Fetch events error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

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
  addressLabel: z.string().optional(),
  minPlayers: z.number().int().min(2).max(20),
  maxPlayers: z.number().int().min(2).max(20),
  type: z.enum(['public', 'private']).default('public'),
})

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

    const now = new Date().toISOString()
    const eventRef = db.collection('events').doc()

    await eventRef.set({
      boardGame: data.boardGame,
      ...(data.description && { description: data.description }),
      dateTime: data.dateTime,
      ...(data.endDateTime && { endDateTime: data.endDateTime }),
      address: data.address,
      ...(data.addressLabel && { addressLabel: data.addressLabel }),
      minPlayers: data.minPlayers,
      maxPlayers: data.maxPlayers,
      type: data.type,
      status: 'active',
      hostUid: uid,
      playerUids: [uid],
      createdAt: now,
      players: [
        {
          id: uid,
          name: displayName ?? 'Host',
          isHost: true,
          joinedAt: now,
          ...(photoURL && { photoURL }),
        },
      ],
    })

    return NextResponse.json({ id: eventRef.id }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    console.error('Create event error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
