import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, db } from '@/lib/firebase/admin'
import { getUidFromRequest } from '@/lib/api-auth'

export interface UserSearchResult {
  uid: string
  displayName: string
  photoURL: string | null
  bggUsername: string | null
}

export async function GET(req: NextRequest) {
  const myUid = await getUidFromRequest(req)
  if (!myUid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const q = req.nextUrl.searchParams.get('q')?.trim() ?? ''
  if (q.length < 2) return NextResponse.json({ users: [] })

  const lower = q.toLowerCase()

  // Fetch all auth users (up to 1000 – fine for this app size)
  const listResult = await adminAuth.listUsers(1000)

  // Filter by displayName substring or email prefix (case-insensitive)
  const authMatches = listResult.users.filter((u) => {
    if (u.uid === myUid) return false
    const name = (u.displayName ?? '').toLowerCase()
    const email = (u.email ?? '').toLowerCase()
    return name.includes(lower) || email.startsWith(lower)
  })

  // Collect uids already matched so we can skip them in BGG search
  const matchedUids = new Set(authMatches.map((u) => u.uid))

  // Search Firestore for bggUsername (exact, case-insensitive prefix via range query)
  const bggSnap = await db
    .collection('users')
    .where('bggUsername', '>=', q)
    .where('bggUsername', '<=', q + '\uf8ff')
    .limit(20)
    .get()

  // Build bgg-matched user records not already in authMatches
  const bggExtra: UserSearchResult[] = []
  for (const doc of bggSnap.docs) {
    const uid = doc.id
    if (uid === myUid || matchedUids.has(uid)) continue
    try {
      const authUser = await adminAuth.getUser(uid)
      bggExtra.push({
        uid,
        displayName: authUser.displayName ?? uid,
        photoURL: authUser.photoURL ?? null,
        bggUsername: doc.data().bggUsername ?? null,
      })
      matchedUids.add(uid)
    } catch {
      // skip if auth user not found
    }
  }

  // Fetch profile data (bggUsername) for auth-matched users
  const profileSnaps = await Promise.all(
    authMatches.map((u) => db.collection('users').doc(u.uid).get())
  )

  const users: UserSearchResult[] = [
    ...authMatches.map((u, i) => ({
      uid: u.uid,
      displayName: u.displayName ?? u.uid,
      photoURL: u.photoURL ?? null,
      bggUsername: (profileSnaps[i].data()?.bggUsername as string | undefined) ?? null,
    })),
    ...bggExtra,
  ]

  return NextResponse.json({ users: users.slice(0, 20) })
}
