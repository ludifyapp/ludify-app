'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import { useTranslation } from 'react-i18next'
import { Spinner } from '@/components/ui/Spinner'
import { Analytics } from '@/lib/analytics'

interface GameRecommendation {
  bggId: string
  name: string
  thumbnail: string
  ownedBy: string[]
}

function GameRecCard({ game }: { game: GameRecommendation }) {
  const [imgError, setImgError] = useState(false)
  const isPopular = game.ownedBy.length >= 2
  const ownerLabel = game.ownedBy.length === 1
    ? `by ${game.ownedBy[0].split(' ')[0]}`
    : game.ownedBy.length === 2
    ? `by ${game.ownedBy[0].split(' ')[0]} & ${game.ownedBy[1].split(' ')[0]}`
    : `by ${game.ownedBy[0].split(' ')[0]} & ${game.ownedBy.length - 1} more`

  return (
    <div className="flex-shrink-0 w-[120px] bg-surface-container-high rounded-2xl p-2.5 flex flex-col gap-2">
      <div className="relative w-full h-20 bg-surface-container-highest rounded-xl overflow-hidden">
        {game.thumbnail && !imgError ? (
          <Image
            src={game.thumbnail}
            alt={game.name}
            width={120}
            height={80}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-2xl font-extrabold text-primary/30">
              {game.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>
      <div>
        <p className="text-xs font-bold text-on-surface leading-tight line-clamp-2">{game.name}</p>
        <p className="text-[10px] text-on-surface-variant mt-0.5">{ownerLabel}</p>
      </div>
      {isPopular && (
        <div className="mt-auto">
          <span className="bg-tertiary/10 text-tertiary text-[9px] font-bold px-1.5 py-0.5 rounded-md">Popular</span>
        </div>
      )}
    </div>
  )
}

export function GameRecommendations({ tableId }: { tableId: string }) {
  const { t } = useTranslation()
  const [recs, setRecs] = useState<GameRecommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [noCollections, setNoCollections] = useState(false)
  const [showLeft, setShowLeft] = useState(false)
  const [showRight, setShowRight] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch(`/api/tables/${tableId}/recommendations`)
      .then((r) => r.json())
      .then((d) => {
        const data: GameRecommendation[] = d.recommendations ?? []
        setRecs(data)
        setNoCollections(data.length === 0)
        if (data.length > 0) Analytics.gameRecsOpened({ table_id: tableId, rec_count: data.length })
      })
      .catch(() => setNoCollections(true))
      .finally(() => setLoading(false))
  }, [tableId])

  const updateArrows = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setShowLeft(el.scrollLeft > 4)
    setShowRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4)
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    updateArrows()
    el.addEventListener('scroll', updateArrows, { passive: true })
    const ro = new ResizeObserver(updateArrows)
    ro.observe(el)
    return () => {
      el.removeEventListener('scroll', updateArrows)
      ro.disconnect()
    }
  }, [recs, updateArrows])

  const scroll = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'left' ? -320 : 320, behavior: 'smooth' })
  }

  return (
    <div className="bg-surface-container rounded-3xl p-5 shadow-lg">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <svg className="w-4 h-4 text-on-surface-variant flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z"/>
        </svg>
        <h3 className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">
          {t('gameRec.title')} · {t('gameRec.subtitle')}
        </h3>
      </div>

      {/* Carousel */}
      {loading ? (
        <div className="flex justify-center py-6">
          <Spinner className="h-5 w-5" />
        </div>
      ) : noCollections ? (
        <div className="py-2 text-center">
          <p className="text-sm text-on-surface-variant">{t('gameRec.noCollections')}</p>
          <p className="text-xs text-on-surface-variant/60 mt-1">{t('gameRec.collectionHint')}</p>
        </div>
      ) : (
        <div ref={scrollRef} className="overflow-x-auto no-scrollbar pb-1" style={{ scrollbarWidth: 'none' }}>
          <div className="flex gap-3 w-max">
            {recs.map((game) => (
              <GameRecCard key={game.bggId} game={game} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
