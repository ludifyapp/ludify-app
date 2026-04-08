import https from 'node:https'
import { XMLParser } from 'fast-xml-parser'
import { BggGame, CollectionGame } from '@/types'

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_', processEntities: true })

function httpsGet(url: string): Promise<{ status: number; body: string }> {
  const token = process.env.BGG_API_TOKEN
  const headers: Record<string, string> = { 'User-Agent': 'GameNightApp/1.0' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers }, (res) => {
      let body = ''
      res.on('data', (chunk) => (body += chunk))
      res.on('end', () => resolve({ status: res.statusCode ?? 0, body }))
    })
    req.on('error', reject)
    req.setTimeout(10000, () => {
      req.destroy()
      reject(new Error('BGG request timed out'))
    })
  })
}

export async function searchGames(query: string): Promise<BggGame[]> {
  const { status, body } = await httpsGet(
    `https://boardgamegeek.com/xmlapi2/search?query=${encodeURIComponent(query)}&type=boardgame`
  )

  if (status !== 200 || !body.trim()) return []

  const parsed = parser.parse(body)
  const items = parsed?.items

  if (!items || items['@_total'] === '0' || items['@_total'] === 0) return []

  const rawItems = items.item ? [items.item].flat() : []
  const candidates = rawItems.slice(0, 20) // fetch a few extra in case some are expansions

  // Batch-verify types via the thing endpoint to exclude expansions
  const ids = candidates.map((item: any) => item['@_id']).join(',')
  const { status: thingStatus, body: thingBody } = await httpsGet(
    `https://boardgamegeek.com/xmlapi2/thing?id=${ids}&type=boardgame`
  )

  const thingDataMap = new Map<string, { thumbnail?: string }>()
  if (thingStatus === 200 && thingBody.trim()) {
    const thingParsed = parser.parse(thingBody)
    const thingItems = thingParsed?.items?.item ? [thingParsed.items.item].flat() : []
    for (const ti of thingItems) {
      // Only items returned by type=boardgame are base games (not expansions)
      const image = typeof ti.image === 'string' ? ti.image : ''
      const thumb = typeof ti.thumbnail === 'string' ? ti.thumbnail : ''
      thingDataMap.set(String(ti['@_id']), { thumbnail: image || thumb || undefined })
    }
  }

  return candidates
    .filter((item: any) => thingDataMap.has(String(item['@_id'])))
    .slice(0, 12)
    .map((item: any) => {
      const bggId = String(item['@_id'])
      const names = [item.name].flat()
      const primaryName =
        names.find((n: any) => n['@_type'] === 'primary')?.['@_value'] ??
        names[0]?.['@_value'] ??
        'Unknown'
      return {
        bggId,
        name: String(primaryName),
        yearPublished: item.yearpublished?.['@_value'] ?? null,
        thumbnail: thingDataMap.get(bggId)?.thumbnail,
      }
    })
}

export async function getGameDetails(bggId: string): Promise<BggGame | null> {
  const { status, body } = await httpsGet(
    `https://boardgamegeek.com/xmlapi2/thing?id=${bggId}&type=boardgame`
  )

  if (status !== 200 || !body.trim()) return null

  const parsed = parser.parse(body)
  const item = parsed?.items?.item

  if (!item) return null

  const names = [item.name].flat()
  const primaryName =
    names.find((n: any) => n['@_type'] === 'primary')?.['@_value'] ?? 'Unknown'

  // Prefer full-res `image` over low-res `thumbnail` (200x150) for better quality on large displays
  const image = typeof item.image === 'string' ? item.image : ''
  const thumb = typeof item.thumbnail === 'string' ? item.thumbnail : ''

  return {
    bggId,
    name: String(primaryName),
    thumbnail: image || thumb,
  }
}

export async function getHotBoardGames(): Promise<BggGame[]> {
  const { status, body } = await httpsGet(
    'https://boardgamegeek.com/xmlapi2/hot?type=boardgame'
  )

  if (status !== 200 || !body.trim()) return []

  const parsed = parser.parse(body)
  const items = parsed?.items?.item

  if (!items) return []

  const rawItems = [items].flat().slice(0, 20)

  // Batch-fetch full details via /thing to get higher-res images
  const ids = rawItems.map((item: any) => item['@_id']).join(',')
  const { status: thingStatus, body: thingBody } = await httpsGet(
    `https://boardgamegeek.com/xmlapi2/thing?id=${ids}`
  )

  const imageMap = new Map<string, string>()
  if (thingStatus === 200 && thingBody.trim()) {
    const thingParsed = parser.parse(thingBody)
    const thingItems = thingParsed?.items?.item ? [thingParsed.items.item].flat() : []
    for (const ti of thingItems) {
      const image = typeof ti.image === 'string' ? ti.image : ''
      const thumb = typeof ti.thumbnail === 'string' ? ti.thumbnail : ''
      imageMap.set(String(ti['@_id']), image || thumb)
    }
  }

  return rawItems.map((item: any) => {
    const bggId = String(item['@_id'])
    return {
      bggId,
      name: String(item.name?.['@_value'] ?? 'Unknown'),
      thumbnail: imageMap.get(bggId) ?? '',
      yearPublished: item.yearpublished?.['@_value'] ? Number(item.yearpublished['@_value']) : null,
    }
  })
}

/**
 * Fetch a BGG user's owned game collection.
 * BGG returns 202 while it processes the request — we retry up to 5 times.
 */
export async function fetchBggCollection(username: string): Promise<CollectionGame[]> {
  const url = `https://boardgamegeek.com/xmlapi2/collection?username=${encodeURIComponent(username)}&own=1&subtype=boardgame&excludesubtype=boardgameexpansion`

  let attempts = 0
  const maxAttempts = 5

  while (attempts < maxAttempts) {
    const { status, body } = await httpsGet(url)

    if (status === 202) {
      // BGG is still processing — wait and retry
      attempts++
      await new Promise((r) => setTimeout(r, 2000))
      continue
    }

    if (status !== 200 || !body.trim()) return []

    const parsed = parser.parse(body)
    const items = parsed?.items

    if (!items || items['@_totalitems'] === '0' || items['@_totalitems'] === 0) return []

    const rawItems = items.item ? [items.item].flat() : []
    const now = new Date().toISOString()

    return rawItems.map((item: any) => {
      const image = typeof item.image === 'string' ? item.image : ''
      const thumb = typeof item.thumbnail === 'string' ? item.thumbnail : ''
      const yearVal = item.yearpublished ?? null

      return {
        bggId: String(item['@_objectid']),
        name: String(item.name?.['#text'] ?? item.name ?? 'Unknown'),
        thumbnail: image || thumb,
        yearPublished: yearVal ? Number(yearVal) : null,
        addedAt: now,
      } satisfies CollectionGame
    })
  }

  return []
}
