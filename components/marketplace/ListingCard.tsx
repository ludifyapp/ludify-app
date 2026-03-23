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
      <div className="w-14 h-14 rounded-[1.5rem] bg-primary-container flex items-center justify-center">
        <span className="text-2xl font-bold text-primary">{initial}</span>
      </div>
      <p className="text-xs text-on-surface-variant/60 text-center leading-tight line-clamp-2 px-1 font-meta">{name}</p>
    </div>
  )
}

export function ListingCard({ listing, listView }: { listing: Listing; listView?: boolean }) {
  const [imgError, setImgError] = useState(false)

  if (listView) {
    return (
      <Link href={`/marketplace/listing/${listing.id}`} onClick={() => Analytics.listingViewed({ listing_id: listing.id, game: listing.boardGame.name })}>
        <div className="bg-surface-container-high rounded-[1.5rem] hover:bg-surface-container-highest transition-colors flex items-center gap-3 p-3">
          <div className="w-16 h-16 flex-shrink-0 bg-surface-container-highest rounded-[1.5rem] flex items-center justify-center overflow-hidden">
            {listing.boardGame.thumbnail && !imgError ? (
              <Image
                src={listing.boardGame.thumbnail}
                alt={listing.boardGame.name}
                width={64}
                height={64}
                className="w-full h-full object-contain p-1"
                onError={() => setImgError(true)}
              />
            ) : (
              <span className="text-xl font-bold text-primary">{listing.boardGame.name.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-on-surface text-sm leading-tight truncate">
              {listing.boardGame.name}
              {listing.boardGame.yearPublished && (
                <span className="text-on-surface-variant/60 font-normal"> ({listing.boardGame.yearPublished})</span>
              )}
            </p>
            <p className="text-xs text-on-surface-variant/60 font-meta truncate mt-0.5">{listing.location}</p>
          </div>
          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
            <span className="text-base font-bold text-primary">{formatPrice(listing.price)}</span>
            <ConditionBadge condition={listing.condition} />
          </div>
        </div>
      </Link>
    )
  }

  return (
    <Link href={`/marketplace/listing/${listing.id}`} onClick={() => Analytics.listingViewed({ listing_id: listing.id, game: listing.boardGame.name })}>
      <div className="bg-surface-container-high rounded-[1.5rem] hover:bg-surface-container-highest transition-colors overflow-hidden">
        {/* Game thumbnail */}
        <div className="aspect-square bg-surface-container-highest rounded-t-[1.5rem] flex items-center justify-center overflow-hidden">
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
          <p className="font-semibold text-on-surface text-sm leading-tight line-clamp-2">
            {listing.boardGame.name}
            {listing.boardGame.yearPublished && (
              <span className="text-on-surface-variant/60 font-normal"> ({listing.boardGame.yearPublished})</span>
            )}
          </p>

          <div className="flex items-center justify-between gap-2">
            <span className="text-base font-bold text-primary">
              {formatPrice(listing.price)}
            </span>
            <ConditionBadge condition={listing.condition} />
          </div>

          <p className="text-xs text-on-surface-variant/60 font-meta truncate">{listing.location}</p>
        </div>
      </div>
    </Link>
  )
}
