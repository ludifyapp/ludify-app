'use client'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useRouter } from 'next/navigation'
import { GameThumbnail } from '@/components/ui/GameThumbnail'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import type { BggGame } from '@/types'

interface HotnessGamesProps {
  games: BggGame[]
}

export function HotnessGames({ games }: HotnessGamesProps) {
  const { t } = useTranslation()
  const router = useRouter()
  const [selectedGame, setSelectedGame] = useState<BggGame | null>(null)

  if (games.length === 0) return null

  const closeModal = () => setSelectedGame(null)

  const goToBgg = () => {
    if (selectedGame) {
      window.open(`https://boardgamegeek.com/boardgame/${selectedGame.bggId}`, '_blank', 'noopener')
      closeModal()
    }
  }

  const searchForEvents = () => {
    if (selectedGame) {
      router.push(`/?tab=events&subTab=explore&q=${encodeURIComponent(selectedGame.name)}`)
      closeModal()
    }
  }

  return (
    <div className="mb-5">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold tracking-tight text-on-surface">{t('home.hotGames')}</h2>
      </div>
      <div className="flex gap-4 -mx-4 px-4 overflow-x-auto scrollbar-hide pb-2">
        {games.slice(0, 20).map((game) => (
          <div
            key={game.bggId}
            className="flex-shrink-0 w-[140px] md:w-[160px] lg:w-[180px] group cursor-pointer"
            onClick={() => setSelectedGame(game)}
          >
            <div className="w-[140px] h-[140px] md:w-[160px] md:h-[160px] lg:w-[180px] lg:h-[180px] rounded-[1.5rem] overflow-hidden bg-surface-container-high mb-2 card-shadow transition-transform group-hover:scale-105 active:scale-95">
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
          </div>
        ))}
      </div>

      <Modal
        isOpen={!!selectedGame}
        title={selectedGame?.name ?? ''}
        onCancel={closeModal}
        cancelLabel={t('common.cancel') || 'Cancel'}
      >
        <div className="flex flex-col gap-3 mt-4">
          <Button
            variant="secondary"
            className="w-full justify-start border border-outline h-12"
            onClick={goToBgg}
          >
            <span className="mr-3 text-lg">🌐</span>
            {t('home.gameAction.goToBgg')}
          </Button>
          <Button
            variant="secondary"
            className="w-full justify-start border border-outline h-12"
            onClick={searchForEvents}
          >
            <span className="mr-3 text-lg">🔍</span>
            {t('home.gameAction.search')}
          </Button>
          <Button
            variant="secondary"
            className="w-full justify-start border border-outline h-12 opacity-50"
            disabled
          >
            <span className="mr-3 text-lg">👥</span>
            {t('home.gameAction.checkFriends')}
          </Button>
        </div>
      </Modal>
    </div>
  )
}
