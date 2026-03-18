import { NextRequest, NextResponse } from 'next/server'
import { getGameDetails } from '@/lib/bgg'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  try {
    const game = await getGameDetails(id)
    if (!game) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ game })
  } catch {
    return NextResponse.json({ error: 'Failed to get game details' }, { status: 500 })
  }
}
