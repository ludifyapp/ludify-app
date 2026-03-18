'use client'
import { useState, useEffect } from 'react'
import { Player } from '@/types'
import { PlayerRow } from './PlayerRow'
import { useAuth } from '@/contexts/AuthContext'
import { useFriendships } from '@/hooks/useFriendships'

interface PlayerListProps {
  players: Player[]
  maxPlayers: number
  isHost?: boolean
  onRemovePlayer?: (playerId: string) => Promise<void>
}

export function PlayerList({ players, maxPlayers, isHost, onRemovePlayer }: PlayerListProps) {
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [friendActionId, setFriendActionId] = useState<string | null>(null)
  const [fetchedPhotos, setFetchedPhotos] = useState<Record<string, string>>({})
  const { user } = useAuth()

  const { statuses, sendRequest, cancelOrUnfriend, accept } = useFriendships(user?.uid ?? null)

  useEffect(() => {
    const missingUids = players
      .filter((p) => !p.photoURL && p.id && !p.id.includes('-'))
      .map((p) => p.id)
    if (missingUids.length === 0) return

    fetch('/api/users/photos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uids: missingUids }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.photos) setFetchedPhotos(data.photos)
      })
      .catch(() => {})
  }, [players])

  const enrichedPlayers = players.map((p) => {
    if (p.photoURL) return p
    if (user && p.id === user.uid && user.photoURL) return { ...p, photoURL: user.photoURL }
    if (fetchedPhotos[p.id]) return { ...p, photoURL: fetchedPhotos[p.id] }
    return p
  })

  const sortedPlayers = [...enrichedPlayers].sort((a, b) => {
    if (a.isHost) return -1
    if (b.isHost) return 1
    return new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime()
  })

  const handleRemove = async (playerId: string) => {
    if (!onRemovePlayer) return
    setRemovingId(playerId)
    try {
      await onRemovePlayer(playerId)
    } finally {
      setRemovingId(null)
    }
  }

  const handleFriendAction = async (playerId: string, currentStatus: string) => {
    setFriendActionId(playerId)
    try {
      if (currentStatus === 'none') {
        await sendRequest(playerId)
      } else if (currentStatus === 'pending_received') {
        await accept(playerId)
      }
    } finally {
      setFriendActionId(null)
    }
  }

  const handleCancelOrUnfriend = async (playerId: string) => {
    setFriendActionId(playerId)
    try {
      await cancelOrUnfriend(playerId)
    } finally {
      setFriendActionId(null)
    }
  }

  const emptySlots = maxPlayers - players.length

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-gray-900">Players</h3>
        <span className="text-sm text-gray-500">
          {players.length} / {maxPlayers}
        </span>
      </div>
      <div className="divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden">
        {sortedPlayers.map((player) => {
          const isSelf = !!user && player.id === user.uid
          const friendStatus = !isSelf && user && !player.id.includes('-')
            ? (statuses[player.id] ?? 'none')
            : undefined

          return (
            <div key={player.id} className="bg-white px-4">
              <PlayerRow
                player={player}
                canRemove={isHost && !player.isHost}
                onRemove={() => handleRemove(player.id)}
                isRemoving={removingId === player.id}
                friendshipStatus={friendStatus}
                onAddFriend={() => handleFriendAction(player.id, friendStatus ?? 'none')}
                onCancelRequest={() => handleCancelOrUnfriend(player.id)}
                isFriendActionLoading={friendActionId === player.id}
              />
            </div>
          )
        })}
        {Array.from({ length: emptySlots }).map((_, i) => (
          <div key={`empty-${i}`} className="bg-white px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-sm flex-shrink-0">
              {players.length + i + 1}
            </div>
            <span className="text-sm text-gray-400 italic">Open spot</span>
          </div>
        ))}
      </div>
    </div>
  )
}
