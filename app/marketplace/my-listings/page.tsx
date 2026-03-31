'use client'
import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { ConditionBadge } from '@/components/marketplace/ConditionBadge'
import { Spinner } from '@/components/ui/Spinner'
import { auth } from '@/lib/firebase/client'
import { useTranslation } from 'react-i18next'
import type { Listing } from '@/types'

function formatPrice(cents: number) {
  return '$' + (cents / 100).toFixed(2)
}

export default function MyListingsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { t } = useTranslation()
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !user) router.replace('/')
  }, [user, authLoading, router])

  const fetchListings = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const token = await auth.currentUser?.getIdToken()
      const [activeRes, soldRes] = await Promise.all([
        fetch(`/api/listings?sellerUid=${user.uid}&status=active`, { headers: token ? { Authorization: `Bearer ${token}` } : {} }),
        fetch(`/api/listings?sellerUid=${user.uid}&status=sold`, { headers: token ? { Authorization: `Bearer ${token}` } : {} }),
      ])
      const [activeData, soldData] = await Promise.all([activeRes.json(), soldRes.json()])
      setListings([...(activeData.listings ?? []), ...(soldData.listings ?? [])])
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user) fetchListings()
  }, [user, fetchListings])

  const authedFetch = async (path: string, options: RequestInit = {}) => {
    const token = await auth.currentUser?.getIdToken()
    return fetch(path, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
  }

  const toggleStatus = async (listing: Listing) => {
    setActionLoading(listing.id)
    const newStatus = listing.status === 'active' ? 'sold' : 'active'
    await authedFetch(`/api/listings/${listing.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: newStatus }),
    })
    await fetchListings()
    setActionLoading(null)
  }

  const deleteListing = async (id: string) => {
    if (!confirm(t('marketplace.confirmDelete'))) return
    setActionLoading(id)
    await authedFetch(`/api/listings/${id}`, { method: 'DELETE' })
    await fetchListings()
    setActionLoading(null)
  }

  if (authLoading || !user) return (
    <div className="min-h-screen flex items-center justify-center">
      <Spinner className="h-8 w-8" />
    </div>
  )

  const active = listings.filter((l) => l.status === 'active')
  const sold = listings.filter((l) => l.status === 'sold')

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-zinc-950 px-4 py-10">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/marketplace" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-zinc-200 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 px-3.5 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800 shadow-sm transition-colors">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            {t('nav.marketplace')}
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('marketplace.myListings')}</h1>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Spinner className="h-8 w-8" /></div>
        ) : listings.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800">
            <p className="font-semibold text-slate-700 dark:text-zinc-200">{t('marketplace.noListingsYet')}</p>
            <p className="text-sm text-slate-400 dark:text-zinc-500 mt-1">{t('marketplace.startSelling')}</p>
            <Link href="/marketplace/create" className="inline-block mt-4 px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-xl hover:bg-teal-700 transition-colors">
              {t('marketplace.listAGameLink')}
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {active.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wide mb-3">
                  {t('marketplace.active')} ({active.length})
                </h2>
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800 divide-y divide-slate-100 dark:divide-zinc-800">
                  {active.map((l) => (
                    <ListingRow key={l.id} listing={l} actionLoading={actionLoading} onToggle={toggleStatus} onDelete={deleteListing} />
                  ))}
                </div>
              </section>
            )}
            {sold.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wide mb-3">
                  {t('marketplace.soldSection')} ({sold.length})
                </h2>
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800 divide-y divide-slate-100 dark:divide-zinc-800">
                  {sold.map((l) => (
                    <ListingRow key={l.id} listing={l} actionLoading={actionLoading} onToggle={toggleStatus} onDelete={deleteListing} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </main>
  )
}

function ListingRow({ listing, actionLoading, onToggle, onDelete }: {
  listing: Listing
  actionLoading: string | null
  onToggle: (l: Listing) => void
  onDelete: (id: string) => void
}) {
  const { t } = useTranslation()
  const busy = actionLoading === listing.id
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0 overflow-hidden">
        {listing.boardGame.thumbnail ? (
          <Image src={listing.boardGame.thumbnail} alt={listing.boardGame.name} width={48} height={48} className="object-contain w-full h-full p-1" />
        ) : (
          <span className="text-xl">🎲</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-slate-900 dark:text-white text-sm truncate">{listing.boardGame.name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-sm font-semibold text-teal-600 dark:text-teal-400">{formatPrice(listing.price)}</span>
          <ConditionBadge condition={listing.condition} />
        </div>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <Link href={`/marketplace/listing/${listing.id}`} className="p-1.5 text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
        </Link>
        <button
          disabled={busy}
          onClick={() => onToggle(listing)}
          className="text-xs font-medium px-2.5 py-1 rounded-lg border transition-colors disabled:opacity-50 border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800"
        >
          {busy ? '…' : listing.status === 'active' ? t('marketplace.markSold') : t('marketplace.relist')}
        </button>
        <button
          disabled={busy}
          onClick={() => onDelete(listing.id)}
          className="p-1.5 text-slate-300 dark:text-zinc-600 hover:text-red-500 dark:hover:text-red-400 transition-colors disabled:opacity-50"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
        </button>
      </div>
    </div>
  )
}
