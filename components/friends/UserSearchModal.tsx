'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { auth } from '@/lib/firebase/client'
import type { FriendshipStatus } from '@/types'
import type { UserSearchResult } from '@/app/api/users/search/route'

async function authedFetch(path: string, options: RequestInit = {}) {
  const token = await auth.currentUser?.getIdToken()
  return fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers as Record<string, string>),
    },
  })
}

interface Props {
  isOpen: boolean
  onClose: () => void
  /** Current friendship statuses so we can show the correct button state */
  friendStatuses: Record<string, FriendshipStatus>
  onAddFriend: (toUid: string) => Promise<void>
}

export function UserSearchModal({ isOpen, onClose, friendStatuses, onAddFriend }: Props) {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<UserSearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [localStatuses, setLocalStatuses] = useState<Record<string, FriendshipStatus>>({})
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setResults([])
      setLocalStatuses({})
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (query.trim().length < 2) {
      setResults([])
      setSearching(false)
      return
    }
    setSearching(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await authedFetch(`/api/users/search?q=${encodeURIComponent(query.trim())}`)
        const data = await res.json()
        setResults(data.users ?? [])
      } catch {
        setResults([])
      } finally {
        setSearching(false)
      }
    }, 350)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  const getStatus = useCallback(
    (uid: string): FriendshipStatus =>
      localStatuses[uid] ?? friendStatuses[uid] ?? 'none',
    [localStatuses, friendStatuses]
  )

  const handleAdd = async (uid: string) => {
    setActionLoading(uid)
    try {
      await onAddFriend(uid)
      setLocalStatuses((prev) => ({ ...prev, [uid]: 'pending_sent' }))
    } finally {
      setActionLoading(null)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden flex flex-col max-h-[75vh]">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-gray-100 dark:border-gray-800">
          {/* Search icon */}
          <svg className="w-5 h-5 text-gray-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('friends.searchPlaceholder')}
            className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none"
          />
          {searching && <Spinner className="h-4 w-4 flex-shrink-0" />}
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors flex-shrink-0"
            aria-label={t('common.close')}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Results */}
        <div className="overflow-y-auto">
          {query.trim().length >= 2 && !searching && results.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-10">
              {t('friends.noSearchResults')}
            </p>
          )}
          {results.map((user) => {
            const status = getStatus(user.uid)
            return (
              <div
                key={user.uid}
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <Avatar name={user.displayName} photoURL={user.photoURL} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {user.displayName}
                  </p>
                  {user.bggUsername && (
                    <p className="text-xs text-gray-400 truncate">BGG: {user.bggUsername}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link
                    href={`/profile/${user.uid}`}
                    onClick={onClose}
                    className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    {t('friends.viewProfile')}
                  </Link>
                  {status === 'none' && (
                    <Button
                      size="sm"
                      loading={actionLoading === user.uid}
                      onClick={() => handleAdd(user.uid)}
                    >
                      {t('friends.addFriendBtn')}
                    </Button>
                  )}
                  {status === 'pending_sent' && (
                    <span className="text-xs font-medium text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-lg">
                      {t('friends.requested')}
                    </span>
                  )}
                  {status === 'pending_received' && (
                    <span className="text-xs font-medium text-amber-600 bg-amber-50 dark:bg-amber-900/30 px-2 py-1 rounded-lg">
                      {t('friends.wantsToAdd')}
                    </span>
                  )}
                  {status === 'friends' && (
                    <span className="text-xs font-medium text-green-600 bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded-lg">
                      {t('friends.alreadyFriends')}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
          {query.trim().length < 2 && (
            <p className="text-sm text-gray-400 text-center py-10">
              {t('friends.searchHint')}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
