'use client'
import { use, useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useTable } from '@/hooks/useTable'
import { useAuth } from '@/contexts/AuthContext'
import { TableCard } from '@/components/table/TableCard'
import { PlayerList } from '@/components/table/PlayerList'
import { EditTableForm } from '@/components/forms/EditTableForm'
import { CancelTableButton } from '@/components/table/CancelTableButton'
import { ShareWithFriendsModal } from '@/components/table/ShareWithFriendsModal'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { Input } from '@/components/ui/Input'
import { GameTable, Recap } from '@/types'
import { getEffectiveStatus } from '@/lib/utils'
import { getIdToken } from '@/lib/getIdToken'
import { Analytics } from '@/lib/analytics'
import { useTranslation } from 'react-i18next'

export default function ManagePage({ params }: { params: Promise<{ id: string }> }) {
  const { t } = useTranslation()
  const { id } = use(params)
  const { table, loading: tableLoading, error } = useTable(id)
  const { user, loading: authLoading } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [recap, setRecap] = useState<Recap | null | undefined>(undefined) // undefined = loading
  const [recapNote, setRecapNote] = useState('')
  const [recapWinner, setRecapWinner] = useState('')
  const [postingRecap, setPostingRecap] = useState(false)
  const [recapPosted, setRecapPosted] = useState(false)

  // Compute before early returns so hooks are always called in the same order
  const effectiveStatus = table ? getEffectiveStatus(table) : null

  // Fetch existing recap — must be above all early returns (Rules of Hooks)
  useEffect(() => {
    if (effectiveStatus !== 'ended') return
    fetch(`/api/tables/${id}/recap`)
      .then((r) => r.json())
      .then((d) => setRecap(d.recap ?? null))
      .catch(() => setRecap(null))
  }, [id, effectiveStatus])

  if (tableLoading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  if (error || !table) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-600 dark:text-zinc-400">{error ?? t('table.notFound')}</p>
      </div>
    )
  }

  if (!user || user.uid !== table.hostUid) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600 dark:text-zinc-400">{t('manage.noAccess')}</p>
          <Link href={`/table/${id}`} className="mt-4 inline-block text-teal-600 hover:underline">
            {t('manage.viewTable')}
          </Link>
        </div>
      </div>
    )
  }

  const handleSave = async (data: Partial<GameTable>) => {
    const token = await getIdToken()
    const res = await fetch(`/api/tables/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const body = await res.json()
      throw new Error(body.error ?? 'Failed to save')
    }
  }

  const handleCancelTable = async () => {
    await handleSave({ status: 'cancelled' })
    Analytics.tableCancelled({ table_id: id, game: table.boardGame.name })
  }

  const handleAddGuest = async (name: string) => {
    const res = await fetch(`/api/tables/${id}/players`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    if (!res.ok) {
      const body = await res.json()
      throw new Error(body.error ?? 'Failed to add guest')
    }
  }

  const handleRemovePlayer = async (playerId: string) => {
    const token = await getIdToken()
    const res = await fetch(`/api/tables/${id}/players/${playerId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    })
    if (!res.ok) {
      const body = await res.json()
      throw new Error(body.error ?? 'Failed to remove player')
    }
  }

  const isPreStart = effectiveStatus === 'waiting' || effectiveStatus === 'full'
  const isLive = isPreStart || effectiveStatus === 'ongoing'

  const handlePostRecap = async () => {
    setPostingRecap(true)
    try {
      const token = await getIdToken()
      const res = await fetch(`/api/tables/${id}/recap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ note: recapNote, winner: recapWinner }),
      })
      if (res.ok) {
        const data = await res.json()
        setRecap(data.recap)
        setRecapPosted(true)
        Analytics.recapPosted({ table_id: id, game: table.boardGame.name })
      }
    } finally {
      setPostingRecap(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-zinc-950 px-4 py-10">
      <div className="max-w-lg mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link href={`/table/${id}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-zinc-200 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 px-3.5 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800 shadow-sm transition-colors">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            {t('manage.tablePage')}
          </Link>
        </div>

        {isEditing ? (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800 p-6">
            <h2 className="font-semibold text-slate-900 dark:text-white mb-4">{t('manage.editTable')}</h2>
            <EditTableForm
              table={table}
              onSave={handleSave}
              onClose={() => setIsEditing(false)}
            />
          </div>
        ) : (
          <>
            <TableCard table={table} />
            {isPreStart && (
              <Button variant="secondary" onClick={() => setIsEditing(true)} className="w-full">
                {t('manage.editTableDetails')}
              </Button>
            )}
          </>
        )}

        <PlayerList
          players={table.players}
          maxPlayers={table.maxPlayers}
          isHost
          onRemovePlayer={isLive ? handleRemovePlayer : undefined}
          onInviteFriends={isPreStart ? () => setShareOpen(true) : undefined}
        />

        {isPreStart && (
          <AddGuestForm
            onAdd={handleAddGuest}
            isFull={table.players.length >= table.maxPlayers}
          />
        )}

        {isLive && (
          <div className="pt-2">
            <CancelTableButton onCancel={handleCancelTable} />
          </div>
        )}

        {/* Post-table recap */}
        {effectiveStatus === 'ended' && (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center flex-shrink-0">
                <span className="text-lg">🎲</span>
              </div>
              <div>
                <h2 className="font-semibold text-slate-900 dark:text-white">{t('manage.postRecap')}</h2>
                <p className="text-xs text-slate-500 dark:text-zinc-400">{t('manage.postRecapDesc')}</p>
              </div>
            </div>

            {recap === undefined ? (
              <div className="flex justify-center py-3"><Spinner className="h-5 w-5" /></div>
            ) : recap !== null || recapPosted ? (
              <div className="flex items-center gap-2 text-sm text-teal-600 dark:text-teal-400 font-medium">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {t('manage.recapPosted')}
              </div>
            ) : (
              <div className="space-y-3">
                {/* Winner */}
                <div>
                  <datalist id="player-names">
                    {table.players.map((p) => (
                      <option key={p.id} value={p.name} />
                    ))}
                  </datalist>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base">🏆</span>
                    <input
                      type="text"
                      list="player-names"
                      value={recapWinner}
                      onChange={(e) => setRecapWinner(e.target.value)}
                      maxLength={100}
                      placeholder={t('manage.recapWinnerPlaceholder')}
                      className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>
                <textarea
                  value={recapNote}
                  onChange={(e) => setRecapNote(e.target.value)}
                  maxLength={500}
                  rows={3}
                  placeholder={t('manage.recapPlaceholder')}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 dark:text-zinc-500">{recapNote.length}/500</span>
                  <Button size="sm" onClick={handlePostRecap} loading={postingRecap}>
                    {t('manage.postRecapBtn')}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <ShareWithFriendsModal
        tableId={id}
        tableName={table.boardGame.name}
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
      />
    </main>
  )
}

function AddGuestForm({ onAdd, isFull }: { onAdd: (name: string) => Promise<void>; isFull: boolean }) {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) { setError(t('manage.enterName')); return }
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      await onAdd(trimmed)
      setSuccess(t('manage.guestAdded', { name: trimmed }))
      setName('')
      inputRef.current?.focus()
    } catch (err) {
      setError((err as Error).message || 'Failed to add guest')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800 p-6">
      <h2 className="font-semibold text-slate-900 dark:text-white mb-4">{t('manage.addGuest')}</h2>
      {isFull ? (
        <p className="text-sm text-slate-500 dark:text-zinc-400">{t('manage.tableFull')}</p>
      ) : (
        <form onSubmit={handleSubmit} className="flex gap-3">
          <div className="flex-1">
            <Input
              ref={inputRef}
              placeholder={t('manage.guestName')}
              value={name}
              onChange={(e) => { setName(e.target.value); setError(''); setSuccess('') }}
              error={error}
            />
          </div>
          <Button type="submit" loading={loading} className="self-start">{t('manage.add')}</Button>
        </form>
      )}
      {success && <p className="text-sm text-green-600 dark:text-green-400 mt-2">{success}</p>}
    </div>
  )
}
