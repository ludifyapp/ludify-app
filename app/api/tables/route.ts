import { unstable_cache } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'
import { db, adminAuth } from '@/lib/firebase/admin'
import { z } from 'zod'
import { getEffectiveStatus } from '@/lib/utils'
import type { GameTable } from '@/types'

const getPublicTables = unstable_cache(
  async (): Promise<{ tables: GameTable[]; nextCursor: string | null }> => {
    // Look back 8 h so currently-ongoing tables (dateTime in past, endDateTime in future) are included
    const queryFrom = new Date(Date.now() - 8 * 3_600_000).toISOString()
    const snapshot = await db
      .collection('tables')
      .where('dateTime', '>=', queryFrom)
      .orderBy('dateTime', 'asc')
      .limit(40)
      .get()

    const tables = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as GameTable))
    const filtered = tables.filter((e) => {
      const s = getEffectiveStatus(e)
      return e.type !== 'private' && s !== 'cancelled' && s !== 'ended'
    })
    const nextCursor = tables.length === 40 ? tables[tables.length - 1].dateTime : null
    return { tables: filtered, nextCursor }
  },
  ['public-tables'],
  { revalidate: 120 } // 2 minutes
)

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const playerUid = searchParams.get('player')
    const limitParam = searchParams.get('limit')
    const limit = limitParam ? parseInt(limitParam, 10) : 15
    const cursor = searchParams.get('cursor')

    if (playerUid) {
      // Fetch all tables the user is a player in (no date filter — caller filters)
      const snapshot = await db
        .collection('tables')
        .where('playerUids', 'array-contains', playerUid)
        .get()
      const tables = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as GameTable))
      return NextResponse.json({ tables })
    }

    if (cursor) {
      // Paginated path — not cached, fetched on scroll
      const queryFrom = new Date(Date.now() - 8 * 3_600_000).toISOString()
      const snapshot = await db
        .collection('tables')
        .where('dateTime', '>=', queryFrom)
        .orderBy('dateTime', 'asc')
        .startAfter(cursor)
        .limit(limit)
        .get()
      const tables = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as GameTable))
      const filtered = tables.filter((e) => {
        const s = getEffectiveStatus(e)
        return e.type !== 'private' && s !== 'cancelled' && s !== 'ended'
      })
      const nextCursor = tables.length === limit ? tables[tables.length - 1].dateTime : null
      return NextResponse.json({ tables: filtered, nextCursor })
    }

    // First page of public tables — cached
    const result = await getPublicTables()
    return NextResponse.json(result)
  } catch (error) {
    console.error('Fetch tables error:', error)
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
  minPlayers: z.number().int().min(1).max(64),
  maxPlayers: z.number().int().min(1).max(64),
  type: z.enum(['public', 'private']).default('public'),
  allowComments: z.boolean().default(true),
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
    console.log('POST /api/tables body:', JSON.stringify(body, null, 2))
    const data = schema.parse(body)
    console.log('POST /api/tables parsed data:', JSON.stringify(data, null, 2))

    if (data.minPlayers > data.maxPlayers) {
      return NextResponse.json({ error: 'minPlayers cannot exceed maxPlayers' }, { status: 400 })
    }

    const minAllowed = new Date(Date.now() + 10 * 60 * 1000)
    if (new Date(data.dateTime) < minAllowed) {
      return NextResponse.json({ error: 'Table must start at least 10 minutes from now' }, { status: 400 })
    }

    if (data.endDateTime && new Date(data.endDateTime) <= new Date(data.dateTime)) {
      return NextResponse.json({ error: 'End time must be after start time' }, { status: 400 })
    }

    const now = new Date().toISOString()
    const tableRef = db.collection('tables').doc()

    await tableRef.set({
      boardGame: data.boardGame,
      ...(data.description && { description: data.description }),
      dateTime: data.dateTime,
      ...(data.endDateTime && { endDateTime: data.endDateTime }),
      address: data.address,
      ...(data.addressLabel && { addressLabel: data.addressLabel }),
      minPlayers: data.minPlayers,
      maxPlayers: data.maxPlayers,
      type: data.type,
      allowComments: data.allowComments,
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

    return NextResponse.json({ id: tableRef.id }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    console.error('Create table error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      error
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
