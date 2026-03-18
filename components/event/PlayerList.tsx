'use client'
import { useState } from 'react'
import { Player } from '@/types'
import { PlayerRow } from './PlayerRow'

interface PlayerListProps {
  players: Player[]
  maxPlayers: number
  isHost?: boolean
  onRemovePlayer?: (playerId: string) => Promise<void>
}

export function PlayerList({ players, maxPlayers, isHost, onRemovePlayer }: PlayerListProps) {
  const [removingId, setRemovingId] = useState<string | null>(null)

  const sortedPlayers = [...players].sort((a, b) => {
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
        {sortedPlayers.map((player, index) => (
          <div key={player.id} className="bg-white px-4">
            <PlayerRow
              player={player}
              position={index + 1}
              canRemove={isHost && !player.isHost}
              onRemove={() => handleRemove(player.id)}
              isRemoving={removingId === player.id}
            />
          </div>
        ))}
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
