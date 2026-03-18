import { Player } from '@/types'
import { Button } from '@/components/ui/Button'

interface PlayerRowProps {
  player: Player
  position: number
  canRemove?: boolean
  onRemove?: () => void
  isRemoving?: boolean
}

export function PlayerRow({ player, position, canRemove, onRemove, isRemoving }: PlayerRowProps) {
  return (
    <div className="flex items-center gap-3 py-3">
      <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-semibold flex-shrink-0">
        {position}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900">{player.name}</span>
          {player.isHost && (
            <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium">
              Host
            </span>
          )}
        </div>
      </div>
      {canRemove && onRemove && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          loading={isRemoving}
          className="text-red-500 hover:text-red-700 hover:bg-red-50"
        >
          Remove
        </Button>
      )}
    </div>
  )
}
