'use client'
import { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore'
import { db as clientDb } from '@/lib/firebase/client'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/contexts/AuthContext'
import { Spinner } from '@/components/ui/Spinner'
import type { Conversation, DirectMessage } from '@/types'

const CONV_PAGE_SIZE = 50
const MSGS_PER_CONV = 50

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return 'now'
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(diff / 3_600_000)
  if (hours < 24) return `${hours}h`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function MessagesPage() {
  const { t } = useTranslation()
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  // Conversation list (paginated)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [visibleCount, setVisibleCount] = useState(CONV_PAGE_SIZE)

  // Local message cache: convId -> DirectMessage[]
  const [messageCache, setMessageCache] = useState<Record<string, DirectMessage[]>>({})
  const [syncedConvIds, setSyncedConvIds] = useState<Set<string>>(new Set())
  const msgUnsubs = useRef<Record<string, () => void>>({})

  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')

  // Infinite scroll
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!authLoading && !user) router.replace('/')
  }, [user, authLoading, router])

  // Debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Listen to ALL conversations (no limit — Firestore handles caching)
  useEffect(() => {
    if (!user) return
    const q = query(
      collection(clientDb, 'conversations'),
      where('participants', 'array-contains', user.uid),
      orderBy('lastMessageAt', 'desc')
    )
    const unsub = onSnapshot(q, (snap) => {
      setConversations(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Conversation))
      setLoading(false)
    }, () => setLoading(false))
    return unsub
  }, [user])

  // Sync messages for conversations in the visible window
  useEffect(() => {
    if (!user || conversations.length === 0) return

    const visibleConvs = conversations.slice(0, visibleCount)
    const newIds = visibleConvs.map((c) => c.id).filter((id) => !msgUnsubs.current[id])

    for (const convId of newIds) {
      const q = query(
        collection(clientDb, 'conversations', convId, 'messages'),
        orderBy('createdAt', 'desc'),
        limit(MSGS_PER_CONV)
      )
      msgUnsubs.current[convId] = onSnapshot(q, (snap) => {
        const msgs = snap.docs.map((d) => {
          const data = d.data()
          return {
            id: d.id,
            uid: data.uid,
            text: data.text ?? '',
            type: data.type ?? 'text',
            listing: data.listing ?? undefined,
            reactions: data.reactions ?? undefined,
            createdAt: data.createdAt?.toDate?.()?.toISOString() ?? '',
          } as DirectMessage
        })
        setMessageCache((prev) => ({ ...prev, [convId]: msgs }))
        setSyncedConvIds((prev) => new Set(prev).add(convId))
      })
    }

    // Cleanup: unsubscribe listeners for conversations no longer visible
    // (only if they were beyond the visible window AND are not in the current set)
    // We keep all listeners active to avoid re-fetching — lightweight since
    // Firestore uses local cache after first fetch.
  }, [user, conversations, visibleCount])

  // Cleanup all message listeners on unmount
  useEffect(() => {
    return () => {
      Object.values(msgUnsubs.current).forEach((unsub) => unsub())
      msgUnsubs.current = {}
    }
  }, [])

  // Infinite scroll observer
  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && visibleCount < conversations.length) {
          setVisibleCount((prev) => Math.min(prev + CONV_PAGE_SIZE, conversations.length))
        }
      },
      { rootMargin: '200px' }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [visibleCount, conversations.length])

  // Deep search: match against participant names, last message, listing name, AND all cached messages
  const searchResults = useMemo(() => {
    const q = debouncedQuery.toLowerCase().trim()
    if (!q) return null

    const results: { conv: Conversation; matchSnippet?: string; matchMsgId?: string; matchSource: 'name' | 'lastMsg' | 'listing' | 'deepMsg' }[] = []

    for (const conv of conversations) {
      const otherUid = conv.participants.find((p) => p !== user?.uid) ?? ''
      const otherName = (conv.participantNames?.[otherUid] ?? '').toLowerCase()
      const lastMsg = (conv.lastMessage ?? '').toLowerCase()
      const listing = (conv.listingName ?? '').toLowerCase()

      // Check name match
      if (otherName.includes(q)) {
        results.push({ conv, matchSource: 'name' })
        continue
      }

      // Check last message match
      if (lastMsg.includes(q)) {
        results.push({ conv, matchSource: 'lastMsg' })
        continue
      }

      // Check listing name match
      if (listing.includes(q)) {
        results.push({ conv, matchSnippet: conv.listingName ?? undefined, matchSource: 'listing' })
        continue
      }

      // Deep search: check all cached messages for this conversation
      const cachedMsgs = messageCache[conv.id]
      if (cachedMsgs) {
        const match = cachedMsgs.find((m) => m.text.toLowerCase().includes(q))
        if (match) {
          results.push({ conv, matchSnippet: match.text, matchMsgId: match.id, matchSource: 'deepMsg' })
        }
      }
    }

    return results
  }, [conversations, debouncedQuery, user?.uid, messageCache])

  // Highlight matching substring in text
  const highlightMatch = useCallback((text: string, q: string) => {
    if (!q.trim()) return text
    const idx = text.toLowerCase().indexOf(q.toLowerCase())
    if (idx === -1) return text
    const before = text.slice(0, idx)
    const match = text.slice(idx, idx + q.length)
    const after = text.slice(idx + q.length)
    return (
      <>{before}<mark className="bg-yellow-200 dark:bg-yellow-700/50 text-inherit rounded-sm px-0.5">{match}</mark>{after}</>
    )
  }, [])

  if (authLoading || (!user && loading)) {
    return <div className="min-h-screen flex items-center justify-center"><Spinner className="h-8 w-8" /></div>
  }

  const isSearching = debouncedQuery.trim().length > 0
  const displayConversations = isSearching
    ? (searchResults ?? []).map((r) => r.conv)
    : conversations.slice(0, visibleCount)
  const deepSnippets = isSearching
    ? Object.fromEntries((searchResults ?? []).filter((r) => r.matchSnippet).map((r) => [r.conv.id, r.matchSnippet!]))
    : {}
  const deepMatchMsgIds = isSearching
    ? Object.fromEntries((searchResults ?? []).filter((r) => r.matchMsgId).map((r) => [r.conv.id, r.matchMsgId!]))
    : {}

  const syncProgress = conversations.length > 0
    ? Math.round((syncedConvIds.size / Math.min(visibleCount, conversations.length)) * 100)
    : 100

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-zinc-950 px-4 py-10">
      <div className="max-w-lg mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-zinc-200 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 px-3.5 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800 shadow-sm transition-colors">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            {t('messages.home')}
          </Link>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white">{t('messages.title')}</h1>
          <div className="w-20" />
        </div>

        {/* Search bar */}
        {conversations.length > 0 && (
          <div className="space-y-1.5">
            <div className="relative">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-500 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('messages.searchPlaceholder')}
                className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl pl-10 pr-9 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                  aria-label="Clear search"
                >
                  <svg className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6 6 18M6 6l12 12"/>
                  </svg>
                </button>
              )}
            </div>
            {/* Sync progress indicator */}
            {syncProgress < 100 && (
              <div className="flex items-center gap-2 px-1">
                <div className="flex-1 h-1 bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-teal-500 rounded-full transition-all duration-500" style={{ width: `${syncProgress}%` }} />
                </div>
                <span className="text-[10px] text-slate-400 dark:text-zinc-500 flex-shrink-0">{t('messages.syncing')}</span>
              </div>
            )}
          </div>
        )}

        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800 overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-12"><Spinner className="h-6 w-6" /></div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-16 px-6">
              <div className="text-4xl mb-3">💬</div>
              <p className="font-semibold text-slate-900 dark:text-white">{t('messages.noMessages')}</p>
              <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
                {t('messages.noMessagesDesc')}
              </p>
              <Link href="/" className="inline-block mt-4 px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-xl hover:bg-teal-700 transition-colors">
                {t('messages.browseMarketplace')}
              </Link>
            </div>
          ) : displayConversations.length === 0 ? (
            <div className="text-center py-16 px-6">
              <div className="text-4xl mb-3">🔍</div>
              <p className="font-semibold text-slate-900 dark:text-white">{t('messages.noResults')}</p>
              <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
                {t('messages.noResultsDesc')}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-zinc-800">
              {displayConversations.map((conv) => {
                const otherUid = conv.participants.find((p) => p !== user!.uid) ?? ''
                const otherName = conv.participantNames?.[otherUid] ?? 'User'
                const otherPhoto = conv.participantPhotos?.[otherUid] ?? ''
                const unreadCount = conv.unread?.[user!.uid] ?? 0
                const deepSnippet = deepSnippets[conv.id]
                const matchMsgId = deepMatchMsgIds[conv.id]
                const href = matchMsgId ? `/messages/${conv.id}?msg=${matchMsgId}` : `/messages/${conv.id}`

                return (
                  <li key={conv.id}>
                    <Link href={href} className="flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors">
                      <div className="relative flex-shrink-0">
                        {otherPhoto ? (
                          <Image src={otherPhoto} alt={otherName} width={44} height={44} className="rounded-full" />
                        ) : (
                          <div className="w-11 h-11 rounded-full bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center text-sm font-semibold text-teal-700 dark:text-teal-300">
                            {otherName[0]}
                          </div>
                        )}
                        {unreadCount > 0 && (
                          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-teal-500 rounded-full border-2 border-white dark:border-zinc-900 text-[10px] text-white font-bold flex items-center justify-center">
                            {unreadCount > 9 ? '9+' : unreadCount}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className={`text-sm font-semibold truncate ${unreadCount > 0 ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-zinc-200'}`}>
                            {debouncedQuery ? highlightMatch(otherName, debouncedQuery) : otherName}
                          </p>
                          <span className="text-xs text-slate-400 dark:text-zinc-500 flex-shrink-0">
                            {timeAgo(conv.lastMessageAt)}
                          </span>
                        </div>
                        {conv.listingName && !conv.lastMessage && !deepSnippet && (
                          <p className="text-xs text-teal-600 dark:text-teal-400 truncate">re: {conv.listingName}</p>
                        )}
                        {/* Deep match snippet takes priority when searching */}
                        {deepSnippet && debouncedQuery ? (
                          <p className="text-xs truncate mt-0.5 text-teal-600 dark:text-teal-400 italic">
                            {highlightMatch(deepSnippet, debouncedQuery)}
                          </p>
                        ) : conv.lastMessage ? (
                          <p className={`text-xs truncate mt-0.5 ${unreadCount > 0 ? 'font-medium text-slate-700 dark:text-zinc-200' : 'text-slate-400 dark:text-zinc-500'}`}>
                            {conv.lastSenderUid === user!.uid ? 'You: ' : ''}{debouncedQuery ? highlightMatch(conv.lastMessage, debouncedQuery) : conv.lastMessage}
                          </p>
                        ) : null}
                      </div>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* Infinite scroll sentinel */}
        {!isSearching && visibleCount < conversations.length && (
          <div ref={sentinelRef} className="flex justify-center py-4">
            <Spinner className="h-5 w-5" />
          </div>
        )}
      </div>
    </main>
  )
}
