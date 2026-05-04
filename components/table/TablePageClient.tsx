'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { useTable } from '@/hooks/useTable'
import { useAuth } from '@/contexts/AuthContext'
import { TableCard } from '@/components/table/TableCard'
import { PlayerList } from '@/components/table/PlayerList'
import { ShareWithFriendsModal } from '@/components/table/ShareWithFriendsModal'
import { Spinner } from '@/components/ui/Spinner'
import { getEffectiveStatus } from '@/lib/utils'
import { auth } from '@/lib/firebase/client'
import { Analytics } from '@/lib/analytics'
import { TableComments } from '@/components/table/TableComments'
import { HostRatingForm } from '@/components/table/HostRatingForm'
import { GameRecommendations } from '@/components/table/GameRecommendations'

// Removed standalone LeaveButton as it is now integrated into PlayerList

export function TablePageClient({ id }: { id: string }) {
  const { t } = useTranslation()
  const { table, loading, error } = useTable(id)
  const { user } = useAuth()
  const [shareOpen, setShareOpen] = useState(false)
  const [justJoined, setJustJoined] = useState(false)

  // Track page view once table loads — must be before any early returns
  useEffect(() => {
    if (!table) return
    const effectiveStatus = getEffectiveStatus(table)
    Analytics.tableViewed({ table_id: id, game: table.boardGame.name, status: effectiveStatus })
  }, [id, table]) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  if (error || !table) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-on-surface-variant">{error ?? t('table.notFound')}</p>
          <Link href="/" className="mt-4 inline-block text-primary hover:underline">
            {t('table.backHome')}
          </Link>
        </div>
      </div>
    )
  }

  const effectiveStatus = getEffectiveStatus(table)
  const isHost = !!user && user.uid === table.hostUid
  const hasJoined = !!user && table.playerUids?.includes(user.uid)

  const handleLeave = async () => {
    if (!user) return
    const token = await user.getIdToken()
    const res = await fetch(`/api/tables/${id}/players/${user.uid}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error ?? 'Failed to leave')
    }
    setJustJoined(false)
    Analytics.tableLeft({ table_id: id, game: table.boardGame.name })
  }

  const handleRemovePlayer = async (playerId: string) => {
    if (!user) return
    const token = await user.getIdToken()
    const res = await fetch(`/api/tables/${id}/players/${playerId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error ?? 'Failed to remove player')
    }
  }

  const handleJoin = async (name: string) => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    const token = await auth.currentUser?.getIdToken()
    if (token) headers['Authorization'] = `Bearer ${token}`

    const res = await fetch(`/api/tables/${id}/players`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ name }),
    })
    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error ?? 'Failed to join')
    }
    setJustJoined(true)
    Analytics.tableJoined({ table_id: id, game: table.boardGame.name })
  }

  return (
    <main className="min-h-screen bg-surface pb-24">
      <TableCard
        table={table}
        backHref="/"
        manageHref={isHost ? `/table/${id}/manage` : undefined}
      />

      {/* Remaining sections in a constrained container */}
      <div className="max-w-lg mx-auto px-5 flex flex-col gap-3 mt-8">
        <PlayerList
          players={table.players}
          maxPlayers={table.maxPlayers}
          minPlayers={table.minPlayers}
          isHost={isHost}
          onJoin={!isHost && !hasJoined && !['ended', 'cancelled', 'full'].includes(effectiveStatus) ? handleJoin : undefined}
          onLeave={hasJoined && !isHost && effectiveStatus !== 'ended' ? handleLeave : undefined}
          onRemovePlayer={isHost ? handleRemovePlayer : undefined}
          onInviteFriends={user ? () => { setShareOpen(true); Analytics.shareModalOpened({ table_id: id }) } : undefined}
        />
        {justJoined && hasJoined && !isHost && effectiveStatus !== 'ended' && (
          <div className="bg-tertiary-container rounded-xl p-4">
            <p className="text-on-tertiary-container font-medium text-center">{t('table.youreGoing')}</p>
          </div>
        )}

        {/* Host rating — shown to attendees (not host) after table ends */}
        {hasJoined && !isHost && effectiveStatus === 'ended' && (
          <HostRatingForm
            tableId={id}
            hostName={table.players.find((p) => p.isHost)?.name ?? 'the host'}
          />
        )}

        {/* Game recommendations — shown to participants when table is upcoming or ongoing */}
        {(isHost || hasJoined) && (effectiveStatus === 'waiting' || effectiveStatus === 'full' || effectiveStatus === 'ongoing') && (
          <GameRecommendations tableId={id} />
        )}

        <div className="bg-surface-container-high rounded-3xl px-6 py-6">
          <TableComments
            tableId={id}
            hostUid={table.hostUid}
            hostName={table.players.find((p) => p.isHost)?.name ?? 'Host'}
            canComment={!!user && table.allowComments !== false}
            allowComments={table.allowComments}
          />
        </div>
      </div>

      {user && (
        <ShareWithFriendsModal
          tableId={id}
          tableName={table.boardGame.name}
          isOpen={shareOpen}
          onClose={() => setShareOpen(false)}
        />
      )}
    </main>
  )
}
