'use client'
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { UpcomingEventCard } from '@/components/event/UpcomingEventCard'
import { ListingCard } from '@/components/marketplace/ListingCard'
import { FriendSalesCarousel } from '@/components/marketplace/FriendSalesCarousel'
import { HomeHeader } from '@/components/layout/HomeHeader'
import { CreateEventCTA } from '@/components/layout/CreateEventCTA'
import { Spinner } from '@/components/ui/Spinner'
import { auth } from '@/lib/firebase/client'
import { getEffectiveStatus } from '@/lib/utils'
import { Analytics } from '@/lib/analytics'
import { OnboardingModal } from '@/components/layout/OnboardingModal'
import { NearbyPlayers } from '@/components/players/NearbyPlayers'
import { HotnessGames } from '@/components/game/HotnessGames'
import { AppFooter } from '@/components/layout/AppFooter'
import { useUnreadMessages } from '@/hooks/useUnreadMessages'
import { useTranslation } from 'react-i18next'
import { useFeatureFlags } from '@/contexts/FeatureFlagsContext'
import { FriendStoryOverlay } from '@/components/layout/FriendStoryOverlay'
import type { GameEvent, Listing, ListingCondition, BggGame, FriendDisplayItem, Recap } from '@/types'

type Tab = 'friends' | 'events' | 'marketplace'
type EventSubTab = 'explore' | 'joined' | 'mine'
type DateFilter = '' | 'today' | 'weekend' | 'week'
type MineFilter = 'all' | 'next' | 'waiting' | 'past'
type WaitingSort = 'start_asc' | 'start_desc' | 'created_asc' | 'created_desc'


function TabIcon({ id, active }: { id: Tab; active: boolean }) {
  const cls = `w-[18px] h-[18px] flex-shrink-0 transition-colors ${active ? 'fill-on-surface' : 'fill-on-surface-variant'}`
  if (id === 'friends') return (
    <svg className={cls} viewBox="0 0 24 24">
      <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
    </svg>
  )
  if (id === 'events') return (
    <svg className={cls} viewBox="0 0 24 24">
      <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z" />
    </svg>
  )
  if (id === 'marketplace') return (
    <svg className={cls} viewBox="0 0 24 24">
      <path d="M4 4h16v2H4zm0 4h16l-1 10H5L4 8zm5 3v4h6v-4h-6z" />
    </svg>
  )
  return (
    <svg className={cls} viewBox="0 0 24 24">
      <path d="M3 3h8v8H3zm0 10h8v8H3zM13 3h8v8h-8zm0 10h8v8h-8z" />
    </svg>
  )
}

const TABS: { id: Tab; authOnly: boolean }[] = [
  { id: 'friends',     authOnly: true },
  { id: 'events',      authOnly: false },
  { id: 'marketplace', authOnly: false },
]

const TAB_LABEL_KEYS: Record<Tab, string> = {
  friends:     'nav.forYou',
  events:      'nav.events',
  marketplace: 'nav.marketplace',
}

async function fetchPublicEvents(cursor?: string): Promise<{ events: GameEvent[], nextCursor: string | null }> {
  try {
    const url = cursor ? `/api/events?cursor=${encodeURIComponent(cursor)}` : '/api/events'
    const res = await fetch(url)
    if (!res.ok) return { events: [], nextCursor: null }
    const data = await res.json()
    return { events: data.events ?? [], nextCursor: data.nextCursor ?? null }
  } catch {
    return { events: [], nextCursor: null }
  }
}

