import { Metadata } from 'next'
import { db } from '@/lib/firebase/admin'
import { TablePageClient } from '@/components/table/TablePageClient'
import { formatDateTime } from '@/lib/utils'
import type { GameTable } from '@/types'

async function getTable(id: string): Promise<GameTable | null> {
  const snap = await db.collection('tables').doc(id).get()
  if (!snap.exists) return null
  return { id: snap.id, ...snap.data() } as GameTable
}

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params
  const table = await getTable(id)

  if (!table) {
    return { title: 'Table not found – Ludify' }
  }

  const host = table.players.find((p) => p.isHost)
  const playerNames = table.players.map((p) => p.name)
  const spotsLeft = table.maxPlayers - table.players.length

  const title = `${table.boardGame.name} – Ludify`

  const playerSummary =
    playerNames.length > 0
      ? `Players: ${playerNames.join(', ')}`
      : 'No players yet'

  const description = [
    host ? `Hosted by ${host.name}` : null,
    formatDateTime(table.dateTime),
    table.address,
    `${table.players.length}/${table.maxPlayers} players${spotsLeft > 0 ? ` · ${spotsLeft} spot${spotsLeft !== 1 ? 's' : ''} left` : ' · Full'}`,
    playerSummary,
  ]
    .filter(Boolean)
    .join('\n')

  const image = table.boardGame.thumbnail || null

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      ...(image && {
        images: [{ url: image, width: 200, height: 200, alt: table.boardGame.name }],
      }),
    },
    twitter: {
      card: image ? 'summary' : 'summary',
      title,
      description,
      ...(image && { images: [image] }),
    },
  }
}

export default async function TablePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <TablePageClient id={id} />
}
