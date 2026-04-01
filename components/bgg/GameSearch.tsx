'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { GameThumbnail } from '@/components/ui/GameThumbnail'
import { BggGame } from '@/types'
import { useBggSearch } from '@/hooks/useBggSearch'
import { Spinner } from '@/components/ui/Spinner'

interface GameSearchProps {
  value: BggGame | null
  onSelect: (game: BggGame) => void
  error?: string
}

export function GameSearch({ value, onSelect, error }: GameSearchProps) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const { results, isLoading } = useBggSearch(query)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = useCallback(
    async (game: BggGame) => {
      setIsOpen(false)
      setQuery('')
      // Fetch thumbnail
      try {
        const res = await fetch(`/api/bgg/thing?id=${game.bggId}`)
        const data = await res.json()
        onSelect(data.game ?? game)
      } catch {
        onSelect(game)
      }
    },
    [onSelect]
  )

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightedIndex((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightedIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && highlightedIndex >= 0) {
      e.preventDefault()
      handleSelect(results[highlightedIndex])
    } else if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  return (
    <div className="flex flex-col gap-1" ref={containerRef}>
      <label className="text-sm font-semibold text-on-surface-variant">Board Game</label>

      {value ? (
        <div className="flex items-center gap-3 px-3.5 py-3 ghost-border rounded-[0.75rem] bg-surface-container-high">
          <GameThumbnail
            src={value.thumbnail}
            name={value.name}
            width={40}
            height={40}
            imgClassName="rounded object-cover flex-shrink-0"
            placeholderClassName="w-10 h-10 rounded bg-surface-container-highest flex items-center justify-center flex-shrink-0 text-lg font-bold text-teal-600"
          />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-on-surface truncate">{value.name}</p>
            {value.yearPublished && <p className="text-xs text-on-surface-variant/60">{value.yearPublished}</p>}
          </div>
          <button
            type="button"
            onClick={() => onSelect(null as any)}
            className="text-primary text-sm font-medium flex-shrink-0"
          >
            Change
          </button>
        </div>
      ) : (
        <div className="relative">
          <input
            type="text"
            placeholder="Search for a board game..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setIsOpen(true)
              setHighlightedIndex(-1)
            }}
            onFocus={() => query.length >= 2 && setIsOpen(true)}
            onKeyDown={handleKeyDown}
            className={`w-full px-3.5 py-2.5 ghost-border rounded-[0.75rem] text-sm bg-surface-container-high text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary ${
              error ? 'ring-2 ring-error' : ''
            }`}
          />
          {isLoading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Spinner className="h-4 w-4" />
            </div>
          )}
          {isOpen && results.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-surface-container-highest rounded-[1rem] shadow-xl overflow-hidden max-h-64 overflow-y-auto">
              {results.map((game, index) => (
                <button
                  key={game.bggId}
                  type="button"
                  onClick={() => handleSelect(game)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-left transition-colors ${
                    index === highlightedIndex ? 'bg-surface-container-high' : 'hover:bg-surface-container-high'
                  }`}
                >
                  <GameThumbnail
                    src={game.thumbnail}
                    name={game.name}
                    width={36}
                    height={36}
                    imgClassName="w-9 h-9 rounded-[0.5rem] object-cover flex-shrink-0"
                    placeholderClassName="w-9 h-9 rounded-[0.5rem] bg-surface-container flex-shrink-0 flex items-center justify-center text-sm font-bold text-on-surface-variant/60"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-on-surface truncate">{game.name}</p>
                    {game.yearPublished && (
                      <p className="text-xs text-on-surface-variant/50">{game.yearPublished}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      {error && <p className="text-sm text-error">{error}</p>}
    </div>
  )
}
