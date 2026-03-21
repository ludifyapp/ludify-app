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
  friendshipStatus,
  onAddFriend,
  onCancelRequest,
  isFriendActionLoading,
  isSelf,
  onLeave,
  isLeaving,
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
          <button
            onClick={onRemove}
            disabled={isRemoving}
            className="p-1.5 text-red-500 hover:text-red-700 transition-colors"
            title="Remove Player"
          >
            {isRemoving ? (
              <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6" />
              </svg>
            )}
          </button>
        )}

        {isSelf && !player.isHost && onLeave && (
          <button
            onClick={onLeave}
            disabled={isLeaving}
            className="p-1.5 text-red-500 hover:text-red-700 transition-colors"
          >
            {isLeaving ? (
              <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
