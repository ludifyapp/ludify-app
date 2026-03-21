'use client'
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Player } from '@/types'
import { PlayerRow } from './PlayerRow'
import { useAuth } from '@/contexts/AuthContext'
import { useFriendships } from '@/hooks/useFriendships'
import { Button } from '@/components/ui/Button'

interface PlayerListProps {
  players: Player[]
  maxPlayers: number
  minPlayers?: number
  isHost?: boolean
  onRemovePlayer?: (playerId: string) => Promise<void>
  onJoin?: (name: string) => Promise<void>
}

export function PlayerList({ players, maxPlayers, minPlayers = 1, isHost, onRemovePlayer, onJoin }: PlayerListProps) {
  const { t } = useTranslation()
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [friendActionId, setFriendActionId] = useState<string | null>(null)
  const [fetchedPhotos, setFetchedPhotos] = useState<Record<string, string>>({})
  
  const [joinName, setJoinName] = useState('')
  const [isJoining, setIsJoining] = useState(false)
  const [joinError, setJoinError] = useState('')

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

  const handleJoinClick = async () => {
    if (!onJoin) return
    if (!user && !joinName.trim()) {
      setJoinError(t('joinForm.enterName', 'Please enter your name'))
      return
    }
    setIsJoining(true)
    setJoinError('')
    try {
      await onJoin(user?.displayName ?? user?.email ?? joinName.trim())
    } catch (err) {
      setJoinError((err as Error).message || 'Failed to join')
    } finally {
      setIsJoining(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-gray-900 dark:text-white">{t('players.players')}</h3>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {players.length} / {maxPlayers}
        </span>
      </div>
      <div className="divide-y divide-gray-100 dark:divide-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        {sortedPlayers.map((player) => {
          const isSelf = !!user && player.id === user.uid
          const friendStatus = !isSelf && user && !player.id.includes('-')
            ? (statuses[player.id] ?? 'none')
            : undefined

          return (
            <div key={player.id} className="bg-white dark:bg-gray-800 px-4">
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
        {Array.from({ length: emptySlots }).map((_, i) => {
          const slotNumber = players.length + i + 1
          const isOptional = slotNumber > minPlayers
          const isNextSpot = i === 0

          return (
            <div key={`empty-${i}`} className="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm flex-shrink-0">
                  {slotNumber}
                </div>
                <span className="text-sm text-gray-400 dark:text-gray-500 italic">
                  {isOptional ? t('players.optionalOpenSpot', 'Optional Open Spot') : t('players.openSpot')}
                </span>
              </div>
              {isNextSpot && onJoin && (
                <div className="flex items-center gap-2">
                  {!user && (
                    <input
                      type="text"
                      className="text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded px-2 py-1 w-32 focus:outline-none focus:ring-1 focus:ring-teal-500"
                      placeholder={t('joinForm.yourName', 'Your Name')}
                      value={joinName}
                      onChange={e => setJoinName(e.target.value)}
                    />
                  )}
                  {joinError && <span className="text-xs text-red-500 font-medium">{joinError}</span>}
                  <Button size="sm" onClick={handleJoinClick} loading={isJoining} className="h-8 text-xs py-0 px-3 shrink-0">
                    {t('joinForm.join', 'Join')}
                  </Button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
