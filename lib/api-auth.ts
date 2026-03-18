import 'server-only'
import { NextRequest } from 'next/server'
import { adminAuth } from '@/lib/firebase/admin'
import type { DecodedIdToken } from 'firebase-admin/auth'

export async function getDecodedToken(req: NextRequest): Promise<DecodedIdToken | null> {
  const header = req.headers.get('authorization')
  if (!header?.startsWith('Bearer ')) return null
  try {
    return await adminAuth.verifyIdToken(header.slice(7))
  } catch {
    return null
  }
}

export async function getUidFromRequest(req: NextRequest): Promise<string | null> {
  return (await getDecodedToken(req))?.uid ?? null
}
