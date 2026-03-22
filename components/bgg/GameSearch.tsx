'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import Image from 'next/image'
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
      <label className="text-sm font-medium text-gray-700">Board Game</label>

      {value ? (
        <div className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg bg-gray-50">
          <GameThumbnail
            src={value.thumbnail}
            name={value.name}
            width={40}
            height={40}
            imgClassName="rounded object-cover flex-shrink-0"
            placeholderClassName="w-10 h-10 rounded bg-gray-200 flex items-center justify-center flex-shrink-0 text-lg"
          />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 truncate">{value.name}</p>
            {value.yearPublished && <p className="text-xs text-gray-500">{value.yearPublished}</p>}
          </div>
          <button
            type="button"
            onClick={() => onSelect(null as any)}
            className="text-gray-400 hover:text-gray-600 text-sm underline flex-shrink-0"
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
            className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
              error ? 'border-red-400 bg-red-50' : 'border-gray-300'
            }`}
          />
          {isLoading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Spinner className="h-4 w-4" />
            </div>
          )}
          {isOpen && results.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden max-h-64 overflow-y-auto">
              {results.map((game, index) => (
                <button
                  key={game.bggId}
                  type="button"
                  onClick={() => handleSelect(game)}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-indigo-50 transition-colors ${
                    index === highlightedIndex ? 'bg-indigo-50' : ''
                  }`}
                >
                  <div className="w-9 h-9 rounded bg-gray-200 flex-shrink-0 flex items-center justify-center">
                    <span className="text-gray-400 text-xs">🎲</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{game.name}</p>
                    {game.yearPublished && (
                      <p className="text-xs text-gray-500">{game.yearPublished}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
