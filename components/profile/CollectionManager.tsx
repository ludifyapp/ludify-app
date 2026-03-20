'use client'
import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { useBggSearch } from '@/hooks/useBggSearch'
import { Spinner } from '@/components/ui/Spinner'
import { Analytics } from '@/lib/analytics'
import type { BggGame, CollectionGame } from '@/types'

interface CollectionManagerProps {
  uid: string
  authedFetch: (path: string, options?: RequestInit) => Promise<Response>
}

export function CollectionManager({ uid, authedFetch }: CollectionManagerProps) {
  const [collection, setCollection] = useState<CollectionGame[]>([])
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [query, setQuery] = useState('')
  const [addingId, setAddingId] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { results, isLoading: bggLoading } = useBggSearch(query)

  useEffect(() => {
    fetch(`/api/users/${uid}/collection`)
      .then((r) => r.json())
      .then((d) => setCollection(d.collection ?? []))
      .finally(() => setLoading(false))
  }, [uid])

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
          inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const addGame = async (game: BggGame) => {
    if (addingId) return
    setAddingId(game.bggId)
    try {
      let enriched = game
      try {
        const res = await fetch(`/api/bgg/thing?id=${game.bggId}`)
        const data = await res.json()
        if (data.game) enriched = data.game
      } catch {}

      const res = await authedFetch(`/api/users/${uid}/collection`, {
        method: 'POST',
        body: JSON.stringify({
          bggId: enriched.bggId,
          name: enriched.name,
          thumbnail: enriched.thumbnail ?? '',
          yearPublished: enriched.yearPublished,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setCollection((prev) => [...prev, data.game])
        Analytics.collectionGameAdded({ game: enriched.name })
      }
    } finally {
      setAddingId(null)
      setQuery('')
    }
  }

  const removeGame = async (bggId: string, name: string) => {
    await authedFetch(`/api/users/${uid}/collection?bggId=${encodeURIComponent(bggId)}`, { method: 'DELETE' })
    setCollection((prev) => prev.filter((g) => g.bggId !== bggId))
    Analytics.collectionGameRemoved({ game: name })
  }

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-slate-900 dark:text-white">
          My Collection
          {collection.length > 0 && (
            <span className="ml-2 text-sm font-normal text-slate-400 dark:text-zinc-500">{collection.length} game{collection.length !== 1 ? 's' : ''}</span>
          )}
        </h2>
        <button
          onClick={() => { setSearching((p) => !p); setQuery(''); setTimeout(() => inputRef.current?.focus(), 50) }}
          className="text-sm font-medium text-teal-600 dark:text-teal-400 hover:text-teal-800 dark:hover:text-teal-300 transition-colors"
        >
          {searching ? 'Done' : '+ Add game'}
        </button>
      </div>

      {/* Search */}
      {searching && (
        <div className="mb-4 relative">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search BoardGameGeek…"
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            {bggLoading && (
              <div className="absolute right-3 top-2.5"><Spinner className="h-4 w-4" /></div>
            )}
          </div>
          {results.length > 0 && query.length >= 2 && (
            <div ref={dropdownRef} className="absolute z-10 w-full mt-1 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl shadow-lg overflow-hidden max-h-64 overflow-y-auto">
              {results.map((game) => {
                const owned = collection.some((g) => g.bggId === game.bggId)
                const isAdding = addingId === game.bggId
                return (
                  <button
                    key={game.bggId}
                    type="button"
                    disabled={owned || !!addingId}
                    onClick={() => addGame(game)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                      owned ? 'opacity-50 cursor-default' : 'hover:bg-slate-50 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0 text-base">🎲</div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{game.name}</p>
                      {game.yearPublished && <p className="text-xs text-slate-400 dark:text-zinc-500">{game.yearPublished}</p>}
                    </div>
                    {isAdding && <Spinner className="h-3.5 w-3.5 flex-shrink-0 text-teal-500" />}
                    {owned && !isAdding && <span className="text-xs text-teal-600 dark:text-teal-400 flex-shrink-0">Owned</span>}
                    {!owned && !isAdding && (
                      <svg className="w-4 h-4 text-slate-300 dark:text-zinc-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14"/>
                      </svg>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Collection grid */}
      {loading ? (
        <div className="flex justify-center py-6"><Spinner className="h-5 w-5" /></div>
      ) : collection.length === 0 ? (
        <p className="text-sm text-slate-400 dark:text-zinc-500 italic">
          Add the games you own — it shows on your public profile
        </p>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {collection.map((game) => (
            <div key={game.bggId} className="group relative bg-slate-50 dark:bg-zinc-800 rounded-xl overflow-hidden aspect-square">
              {game.thumbnail ? (
                <Image
                  src={game.thumbnail}
                  alt={game.name}
                  width={120}
                  height={120}
                  className="w-full h-full object-contain p-2"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-2xl">🎲</span>
                </div>
              )}
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-2">
                <p className="text-white text-xs font-medium text-center leading-tight line-clamp-3">{game.name}</p>
                <button
                  onClick={() => removeGame(game.bggId, game.name)}
                  className="text-xs text-red-300 hover:text-red-200 underline transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
