'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { ConditionBadge } from '@/components/marketplace/ConditionBadge'
import { Spinner } from '@/components/ui/Spinner'
import { auth } from '@/lib/firebase/client'
import { Analytics } from '@/lib/analytics'
import type { Listing } from '@/types'

async function startConversation(
  sellerUid: string,
  listingId: string,
  listingName: string,
  listingThumbnail: string,
): Promise<string> {
  const token = await auth.currentUser?.getIdToken()
  const res = await fetch('/api/conversations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ toUid: sellerUid, listingId, listingName, listingThumbnail }),
  })
  const data = await res.json()
  return data.conversationId
}

function formatPrice(cents: number) {
  return '$' + (cents / 100).toFixed(2)
}

function buildWhatsAppUrl(phone: string, gameName: string) {
  const clean = phone.replace(/[\s\-()]/g, '')
  const number = clean.startsWith('+') ? clean.slice(1) : clean
  const text = encodeURIComponent(`Hi! I'm interested in your ${gameName} listing on Game Night.`)
  return `https://wa.me/${number}?text=${text}`
}

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const router = useRouter()
  const [listing, setListing] = useState<Listing | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [deleted, setDeleted] = useState(false)
  const [imgError, setImgError] = useState(false)
  const [sellerStats, setSellerStats] = useState<{ hostedCount: number; memberSince: number | null } | null>(null)

  useEffect(() => {
    fetch(`/api/listings/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setListing(d.listing ?? null)
        if (d.listing) {
          Analytics.listingViewed({ listing_id: id, game: d.listing.boardGame.name })
          fetch(`/api/users/${d.listing.sellerUid}`)
            .then((r) => r.json())
            .then((u) => setSellerStats({ hostedCount: u.hostedCount ?? 0, memberSince: u.memberSince ?? null }))
            .catch(() => {})
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

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

  const markSold = async () => {
    if (!listing) return
    setActionLoading(true)
    await authedFetch(`/api/listings/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'sold' }),
    })
    setListing({ ...listing, status: 'sold' })
    Analytics.listingMarkedSold({ listing_id: id })
    setActionLoading(false)
  }

  const relist = async () => {
    if (!listing) return
    setActionLoading(true)
    await authedFetch(`/api/listings/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'active' }),
    })
    setListing({ ...listing, status: 'active' })
    Analytics.listingRelisted({ listing_id: id })
    setActionLoading(false)
  }

  const deleteListing = async () => {
    if (!confirm('Delete this listing? This cannot be undone.')) return
    setActionLoading(true)
    await authedFetch(`/api/listings/${id}`, { method: 'DELETE' })
    Analytics.listingDeleted({ listing_id: id })
    setDeleted(true)
    router.push('/marketplace/my-listings')
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Spinner className="h-8 w-8" />
    </div>
  )

  if (!listing || deleted) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-slate-500 dark:text-zinc-400">Listing not found.</p>
    </div>
  )

  const isSeller = user?.uid === listing.sellerUid

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-zinc-950 px-4 py-10">
      <div className="max-w-lg mx-auto">
        <div className="mb-6">
          <Link href="/marketplace" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-zinc-200 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 px-3.5 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800 shadow-sm transition-colors">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            Marketplace
          </Link>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800 overflow-hidden">
          {/* Game image */}
          <div className="aspect-square max-h-72 bg-slate-50 dark:bg-zinc-800 flex items-center justify-center">
            {listing.boardGame.thumbnail && !imgError ? (
              <Image
                src={listing.boardGame.thumbnail}
                alt={listing.boardGame.name}
                width={400}
                height={400}
                className="w-full h-full object-contain p-6"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="flex flex-col items-center justify-center gap-3">
                <div className="w-20 h-20 rounded-3xl bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                  <span className="text-4xl font-bold text-teal-600 dark:text-teal-400">
                    {listing.boardGame.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <p className="text-sm text-slate-400 dark:text-zinc-500">{listing.boardGame.name}</p>
              </div>
            )}
          </div>

          <div className="p-5 flex flex-col gap-4">
            {/* Sold banner */}
            {listing.status === 'sold' && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-2.5 text-sm font-medium text-red-700 dark:text-red-400 text-center">
                This item has been sold
              </div>
            )}

            {/* Title + price */}
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                {listing.boardGame.name}
                {listing.boardGame.yearPublished && (
                  <span className="text-slate-400 dark:text-zinc-500 font-normal text-base"> ({listing.boardGame.yearPublished})</span>
                )}
              </h1>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-2xl font-bold text-teal-600 dark:text-teal-400">
                  {formatPrice(listing.price)}
                </span>
                <ConditionBadge condition={listing.condition} />
              </div>
            </div>

            {/* Location */}
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-zinc-400">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
              {listing.location}
            </div>

            {/* Description */}
            {listing.description && (
              <p className="text-sm text-slate-600 dark:text-zinc-300 leading-relaxed">
                {listing.description}
              </p>
            )}

            {/* Seller */}
            <div className="flex items-center gap-2.5 pt-2 border-t border-slate-100 dark:border-zinc-800">
              {listing.sellerPhoto ? (
                <Image src={listing.sellerPhoto} alt={listing.sellerName} width={32} height={32} className="rounded-full" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center text-sm font-semibold text-teal-700 dark:text-teal-300">
                  {listing.sellerName[0]}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-400 dark:text-zinc-500">Listed by</p>
                <Link href={`/profile/${listing.sellerUid}`} className="text-sm font-medium text-slate-700 dark:text-zinc-200 hover:underline">
                  {listing.sellerName}
                </Link>
                {sellerStats && (
                  <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">
                    {sellerStats.hostedCount > 0 ? `Hosted ${sellerStats.hostedCount} event${sellerStats.hostedCount !== 1 ? 's' : ''}` : 'New member'}
                    {sellerStats.memberSince ? ` · member since ${sellerStats.memberSince}` : ''}
                  </p>
                )}
              </div>
            </div>

            {/* Actions */}
            {isSeller ? (
              <div className="flex gap-2 pt-2">
                {listing.status === 'active' ? (
                  <button
                    onClick={markSold}
                    disabled={actionLoading}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50"
                  >
                    {actionLoading ? 'Updating…' : 'Mark as Sold'}
                  </button>
                ) : (
                  <button
                    onClick={relist}
                    disabled={actionLoading}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-teal-600 text-white hover:bg-teal-700 transition-colors disabled:opacity-50"
                  >
                    {actionLoading ? 'Updating…' : 'Re-list'}
                  </button>
                )}
                <button
                  onClick={deleteListing}
                  disabled={actionLoading}
                  className="py-2.5 px-4 rounded-xl text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            ) : listing.status === 'active' && (
              <div className="space-y-2">
                {user ? (
                  <button
                    onClick={async () => {
                      setActionLoading(true)
                      try {
                        const convId = await startConversation(
                          listing.sellerUid,
                          id,
                          listing.boardGame.name,
                          listing.boardGame.thumbnail ?? '',
                        )
                        Analytics.contactSeller({ listing_id: id })
                        Analytics.conversationStarted({ from_listing: true })
                        router.push(`/messages/${convId}`)
                      } finally {
                        setActionLoading(false)
                      }
                    }}
                    disabled={actionLoading}
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm transition-colors disabled:opacity-50"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    {actionLoading ? 'Opening…' : 'Message Seller'}
                  </button>
                ) : (
                  <a
                    href={buildWhatsAppUrl(listing.whatsapp, listing.boardGame.name)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => Analytics.contactSeller({ listing_id: id })}
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#25D366] hover:bg-[#1ebe5d] text-white font-semibold text-sm transition-colors"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    Contact on WhatsApp
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
