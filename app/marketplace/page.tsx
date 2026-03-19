'use client'
import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { ListingCard } from '@/components/marketplace/ListingCard'
import { Spinner } from '@/components/ui/Spinner'
import { conditionLabels } from '@/components/marketplace/ConditionBadge'
import type { Listing, ListingCondition } from '@/types'

const CONDITIONS: ListingCondition[] = ['new', 'like_new', 'good', 'fair', 'poor']

export default function MarketplacePage() {
  const { user } = useAuth()
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [conditionFilter, setConditionFilter] = useState<ListingCondition | ''>('')

  useEffect(() => {
    const params = new URLSearchParams({ status: 'active' })
    if (conditionFilter) params.set('condition', conditionFilter)

    fetch(`/api/listings?${params}`)
      .then((r) => r.json())
      .then((d) => setListings(d.listings ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [conditionFilter])

  const filtered = useMemo(() => {
    if (!search.trim()) return listings
    const q = search.toLowerCase()
    return listings.filter((l) => l.boardGame.name.toLowerCase().includes(q))
  }, [listings, search])

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-zinc-950 px-4 py-10">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-zinc-200 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 px-3.5 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800 shadow-sm transition-colors">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
              Home
            </Link>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Marketplace</h1>
          </div>
          {user && (
            <Link href="/marketplace/create" className="inline-flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
              Sell a Game
            </Link>
          )}
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-500 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="M21 21l-4.35-4.35" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by game name…"
            className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        {/* Condition filter */}
        <div className="flex gap-2 flex-wrap mb-6">
          <button
            onClick={() => setConditionFilter('')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              conditionFilter === ''
                ? 'bg-teal-600 border-teal-600 text-white'
                : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 hover:border-teal-400'
            }`}
          >
            All
          </button>
          {CONDITIONS.map((c) => (
            <button
              key={c}
              onClick={() => setConditionFilter(c === conditionFilter ? '' : c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                conditionFilter === c
                  ? 'bg-teal-600 border-teal-600 text-white'
                  : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 hover:border-teal-400'
              }`}
            >
              {conditionLabels[c]}
            </button>
          ))}
        </div>

        {/* Listings */}
        {loading ? (
          <div className="flex justify-center py-16"><Spinner className="h-8 w-8" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800">
            <svg className="mx-auto mb-4" width="64" height="64" viewBox="0 0 64 64" fill="none">
              <circle cx="32" cy="32" r="32" className="fill-teal-50 dark:fill-teal-900/20" />
              <rect x="18" y="16" width="28" height="32" rx="3" className="fill-teal-100 dark:fill-teal-800/40 stroke-teal-400 dark:stroke-teal-600" strokeWidth="1.5"/>
              <path d="M24 26h16M24 31h16M24 36h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-teal-400 dark:text-teal-600"/>
            </svg>
            <p className="font-semibold text-slate-700 dark:text-zinc-200">No listings found</p>
            <p className="text-sm text-slate-400 dark:text-zinc-500 mt-1">
              {search ? 'Try a different game name' : 'Be the first to sell a game!'}
            </p>
            {user && !search && (
              <Link href="/marketplace/create" className="inline-block mt-4 px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-xl hover:bg-teal-700 transition-colors">
                List a Game
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filtered.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