async function fetchFriendUids(myUid: string): Promise<Set<string>> {
  try {
    const token = await auth.currentUser?.getIdToken()
    const res = await fetch('/api/friends', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    const data = await res.json()
    const friendships: any[] = data.friendships ?? []
    const uids = new Set<string>()
    for (const f of friendships) {
      if (f.status === 'accepted') {
        uids.add(f.fromUid === myUid ? f.toUid : f.fromUid)
      }
    }
    return uids
  } catch {
    return new Set()
  }
}

async function fetchUserEvents(uid: string): Promise<GameEvent[]> {
  try {
    const token = await auth.currentUser?.getIdToken()
    const res = await fetch(`/api/events?player=${uid}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    if (!res.ok) return []
    const data = await res.json()
    return data.events ?? []
  } catch {
    return []
  }
}

export default function HomePage() {
  return (
    <Suspense>
      <HomePageInner />
    </Suspense>
  )
}

function HomePageInner() {
  const { t } = useTranslation()
  const { user, loading: authLoading } = useAuth()
  const unreadMessages = useUnreadMessages(user?.uid)
  const searchParams = useSearchParams()
  const flags = useFeatureFlags()
  const [tab, setTab] = useState<Tab>('events')
  const [subTab, setSubTab] = useState<EventSubTab>('explore')
  const sentinelRef = useRef<HTMLDivElement>(null)
  const [publicEvents, setPublicEvents] = useState<GameEvent[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [isFetchingMore, setIsFetchingMore] = useState(false)
  const [userEvents, setUserEvents] = useState<GameEvent[]>([])
  const [friendUids, setFriendUids] = useState<Set<string>>(new Set())
  const [publicLoading, setPublicLoading] = useState(true)
  const [userLoading, setUserLoading] = useState(false)

  const [friendsRecaps, setFriendsRecaps] = useState<Recap[]>([])
  const [hotGames, setHotGames] = useState<BggGame[]>([])
  const [hotGamesLoaded, setHotGamesLoaded] = useState(false)
  const [onboardingReady, setOnboardingReady] = useState(false)
  const [bggLinked, setBggLinked] = useState<boolean | null>(null) // null = loading
  const [bggDismissed, setBggDismissed] = useState(false)
  useEffect(() => {
    if (localStorage.getItem('bggSuggestionDismissed') === '1') setBggDismissed(true)
  }, [])

  // Apply URL params reactively — fires on mount AND on client-side navigation
  const urlParamsRef = useRef<string | null>(null)
  useEffect(() => {
    const urlTab = searchParams.get('tab') as Tab | null
    const urlSubTab = searchParams.get('subTab') as EventSubTab | null
    const urlQ = searchParams.get('q')
    // Only apply if params actually changed (or on first run)
    const key = searchParams.toString()
    if (urlParamsRef.current === key) return
    urlParamsRef.current = key
    if (urlTab && ['friends', 'events', 'marketplace'].includes(urlTab)) {
      setTab(urlTab)
    }
    if (urlSubTab && ['explore', 'joined', 'mine'].includes(urlSubTab)) {
      setSubTab(urlSubTab)
    }
    if (urlQ !== null) {
      setSearch(urlQ)
    }
  }, [searchParams]) // eslint-disable-line react-hooks/exhaustive-deps

  // Set default tab once auth resolves — only if the URL didn't specify a tab
  useEffect(() => {
    if (!authLoading) {
      if (!searchParams.get('tab')) {
        setTab(user ? 'friends' : 'events')
      }
      if (user) setOnboardingReady(true)
    }
  }, [authLoading]) // eslint-disable-line react-hooks/exhaustive-deps

  // Fall back to events if user logs out on an auth-only tab
  useEffect(() => {
    if (!authLoading && !user) {
      setTab('events')
      setSubTab('explore')
    }
  }, [user, authLoading])

  useEffect(() => {
    fetchPublicEvents().then((data) => {
      setPublicEvents(data.events)
      setNextCursor(data.nextCursor)
    }).finally(() => setPublicLoading(false))
  }, [])

  useEffect(() => {
    if (tab !== 'friends' || hotGamesLoaded) return
    fetch('/api/games/hot')
      .then((r) => r.json())
      .then((d) => setHotGames(d.games ?? []))
      .catch(() => {})
      .finally(() => setHotGamesLoaded(true))
  }, [tab, hotGamesLoaded])

  useEffect(() => {
    if (!user) { setUserEvents([]); setFriendUids(new Set()); setFriendsRecaps([]); setFriendListings([]); setFriendListingsLoaded(false); return }
    setUserLoading(true)
    Promise.all([
      fetchFriendUids(user.uid).then((uids) => {
        setFriendUids(uids)
        if (uids.size > 0) {
          const uidList = [...uids].join(',')
          fetch(`/api/recaps?hostUids=${uidList}&limit=20`)
            .then((r) => r.json())
            .then((d) => setFriendsRecaps(d.recaps ?? []))
            .catch(() => {})
        }
      }),
      fetchUserEvents(user.uid).then(setUserEvents),
    ]).finally(() => setUserLoading(false))
  }, [user])

  // Check if user has linked their BGG account
  useEffect(() => {
    if (!user) { setBggLinked(null); return }
    fetch(`/api/users/${user.uid}`)
      .then((r) => r.json())
      .then((d) => setBggLinked(!!d.bggUsername))
      .catch(() => setBggLinked(false))
  }, [user])

  const friendsEvents = useMemo(
    () => publicEvents.filter((e) => friendUids.has(e.hostUid)),
    [publicEvents, friendUids]
  )

  const exploreEvents = useMemo(
    () => publicEvents.filter((e) => {
      const status = getEffectiveStatus(e)
      return (
        e.hostUid !== user?.uid &&
        !(user && e.playerUids.includes(user.uid)) &&
        status === 'waiting'
      )
    }),
    [publicEvents, user]
  )

  const joinedEvents = useMemo(
    () => userEvents.filter((e) => user && e.hostUid !== user.uid),
    [userEvents, user]
  )

  const myEvents = useMemo(
    () => userEvents.filter((e) => user && e.hostUid === user.uid),
    [userEvents, user]
  )

  // Friends display data for the "For You" tab Friends Activity row
  const friendsForDisplay = useMemo((): FriendDisplayItem[] => {
    const now = new Date()
    const friendData = new Map<string, FriendDisplayItem>()

    // Public events → ongoing / upcoming (collect ALL events per friend)
    for (const e of publicEvents) {
      const eventStart = new Date(e.dateTime)
      const eventEnd = e.endDateTime
        ? new Date(e.endDateTime)
        : new Date(eventStart.getTime() + 3 * 3600_000)
      const isOngoing = eventStart <= now && eventEnd >= now
      const isFuture = eventStart > now
      if (!isOngoing && !isFuture) continue
      const activity: 'ongoing' | 'upcoming' = isOngoing ? 'ongoing' : 'upcoming'

      for (const player of e.players) {
        if (!friendUids.has(player.id)) continue
        const existing = friendData.get(player.id)
        if (!existing) {
          friendData.set(player.id, {
            uid: player.id,
            name: player.name,
            photo: player.photoURL,
            activity,
            events: [e],
          })
        } else {
          if (!existing.events.find(ev => ev.id === e.id)) existing.events.push(e)
          // Upgrade activity priority: ongoing > upcoming
          if (existing.activity === 'upcoming' && activity === 'ongoing') {
            existing.activity = 'ongoing'
          }
        }
      }
    }

    // User's private events where a friend is also a player → upcoming_private
    for (const e of userEvents) {
      if (e.type !== 'private') continue
      const eventStart = new Date(e.dateTime)
      const eventEnd = e.endDateTime
        ? new Date(e.endDateTime)
        : new Date(eventStart.getTime() + 3 * 3600_000)
      const isFuture = eventStart > now
      const isOngoing = eventStart <= now && eventEnd >= now
      if (!isFuture && !isOngoing) continue

      for (const player of e.players) {
        if (!friendUids.has(player.id)) continue
        const existing = friendData.get(player.id)
        if (!existing) {
          friendData.set(player.id, {
            uid: player.id,
            name: player.name,
            photo: player.photoURL,
            activity: 'upcoming_private',
            events: [e],
          })
        } else if (existing.activity !== 'ongoing' && existing.activity !== 'upcoming') {
          if (!existing.events.find(ev => ev.id === e.id)) existing.events.push(e)
        }
      }
    }

    // Sort each friend's events by dateTime ascending
    for (const entry of friendData.values()) {
      entry.events.sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime())
    }

    // Recaps — only show within 24 h of when the recap was created
    const recapCutoff = Date.now() - 24 * 3_600_000
    for (const r of friendsRecaps) {
      if (new Date(r.createdAt).getTime() < recapCutoff) continue
      if (!friendData.has(r.hostUid)) {
        friendData.set(r.hostUid, {
          uid: r.hostUid,
          name: r.hostName,
          photo: r.hostPhoto || undefined,
          activity: 'recap',
          events: [],
          recap: r,
        })
      }
    }

    // Sort each friend's events: most recently CREATED first (user sees newest events first)
    for (const entry of friendData.values()) {
      entry.events.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    }

    // Instagram-like scoring:
    // 1. Activity priority (ongoing > upcoming > upcoming_private)
    // 2. Shared events (proxy for how much you interact with this friend)
    // 3. Creation recency (events created recently get a boost)
    // 4. Timing proximity (events happening soon rank higher)
    const currentUid = user?.uid
    function score(f: FriendDisplayItem): number {
      const activityBase = { ongoing: 3000, upcoming: 2000, upcoming_private: 1500, recap: 0 }[f.activity] ?? 0
      const sharedBonus = f.events.filter(e => currentUid && e.players.some(p => p.id === currentUid)).length * 200
      const latestCreated = f.events.reduce((m, e) => Math.max(m, new Date(e.createdAt).getTime()), 0)
      const creationBonus = Math.max(0, 7 - (Date.now() - latestCreated) / 86_400_000) * 100
      const soonest = f.events[0]
      const hoursUntil = soonest ? (new Date(soonest.dateTime).getTime() - Date.now()) / 3_600_000 : 99999
      const timingBonus = hoursUntil < 0 ? 500 : hoursUntil < 24 ? 400 : hoursUntil < 48 ? 200 : hoursUntil < 168 ? 100 : 0
      return activityBase + sharedBonus + creationBonus + timingBonus
    }

    return [...friendData.values()].sort((a, b) => score(b) - score(a))
  }, [publicEvents, userEvents, friendUids, friendsRecaps, user?.uid])

  // Upcoming events for the "For You" tab carousel (joined + mine, not yet started, deduplicated, sorted by date)
  const upcomingUserEvents = useMemo(() => {
    const seen = new Set<string>()
    return [...joinedEvents, ...myEvents]
      .filter(e => {
        if (seen.has(e.id)) return false
        seen.add(e.id)
        const status = getEffectiveStatus(e)
        return status === 'waiting' || status === 'full'
      })
      .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime())
      .slice(0, 8)
  }, [joinedEvents, myEvents])

  const [listings, setListings] = useState<Listing[]>([])
  const [listingsLoading, setListingsLoading] = useState(false)

  useEffect(() => {
    if (tab !== 'marketplace' || listings.length > 0) return
    setListingsLoading(true)
    fetch('/api/listings?status=active')
      .then((r) => r.json())
      .then((d) => setListings(d.listings ?? []))
      .catch(() => {})
      .finally(() => setListingsLoading(false))
  }, [tab]) // eslint-disable-line react-hooks/exhaustive-deps

  const [friendListings, setFriendListings] = useState<Listing[]>([])
  const [friendListingsLoaded, setFriendListingsLoaded] = useState(false)

  useEffect(() => {
    if (!flags.marketplace) return
    if (tab !== 'friends' || friendListingsLoaded) return
    if (friendUids.size === 0 && !userLoading) { setFriendListingsLoaded(true); return }
    if (friendUids.size === 0) return
    const uids = [...friendUids].slice(0, 30).join(',')
    fetch(`/api/listings?status=active&sellerUids=${uids}`)
      .then((r) => r.json())
      .then((d) => setFriendListings(d.listings ?? []))
      .catch(() => {})
      .finally(() => setFriendListingsLoaded(true))
  }, [tab, friendUids, userLoading, flags.marketplace]) // eslint-disable-line react-hooks/exhaustive-deps

  const visibleTabs = TABS.filter((t) => {
    if (!flags.marketplace && t.id === 'marketplace') return false
    return !t.authOnly || !!user
  })

  const [search, setSearch] = useState('')
  const [dateFilter, setDateFilter] = useState<DateFilter>('')
  const [hostedByFriendsFilter, setHostedByFriendsFilter] = useState(false)
  const [joinedByFriendsFilter, setJoinedByFriendsFilter] = useState(false)
  const [showAvailableOnly, setShowAvailableOnly] = useState(false)
  const [mineFilter, setMineFilter] = useState<MineFilter>('next')
  const [waitingSort, setWaitingSort] = useState<WaitingSort>('start_asc')
  const [joinedFilter, setJoinedFilter] = useState<MineFilter>('next')
  const [joinedWaitingSort, setJoinedWaitingSort] = useState<WaitingSort>('start_asc')

  // Resets all filters — called only from explicit user tab/subtab clicks
  const resetFilters = useCallback(() => {
    setDateFilter('')
    setShowAvailableOnly(false)
    setHostedByFriendsFilter(false)
    setJoinedByFriendsFilter(false)
    setSearch('')
    setMineFilter('next')
    setWaitingSort('start_asc')
    setJoinedFilter('next')
    setJoinedWaitingSort('start_asc')
  }, [])

  const handleTabChange = useCallback((id: Tab) => {
    setTab(id)
    resetFilters()
  }, [resetFilters])


  // IntersectionObserver: load more events from backend when sentinel enters viewport
  const loadMore = useCallback(() => {
    if (!nextCursor || isFetchingMore) return
    setIsFetchingMore(true)
    fetchPublicEvents(nextCursor).then((data) => {
      setPublicEvents((prev) => {
        const existingIds = new Set(prev.map(e => e.id))
        const newEvents = data.events.filter(e => !existingIds.has(e.id))
        return [...prev, ...newEvents]
      })
      setNextCursor(data.nextCursor)
    }).finally(() => setIsFetchingMore(false))
  }, [nextCursor, isFetchingMore])

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) loadMore() },
      { rootMargin: '200px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }) // intentionally re-runs every render so closures stay fresh

  // Track search after 1 s of inactivity (event tabs only; marketplace tracks internally)
  useEffect(() => {
    if (!search.trim() || tab === 'marketplace') return
    const t = setTimeout(() =>
      Analytics.searchPerformed({ query_length: search.trim().length, results_count: activeEvents.length, tab }),
    1000)
    return () => clearTimeout(t)
  }, [search]) // eslint-disable-line react-hooks/exhaustive-deps

  const activeEvents = useMemo(() => {
    let base = friendsEvents
    if (tab === 'events') {
      if (subTab === 'explore') {
        base = (hostedByFriendsFilter || joinedByFriendsFilter) ? publicEvents.filter(e => e.hostUid !== user?.uid) : exploreEvents
      }
      else if (subTab === 'joined') {
        const now = new Date()
        const joinedBase = [...joinedEvents].filter(e => {
          if (joinedFilter === 'all') return true
          const endDate = e.endDateTime ? new Date(e.endDateTime) : new Date(new Date(e.dateTime).getTime() + 2 * 60 * 60 * 1000)
          if (joinedFilter === 'next') return endDate >= now
          if (joinedFilter === 'past') return endDate < now
          if (joinedFilter === 'waiting') return e.players.length < e.minPlayers
          return true
        })

        joinedBase.sort((a, b) => {
          if (joinedFilter === 'all') {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          } else if (joinedFilter === 'next') {
            return new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()
          } else if (joinedFilter === 'past') {
            return new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime()
          } else if (joinedFilter === 'waiting') {
            if (joinedWaitingSort === 'start_asc') return new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()
            if (joinedWaitingSort === 'start_desc') return new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime()
            if (joinedWaitingSort === 'created_asc') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            if (joinedWaitingSort === 'created_desc') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          }
          return 0
        })

        base = joinedBase
      }
      else if (subTab === 'mine') {
        const now = new Date()
        const myBase = [...myEvents].filter(e => {
          if (mineFilter === 'all') return true
          const endDate = e.endDateTime ? new Date(e.endDateTime) : new Date(new Date(e.dateTime).getTime() + 2 * 60 * 60 * 1000)
          if (mineFilter === 'next') return endDate >= now
          if (mineFilter === 'past') return endDate < now
          if (mineFilter === 'waiting') return e.players.length < e.minPlayers
          return true
        })

        myBase.sort((a, b) => {
          if (mineFilter === 'all') {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          } else if (mineFilter === 'next') {
            return new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()
          } else if (mineFilter === 'past') {
            return new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime()
          } else if (mineFilter === 'waiting') {
            if (waitingSort === 'start_asc') return new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()
            if (waitingSort === 'start_desc') return new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime()
            if (waitingSort === 'created_asc') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            if (waitingSort === 'created_desc') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          }
          return 0
        })

        base = myBase
      }
    }

    if (tab === 'events' && subTab === 'explore') {
      if (showAvailableOnly) base = base.filter((e) => getEffectiveStatus(e) !== 'full')
      if (hostedByFriendsFilter || joinedByFriendsFilter) {
        base = base.filter((e) => {
          const isHostedByFriend = friendUids.has(e.hostUid)
          const isJoinedByFriend = e.players.some(p => p.id !== e.hostUid && friendUids.has(p.id))
          
          if (hostedByFriendsFilter && joinedByFriendsFilter) return isHostedByFriend || isJoinedByFriend
          if (hostedByFriendsFilter) return isHostedByFriend
          if (joinedByFriendsFilter) return isJoinedByFriend
          return true
        })
      }

      if (dateFilter) {
        const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
        base = base.filter((e) => {
          const d = new Date(e.dateTime); d.setHours(0, 0, 0, 0)
          if (dateFilter === 'today') return d.getTime() === todayStart.getTime()
          if (dateFilter === 'week') {
            const weekEnd = new Date(todayStart.getTime() + 7 * 24 * 60 * 60 * 1000)
            return d >= todayStart && d <= weekEnd
          }
          if (dateFilter === 'weekend') {
            const day = todayStart.getDay()
            const eventDate = new Date(e.dateTime)
            if (day === 0) return d.getTime() === todayStart.getTime() // Sunday = show today
            
            const fri = new Date(todayStart.getTime() + (5 - day) * 24 * 60 * 60 * 1000)
            fri.setHours(17, 0, 0, 0) // Friday 5:00 PM
            
            const sunEnd = new Date(todayStart.getTime() + (7 - day) * 24 * 60 * 60 * 1000)
            sunEnd.setHours(23, 59, 59, 999) // Sunday 11:59 PM
            
            return eventDate >= fri && eventDate <= sunEnd
          }
          return true
        })
      }
    }

    const filtered = !search.trim() ? base : base.filter((e) => {
      const gameName = e.boardGame.name.toLowerCase()
      const hostName = e.players.find((p) => p.isHost)?.name.toLowerCase() ?? ''
      const location = (e.address ?? '').toLowerCase()
      return gameName.includes(search.trim().toLowerCase()) || hostName.includes(search.trim().toLowerCase()) || (tab === 'events' && subTab === 'explore' && location.includes(search.trim().toLowerCase()))
    })

    return [...filtered].sort((a, b) => {
      const aFull = getEffectiveStatus(a) === 'full' ? 1 : 0
      const bFull = getEffectiveStatus(b) === 'full' ? 1 : 0
      return aFull - bFull
    })
  }, [tab, subTab, friendsEvents, exploreEvents, joinedEvents, myEvents, search, dateFilter, showAvailableOnly, hostedByFriendsFilter, joinedByFriendsFilter, friendUids, publicEvents, user, mineFilter, waitingSort, joinedFilter, joinedWaitingSort])

  const isLoading =
    tab !== 'marketplace' && (
      authLoading ||
      publicLoading ||
      (user && userLoading && tab === 'events' && (subTab === 'joined' || subTab === 'mine'))
    )

  return (
    <main className="min-h-screen bg-surface pt-16">
      <HomeHeader
        currentTab={tab}
        navTabs={visibleTabs.map((tb) => ({ id: tb.id, label: t(TAB_LABEL_KEYS[tb.id]) }))}
        onTabChange={(id) => { handleTabChange(id as Tab); Analytics.tabSwitched(id) }}
      />


      {/* Search — Events and Marketplace */}
      {(tab === 'events' || tab === 'marketplace') && <div className="max-w-5xl mx-auto px-4 pt-4">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={tab === 'marketplace' ? t('home.searchPlaceholderMarketplace') : t('home.searchPlaceholderExplore')}
            className="w-full pl-9 pr-4 py-2 text-sm bg-surface-container-high ghost-border rounded-[0.75rem] text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>}

      {/* Events filters */}
      {tab === 'events' && (
        <div className="max-w-5xl mx-auto px-4 pt-2">
          <div className="flex flex-col gap-2">
            {/* Primary pills row */}
            <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
              {/* Explore / All */}
              <button
                onClick={() => {
                  setSubTab('explore')
                  setHostedByFriendsFilter(false)
                  setJoinedByFriendsFilter(false)
                  setDateFilter('')
                }}
                className={`flex-shrink-0 px-3 py-1.5 rounded-[0.75rem] text-xs font-medium transition-colors ${
                  subTab === 'explore'
                    ? 'bg-primary-container text-on-primary-container'
                    : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
                }`}
              >
                {t('home.all', 'All')}
              </button>
              {user && (
                <>
                  {/* Joined pill */}
                  <button
                    onClick={() => setSubTab('joined')}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-[0.75rem] text-xs font-medium transition-colors ${
                      subTab === 'joined'
                        ? 'bg-primary-container text-on-primary-container'
                        : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
                    }`}
                  >
                    {t('nav.joined', 'Joined')}
                  </button>
                  {/* My Events pill */}
                  <button
                    onClick={() => setSubTab('mine')}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-[0.75rem] text-xs font-medium transition-colors ${
                      subTab === 'mine'
                        ? 'bg-primary-container text-on-primary-container'
                        : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
                    }`}
                  >
                    {t('nav.myEvents', 'My Events')}
                  </button>
                  {/* Explore-only: friends filters */}
                  {subTab === 'explore' && (
                    <>
                      <button
                        onClick={() => {
                          setHostedByFriendsFilter((p) => !p)
                          if (!hostedByFriendsFilter) setJoinedByFriendsFilter(false)
                        }}
                        className={`flex-shrink-0 px-3 py-1.5 rounded-[0.75rem] text-xs font-medium transition-colors ${
                          hostedByFriendsFilter
                            ? 'bg-primary-container text-on-primary-container'
                            : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
                        }`}
                      >
                        {t('home.hostedByFriends', 'Hosted by Friends')}
                      </button>
                      <button
                        onClick={() => {
                          setJoinedByFriendsFilter((p) => !p)
                          if (!joinedByFriendsFilter) setHostedByFriendsFilter(false)
                        }}
                        className={`flex-shrink-0 px-3 py-1.5 rounded-[0.75rem] text-xs font-medium transition-colors ${
                          joinedByFriendsFilter
                            ? 'bg-primary-container text-on-primary-container'
                            : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
                        }`}
                      >
                        {t('home.joinedByFriends', 'Joined by Friends')}
                      </button>
                    </>
                  )}
                </>
              )}
              {/* Explore-only: date + availability filters */}
              {subTab === 'explore' && (
                <>
                  {(['today', 'weekend', 'week'] as DateFilter[]).map((f) => (
                    <button
                      key={f}
                      onClick={() => setDateFilter(f === dateFilter ? '' : f)}
                      className={`flex-shrink-0 px-3 py-1.5 rounded-[0.75rem] text-xs font-medium transition-colors ${
                        dateFilter === f
                          ? 'bg-primary-container text-on-primary-container'
                          : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
                      }`}
                    >
                      {f === 'today' ? t('home.today') : f === 'weekend' ? t('home.weekend') : t('home.thisWeek')}
                    </button>
                  ))}
                  <button
                    onClick={() => setShowAvailableOnly((p) => !p)}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-[0.75rem] text-xs font-medium transition-colors ${
                      showAvailableOnly
                        ? 'bg-primary-container text-on-primary-container'
                        : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
                    }`}
                  >
                    {t('home.availableSpots')}
                  </button>
                </>
              )}
            </div>

            {/* Joined sub-filters */}
            {subTab === 'joined' && (
              <div className="flex flex-col gap-2">
                <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                  {(['all', 'next', 'waiting', 'past'] as MineFilter[]).map((f) => (
                    <button
                      key={f}
                      onClick={() => setJoinedFilter(f)}
                      className={`flex-shrink-0 px-3 py-1.5 rounded-[0.75rem] text-xs font-medium transition-colors ${
                        joinedFilter === f
                          ? 'bg-primary-container text-on-primary-container'
                          : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
                      }`}
                    >
                      {f === 'all' ? t('home.filterAll', 'All') : f === 'next' ? t('home.filterNext', 'Next Events') : f === 'waiting' ? t('home.filterWaiting', 'Waiting for Players') : t('home.filterPast', 'Past Events')}
                    </button>
                  ))}
                </div>
                {joinedFilter === 'waiting' && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-on-surface-variant">{t('home.sortBy', 'Sort by')}:</span>
                    <select
                      value={joinedWaitingSort}
                      onChange={(e) => setJoinedWaitingSort(e.target.value as WaitingSort)}
                      className="bg-surface-container-high ghost-border text-on-surface-variant text-xs rounded-[0.75rem] px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="start_asc">{t('home.sortStartAsc', 'Starting date (Asc)')}</option>
                      <option value="start_desc">{t('home.sortStartDesc', 'Starting date (Desc)')}</option>
                      <option value="created_asc">{t('home.sortCreatedAsc', 'Creation date (Asc)')}</option>
                      <option value="created_desc">{t('home.sortCreatedDesc', 'Creation date (Desc)')}</option>
                    </select>
                  </div>
                )}
              </div>
            )}

            {/* My Events sub-filters */}
            {subTab === 'mine' && (
              <div className="flex flex-col gap-2">
                <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                  {(['all', 'next', 'waiting', 'past'] as MineFilter[]).map((f) => (
                    <button
                      key={f}
                      onClick={() => setMineFilter(f)}
                      className={`flex-shrink-0 px-3 py-1.5 rounded-[0.75rem] text-xs font-medium transition-colors ${
                        mineFilter === f
                          ? 'bg-primary-container text-on-primary-container'
                          : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
                      }`}
                    >
                      {f === 'all' ? t('home.filterAll', 'All') : f === 'next' ? t('home.filterNext', 'Next Events') : f === 'waiting' ? t('home.filterWaiting', 'Waiting for Players') : t('home.filterPast', 'Past Events')}
                    </button>
                  ))}
                </div>
                {mineFilter === 'waiting' && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-on-surface-variant">{t('home.sortBy', 'Sort by')}:</span>
                    <select
                      value={waitingSort}
                      onChange={(e) => setWaitingSort(e.target.value as WaitingSort)}
                      className="bg-surface-container-high ghost-border text-on-surface-variant text-xs rounded-[0.75rem] px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="start_asc">{t('home.sortStartAsc', 'Starting date (Asc)')}</option>
                      <option value="start_desc">{t('home.sortStartDesc', 'Starting date (Desc)')}</option>
                      <option value="created_asc">{t('home.sortCreatedAsc', 'Creation date (Asc)')}</option>
                      <option value="created_desc">{t('home.sortCreatedDesc', 'Creation date (Desc)')}</option>
                    </select>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* BGG Link Suggestion */}
      {user && bggLinked === false && !bggDismissed && (
        <div className="max-w-5xl mx-auto px-4 pt-3">
          <div className="flex items-center gap-3 bg-primary-container/50 border border-primary/20 rounded-[1rem] px-4 py-3">
            <span className="text-xl flex-shrink-0">🎲</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-on-surface">{t('emptyState.bggSuggestionTitle')}</p>
              <p className="text-xs text-on-surface-variant mt-0.5">{t('emptyState.bggSuggestionDesc')}</p>
            </div>
            <a href="/settings" className="flex-shrink-0 px-3 py-1.5 text-xs font-semibold text-on-primary bg-primary rounded-[0.75rem] hover:bg-primary/90 transition-colors">
              {t('emptyState.bggSuggestionLink')}
            </a>
            <button onClick={() => { localStorage.setItem('bggSuggestionDismissed', '1'); setBggDismissed(true) }} className="flex-shrink-0 p-1 text-on-surface-variant/50 hover:text-on-surface-variant transition-colors">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      {/* On mobile: clear the bottom nav. On desktop: clear the fixed footer bar. */}
      <div className="max-w-5xl mx-auto px-4 py-4 md:pb-14" style={{ paddingBottom: 'calc(5rem + env(safe-area-inset-bottom))' }}>
        {tab === 'marketplace' ? (
          listingsLoading ? (
            <div className="flex justify-center py-16"><Spinner className="h-7 w-7" /></div>
          ) : (
            <MarketplaceTab listings={listings} search={search} user={!!user} />
          )
        ) : isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner className="h-7 w-7" />
          </div>
        ) : tab === 'friends' ? (
          <ForYouContent
            user={user}
            friendsForDisplay={friendsForDisplay}
            upcomingUserEvents={upcomingUserEvents}
            exploreEvents={exploreEvents}
            hotGames={hotGames}
            friendListings={flags.marketplace ? friendListings : []}
            onSeeAllListings={() => handleTabChange('marketplace')}
            onSeeAllUpcoming={() => { handleTabChange('events'); setSubTab('joined') }}
            onSeeAllRecommended={() => { handleTabChange('events'); setSubTab('explore') }}
          />
        ) : (
          <>
            {/* Nearby players — Explore tab, logged-in users only */}
            {flags.nearbyPlayers && tab === 'events' && subTab === 'explore' && user && !search.trim() && !dateFilter && !showAvailableOnly && (
              <div className="mb-6">
                <NearbyPlayers />
              </div>
            )}

            {activeEvents.length === 0 ? (
              search.trim() ? (
                <div className="text-center py-16 px-6 bg-surface-container-high rounded-[1.5rem]">
                  <div className="flex justify-center mb-5">
                    <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                      <circle cx="40" cy="40" r="40" className="fill-primary-container/30" />
                      <circle cx="36" cy="36" r="13" className="fill-primary-container/60" />
                      <circle cx="36" cy="36" r="13" className="stroke-primary" strokeWidth="3" fill="none" />
                      <line x1="46" y1="46" x2="57" y2="57" className="stroke-primary" strokeWidth="4" strokeLinecap="round" />
                      <path d="M31 31l10 10M41 31l-10 10" className="stroke-primary/70" strokeWidth="2.5" strokeLinecap="round" />
                    </svg>
                  </div>
                  <p className="text-on-surface font-semibold">{t('home.noResults', { query: search.trim() })}</p>
                  <p className="text-on-surface-variant text-sm mt-1">{t('home.tryDifferent')}</p>
                </div>
              ) : (
                <EmptyState tab={subTab} />
              )
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {activeEvents.map((event) => (
                  <UpcomingEventCard key={event.id} event={event} currentUserUid={user?.uid ?? undefined} />
                ))}
                {(nextCursor || isFetchingMore) && tab === 'events' && subTab === 'explore' && (
                  <div ref={sentinelRef} className="flex justify-center py-4 min-h-[50px]">
                    <Spinner className="h-5 w-5" />
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Desktop FAB — Create Event or Sell a Game */}
      {user && (
        <a
          href={flags.marketplace && tab === 'marketplace' ? '/marketplace/create' : '/create'}
          className="hidden md:flex fixed right-8 bottom-8 z-50 items-center gap-2 bg-secondary hover:brightness-110 active:brightness-90 text-on-secondary font-semibold text-sm px-5 py-3.5 rounded-[1.5rem] shadow-lg shadow-secondary/30 transition-all"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          {flags.marketplace && tab === 'marketplace' ? t('marketplace.sellAGame') : t('home.createEvent')}
        </a>
      )}

      {/* Onboarding modal — shown once to new users */}
      {onboardingReady && (
        <OnboardingModal onExplore={() => { handleTabChange('events'); setSubTab('explore'); }} />
      )}

      {/* Mobile create button — FAB bottom right */}
      {user && (
        <a
          href={flags.marketplace && tab === 'marketplace' ? '/marketplace/create' : '/create'}
          className="md:hidden fixed right-4 z-50 w-14 h-14 bg-secondary rounded-full shadow-lg shadow-secondary/30 flex items-center justify-center text-on-secondary active:scale-90 transition-transform"
          style={{ bottom: 'calc(env(safe-area-inset-bottom) + 5rem)' }}
        >
          <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </a>
      )}

      {/* Mobile bottom nav — fixed at bottom */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 glass-nav rounded-t-[1.25rem] border-t border-outline-variant/5 shadow-[0_-8px_32px_rgba(0,0,0,0.08)]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex items-center justify-around px-2 pt-3 pb-2">
          {visibleTabs.map((tb) => (
            <React.Fragment key={tb.id}>
              {/* Insert Messages before Marketplace if Marketplace is next */}
              {tb.id === 'marketplace' && user && (
                <Link
                  href="/messages"
                  className="flex flex-col items-center justify-center flex-1 py-1.5 gap-1 transition-all text-on-surface-variant opacity-70 relative"
                >
                  <svg className="w-[18px] h-[18px] flex-shrink-0 fill-on-surface-variant" viewBox="0 0 24 24">
                    <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z" />
                  </svg>
                  {unreadMessages > 0 && (
                    <span className="absolute -top-0.5 right-1/4 min-w-[16px] h-4 bg-red-500 rounded-full text-[10px] text-white font-bold flex items-center justify-center px-1">
                      {unreadMessages > 9 ? '9+' : unreadMessages}
                    </span>
                  )}
                  <span className="text-[10px] font-bold uppercase tracking-widest leading-none">{t('menu.messages', 'Messages')}</span>
                </Link>
              )}
              <button
                onClick={() => { handleTabChange(tb.id); Analytics.tabSwitched(tb.id) }}
                className={`flex flex-col items-center justify-center flex-1 py-1.5 gap-1 transition-all ${
                  tab === tb.id ? 'text-primary scale-105' : 'text-on-surface-variant opacity-70'
                }`}
              >
                <TabIcon id={tb.id} active={tab === tb.id} />
                <span className="text-[10px] font-bold uppercase tracking-widest leading-none">{t(TAB_LABEL_KEYS[tb.id])}</span>
              </button>
            </React.Fragment>
          ))}

          {/* Fallback: if Marketplace is NOT visible but user IS logged in, put Messages at the end */}
          {user && !visibleTabs.some(t => t.id === 'marketplace') && (
            <Link
              href="/messages"
              className="flex flex-col items-center justify-center flex-1 py-1.5 gap-1 transition-all text-on-surface-variant opacity-70 relative"
            >
              <svg className="w-[18px] h-[18px] flex-shrink-0 fill-on-surface-variant" viewBox="0 0 24 24">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z" />
              </svg>
              {unreadMessages > 0 && (
                <span className="absolute -top-0.5 right-1/4 min-w-[16px] h-4 bg-red-500 rounded-full text-[10px] text-white font-bold flex items-center justify-center px-1">
                  {unreadMessages > 9 ? '9+' : unreadMessages}
                </span>
              )}
              <span className="text-[10px] font-bold uppercase tracking-widest leading-none">{t('menu.messages', 'Messages')}</span>
            </Link>
          )}
        </div>
      </nav>

      <AppFooter />
    </main>
  )
}

const CONDITIONS: ListingCondition[] = ['new', 'like_new', 'good', 'fair', 'poor']

type PriceSort = '' | 'asc' | 'desc'

function MarketplaceTab({ listings, search, user }: { listings: Listing[]; search: string; user: boolean }) {
  const { t } = useTranslation()
  const [conditionFilter, setConditionFilter] = useState<ListingCondition | ''>('')
  const [priceSort, setPriceSort] = useState<PriceSort>('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const filtered = listings
    .filter((l) => !search.trim() || l.boardGame.name.toLowerCase().includes(search.toLowerCase()))
    .filter((l) => !conditionFilter || l.condition === conditionFilter)
    .sort((a, b) => priceSort === 'asc' ? a.price - b.price : priceSort === 'desc' ? b.price - a.price : 0)

  useEffect(() => {
    if (!search.trim()) return
    const t = setTimeout(() =>
      Analytics.searchPerformed({ query_length: search.trim().length, results_count: filtered.length, tab: 'marketplace' }),
    1000)
    return () => clearTimeout(t)
  }, [search, filtered.length]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col gap-4">
      {/* Condition pills */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setConditionFilter('')}
          className={`px-3 py-1.5 rounded-[0.75rem] text-xs font-medium transition-colors ${
            conditionFilter === ''
              ? 'bg-primary-container text-on-primary-container'
              : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
          }`}
        >
          {t('marketplace.all')}
        </button>
        {CONDITIONS.map((c) => (
          <button
            key={c}
            onClick={() => setConditionFilter(c === conditionFilter ? '' : c)}
            className={`px-3 py-1.5 rounded-[0.75rem] text-xs font-medium transition-colors ${
              conditionFilter === c
                ? 'bg-primary-container text-on-primary-container'
                : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
            }`}
          >
            {t(`condition.${c}`)}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 px-6 bg-surface-container-high rounded-[1.5rem]">
          <svg className="mx-auto mb-4" width="64" height="64" viewBox="0 0 64 64" fill="none">
            <circle cx="32" cy="32" r="32" className="fill-primary-container/30" />
            <rect x="18" y="16" width="28" height="32" rx="3" className="fill-primary-container/60 stroke-primary/50" strokeWidth="1.5"/>
            <path d="M24 26h16M24 31h16M24 36h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-primary/70"/>
          </svg>
          <p className="font-semibold text-on-surface">{t('marketplace.noListingsFound')}</p>
          <p className="text-sm text-on-surface-variant mt-1">
            {search || conditionFilter ? t('marketplace.adjustFilters') : t('marketplace.beFirst')}
          </p>
          {user && !search && !conditionFilter && (
            <Link href="/marketplace/create" className="inline-block mt-4 px-4 py-2 bg-secondary text-on-secondary text-sm font-medium rounded-[0.75rem] hover:brightness-110 transition-all">
              {t('marketplace.listAGame')}
            </Link>
          )}
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-on-surface-variant/60 font-meta">{t('marketplace.listing', { count: filtered.length })}</p>
            <div className="flex items-center gap-3">
              <select
                value={priceSort}
                onChange={(e) => setPriceSort(e.target.value as PriceSort)}
                className="text-sm bg-surface-container-high ghost-border text-on-surface-variant rounded-[0.75rem] px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">{t('marketplace.sortBy')}</option>
                <option value="asc">{t('marketplace.priceLowHigh')}</option>
                <option value="desc">{t('marketplace.priceHighLow')}</option>
              </select>
              {/* Grid / List toggle */}
              <div className="flex rounded-[0.75rem] bg-surface-container-highest overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 transition-colors ${viewMode === 'grid' ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant hover:bg-surface-container-high'}`}
                  aria-label="Grid view"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="3" width="8" height="8" rx="1"/><rect x="3" y="13" width="8" height="8" rx="1"/><rect x="13" y="13" width="8" height="8" rx="1"/>
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 transition-colors ${viewMode === 'list' ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant hover:bg-surface-container-high'}`}
                  aria-label="List view"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="3" y="4" width="18" height="3" rx="1"/><rect x="3" y="10.5" width="18" height="3" rx="1"/><rect x="3" y="17" width="18" height="3" rx="1"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {filtered.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filtered.map((listing) => (
                <ListingCard key={listing.id} listing={listing} listView={true} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function EmptyState({ tab }: { tab: Tab | EventSubTab }) {
  const { t } = useTranslation()
  if (tab === 'friends') return (
    <div className="text-center py-16 px-6 bg-surface-container-high rounded-[1.5rem]">
      <div className="flex justify-center mb-5">
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
          <circle cx="40" cy="40" r="40" className="fill-primary-container/30" />
          {/* Person 1 */}
          <circle cx="31" cy="30" r="8" className="fill-primary-container/60" />
          <path d="M16 55c0-8.284 6.716-15 15-15h1c8.284 0 15 6.716 15 15" className="stroke-primary/40" strokeWidth="3" strokeLinecap="round" fill="none" />
          {/* Person 2 */}
          <circle cx="50" cy="28" r="7" className="fill-primary/40" />
          <path d="M36 55c0-7.732 6.268-14 14-14h1c7.732 0 14 6.268 14 14" className="stroke-primary/70" strokeWidth="3" strokeLinecap="round" fill="none" />
        </svg>
      </div>
      <p className="text-on-surface font-semibold">{t('emptyState.noFriendEvents')}</p>
      <p className="text-on-surface-variant text-sm mt-1">{t('emptyState.addFriendsHint')}</p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center mt-5">
        <Link href="/friends" className="px-4 py-2.5 bg-secondary text-on-secondary text-sm font-semibold rounded-[0.75rem] hover:brightness-110 transition-all">
          {t('emptyState.findFriends')}
        </Link>
        <Link href="?tab=explore" className="px-4 py-2.5 bg-surface-container-highest text-on-surface-variant text-sm font-semibold rounded-[0.75rem] hover:bg-surface-container-highest/80 transition-colors">
          {t('emptyState.exploreEvents')}
        </Link>
      </div>
    </div>
  )
  if (tab === 'joined') return (
    <div className="text-center py-16 px-6 bg-surface-container-high rounded-[1.5rem]">
      <div className="flex justify-center mb-5">
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
          <circle cx="40" cy="40" r="40" className="fill-primary-container/30" />
          {/* Ticket body */}
          <rect x="16" y="28" width="48" height="26" rx="5" className="fill-primary-container/60" />
          <rect x="16" y="28" width="48" height="26" rx="5" className="stroke-primary/50" strokeWidth="2.5" fill="none" />
          {/* Perforation */}
          <line x1="34" y1="28" x2="34" y2="54" className="stroke-primary/30" strokeWidth="2" strokeDasharray="3 3" />
          {/* Star on stub */}
          <path d="M25 41l1.5-4.5 1.5 4.5-4-2.7h5z" className="fill-primary/60" />
          {/* Lines on main body */}
          <rect x="39" y="35" width="18" height="2.5" rx="1.25" className="fill-primary/40" />
          <rect x="39" y="41" width="12" height="2.5" rx="1.25" className="fill-primary/30" />
        </svg>
      </div>
      <p className="text-on-surface font-semibold">{t('emptyState.notJoined')}</p>
      <p className="text-on-surface-variant text-sm mt-1">{t('emptyState.browseExplore')}</p>
    </div>
  )
  if (tab === 'mine') return (
    <div className="text-center py-16 px-6 bg-surface-container-high rounded-[1.5rem]">
      <div className="flex justify-center mb-5">
        <DiceIllustration />
      </div>
      <p className="text-on-surface font-semibold">{t('emptyState.noEventsYet')}</p>
      <p className="text-on-surface-variant text-sm mt-1">{t('emptyState.organizeFirst')}</p>
      <CreateEventCTA />
    </div>
  )
  return (
    <div className="text-center py-16 px-6 bg-surface-container-high rounded-[1.5rem]">
      <div className="flex justify-center mb-5">
        <DiceIllustration />
      </div>
      <p className="text-on-surface font-semibold">{t('emptyState.noUpcomingEvents')}</p>
      <p className="text-on-surface-variant text-sm mt-1">{t('emptyState.beFirstOrganize')}</p>
      <CreateEventCTA />
    </div>
  )
}

function ForYouContent({
  user,
  friendsForDisplay,
  upcomingUserEvents,
  exploreEvents,
  hotGames,
  friendListings,
  onSeeAllListings,
  onSeeAllUpcoming,
  onSeeAllRecommended,
}: {
  user: { displayName?: string | null; uid: string } | null
  friendsForDisplay: FriendDisplayItem[]
  upcomingUserEvents: GameEvent[]
  exploreEvents: GameEvent[]
  hotGames: BggGame[]
  friendListings: Listing[]
  onSeeAllListings: () => void
  onSeeAllUpcoming: () => void
  onSeeAllRecommended: () => void
}) {
  const { t } = useTranslation()
  const [activeFriendIndex, setActiveFriendIndex] = useState<number | null>(null)
  // Snapshot of storyFriends captured when the overlay opens.
  // Prevents the array from shrinking mid-session (as friends get marked seen),
  // which would shift indices and skip/repeat stories.
  const [overlaySnapshot, setOverlaySnapshot] = useState<FriendDisplayItem[]>([])

  // Track which event IDs the user has already watched — persisted in localStorage
  const [seenEventIds, setSeenEventIds] = useState<Set<string>>(new Set())
  useEffect(() => {
    try {
      const raw = localStorage.getItem('ludify_seen_stories')
      if (raw) setSeenEventIds(new Set(JSON.parse(raw) as string[]))
    } catch {}
  }, [])

  function markFriendSeen(eventIds: string[]) {
    setSeenEventIds(prev => {
      const next = new Set(prev)
      eventIds.forEach(id => next.add(id))
      try { localStorage.setItem('ludify_seen_stories', JSON.stringify([...next])) } catch {}
      return next
    })
  }

  // Hide bubbles whose events have all been watched.
  // Disabled only in dev so stories can be re-watched without clearing localStorage.
  // QA and production both filter out fully-seen friends.
  const visibleFriends = process.env.NEXT_PUBLIC_APP_ENV === 'dev'
    ? friendsForDisplay
    : friendsForDisplay.filter(f =>
        f.events.length === 0 || !f.events.every(e => seenEventIds.has(e.id))
      )

  const showEmptyState = visibleFriends.length === 0 && upcomingUserEvents.length === 0

  // All visible friends are story-eligible (recap friends now open the story modal too)
  const storyFriends = visibleFriends

  return (
    <div>
      {activeFriendIndex !== null && (
        <FriendStoryOverlay
          friends={overlaySnapshot}
          initialFriendIndex={activeFriendIndex}
          onClose={() => setActiveFriendIndex(null)}
          onFriendSeen={(eventIds) => markFriendSeen(eventIds)}
        />
      )}

      {/* Friends Activity */}
      {visibleFriends.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-bold tracking-tight text-on-surface mb-4">
            {t('home.friendsActivity')}
          </h2>
          <div className="flex gap-4 -mx-4 px-4 overflow-x-auto scrollbar-hide py-2">
            {visibleFriends.map((friend) => {
              const isRecap = friend.activity === 'recap'

              const avatarEl = friend.photo ? (
                <Image
                  src={friend.photo}
                  alt={friend.name}
                  width={56}
                  height={56}
                  className="w-14 h-14 rounded-full object-cover"
                />
              ) : (
                <div className="w-14 h-14 rounded-full flex items-center justify-center text-base font-bold bg-primary-container text-on-primary-container">
                  {friend.name[0]?.toUpperCase()}
                </div>
              )

              let bubbleEl: React.ReactNode
              if (friend.activity === 'ongoing') {
                bubbleEl = (
                  <div className="relative p-[2.5px] rounded-full bg-green-400">
                    <div className="rounded-full bg-surface p-[2px]">
                      {avatarEl}
                    </div>
                    <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-green-400 border-2 border-surface rounded-full" />
                  </div>
                )
              } else if (friend.activity === 'upcoming') {
                bubbleEl = (
                  <div className="p-[2.5px] rounded-full bg-pink-500">
                    <div className="rounded-full bg-surface p-[2px]">
                      {avatarEl}
                    </div>
                  </div>
                )
              } else if (friend.activity === 'upcoming_private') {
                bubbleEl = (
                  <div className="p-[2.5px] rounded-full bg-green-500">
                    <div className="rounded-full bg-surface p-[2px]">
                      {avatarEl}
                    </div>
                  </div>
                )
              } else {
                bubbleEl = (
                  <div className="p-[2.5px] rounded-full bg-surface-container-high">
                    <div className="rounded-full bg-surface p-[2px]">
                      {avatarEl}
                    </div>
                  </div>
                )
              }

              return (
                <button
                  key={friend.uid}
                  onClick={() => {
                    const storyIdx = storyFriends.findIndex(f => f.uid === friend.uid)
                    if (storyIdx !== -1) {
                      setOverlaySnapshot(storyFriends)
                      setActiveFriendIndex(storyIdx)
                    }
                  }}
                  className="flex flex-col items-center gap-1.5 flex-shrink-0"
                >
                  {bubbleEl}
                  <span className={`text-[10px] font-bold truncate max-w-[64px] text-center font-meta ${isRecap ? 'text-on-surface-variant' : 'text-on-surface'}`}>
                    {friend.name.split(' ')[0]}
                  </span>
                </button>
              )
            })}
          </div>
        </section>
      )}

      {/* Your Upcoming */}
      {upcomingUserEvents.length > 0 && (
        <section className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold tracking-tight text-on-surface">{t('home.yourUpcoming')}</h2>
            {upcomingUserEvents.length > 6 && (
              <button onClick={onSeeAllUpcoming} className="text-sm font-semibold text-primary hover:underline">{t('home.seeAll')}</button>
            )}
          </div>
          <div className="flex gap-4 -mx-4 px-4 overflow-x-auto scrollbar-hide pb-2">
            {upcomingUserEvents.slice(0, 6).map((event) => (
              <UpcomingEventCard key={event.id} event={event} currentUserUid={user?.uid ?? undefined} className="flex-shrink-0 w-72 md:w-80" />
            ))}
          </div>
        </section>
      )}

      {/* Hot Games */}
      {hotGames.length > 0 && (
        <section className="mb-8">
          <HotnessGames games={hotGames} />
        </section>
      )}

      {/* Recommended Events */}
      <section className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-on-surface">{t('home.recommendedEvents')}</h2>
            <p className="text-xs text-on-surface-variant mt-0.5">{t('home.recommendedSubtitle')}</p>
          </div>
          {exploreEvents.length > 6 && (
            <button onClick={onSeeAllRecommended} className="text-sm font-semibold text-primary hover:underline flex-shrink-0 self-start">{t('home.seeAll')}</button>
          )}
        </div>
        {exploreEvents.length > 0 ? (
          <div className="flex gap-4 -mx-4 px-4 overflow-x-auto scrollbar-hide pb-2">
            {exploreEvents.slice(0, 6).map((event) => (
              <UpcomingEventCard key={event.id} event={event} currentUserUid={user?.uid ?? undefined} className="flex-shrink-0 w-72 md:w-80" />
            ))}
          </div>
        ) : (
          <p className="text-sm text-on-surface-variant py-4">{t('home.noRecommendedEvents')}</p>
        )}
      </section>

      {/* Friends are Selling */}
      {friendListings.length > 0 && (
        <section className="mb-8">
          <FriendSalesCarousel listings={friendListings} onSeeAll={onSeeAllListings} />
        </section>
      )}

      {showEmptyState && <EmptyState tab="friends" />}
    </div>
  )
}

function DiceIllustration() {
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
      <circle cx="40" cy="40" r="40" className="fill-primary-container/30" />
      {/* Dice body */}
      <rect x="20" y="20" width="40" height="40" rx="8" className="fill-primary-container/60" />
      <rect x="20" y="20" width="40" height="40" rx="8" className="stroke-primary/50" strokeWidth="2.5" fill="none" />
      {/* Dots — 5 pattern */}
      <circle cx="31" cy="31" r="3.5" className="fill-primary" />
      <circle cx="49" cy="31" r="3.5" className="fill-primary" />
      <circle cx="40" cy="40" r="3.5" className="fill-primary" />
      <circle cx="31" cy="49" r="3.5" className="fill-primary" />
      <circle cx="49" cy="49" r="3.5" className="fill-primary" />
    </svg>
  )
}
