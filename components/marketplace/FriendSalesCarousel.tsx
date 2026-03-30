'use client'
import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { Analytics } from '@/lib/analytics'
import type { Listing } from '@/types'

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
      className="bg-surface-container-high rounded-[1.5rem] p-3 flex flex-col gap-3 card-shadow hover:bg-surface-container-highest transition-colors group"
    >
      {/* Art — inset with all-corner radius */}
      <div className="w-full aspect-square rounded-[1.5rem] overflow-hidden bg-surface-container-highest">
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
      </div>

      <div className="flex flex-col gap-1.5">
        {/* Price row: price left, seller avatar right */}
        <div className="flex justify-between items-center">
          <span className="text-lg font-bold text-primary font-sans">
            {formatPrice(listing.price)}
          </span>
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
        </div>

        {/* Seller name */}
        <p className="text-xs text-on-surface-variant font-meta font-medium leading-none">
          Seller: {listing.sellerName.split(' ')[0]}
        </p>

        {/* Buy button — pill, Hot Pink, glow shadow */}
        <button
          className="w-full bg-secondary text-on-secondary font-bold py-2 rounded-full text-sm active:scale-95 transition-transform shadow-[0_4px_12px_rgba(255,111,126,0.3)] hover:opacity-90 mt-1"
          onClick={(e) => { e.preventDefault(); window.location.href = `/marketplace/listing/${listing.id}` }}
        >
          Buy
        </button>
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

      {/* 2-column grid — matches Stitch layout exactly */}
      <div className="grid grid-cols-2 gap-4">
        {listings.slice(0, 6).map((listing) => (
          <FriendListingCard key={listing.id} listing={listing} />
        ))}
      </div>
    </div>
  )
}
