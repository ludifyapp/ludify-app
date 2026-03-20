import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase/admin'

// GET /api/recaps?limit=20&hostUids=uid1,uid2
// Returns recent recaps, optionally filtered to specific host UIDs (for friends feed)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '20', 10), 50)
    const hostUidsParam = searchParams.get('hostUids')

    let query = db.collection('recaps').orderBy('createdAt', 'desc')

    // If hostUids provided, filter to those users (for friends feed)
    // Firestore 'in' supports up to 30 items
    if (hostUidsParam) {
      const uids = hostUidsParam.split(',').filter(Boolean).slice(0, 30)
      if (uids.length === 0) return NextResponse.json({ recaps: [] })
      query = query.where('hostUid', 'in', uids) as typeof query
    }

    const snap = await query.limit(limit).get()
    const recaps = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    return NextResponse.json({ recaps })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
