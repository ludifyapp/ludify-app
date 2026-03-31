'use client'
import { useTranslation } from 'react-i18next'
import { GameThumbnail } from '@/components/ui/GameThumbnail'
import type { TrendingGame } from '@/types'

interface TrendingGamesProps {
  games: TrendingGame[]
}

export function TrendingGames({ games }: TrendingGamesProps) {
  const { t } = useTranslation()
  if (games.length === 0) return null

  return (
    <div className="mb-5">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold tracking-tight text-on-surface">{t('home.trendingGames')}</h2>
      </div>
      <div className="flex gap-4 -mx-4 px-4 overflow-x-auto scrollbar-hide pb-2">
        {games.slice(0, 8).map((game) => (
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
              {t('home.playsThisWeek', { count: game.playCount.toLocaleString() })}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
