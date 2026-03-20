import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase/admin'
import { getUidFromRequest } from '@/lib/api-auth'
import { geohashForLocation } from 'geofire-common'

// POST /api/profile/location — save approximate location
export async function POST(req: NextRequest) {
  try {
    const uid = await getUidFromRequest(req)
    if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { lat, lng } = await req.json()
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return NextResponse.json({ error: 'lat and lng required' }, { status: 400 })
    }
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 })
    }

    // Round to ~1km precision (2 decimal places ≈ 1.1 km)
    const roundedLat = Math.round(lat * 100) / 100
    const roundedLng = Math.round(lng * 100) / 100
    const geohash = geohashForLocation([roundedLat, roundedLng])

    await db.collection('users').doc(uid).set(
      { geo: { geohash, lat: roundedLat, lng: roundedLng } },
      { merge: true }
    )

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/profile/location — remove location
export async function DELETE(req: NextRequest) {
  try {
    const uid = await getUidFromRequest(req)
    if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { FieldValue } = await import('firebase-admin/firestore')
    await db.collection('users').doc(uid).update({ geo: FieldValue.delete() })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
