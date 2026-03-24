'use client'
import { useState, useEffect } from 'react'
import { GameThumbnail } from '@/components/ui/GameThumbnail'
import { useTranslation } from 'react-i18next'
import { Spinner } from '@/components/ui/Spinner'
import { Analytics } from '@/lib/analytics'

interface GameRecommendation {
  bggId: string
  name: string
  thumbnail: string
  ownedBy: string[]
}

export function GameRecommendations({ eventId }: { eventId: string }) {
  const { t } = useTranslation()
  const [recs, setRecs] = useState<GameRecommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [noCollections, setNoCollections] = useState(false)

  useEffect(() => {
    fetch(`/api/events/${eventId}/recommendations`)
      .then((r) => r.json())
      .then((d) => {
        const data: GameRecommendation[] = d.recommendations ?? []
        setRecs(data)
        setNoCollections(data.length === 0)
      })
      .catch(() => setNoCollections(true))
      .finally(() => setLoading(false))
  }, [eventId])

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800 overflow-hidden">
      <button
        onClick={() => { const next = !open; setOpen(next); if (next) Analytics.gameRecsOpened({ event_id: eventId, rec_count: recs.length }) }}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">🎲</span>
          <span className="font-semibold text-slate-900 dark:text-white text-sm">{t('gameRec.title')}</span>
          {!loading && recs.length > 0 && (
            <span className="text-xs text-slate-400 dark:text-zinc-500">{t('gameRec.suggestion', { count: recs.length })}</span>
          )}
        </div>
        <svg
          className={`w-4 h-4 text-slate-400 dark:text-zinc-500 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="px-6 pb-5 border-t border-slate-100 dark:border-zinc-800">
          {loading ? (
            <div className="flex justify-center py-6"><Spinner className="h-5 w-5" /></div>
          ) : noCollections ? (
            <div className="py-5 text-center">
              <p className="text-sm text-slate-500 dark:text-zinc-400">
                {t('gameRec.noCollections')}
              </p>
              <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">
                {t('gameRec.collectionHint')}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-zinc-800 mt-1">
              {recs.map((game, i) => (
                <li key={game.bggId} className="flex items-center gap-3 py-3">
                  <span className="text-xs font-bold text-slate-300 dark:text-zinc-600 w-4 text-center flex-shrink-0">
                    {i + 1}
                  </span>
                  <GameThumbnail
                    src={game.thumbnail}
                    name={game.name}
                    width={36}
                    height={36}
                    imgClassName="rounded-lg object-contain bg-slate-50 dark:bg-zinc-800 p-0.5 flex-shrink-0"
                    placeholderClassName="w-9 h-9 rounded-lg bg-slate-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0 text-sm"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{game.name}</p>
                    <p className="text-xs text-slate-400 dark:text-zinc-500 truncate">
                      {game.ownedBy.length > 1
                        ? t('gameRec.ownedBy', { names: `${game.ownedBy.slice(0, 2).join(' & ')}${game.ownedBy.length > 2 ? ` +${game.ownedBy.length - 2}` : ''}` })
                        : t('gameRec.ownedBy', { names: game.ownedBy[0] })}
                    </p>
                  </div>
                  {game.ownedBy.length > 1 && (
                    <span className="flex-shrink-0 text-xs font-semibold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/20 px-2 py-0.5 rounded-full">
                      {t('gameRec.ownCount', { count: game.ownedBy.length })}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
