import { NextResponse } from 'next/server'
import { db } from '@/lib/firebase/admin'
import { getGameDetails } from '@/lib/bgg'

// Known bggIds for common seed games — used when a doc has a name but no bggId
const KNOWN_GAMES: Record<string, string> = {
  'Catan': '13',
  'Ticket to Ride': '9209',
  'Pandemic': '30549',
  'Wingspan': '266192',
  'Azul': '230802',
  'Codenames': '178900',
  '7 Wonders': '68448',
  'Terraforming Mars': '167791',
  'Dominion': '36218',
  'Spirit Island': '162886',
  'Root': '237182',
  'Viticulture': '128621',
  'Gloomhaven': '174430',
  'Scythe': '169786',
  'Sheriff of Nottingham': '157969',
  'Dixit': '39856',
  'Splendor': '148228',
  'Arkham Horror': '257499',
  'Power Grid': '2651',
  'Betrayal at House on the Hill': '10547',
}

export async function POST() {
  if (process.env.NODE_ENV !== 'development' && process.env.ENABLE_DEV_LOGIN !== 'true') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const results = { events: 0, recaps: 0, listings: 0, errors: 0 }

  // Cache bggId → thumbnail so we don't call BGG API repeatedly for the same game
  const cache = new Map<string, string>()

  async function fetchThumbnail(bggId: string): Promise<string> {
    if (cache.has(bggId)) return cache.get(bggId)!
    const game = await getGameDetails(bggId)
    const thumb = game?.thumbnail ?? ''
    cache.set(bggId, thumb)
    return thumb
  }

  // ── Backfill events ───────────────────────────────────────────────────────
  const eventsSnap = await db.collection('events').get()
  const eventBatch = db.batch()

  for (const doc of eventsSnap.docs) {
    const data = doc.data()
    const game = data.boardGame ?? {}
    const bggId: string = game.bggId || KNOWN_GAMES[game.name] || ''
    if (!bggId) continue

    try {
      const thumbnail = await fetchThumbnail(bggId)
      if (!thumbnail) continue
      eventBatch.update(doc.ref, { 'boardGame.bggId': bggId, 'boardGame.thumbnail': thumbnail })
      results.events++
    } catch {
      results.errors++
    }
  }

  await eventBatch.commit()

  // ── Backfill recaps ───────────────────────────────────────────────────────
  const recapsSnap = await db.collection('recaps').get()
  const recapBatch = db.batch()

  for (const doc of recapsSnap.docs) {
    const data = doc.data()
    const game = data.game ?? {}
    const bggId: string = game.bggId || KNOWN_GAMES[game.name] || ''
    if (!bggId) continue

    try {
      const thumbnail = await fetchThumbnail(bggId)
      if (!thumbnail) continue
      recapBatch.update(doc.ref, { 'game.bggId': bggId, 'game.thumbnail': thumbnail })
      results.recaps++
    } catch {
      results.errors++
    }
  }

  await recapBatch.commit()

  // ── Backfill listings ─────────────────────────────────────────────────────
  const listingsSnap = await db.collection('listings').get()
  const listingBatch = db.batch()

  for (const doc of listingsSnap.docs) {
    const data = doc.data()
    const game = data.boardGame ?? {}
    const bggId: string = game.bggId || KNOWN_GAMES[game.name] || ''
    if (!bggId) continue

    try {
      const thumbnail = await fetchThumbnail(bggId)
      if (!thumbnail) continue
      listingBatch.update(doc.ref, { 'boardGame.bggId': bggId, 'boardGame.thumbnail': thumbnail })
      results.listings++
    } catch {
      results.errors++
    }
  }

  await listingBatch.commit()

  return NextResponse.json({ ok: true, ...results })
}
