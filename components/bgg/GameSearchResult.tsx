import Image from 'next/image'
import { BggGame } from '@/types'

interface GameSearchResultProps {
  game: BggGame
  isHighlighted: boolean
  onSelect: () => void
}

export function GameSearchResult({ game, isHighlighted, onSelect }: GameSearchResultProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-indigo-50 transition-colors ${
        isHighlighted ? 'bg-indigo-50' : ''
      }`}
    >
      {game.thumbnail ? (
        <Image
          src={game.thumbnail}
          alt={game.name}
          width={36}
          height={36}
          className="rounded object-cover flex-shrink-0"
        />
      ) : (
        <div className="w-9 h-9 rounded bg-gray-200 flex-shrink-0 flex items-center justify-center">
          <span className="text-gray-400 text-xs">🎲</span>
        </div>
      )}
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{game.name}</p>
        {game.yearPublished && (
          <p className="text-xs text-gray-500">{game.yearPublished}</p>
        )}
      </div>
    </button>
  )
}
