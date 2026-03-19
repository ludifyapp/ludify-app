import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, db } from '@/lib/firebase/admin'
import { getUidFromRequest } from '@/lib/api-auth'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ uid: string }> }) {
  const { uid } = await params
  try {
    const [user, profileSnap] = await Promise.all([
      adminAuth.getUser(uid),
      db.collection('users').doc(uid).get(),
    ])
    return NextResponse.json({
      uid: user.uid,
      displayName: user.displayName ?? null,
      photoURL: user.photoURL ?? null,
      bio: profileSnap.data()?.bio ?? null,
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
