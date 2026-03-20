import { Metadata } from 'next'
import { db } from '@/lib/firebase/admin'
import { EventPageClient } from '@/components/event/EventPageClient'
import { formatDateTime } from '@/lib/utils'
import type { GameEvent } from '@/types'

async function getEvent(id: string): Promise<GameEvent | null> {
  const snap = await db.collection('events').doc(id).get()
  if (!snap.exists) return null
  return { id: snap.id, ...snap.data() } as GameEvent
}

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params
  const event = await getEvent(id)

  if (!event) {
    return { title: 'Event not found – Ludify' }
  }

  const host = event.players.find((p) => p.isHost)
  const playerNames = event.players.map((p) => p.name)
  const spotsLeft = event.maxPlayers - event.players.length

  const title = `${event.boardGame.name} – Ludify`

  const playerSummary =
    playerNames.length > 0
      ? `Players: ${playerNames.join(', ')}`
      : 'No players yet'

  const description = [
    host ? `Hosted by ${host.name}` : null,
    formatDateTime(event.dateTime),
    event.address,
    `${event.players.length}/${event.maxPlayers} players${spotsLeft > 0 ? ` · ${spotsLeft} spot${spotsLeft !== 1 ? 's' : ''} left` : ' · Full'}`,
    playerSummary,
  ]
    .filter(Boolean)
    .join('\n')

  const image = event.boardGame.thumbnail || null

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      ...(image && {
        images: [{ url: image, width: 200, height: 200, alt: event.boardGame.name }],
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

export default async function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <EventPageClient id={id} />
}
