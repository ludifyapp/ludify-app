import { NextRequest, NextResponse } from 'next/server'
import { adminAuth } from '@/lib/firebase/admin'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ uid: string }> }) {
  const { uid } = await params
  try {
    const user = await adminAuth.getUser(uid)
    return NextResponse.json({
      uid: user.uid,
      displayName: user.displayName ?? null,
      photoURL: user.photoURL ?? null,
    })
  } catch {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }
}
