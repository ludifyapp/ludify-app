import { getHotBoardGames } from '@/lib/bgg'
import { unstable_cache } from 'next/cache'
import { NextResponse } from 'next/server'

const getCachedHotGames = unstable_cache(
  async () => getHotBoardGames(),
  ['bgg-hot-games-v3'],
  { revalidate: 86400 }
)

export async function GET() {
  try {
    const games = await getCachedHotGames()
    return NextResponse.json({ games })
  } catch (error) {
    console.error('Failed to fetch hot games:', error)
    return NextResponse.json({ games: [] }, { status: 500 })
  }
}
