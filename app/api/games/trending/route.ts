import { NextResponse } from 'next/server'
import { db } from '@/lib/firebase/admin'
// In case you want some mock data while developing the frontend, you can uncomment this and comment out the actual db calls above.
//import { MOCK_TRENDING_GAMES } from '@/lib/mock/trendingGames'
import type { TrendingGame } from '@/types'

// GET /api/games/trending
// Returns the top 10 trending games based on recaps + recent events from the last 30 days.
export async function GET() {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

    const [recapsSnap, eventsSnap] = await Promise.all([
      db.collection('recaps').orderBy('createdAt', 'desc').limit(200).get(),
      db.collection('events').where('dateTime', '>=', thirtyDaysAgo).get(),
    ])

    const map = new Map<string, TrendingGame>()

    for (const doc of recapsSnap.docs) {
      const d = doc.data()
      const bggId: string = d.game?.bggId
      if (!bggId) continue
      const existing = map.get(bggId)
      if (existing) {
        existing.playCount += 1
        existing.totalPlayers += d.playerCount ?? 0
      } else {
        map.set(bggId, {
          bggId,
          name: d.game?.name ?? '',
          thumbnail: d.game?.thumbnail ?? '',
          playCount: 1,
          totalPlayers: d.playerCount ?? 0,
        })
      }
    }

    for (const doc of eventsSnap.docs) {
      const d = doc.data()
      const bggId: string = d.boardGame?.bggId
      if (!bggId) continue
      const players = (d.playerUids as string[] | undefined)?.length ?? 0
      const existing = map.get(bggId)
      if (existing) {
        existing.playCount += 1
        existing.totalPlayers += players
      } else {
        map.set(bggId, {
          bggId,
          name: d.boardGame?.name ?? '',
          thumbnail: d.boardGame?.thumbnail ?? '',
          playCount: 1,
          totalPlayers: players,
        })
      }
    }

    const games = [...map.values()]
      .sort((a, b) => b.playCount - a.playCount || b.totalPlayers - a.totalPlayers)
      .slice(0, 10)

    return NextResponse.json({ games })
  } catch (error) {
    console.error('Error fetching trending games:', error)
    return NextResponse.json({ games: [] })
  }
}
