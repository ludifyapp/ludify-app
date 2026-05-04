'use client'
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Player } from '@/types'
import { PlayerRow } from './PlayerRow'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'

interface PlayerListProps {
  players: Player[]
  maxPlayers: number
  minPlayers?: number
  isHost?: boolean
  onRemovePlayer?: (playerId: string) => Promise<void>
  onJoin?: (name: string) => Promise<void>
  onLeave?: () => Promise<void>
  onInviteFriends?: () => void
}

export function PlayerList({ players, maxPlayers, minPlayers = 1, isHost, onRemovePlayer, onJoin, onLeave, onInviteFriends }: PlayerListProps) {
  const { t } = useTranslation()
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [isLeaving, setIsLeaving] = useState(false)
  const [fetchedPhotos, setFetchedPhotos] = useState<Record<string, string>>({})

  const [joinName, setJoinName] = useState('')
  const [isJoining, setIsJoining] = useState(false)
  const [joinError, setJoinError] = useState('')

  const { user } = useAuth()

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
    if (!window.confirm(t('players.removePlayerConfirm', 'Are you sure you want to remove this player?'))) return
    setRemovingId(playerId)
    try {
      await onRemovePlayer(playerId)
    } finally {
      setRemovingId(null)
    }
  }

  const handleLeave = async () => {
    if (!onLeave) return
    if (!window.confirm(t('players.leaveConfirm', 'Are you sure you want to leave this table?'))) return
    setIsLeaving(true)
    try {
      await onLeave()
    } finally {
      setIsLeaving(false)
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
    <div className="bg-surface-container rounded-3xl p-5 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-lg text-on-surface">{t('players.players')}</h3>
          <span className="bg-surface-container-highest text-on-surface-variant px-2 py-0.5 rounded-full text-xs font-bold">
            {players.length} / {maxPlayers}
          </span>
        </div>
        {onInviteFriends && (
          <button
            onClick={onInviteFriends}
            className="bg-primary-container text-primary px-3 py-1.5 rounded-[12px] text-xs font-bold"
          >
            {t('table.inviteFriends', 'Invite Friends')}
          </button>
        )}
      </div>

      {/* Player rows */}
      <div className="flex flex-col gap-4">
        {sortedPlayers.map((player, i) => {
          const isSelf = !!user && player.id === user.uid
          return (
            <PlayerRow
              key={`${player.id}-${i}`}
              player={player}
              canRemove={isHost && !player.isHost}
              onRemove={() => handleRemove(player.id)}
              isRemoving={removingId === player.id}
              isSelf={isSelf}
              onLeave={handleLeave}
              isLeaving={isLeaving}
            />
          )
        })}

        {/* Empty slots */}
        {Array.from({ length: emptySlots }).map((_, i) => {
          const slotNumber = players.length + i + 1
          const isOptional = slotNumber > minPlayers
          const isNextSpot = i === 0

          return (
            <div key={`empty-${i}`} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full border-2 border-dashed border-on-surface-variant flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-on-surface-variant" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                  </svg>
                </div>
                <span className="text-on-surface-variant font-medium text-sm">
                  {isOptional ? t('players.optionalOpenSpot', 'Optional Open Spot') : t('players.openSpot')}
                </span>
              </div>
              {isNextSpot && onJoin && (
                <div className="flex items-center gap-2">
                  {!user && (
                    <input
                      type="text"
                      className="text-sm bg-surface-container-high border border-outline-variant rounded-lg px-2 py-1 w-28 focus:outline-none focus:ring-1 focus:ring-primary text-on-surface placeholder:text-on-surface-variant"
                      placeholder={t('joinForm.yourName', 'Your Name')}
                      value={joinName}
                      onChange={e => setJoinName(e.target.value)}
                    />
                  )}
                  {joinError && <span className="text-xs text-error font-medium">{joinError}</span>}
                  <button
                    onClick={handleJoinClick}
                    disabled={isJoining}
                    className="bg-primary text-surface px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-tight disabled:opacity-60"
                  >
                    {isJoining ? '...' : t('joinForm.join', 'Join')}
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
