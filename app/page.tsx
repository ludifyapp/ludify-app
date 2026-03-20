'use client'
import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { EventListCard } from '@/components/event/EventListCard'
import { FriendsCarousel } from '@/components/event/FriendsCarousel'
import { ListingCard } from '@/components/marketplace/ListingCard'
import { HomeHeader } from '@/components/layout/HomeHeader'
import { CreateEventCTA } from '@/components/layout/CreateEventCTA'
import { Spinner } from '@/components/ui/Spinner'
import { auth } from '@/lib/firebase/client'
import { getEffectiveStatus } from '@/lib/utils'
import { Analytics } from '@/lib/analytics'
import { RecapCard } from '@/components/event/RecapCard'
import { OnboardingModal } from '@/components/layout/OnboardingModal'
import { NearbyPlayers } from '@/components/players/NearbyPlayers'
import { useTranslation } from 'react-i18next'
import { useFeatureFlags } from '@/contexts/FeatureFlagsContext'
import type { GameEvent, Listing, ListingCondition, Recap } from '@/types'

type Tab = 'friends' | 'explore' | 'joined' | 'mine' | 'marketplace'
type DateFilter = '' | 'today' | 'weekend' | 'week'

function TabIcon({ id, active }: { id: Tab; active: boolean }) {
  const cls = `w-[18px] h-[18px] flex-shrink-0 transition-colors ${active ? 'fill-slate-900 dark:fill-white' : 'fill-slate-400 dark:fill-zinc-500'}`
  if (id === 'friends') return (
    <svg className={cls} viewBox="0 0 24 24">
      <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
    </svg>
  )
  if (id === 'explore') return (
    <svg className={cls} viewBox="0 0 24 24">
      <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
    </svg>
  )
  if (id === 'joined') return (
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
  { id: 'explore',     authOnly: false },
  { id: 'joined',      authOnly: true },
  { id: 'mine',        authOnly: true },
  { id: 'marketplace', authOnly: false },
]

const TAB_LABEL_KEYS: Record<Tab, string> = {
  friends:     'nav.forYou',
  explore:     'nav.explore',
  joined:      'nav.joined',
  mine:        'nav.myEvents',
  marketplace: 'nav.marketplace',
}

async function fetchPublicEvents(): Promise<GameEvent[]> {
  try {
    const res = await fetch('/api/events')
    if (!res.ok) return []
    const data = await res.json()
    return data.events ?? []
  } catch {
    return []
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
  const { t } = useTranslation()
  const { user, loading: authLoading } = useAuth()
  const flags = useFeatureFlags()
  const [tab, setTab] = useState<Tab>('explore')
  const [visibleCount, setVisibleCount] = useState(15)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const [publicEvents, setPublicEvents] = useState<GameEvent[]>([])
  const [userEvents, setUserEvents] = useState<GameEvent[]>([])
  const [friendUids, setFriendUids] = useState<Set<string>>(new Set())
  const [publicLoading, setPublicLoading] = useState(true)
  const [userLoading, setUserLoading] = useState(false)

  const [friendsRecaps, setFriendsRecaps] = useState<Recap[]>([])
  const [onboardingReady, setOnboardingReady] = useState(false)

  // Set default tab once auth resolves
  useEffect(() => {
    if (!authLoading) {
      setTab(user ? 'friends' : 'explore')
      if (user) setOnboardingReady(true) // trigger onboarding check for logged-in users
    }
  }, [authLoading]) // eslint-disable-line react-hooks/exhaustive-deps

  // Fall back to explore if user logs out on an auth-only tab
  useEffect(() => {
    if (!authLoading && !user) setTab('explore')
  }, [user, authLoading])

  useEffect(() => {
    fetchPublicEvents().then(setPublicEvents).finally(() => setPublicLoading(false))
  }, [])

  useEffect(() => {
    if (!user) { setUserEvents([]); setFriendUids(new Set()); setFriendsRecaps([]); return }
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

  const friendsEvents = useMemo(
    () => publicEvents.filter((e) => friendUids.has(e.hostUid)),
    [publicEvents, friendUids]
  )

  const exploreEvents = useMemo(
    () => publicEvents.filter((e) => !friendUids.has(e.hostUid) && e.hostUid !== user?.uid),
    [publicEvents, friendUids, user]
  )

  const joinedEvents = useMemo(
    () =>
      userEvents
        .filter((e) => user && e.hostUid !== user.uid)
        .filter((e) => !['ended', 'cancelled'].includes(getEffectiveStatus(e)))
        .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()),
    [userEvents, user]
  )

  const myEvents = useMemo(
    () =>
      userEvents
        .filter((e) => user && e.hostUid === user.uid)
        .sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime()),
    [userEvents, user]
  )

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

  const [recaps, setRecaps] = useState<Recap[]>([])
  const [recapsLoaded, setRecapsLoaded] = useState(false)

  useEffect(() => {
    if (tab !== 'friends' || recapsLoaded) return
    if (friendUids.size === 0 && !userLoading) {
      setRecapsLoaded(true)
      return
    }
    if (friendUids.size === 0) return // wait for friends to load
    const uids = [...friendUids].slice(0, 30).join(',')
    fetch(`/api/recaps?hostUids=${uids}&limit=10`)
      .then((r) => r.json())
      .then((d) => setRecaps(d.recaps ?? []))
      .catch(() => {})
      .finally(() => setRecapsLoaded(true))
  }, [tab, friendUids, userLoading]) // eslint-disable-line react-hooks/exhaustive-deps

  const visibleTabs = TABS.filter((t) => {
    if (!flags.marketplace && t.id === 'marketplace') return false
    return !t.authOnly || !!user
  })

  const [search, setSearch] = useState('')
  const [dateFilter, setDateFilter] = useState<DateFilter>('')
  const [showAvailableOnly, setShowAvailableOnly] = useState(false)

  // Reset visible count and explore filters when tab changes
  useEffect(() => { setVisibleCount(15); setDateFilter(''); setShowAvailableOnly(false); setSearch('') }, [tab])
  // Reset visible count when search changes
  useEffect(() => { setVisibleCount(15) }, [search])

  // IntersectionObserver: load 15 more when sentinel enters viewport
  const loadMore = useCallback((total: number) => {
    setVisibleCount((c) => Math.min(c + 15, total))
  }, [])

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) loadMore(activeEvents.length) },
      { rootMargin: '200px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }) // intentionally re-runs every render so activeEvents.length stays fresh

  // Track search after 1 s of inactivity (event tabs only; marketplace tracks internally)
  useEffect(() => {
    if (!search.trim() || tab === 'marketplace') return
    const t = setTimeout(() =>
      Analytics.searchPerformed({ query_length: search.trim().length, results_count: activeEvents.length, tab }),
    1000)
    return () => clearTimeout(t)
  }, [search]) // eslint-disable-line react-hooks/exhaustive-deps

  const activeEvents = useMemo(() => {
    let base =
      tab === 'friends' ? friendsEvents
      : tab === 'explore' ? exploreEvents
      : tab === 'joined' ? joinedEvents
      : myEvents

    if (tab === 'explore') {
      if (showAvailableOnly) base = base.filter((e) => getEffectiveStatus(e) !== 'full')
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
            if (day === 0) return d.getTime() === todayStart.getTime() // Sunday = show today
            const sat = new Date(todayStart.getTime() + (6 - day) * 24 * 60 * 60 * 1000)
            const sun = new Date(sat.getTime() + 24 * 60 * 60 * 1000)
            return d.getTime() === sat.getTime() || d.getTime() === sun.getTime()
          }
          return true
        })
      }
    }

    if (!search.trim()) return base
    const q = search.trim().toLowerCase()
    return base.filter((e) => {
      const gameName = e.boardGame.name.toLowerCase()
      const hostName = e.players.find((p) => p.isHost)?.name.toLowerCase() ?? ''
      const location = (e.address ?? '').toLowerCase()
      return gameName.includes(q) || hostName.includes(q) || (tab === 'explore' && location.includes(q))
    })
  }, [tab, friendsEvents, exploreEvents, joinedEvents, myEvents, search, dateFilter, showAvailableOnly])

  const isLoading =
    tab !== 'marketplace' && (
      authLoading ||
      publicLoading ||
      (user && userLoading && (tab === 'joined' || tab === 'mine'))
    )

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-zinc-950">
      <div className="max-w-lg mx-auto px-4 pt-10 pb-4">
        <HomeHeader />
      </div>

      {/* Desktop tab bar — hidden on mobile */}
      <div className="hidden md:block sticky top-0 z-40 bg-slate-50 dark:bg-zinc-950 border-b border-slate-200 dark:border-zinc-800">
        <div className="max-w-2xl mx-auto flex">
          {visibleTabs.map((tb) => (
            <button
              key={tb.id}
              onClick={() => { setTab(tb.id); Analytics.tabSwitched(tb.id) }}
              className={`flex-1 py-3.5 flex flex-row items-center justify-center gap-2.5 text-sm font-semibold transition-colors relative ${
                tab === tb.id ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300'
              }`}
            >
              <TabIcon id={tb.id} active={tab === tb.id} />
              {t(TAB_LABEL_KEYS[tb.id])}
              {tab === tb.id && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-0.5 bg-teal-600 dark:bg-teal-400 rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Search — Explore and Marketplace */}
      {(tab === 'explore' || tab === 'marketplace') && <div className="max-w-lg mx-auto px-4 pt-4">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-500 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={tab === 'marketplace' ? t('home.searchPlaceholderMarketplace') : t('home.searchPlaceholderExplore')}
            className="w-full pl-9 pr-4 py-2 text-sm bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>}

      {/* Explore filters: date + availability */}
      {tab === 'explore' && (
        <div className="max-w-lg mx-auto px-4 pt-2">
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {(['', 'today', 'weekend', 'week'] as DateFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setDateFilter(f)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  dateFilter === f
                    ? 'bg-teal-600 border-teal-600 text-white'
                    : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 hover:border-teal-400'
                }`}
              >
                {f === '' ? t('home.anyTime') : f === 'today' ? t('home.today') : f === 'weekend' ? t('home.weekend') : t('home.thisWeek')}
              </button>
            ))}
            <button
              onClick={() => setShowAvailableOnly((p) => !p)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                showAvailableOnly
                  ? 'bg-teal-600 border-teal-600 text-white'
                  : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 hover:border-teal-400'
              }`}
            >
              {t('home.availableSpots')}
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-lg mx-auto px-4 py-4 pb-24 md:pb-24" style={{ paddingBottom: 'calc(5rem + env(safe-area-inset-bottom))' }}>
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
        ) : (
          <>
            {tab === 'friends' && <FriendsCarousel events={friendsEvents} recaps={friendsRecaps} />}

            {/* Nearby players — Explore tab, logged-in users only */}
            {flags.nearbyPlayers && tab === 'explore' && user && !search.trim() && !dateFilter && !showAvailableOnly && (
              <NearbyPlayers />
            )}

            {/* Recent recaps from friends */}
            {tab === 'friends' && recaps.length > 0 && (
              <div className="mb-2">
                <p className="text-xs font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-3">{t('home.recentGameNights')}</p>
                <div className="flex flex-col gap-4">
                  {recaps.map((r) => <RecapCard key={r.id} recap={r} />)}
                </div>
                {activeEvents.length > 0 && (
                  <p className="text-xs font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mt-5 mb-3">{t('home.upcomingFromFriends')}</p>
                )}
              </div>
            )}

            {activeEvents.length === 0 ? (
              search.trim() ? (
                <div className="text-center py-16 px-6 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800">
                  <div className="flex justify-center mb-5">
                    <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                      <circle cx="40" cy="40" r="40" className="fill-teal-50 dark:fill-teal-900/20" />
                      <circle cx="36" cy="36" r="13" className="fill-teal-100 dark:fill-teal-800/40" />
                      <circle cx="36" cy="36" r="13" className="stroke-teal-400 dark:stroke-teal-500" strokeWidth="3" fill="none" />
                      <line x1="46" y1="46" x2="57" y2="57" className="stroke-teal-500 dark:stroke-teal-400" strokeWidth="4" strokeLinecap="round" />
                      <path d="M31 31l10 10M41 31l-10 10" className="stroke-teal-400 dark:stroke-teal-500" strokeWidth="2.5" strokeLinecap="round" />
                    </svg>
                  </div>
                  <p className="text-slate-700 dark:text-zinc-200 font-semibold">{t('home.noResults', { query: search.trim() })}</p>
                  <p className="text-slate-500 dark:text-zinc-400 text-sm mt-1">{t('home.tryDifferent')}</p>
                </div>
              ) : (
                <EmptyState tab={tab} />
              )
            ) : (
              <div className="flex flex-col gap-6">
                {activeEvents.slice(0, visibleCount).map((event) => (
                  <EventListCard key={event.id} event={event} />
                ))}
                {visibleCount < activeEvents.length && (
                  <div ref={sentinelRef} className="flex justify-center py-4">
                    <Spinner className="h-5 w-5" />
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* FAB — context-aware: Create Event or Sell a Game */}
      {user && (
        <a
          href={flags.marketplace && tab === 'marketplace' ? '/marketplace/create' : '/create'}
          className="fixed right-6 z-50 flex items-center gap-2 bg-gradient-to-b from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 active:from-teal-700 active:to-teal-700 text-white font-semibold text-sm px-5 py-3.5 rounded-2xl shadow-lg shadow-teal-500/30 dark:shadow-teal-900/50 transition-all"
          style={{ bottom: 'max(1.5rem, calc(4rem + env(safe-area-inset-bottom)))' }}
        >
          <svg className="w-5 h-5 md:block" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          {flags.marketplace && tab === 'marketplace' ? (
            <>
              <span className="hidden md:inline">{t('marketplace.sellAGame')}</span>
              <span className="md:hidden">{t('marketplace.sellAGame')}</span>
            </>
          ) : (
            <>
              <span className="hidden md:inline">{t('home.createEvent')}</span>
              <span className="md:hidden">{t('home.create')}</span>
            </>
          )}
        </a>
      )}

      {/* Onboarding modal — shown once to new users */}
      {onboardingReady && (
        <OnboardingModal onExplore={() => setTab('explore')} />
      )}

      {/* Mobile bottom nav — icons only, Instagram-style */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-800"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex items-center">
          {visibleTabs.map((tb) => (
            <button
              key={tb.id}
              onClick={() => { setTab(tb.id); Analytics.tabSwitched(tb.id) }}
              className={`flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-colors ${
                tab === tb.id ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400 dark:text-zinc-500'
              }`}
            >
              <TabIcon id={tb.id} active={tab === tb.id} />
              {tab === tb.id && (
                <span className="w-1 h-1 rounded-full bg-teal-600 dark:bg-teal-400" />
              )}
            </button>
          ))}
        </div>
      </nav>
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
          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
            conditionFilter === ''
              ? 'bg-teal-600 border-teal-600 text-white'
              : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 hover:border-teal-400'
          }`}
        >
          {t('marketplace.all')}
        </button>
        {CONDITIONS.map((c) => (
          <button
            key={c}
            onClick={() => setConditionFilter(c === conditionFilter ? '' : c)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              conditionFilter === c
                ? 'bg-teal-600 border-teal-600 text-white'
                : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 hover:border-teal-400'
            }`}
          >
            {t(`condition.${c}`)}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 px-6 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800">
          <svg className="mx-auto mb-4" width="64" height="64" viewBox="0 0 64 64" fill="none">
            <circle cx="32" cy="32" r="32" className="fill-teal-50 dark:fill-teal-900/20" />
            <rect x="18" y="16" width="28" height="32" rx="3" className="fill-teal-100 dark:fill-teal-800/40 stroke-teal-400 dark:stroke-teal-600" strokeWidth="1.5"/>
            <path d="M24 26h16M24 31h16M24 36h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-teal-400 dark:text-teal-600"/>
          </svg>
          <p className="font-semibold text-slate-700 dark:text-zinc-200">{t('marketplace.noListingsFound')}</p>
          <p className="text-sm text-slate-400 dark:text-zinc-500 mt-1">
            {search || conditionFilter ? t('marketplace.adjustFilters') : t('marketplace.beFirst')}
          </p>
          {user && !search && !conditionFilter && (
            <Link href="/marketplace/create" className="inline-block mt-4 px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-xl hover:bg-teal-700 transition-colors">
              {t('marketplace.listAGame')}
            </Link>
          )}
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-slate-400 dark:text-zinc-500">{t('marketplace.listing', { count: filtered.length })}</p>
            <div className="flex items-center gap-3">
              <select
                value={priceSort}
                onChange={(e) => setPriceSort(e.target.value as PriceSort)}
                className="text-sm bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">{t('marketplace.sortBy')}</option>
                <option value="asc">{t('marketplace.priceLowHigh')}</option>
                <option value="desc">{t('marketplace.priceHighLow')}</option>
              </select>
              {/* Grid / List toggle */}
              <div className="flex rounded-lg border border-slate-200 dark:border-zinc-700 overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 transition-colors ${viewMode === 'grid' ? 'bg-teal-600 text-white' : 'bg-white dark:bg-zinc-900 text-slate-400 dark:text-zinc-500 hover:bg-slate-50 dark:hover:bg-zinc-800'}`}
                  aria-label="Grid view"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="3" width="8" height="8" rx="1"/><rect x="3" y="13" width="8" height="8" rx="1"/><rect x="13" y="13" width="8" height="8" rx="1"/>
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 transition-colors ${viewMode === 'list' ? 'bg-teal-600 text-white' : 'bg-white dark:bg-zinc-900 text-slate-400 dark:text-zinc-500 hover:bg-slate-50 dark:hover:bg-zinc-800'}`}
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

function EmptyState({ tab }: { tab: Tab }) {
  const { t } = useTranslation()
  if (tab === 'friends') return (
    <div className="text-center py-16 px-6 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800">
      <div className="flex justify-center mb-5">
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none" className="text-teal-500">
          <circle cx="40" cy="40" r="40" className="fill-teal-50 dark:fill-teal-900/20" />
          {/* Person 1 */}
          <circle cx="31" cy="30" r="8" className="fill-teal-200 dark:fill-teal-800/60" />
          <path d="M16 55c0-8.284 6.716-15 15-15h1c8.284 0 15 6.716 15 15" className="stroke-teal-300 dark:stroke-teal-700" strokeWidth="3" strokeLinecap="round" fill="none" />
          {/* Person 2 */}
          <circle cx="50" cy="28" r="7" className="fill-teal-400 dark:fill-teal-600/80" />
          <path d="M36 55c0-7.732 6.268-14 14-14h1c7.732 0 14 6.268 14 14" className="stroke-teal-500 dark:stroke-teal-500" strokeWidth="3" strokeLinecap="round" fill="none" />
        </svg>
      </div>
      <p className="text-slate-700 dark:text-zinc-200 font-semibold">{t('emptyState.noFriendEvents')}</p>
      <p className="text-slate-500 dark:text-zinc-400 text-sm mt-1">{t('emptyState.addFriendsHint')}</p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center mt-5">
        <Link href="/friends" className="px-4 py-2.5 bg-teal-600 text-white text-sm font-semibold rounded-xl hover:bg-teal-700 transition-colors">
          {t('emptyState.findFriends')}
        </Link>
        <Link href="?tab=explore" className="px-4 py-2.5 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 text-sm font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-700 transition-colors">
          {t('emptyState.exploreEvents')}
        </Link>
      </div>
    </div>
  )
  if (tab === 'joined') return (
    <div className="text-center py-16 px-6 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800">
      <div className="flex justify-center mb-5">
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
          <circle cx="40" cy="40" r="40" className="fill-teal-50 dark:fill-teal-900/20" />
          {/* Ticket body */}
          <rect x="16" y="28" width="48" height="26" rx="5" className="fill-teal-100 dark:fill-teal-800/40" />
          <rect x="16" y="28" width="48" height="26" rx="5" className="stroke-teal-400 dark:stroke-teal-500" strokeWidth="2.5" fill="none" />
          {/* Perforation */}
          <line x1="34" y1="28" x2="34" y2="54" className="stroke-teal-300 dark:stroke-teal-600" strokeWidth="2" strokeDasharray="3 3" />
          {/* Star on stub */}
          <path d="M25 41l1.5-4.5 1.5 4.5-4-2.7h5z" className="fill-teal-400 dark:fill-teal-400" />
          {/* Lines on main body */}
          <rect x="39" y="35" width="18" height="2.5" rx="1.25" className="fill-teal-300 dark:fill-teal-600" />
          <rect x="39" y="41" width="12" height="2.5" rx="1.25" className="fill-teal-200 dark:fill-teal-700" />
        </svg>
      </div>
      <p className="text-slate-700 dark:text-zinc-200 font-semibold">{t('emptyState.notJoined')}</p>
      <p className="text-slate-500 dark:text-zinc-400 text-sm mt-1">{t('emptyState.browseExplore')}</p>
    </div>
  )
  if (tab === 'mine') return (
    <div className="text-center py-16 px-6 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800">
      <div className="flex justify-center mb-5">
        <DiceIllustration />
      </div>
      <p className="text-slate-700 dark:text-zinc-200 font-semibold">{t('emptyState.noEventsYet')}</p>
      <p className="text-slate-500 dark:text-zinc-400 text-sm mt-1">{t('emptyState.organizeFirst')}</p>
      <CreateEventCTA />
    </div>
  )
  return (
    <div className="text-center py-16 px-6 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800">
      <div className="flex justify-center mb-5">
        <DiceIllustration />
      </div>
      <p className="text-slate-700 dark:text-zinc-200 font-semibold">{t('emptyState.noUpcomingEvents')}</p>
      <p className="text-slate-500 dark:text-zinc-400 text-sm mt-1">{t('emptyState.beFirstOrganize')}</p>
      <CreateEventCTA />
    </div>
  )
}

function DiceIllustration() {
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
      <circle cx="40" cy="40" r="40" className="fill-teal-50 dark:fill-teal-900/20" />
      {/* Dice body */}
      <rect x="20" y="20" width="40" height="40" rx="8" className="fill-teal-100 dark:fill-teal-800/40" />
      <rect x="20" y="20" width="40" height="40" rx="8" className="stroke-teal-400 dark:stroke-teal-500" strokeWidth="2.5" fill="none" />
      {/* Dots — 5 pattern */}
      <circle cx="31" cy="31" r="3.5" className="fill-teal-500 dark:fill-teal-400" />
      <circle cx="49" cy="31" r="3.5" className="fill-teal-500 dark:fill-teal-400" />
      <circle cx="40" cy="40" r="3.5" className="fill-teal-500 dark:fill-teal-400" />
      <circle cx="31" cy="49" r="3.5" className="fill-teal-500 dark:fill-teal-400" />
      <circle cx="49" cy="49" r="3.5" className="fill-teal-500 dark:fill-teal-400" />
    </svg>
  )
}
