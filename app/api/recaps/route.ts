import { unstable_cache } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase/admin'
import { createTTLCache } from '@/lib/server-cache'

const getRecentRecaps = unstable_cache(
  async () => {
    const snap = await db.collection('recaps').orderBy('createdAt', 'desc').limit(20).get()
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  },
  ['recent-recaps'],
  { revalidate: 300 } // 5 minutes
)

const friendRecapCache = createTTLCache<Record<string, unknown>[]>()
const FRIEND_RECAP_TTL = 3 * 60 * 1000 // 3 minutes

// GET /api/recaps?limit=20&hostUids=uid1,uid2
// Returns recent recaps, optionally filtered to specific host UIDs (for friends feed)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '20', 10), 50)
    const hostUidsParam = searchParams.get('hostUids')

    // If hostUids provided, filter without orderBy (avoids composite index requirement)
    // and sort in memory instead.
    if (hostUidsParam) {
      const uids = hostUidsParam.split(',').filter(Boolean).slice(0, 30)
      if (uids.length === 0) return NextResponse.json({ recaps: [] })

      const cacheKey = [...uids].sort().join(',')
      const cached = friendRecapCache.get(cacheKey)
      if (cached) return NextResponse.json({ recaps: cached.slice(0, limit) })

      const snap = await db.collection('recaps').where('hostUid', 'in', uids).limit(50).get()
      const recaps = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as Record<string, unknown>))
        .sort((a, b) => {
          const aTime = typeof a.createdAt === 'string' ? new Date(a.createdAt).getTime() : 0
          const bTime = typeof b.createdAt === 'string' ? new Date(b.createdAt).getTime() : 0
          return bTime - aTime
        })
      friendRecapCache.set(cacheKey, recaps, FRIEND_RECAP_TTL)
      return NextResponse.json({ recaps: recaps.slice(0, limit) })
    }

    const recaps = await getRecentRecaps()
    return NextResponse.json({ recaps })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
