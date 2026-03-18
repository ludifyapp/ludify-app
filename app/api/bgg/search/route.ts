import { NextRequest, NextResponse } from 'next/server'
import { searchGames } from '@/lib/bgg'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('q')
  if (!query || query.length < 2) return NextResponse.json({ games: [] })

  try {
    const games = await searchGames(query)
    return NextResponse.json({ games })
  } catch {
    return NextResponse.json({ error: 'Failed to search games' }, { status: 500 })
  }
}
