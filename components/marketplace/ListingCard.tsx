'use client'
import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ConditionBadge } from './ConditionBadge'
import { Analytics } from '@/lib/analytics'
import type { Listing } from '@/types'

function formatPrice(cents: number) {
  return '$' + (cents / 100).toFixed(2)
}

function GamePlaceholder({ name }: { name: string }) {
  const initial = name.charAt(0).toUpperCase()
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-3">
      <div className="w-14 h-14 rounded-2xl bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
        <span className="text-2xl font-bold text-teal-600 dark:text-teal-400">{initial}</span>
      </div>
      <p className="text-xs text-slate-400 dark:text-zinc-500 text-center leading-tight line-clamp-2 px-1">{name}</p>
    </div>
  )
}

export function ListingCard({ listing }: { listing: Listing }) {
  const [imgError, setImgError] = useState(false)

  return (
    <Link href={`/marketplace/listing/${listing.id}`} onClick={() => Analytics.listingViewed({ listing_id: listing.id, game: listing.boardGame.name })}>
      <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl overflow-hidden hover:shadow-md hover:border-slate-200 dark:hover:border-zinc-700 transition-all">
        {/* Game thumbnail */}
        <div className="aspect-square bg-slate-50 dark:bg-zinc-800 flex items-center justify-center overflow-hidden">
          {listing.boardGame.thumbnail && !imgError ? (
            <Image
              src={listing.boardGame.thumbnail}
              alt={listing.boardGame.name}
              width={200}
              height={200}
              className="w-full h-full object-contain p-3"
              onError={() => setImgError(true)}
            />
          ) : (
            <GamePlaceholder name={listing.boardGame.name} />
          )}
        </div>

        <div className="p-3 flex flex-col gap-1.5">
          <p className="font-semibold text-slate-900 dark:text-white text-sm leading-tight line-clamp-2">
            {listing.boardGame.name}
            {listing.boardGame.yearPublished && (
              <span className="text-slate-400 dark:text-zinc-500 font-normal"> ({listing.boardGame.yearPublished})</span>
            )}
          </p>

          <div className="flex items-center justify-between gap-2">
            <span className="text-base font-bold text-teal-600 dark:text-teal-400">
              {formatPrice(listing.price)}
            </span>
            <ConditionBadge condition={listing.condition} />
          </div>

          <p className="text-xs text-slate-400 dark:text-zinc-500 truncate">{listing.location}</p>
        </div>
      </div>
    </Link>
  )
}
