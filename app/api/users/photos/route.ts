import { NextRequest, NextResponse } from 'next/server'
import { adminAuth } from '@/lib/firebase/admin'
import { z } from 'zod'

const schema = z.object({
  uids: z.array(z.string()).min(1).max(100),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { uids } = schema.parse(body)

    const { users } = await adminAuth.getUsers(uids.map((uid) => ({ uid })))

    const photos: Record<string, string> = {}
    for (const user of users) {
      if (user.photoURL) {
        photos[user.uid] = user.photoURL
      }
    }

    return NextResponse.json({ photos })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
