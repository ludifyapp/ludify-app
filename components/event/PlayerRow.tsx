import Link from 'next/link'
import Image from 'next/image'
import { Player } from '@/types'
import { Button } from '@/components/ui/Button'
import type { FriendshipStatus } from '@/types'

interface PlayerRowProps {
  player: Player
  canRemove?: boolean
  onRemove?: () => void
  isRemoving?: boolean
  friendshipStatus?: FriendshipStatus
  onAddFriend?: () => void
  onCancelRequest?: () => void
  isFriendActionLoading?: boolean
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
  friendshipStatus,
  onAddFriend,
  onCancelRequest,
  isFriendActionLoading,
}: PlayerRowProps) {
  const isLinked = isFirebaseUid(player.id)

  const avatar = player.photoURL ? (
    <Image
      src={player.photoURL}
      alt={player.name}
      width={32}
      height={32}
      className="rounded-full flex-shrink-0"
    />
  ) : (
    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-semibold flex-shrink-0">
      {player.name.charAt(0).toUpperCase()}
    </div>
  )

  return (
    <div className="flex items-center gap-3 py-3">
      {isLinked ? (
        <Link href={`/profile/${player.id}`} className="hover:opacity-80 transition-opacity">
          {avatar}
        </Link>
      ) : (
        avatar
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900 dark:text-white">{player.name}</span>
          {player.isHost && (
            <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded font-medium">
              Host
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {isLinked && friendshipStatus !== undefined && (
          <>
            {friendshipStatus === 'none' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onAddFriend}
                loading={isFriendActionLoading}
                className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50"
              >
                Add Friend
              </Button>
            )}
            {friendshipStatus === 'pending_sent' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onCancelRequest}
                loading={isFriendActionLoading}
                className="text-gray-400 hover:text-gray-600"
              >
                Requested
              </Button>
            )}
            {friendshipStatus === 'pending_received' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onAddFriend}
                loading={isFriendActionLoading}
                className="text-green-600 hover:text-green-800 hover:bg-green-50"
              >
                Accept
              </Button>
            )}
            {friendshipStatus === 'friends' && (
              <span className="text-xs text-gray-400 px-2">Friends</span>
            )}
          </>
        )}

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
    </div>
  )
}
