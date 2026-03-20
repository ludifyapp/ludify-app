import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, db } from '@/lib/firebase/admin'
import { getUidFromRequest } from '@/lib/api-auth'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ uid: string }> }) {
  const { uid } = await params
  try {
    const [user, profileSnap, hostedSnap] = await Promise.all([
      adminAuth.getUser(uid),
      db.collection('users').doc(uid).get(),
      db.collection('events').where('hostUid', '==', uid).get(),
    ])
    const creationTime = user.metadata.creationTime
    const memberSince = creationTime ? new Date(creationTime).getFullYear() : null
    const profileData = profileSnap.data() ?? {}
    const ratingTotal: number = profileData.ratingTotal ?? 0
    const ratingCount: number = profileData.ratingCount ?? 0
    const ratingAvg = ratingCount > 0 ? Math.round((ratingTotal / ratingCount) * 10) / 10 : null
    return NextResponse.json({
      uid: user.uid,
      displayName: user.displayName ?? null,
      photoURL: user.photoURL ?? null,
      bio: profileData.bio ?? null,
      hostedCount: hostedSnap.size,
      memberSince,
      ratingAvg,
      ratingCount,
      geoEnabled: !!profileData.geo,
    })
  } catch {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ uid: string }> }) {
  const { uid } = await params
  const requestUid = await getUidFromRequest(req)
  if (!requestUid || requestUid !== uid)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { bio } = await req.json()
  if (typeof bio !== 'string' || bio.length > 160)
    return NextResponse.json({ error: 'Bio must be 160 characters or fewer' }, { status: 400 })

  await db.collection('users').doc(uid).set({ bio: bio.trim() }, { merge: true })
  return NextResponse.json({ success: true })
}
