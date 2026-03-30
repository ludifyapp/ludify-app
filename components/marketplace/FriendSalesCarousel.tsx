'use client'
import { useRef, useCallback, useEffect, useState } from 'react'
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
      className="flex flex-col bg-surface-container-high rounded-[1.5rem] overflow-hidden hover:bg-surface-container-highest transition-colors group"
    >
      {/* Art — square, object-cover */}
      <div className="aspect-square w-full bg-surface-container-highest rounded-t-[1.5rem] overflow-hidden">
        {listing.boardGame.thumbnail && !imgError ? (
          <Image
            src={listing.boardGame.thumbnail}
            alt={listing.boardGame.name}
            width={192}
            height={192}
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

      <div className="p-3 flex flex-col gap-2">
        {/* Title */}
        <p className="text-sm font-semibold text-on-surface leading-tight line-clamp-2">
          {listing.boardGame.name}
        </p>

        {/* Price */}
        <p className="text-base font-bold text-primary leading-none">
          {formatPrice(listing.price)}
        </p>

        {/* Seller row */}
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
          <span className="text-[10px] text-on-surface-variant font-meta truncate">{listing.sellerName}</span>
        </div>

        {/* Buy button */}
        <button
          className="w-full mt-1 py-1.5 rounded-[0.75rem] bg-secondary text-on-secondary text-xs font-bold tracking-wide hover:opacity-90 active:scale-95 transition-all"
          onClick={(e) => { e.preventDefault(); /* navigate to listing */ window.location.href = `/marketplace/listing/${listing.id}` }}
        >
          Buy
        </button>
      </div>
    </Link>
  )
}

export function FriendSalesCarousel({ listings, onSeeAll }: FriendSalesCarouselProps) {
  const { t } = useTranslation()
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const updateArrows = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 4)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    updateArrows()
    el.addEventListener('scroll', updateArrows, { passive: true })
    const ro = new ResizeObserver(updateArrows)
    ro.observe(el)
    return () => { el.removeEventListener('scroll', updateArrows); ro.disconnect() }
  }, [updateArrows])

  const scroll = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'left' ? -300 : 300, behavior: 'smooth' })
  }

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

      <div className="relative -mx-4">
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-1 top-1/2 -translate-y-1/2 z-10 w-7 h-7 flex items-center justify-center rounded-full bg-surface-container-highest text-on-surface-variant hover:bg-surface-container-high transition-colors"
            aria-label="Scroll left"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        )}

        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-1 top-1/2 -translate-y-1/2 z-10 w-7 h-7 flex items-center justify-center rounded-full bg-surface-container-highest text-on-surface-variant hover:bg-surface-container-high transition-colors"
            aria-label="Scroll right"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        )}

        <div ref={scrollRef} className="overflow-x-auto scrollbar-hide px-4">
          <div className="flex gap-4 w-max py-1">
            {listings.slice(0, 10).map((listing) => (
              <div key={listing.id} className="w-48 flex-shrink-0">
                <FriendListingCard listing={listing} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
