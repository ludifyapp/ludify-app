import { NextRequest, NextResponse } from 'next/server'
import { db, adminAuth } from '@/lib/firebase/admin'
import { getUidFromRequest } from '@/lib/api-auth'
import { geohashQueryBounds, distanceBetween } from 'geofire-common'

const MAX_RADIUS_KM = 50
const MAX_RESULTS = 20

export async function GET(req: NextRequest) {
  try {
    const uid = await getUidFromRequest(req)
    if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = req.nextUrl
    const lat = parseFloat(searchParams.get('lat') ?? '')
    const lng = parseFloat(searchParams.get('lng') ?? '')
    const radiusKm = Math.min(parseFloat(searchParams.get('radius') ?? '20'), MAX_RADIUS_KM)

    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json({ error: 'lat and lng required' }, { status: 400 })
    }

    const center: [number, number] = [lat, lng]
    const radiusM = radiusKm * 1000

    // geohash bounds for the query
    const bounds = geohashQueryBounds(center, radiusM)

    // Run all range queries in parallel
    const snapshots = await Promise.all(
      bounds.map(([start, end]) =>
        db.collection('users')
          .where('geo.geohash', '>=', start)
          .where('geo.geohash', '<=', end)
          .limit(50)
          .get()
      )
    )

    // Deduplicate, filter by actual distance, exclude self
    const seen = new Set<string>()
    const players: {
      uid: string
      displayName: string
      photoURL: string
      distanceKm: number
      topGames: string[]
      skillLevel: string | null
    }[] = []

    for (const snap of snapshots) {
      for (const doc of snap.docs) {
        if (doc.id === uid || seen.has(doc.id)) continue
        seen.add(doc.id)

        const data = doc.data()
        const geo = data.geo
        if (!geo?.lat || !geo?.lng) continue

        const distKm = distanceBetween([geo.lat, geo.lng], center)
        if (distKm > radiusKm) continue

        const collection: { name: string }[] = data.collection ?? []
        const topGames = collection.slice(0, 3).map((g) => g.name)

        players.push({
          uid: doc.id,
          displayName: '',   // filled from Auth below
          photoURL: '',
          distanceKm: Math.round(distKm * 10) / 10,
          topGames,
          skillLevel: data.skillLevel ?? null,
        })
      }
    }

    // Sort by distance, cap results
    players.sort((a, b) => a.distanceKm - b.distanceKm)
    const top = players.slice(0, MAX_RESULTS)

    // Batch-fetch display names + photos from Auth
    await Promise.all(
      top.map(async (p) => {
        try {
          const user = await adminAuth.getUser(p.uid)
          p.displayName = user.displayName ?? 'Player'
          p.photoURL = user.photoURL ?? ''
        } catch {
          p.displayName = 'Player'
        }
      })
    )

    return NextResponse.json({ players: top, radiusKm })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
