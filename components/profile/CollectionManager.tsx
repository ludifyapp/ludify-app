'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { GameThumbnail } from '@/components/ui/GameThumbnail'
import { Spinner } from '@/components/ui/Spinner'
import type { CollectionGame } from '@/types'

interface CollectionManagerProps {
  uid: string
  authedFetch: (path: string, options?: RequestInit) => Promise<Response>
  isOwner?: boolean
}

export function CollectionManager({ uid, authedFetch, isOwner = true }: CollectionManagerProps) {
  const { t } = useTranslation()
  const [collection, setCollection] = useState<CollectionGame[]>([])
  const [loading, setLoading] = useState(true)
  const [bggUsername, setBggUsername] = useState<string | null>(null)
  const [bggLastSynced, setBggLastSynced] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [collectionLoading, setCollectionLoading] = useState(false)
  const [selectedGame, setSelectedGame] = useState<CollectionGame | null>(null)

  useEffect(() => {
    Promise.all([
      fetch(`/api/users/${uid}`).then((r) => r.json()),
    ]).then(([userData]) => {
      setBggUsername(userData.bggUsername ?? null)
      setBggLastSynced(userData.bggLastSyncedAt ?? null)
    }).finally(() => setLoading(false))
  }, [uid])

  const loadCollection = async () => {
    if (expanded) return
    setCollectionLoading(true)
    try {
      const data = await fetch(`/api/users/${uid}/collection`).then((r) => r.json())
      setCollection(data.collection ?? [])
      setExpanded(true)
    } finally {
      setCollectionLoading(false)
    }
  }

  const resync = async () => {
    if (!bggUsername || syncing) return
    setSyncing(true)
    try {
      const res = await authedFetch('/api/bgg/sync', {
        method: 'POST',
        body: JSON.stringify({ bggUsername }),
      })
      if (res.ok) {
        const data = await res.json()
        setCollection(data.collection ?? [])
        setBggLastSynced(new Date().toISOString())
        setExpanded(true)
      }
    } finally {
      setSyncing(false)
    }
  }

  return (
    <>
      <div className="bg-surface-container rounded-[1.5rem] p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-on-surface">
            {t('collection.title')}
            {collection.length > 0 && (
              <span className="ml-2 text-sm font-normal text-on-surface-variant">
                {collection.length} {collection.length !== 1 ? t('collection.games') : t('collection.game')}
              </span>
            )}
          </h2>
          {isOwner && bggUsername && (
            <button
              onClick={resync}
              disabled={syncing}
              className="text-sm font-medium text-primary hover:text-primary/80 transition-colors disabled:opacity-40"
            >
              {syncing ? t('collection.syncing') : t('collection.syncBgg')}
            </button>
          )}
        </div>

        {/* Linked status */}
        {bggUsername && bggLastSynced && (
          <div className="flex items-center gap-2 mb-4">
            <span className="inline-flex items-center gap-1 text-xs text-primary font-medium">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
              {t('collection.linkedTo', { username: bggUsername })}
            </span>
            <span className="text-xs text-on-surface-variant/60">
              · {t('collection.lastSynced', { date: new Date(bggLastSynced).toLocaleDateString() })}
            </span>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-6"><Spinner className="h-5 w-5" /></div>
        ) : !bggUsername ? (
          isOwner ? (
            <div className="text-center py-6">
              <p className="text-sm text-on-surface-variant mb-2">
                {t('collection.linkRequired')}
              </p>
              <a
                href="/settings"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                {t('collection.goToSettings')}
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </a>
            </div>
          ) : null
        ) : !expanded ? (
          <button
            onClick={loadCollection}
            disabled={collectionLoading}
            className="w-full py-2.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-40"
          >
            {collectionLoading ? (
              <><Spinner className="h-4 w-4" /> {t('collection.loading')}</>
            ) : (
              <>{t('collection.showCollection')} <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg></>
            )}
          </button>
        ) : collection.length === 0 ? (
          <p className="text-sm text-on-surface-variant italic">
            {t('collection.empty')}
          </p>
        ) : (
          <>
            {collection.length > 20 && (
              <button
                onClick={() => setExpanded(false)}
                className="w-full py-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors flex items-center justify-center gap-1.5 mb-3"
              >
                {t('collection.hideCollection')} <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M18 15l-6-6-6 6"/></svg>
              </button>
            )}
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {collection.map((game) => (
                <button
                  key={game.bggId}
                  onClick={() => setSelectedGame(game)}
                  className="group relative bg-surface-container-high rounded-xl overflow-hidden aspect-square text-left cursor-pointer hover:ring-2 hover:ring-primary/40 transition-all"
                >
                  <GameThumbnail
                    src={game.thumbnail}
                    name={game.name}
                    width={120}
                    height={120}
                    imgClassName="w-full h-full object-contain p-2"
                    placeholderClassName="w-full h-full flex items-center justify-center text-2xl"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-2">
                    <p className="text-white text-xs font-medium text-center leading-tight line-clamp-3">{game.name}</p>
                    {game.yearPublished && (
                      <p className="text-white/60 text-[10px]">{game.yearPublished}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
            <button
              onClick={() => setExpanded(false)}
              className="w-full py-2.5 mt-3 text-sm font-medium text-primary hover:text-primary/80 transition-colors flex items-center justify-center gap-1.5"
            >
              {t('collection.hideCollection')} <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M18 15l-6-6-6 6"/></svg>
            </button>
          </>
        )}
      </div>

      {/* Bottom sheet */}
      {selectedGame && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={() => setSelectedGame(null)}>
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 animate-[fadeIn_150ms_ease-out]" />

          {/* Sheet */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg bg-surface rounded-t-[1.5rem] shadow-xl animate-[slideUp_200ms_ease-out] pb-[env(safe-area-inset-bottom)]"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-on-surface-variant/20" />
            </div>

            {/* Game info */}
            <div className="flex items-center gap-3 px-6 py-3">
              <div className="w-14 h-14 rounded-xl overflow-hidden bg-surface-container-high flex-shrink-0">
                <GameThumbnail
                  src={selectedGame.thumbnail}
                  name={selectedGame.name}
                  width={56}
                  height={56}
                  imgClassName="w-full h-full object-contain p-1"
                  placeholderClassName="w-full h-full flex items-center justify-center text-lg"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-on-surface text-sm truncate">{selectedGame.name}</p>
                {selectedGame.yearPublished && (
                  <p className="text-xs text-on-surface-variant/60">{selectedGame.yearPublished}</p>
                )}
              </div>
              <button
                onClick={() => setSelectedGame(null)}
                className="flex-shrink-0 p-1.5 rounded-full hover:bg-surface-container-high transition-colors"
              >
                <svg className="w-5 h-5 text-on-surface-variant" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>

            {/* Actions */}
            <div className="px-4 pb-4 space-y-1">
              {/* Host an event */}
              <Link
                href={`/create?bggId=${selectedGame.bggId}&gameName=${encodeURIComponent(selectedGame.name)}&thumbnail=${encodeURIComponent(selectedGame.thumbnail)}&year=${selectedGame.yearPublished ?? ''}`}
                className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-surface-container-high transition-colors"
                onClick={() => setSelectedGame(null)}
              >
                <span className="text-lg">🎲</span>
                <span className="text-sm font-medium text-on-surface">{t('collection.actionHost')}</span>
              </Link>

              {/* Search events */}
              <Link
                href={`/?tab=events&subTab=explore&q=${encodeURIComponent(selectedGame.name)}`}
                className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-surface-container-high transition-colors"
                onClick={() => setSelectedGame(null)}
              >
                <span className="text-lg">🔍</span>
                <span className="text-sm font-medium text-on-surface">{t('collection.actionSearchEvents')}</span>
              </Link>

              {/* My events for this game */}
              <Link
                href={`/my-events?bggId=${selectedGame.bggId}&gameName=${encodeURIComponent(selectedGame.name)}`}
                className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-surface-container-high transition-colors"
                onClick={() => setSelectedGame(null)}
              >
                <span className="text-lg">📋</span>
                <span className="text-sm font-medium text-on-surface">{t('collection.actionMyEvents')}</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
