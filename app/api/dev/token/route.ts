import { NextRequest, NextResponse } from 'next/server'
import { adminAuth } from '@/lib/firebase/admin'

export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV !== 'development' && process.env.ENABLE_DEV_LOGIN !== 'true') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  const uid = req.nextUrl.searchParams.get('uid')
  if (!uid || !uid.startsWith('seed_u_')) {
    return NextResponse.json({ error: 'Invalid uid' }, { status: 400 })
  }
  const token = await adminAuth.createCustomToken(uid)
  return NextResponse.json({ token })
}
