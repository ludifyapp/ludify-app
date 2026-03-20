import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase/admin'
import type { CollectionGame, GameEvent } from '@/types'

interface GameRecommendation {
  bggId: string
  name: string
  thumbnail: string
  ownedBy: string[]   // player display names who own this game
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const eventSnap = await db.collection('events').doc(id).get()
    if (!eventSnap.exists) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

    const event = { id: eventSnap.id, ...eventSnap.data() } as GameEvent
    const playerUids = event.playerUids ?? []

    if (playerUids.length === 0) return NextResponse.json({ recommendations: [] })

    // Fetch all player user docs in parallel
    const userDocs = await Promise.all(
      playerUids.map((uid) => db.collection('users').doc(uid).get())
    )

    // Build a map of uid → display name (from event players list)
    const uidToName: Record<string, string> = {}
    for (const player of event.players) {
      uidToName[player.id] = player.name
    }

    // Accumulate games: bggId → { game data, ownedBy names }
    const gameMap = new Map<string, GameRecommendation>()
    for (let i = 0; i < playerUids.length; i++) {
      const uid = playerUids[i]
      const doc = userDocs[i]
      if (!doc.exists) continue
      const collection: CollectionGame[] = doc.data()?.collection ?? []
      const ownerName = uidToName[uid] ?? 'Someone'
      for (const game of collection) {
        const existing = gameMap.get(game.bggId)
        if (existing) {
          existing.ownedBy.push(ownerName)
        } else {
          gameMap.set(game.bggId, {
            bggId: game.bggId,
            name: game.name,
            thumbnail: game.thumbnail ?? '',
            ownedBy: [ownerName],
          })
        }
      }
    }

    // Sort: more owners first, then alphabetically
    const recommendations = [...gameMap.values()]
      .sort((a, b) => b.ownedBy.length - a.ownedBy.length || a.name.localeCompare(b.name))
      .slice(0, 10)

    return NextResponse.json({ recommendations })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
