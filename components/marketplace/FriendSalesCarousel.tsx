'use client'
import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { Analytics } from '@/lib/analytics'
import type { Listing } from '@/types'
import { ConditionBadge } from './ConditionBadge'

interface FriendSalesCarouselProps {
  listings: Listing[]
  onSeeAll: () => void
}

function formatPrice(cents: number) {
  return '$' + (cents / 100).toFixed(0)
}

function FriendListingCard({ listing }: { listing: Listing }) {
  const [imgError, setImgError] = useState(false)
  const [sellerImgError, setSellerImgError] = useState(false)

  return (
    <Link
      href={`/marketplace/listing/${listing.id}`}
      onClick={() => Analytics.listingViewed({ listing_id: listing.id, game: listing.boardGame.name })}
      className="bg-surface-container-high rounded-[1.5rem] overflow-hidden flex flex-col card-shadow hover:bg-surface-container-highest transition-colors group"
    >
      {/* Art — flush, top-rounded */}
      <div className="w-full aspect-square bg-surface-container-highest relative">
        {listing.boardGame.thumbnail && !imgError ? (
          <Image
            src={listing.boardGame.thumbnail}
            alt={listing.boardGame.name}
            width={200}
            height={200}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-3xl font-extrabold text-primary/30">
              {listing.boardGame.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <div className="absolute bottom-2 left-2">
          <ConditionBadge condition={listing.condition} />
        </div>
      </div>

      {/* Content */}
      <div className="p-3 flex flex-col gap-1.5">
        {/* Price + seller avatar + name */}
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-primary font-sans">
            {formatPrice(listing.price)}
          </span>
          <div className="flex items-center gap-1.5">
            {listing.sellerPhoto && !sellerImgError ? (
              <Image
                src={listing.sellerPhoto}
                alt={listing.sellerName}
                width={20}
                height={20}
                className="w-5 h-5 rounded-full object-cover flex-shrink-0"
                onError={() => setSellerImgError(true)}
              />
            ) : (
              <div className="w-5 h-5 rounded-full bg-surface-container-highest flex items-center justify-center text-[8px] font-bold text-on-surface-variant flex-shrink-0">
                {listing.sellerName.charAt(0).toUpperCase()}
              </div>
            )}
            <p className="text-xs text-on-surface-variant font-meta font-medium leading-none">
              {listing.sellerName.split(' ')[0]}
            </p>
          </div>
        </div>
      </div>
    </Link>
  )
}

export function FriendSalesCarousel({ listings, onSeeAll }: FriendSalesCarouselProps) {
  const { t } = useTranslation()

  if (listings.length === 0) return null

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold tracking-tight text-on-surface">
          {t('home.friendsAreSelling')}
        </h2>
        <button
          onClick={onSeeAll}
          className="text-sm font-semibold text-primary hover:underline"
        >
          {t('home.seeAll')}
        </button>
      </div>

      {/* 2-col on mobile → 3-col on tablet → 4-col on desktop */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {listings.slice(0, 4).map((listing) => (
          <FriendListingCard key={listing.id} listing={listing} />
        ))}
      </div>
    </div>
  )
}
