import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase/admin'
import { getDecodedToken } from '@/lib/api-auth'

export interface PushPreferences {
  invites: boolean
  joinLeave: boolean
}

// GET — fetch current subscription + preferences
export async function GET(req: NextRequest) {
  const decoded = await getDecodedToken(req)
  if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const doc = await db.collection('pushSubscriptions').doc(decoded.uid).get()
  if (!doc.exists) return NextResponse.json({ subscribed: false, preferences: null })

  const { preferences } = doc.data()!
  return NextResponse.json({ subscribed: true, preferences })
}

// POST — save push subscription with default preferences
export async function POST(req: NextRequest) {
  const decoded = await getDecodedToken(req)
  if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const subscription = await req.json()
  if (!subscription?.endpoint) {
    return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 })
  }

  const existing = await db.collection('pushSubscriptions').doc(decoded.uid).get()
  const existingPrefs: PushPreferences = existing.exists
    ? existing.data()!.preferences
    : { invites: true, joinLeave: true }

  await db.collection('pushSubscriptions').doc(decoded.uid).set({
    uid: decoded.uid,
    subscription,
    preferences: existingPrefs,
    updatedAt: new Date().toISOString(),
  })

  return NextResponse.json({ success: true })
}

// PATCH — update preferences only
export async function PATCH(req: NextRequest) {
  const decoded = await getDecodedToken(req)
  if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { preferences } = body as { preferences: Partial<PushPreferences> }

  await db.collection('pushSubscriptions').doc(decoded.uid).update({
    preferences,
    updatedAt: new Date().toISOString(),
  })

  return NextResponse.json({ success: true })
}

// DELETE — remove subscription
export async function DELETE(req: NextRequest) {
  const decoded = await getDecodedToken(req)
  if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await db.collection('pushSubscriptions').doc(decoded.uid).delete()
  return NextResponse.json({ success: true })
}
