'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { GameThumbnail } from '@/components/ui/GameThumbnail'
import type { TrendingGame } from '@/types'

interface TrendingGamesProps {
  games: TrendingGame[]
}

export function TrendingGames({ games }: TrendingGamesProps) {
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
    scrollRef.current?.scrollBy({ left: dir === 'left' ? -200 : 200, behavior: 'smooth' })
  }

  if (games.length === 0) return null

  return (
    <div className="mb-5">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold tracking-tight text-on-surface">Trending Games</h2>
      </div>
      <div className="relative -mx-4">
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-1 top-[70px] md:top-[80px] lg:top-[90px] -translate-y-1/2 z-10 w-7 h-7 flex items-center justify-center rounded-full bg-surface-container-highest text-on-surface-variant hover:bg-surface-container-high transition-colors"
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
            className="absolute right-1 top-[70px] md:top-[80px] lg:top-[90px] -translate-y-1/2 z-10 w-7 h-7 flex items-center justify-center rounded-full bg-surface-container-highest text-on-surface-variant hover:bg-surface-container-high transition-colors"
            aria-label="Scroll right"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        )}

        <div ref={scrollRef} className="overflow-x-auto scrollbar-hide px-4">
          <div className="flex gap-4 w-max">
            {games.map((game) => (
              <div key={game.bggId} className="flex-shrink-0 w-[140px] md:w-[160px] lg:w-[180px] group cursor-pointer">
                <div className="w-[140px] h-[140px] md:w-[160px] md:h-[160px] lg:w-[180px] lg:h-[180px] rounded-[1.5rem] overflow-hidden bg-surface-container-high mb-2 card-shadow transition-transform group-hover:scale-105">
                  <GameThumbnail
                    src={game.thumbnail}
                    name={game.name}
                    width={180}
                    height={180}
                    imgClassName="w-full h-full object-cover"
                    placeholderClassName="w-full h-full flex items-center justify-center text-3xl font-bold text-primary"
                  />
                </div>
                <p className="font-bold text-sm truncate text-on-surface">
                  {game.name}
                </p>
                <p className="font-meta text-[10px] text-on-surface-variant">
                  {game.playCount.toLocaleString()} plays this week
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
