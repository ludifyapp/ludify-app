import https from 'node:https'
import { XMLParser } from 'fast-xml-parser'
import { BggGame } from '@/types'

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' })

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

  return rawItems.slice(0, 12).map((item: any) => {
    const names = [item.name].flat()
    const primaryName =
      names.find((n: any) => n['@_type'] === 'primary')?.['@_value'] ??
      names[0]?.['@_value'] ??
      'Unknown'
    return {
      bggId: String(item['@_id']),
      name: String(primaryName),
      yearPublished: item.yearpublished?.['@_value'] ?? null,
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

  return {
    bggId,
    name: String(primaryName),
    thumbnail: typeof item.thumbnail === 'string' ? item.thumbnail : '',
  }
}
