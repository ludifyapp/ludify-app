import Link from 'next/link'
import Image from 'next/image'
import { useTranslation } from 'react-i18next'
import { Player } from '@/types'

interface PlayerRowProps {
  player: Player
  canRemove?: boolean
  onRemove?: () => void
  isRemoving?: boolean
  isSelf?: boolean
  onLeave?: () => void
  isLeaving?: boolean
}

// Firebase UIDs are alphanumeric without hyphens; guest UUIDs have hyphens
function isFirebaseUid(id: string) {
  return !id.includes('-')
}

export function PlayerRow({
  player,
  canRemove,
  onRemove,
  isRemoving,
  isSelf,
  onLeave,
  isLeaving,
}: PlayerRowProps) {
  const { t } = useTranslation()
  const isLinked = isFirebaseUid(player.id)

  const avatar = player.photoURL ? (
    <Image
      src={player.photoURL}
      alt={player.name}
      width={32}
      height={32}
      className="rounded-full flex-shrink-0 object-cover"
    />
  ) : (
    <div className="w-8 h-8 rounded-full bg-primary-container text-primary flex items-center justify-center text-sm font-semibold flex-shrink-0">
      {player.name.charAt(0).toUpperCase()}
    </div>
  )

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3 min-w-0">
        {isLinked ? (
          <Link href={`/profile/${player.id}`} className="hover:opacity-80 transition-opacity flex-shrink-0">
            {avatar}
          </Link>
        ) : (
          avatar
        )}

        <div className="flex items-center gap-2 min-w-0">
          <span className="font-bold text-on-surface truncate">{player.name}</span>
          {player.isHost && (
            <span className="bg-primary text-surface text-[9px] px-1.5 py-0.5 rounded-full font-extrabold uppercase flex-shrink-0">
              {t('players.host')}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {canRemove && onRemove && (
          <button
            onClick={onRemove}
            disabled={isRemoving}
            className="text-error hover:text-error/80 transition-colors p-1"
            title="Remove from event"
          >
            {isRemoving ? (
              <div className="w-5 h-5 border-2 border-error border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z"/>
              </svg>
            )}
          </button>
        )}

        {isSelf && !player.isHost && onLeave && (
          <button
            onClick={onLeave}
            disabled={isLeaving}
            className="text-error hover:text-error/80 transition-colors p-1"
            title="Leave event"
          >
            {isLeaving ? (
              <div className="w-5 h-5 border-2 border-error border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
