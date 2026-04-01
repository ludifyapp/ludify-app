import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase/admin'
import { getDecodedToken } from '@/lib/api-auth'
import { fetchBggCollection } from '@/lib/bgg'
import { z } from 'zod'

const bodySchema = z.object({
  bggUsername: z.string().min(1).max(100),
})

// POST /api/bgg/sync — link BGG account and import collection
export async function POST(req: NextRequest) {
  const decoded = await getDecodedToken(req)
  if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { bggUsername } = bodySchema.parse(body)

  // Fetch the user's BGG collection (handles 202 retries internally)
  const games = await fetchBggCollection(bggUsername)

  if (games.length === 0) {
    // Could be invalid username or empty/private collection — we still save the username
    // but let the client know no games were imported
  }

  const userRef = db.collection('users').doc(decoded.uid)
  await userRef.set(
    {
      bggUsername,
      bggLastSyncedAt: new Date().toISOString(),
      collection: games,
    },
    { merge: true },
  )

  return NextResponse.json({
    bggUsername,
    imported: games.length,
    collection: games,
  })
}

// DELETE /api/bgg/sync — unlink BGG account and clear synced collection
export async function DELETE(req: NextRequest) {
  const decoded = await getDecodedToken(req)
  if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { FieldValue } = await import('firebase-admin/firestore')
  const userRef = db.collection('users').doc(decoded.uid)
  await userRef.update({
    bggUsername: FieldValue.delete(),
    bggLastSyncedAt: FieldValue.delete(),
    collection: [],
  })

  return NextResponse.json({ success: true })
}
