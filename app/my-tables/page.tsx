'use client'
import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { GameTable, EffectiveStatus } from '@/types'
import { formatDateTime, getEffectiveStatus } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { db } from '@/lib/firebase/client'
import { Spinner } from '@/components/ui/Spinner'
import { useTranslation } from 'react-i18next'

type TableWithRole = GameTable & { role: 'host' | 'guest' }

export default function MyTablesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Spinner className="h-8 w-8" /></div>}>
      <MyTablesPageInner />
    </Suspense>
  )
}

function MyTablesPageInner() {
  const { user, loading: authLoading } = useAuth()
  const searchParams = useSearchParams()
  const filterBggId = searchParams.get('bggId')
  const filterGameName = searchParams.get('gameName')
  const [gameFilter, setGameFilter] = useState<{ bggId: string; name: string } | null>(
    filterBggId && filterGameName ? { bggId: filterBggId, name: filterGameName } : null
  )
  const [tables, setTables] = useState<TableWithRole[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    if (!user) { setLoading(false); return }

    const load = async () => {
      // Single query: all tables where the user is a player (host or guest)
      const snap = await getDocs(
        query(collection(db, 'tables'), where('playerUids', 'array-contains', user.uid))
      )
      const all = snap.docs
        .map((d) => {
          const data = d.data() as Omit<GameTable, 'id'>
          return {
            id: d.id,
            ...data,
            role: (data.hostUid === user.uid ? 'host' : 'guest') as 'host' | 'guest',
          }
        })
        .sort((a, b) => {
          // Put full tables at the end
          const aFull = getEffectiveStatus(a) === 'full' ? 1 : 0
          const bFull = getEffectiveStatus(b) === 'full' ? 1 : 0
          if (aFull !== bFull) return aFull - bFull
          
          // Then sort by date
          return new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime()
        })

      setTables(all)
      setLoading(false)
    }

    load()
  }, [user, authLoading])

  const filteredTables = gameFilter
    ? tables.filter((e) => e.boardGame?.bggId === gameFilter.bggId)
    : tables

  const upcoming = filteredTables.filter((e) => ['waiting', 'full'].includes(getEffectiveStatus(e)))
  const ongoing = filteredTables.filter((e) => getEffectiveStatus(e) === 'ongoing')

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 px-4 py-10">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-zinc-200 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 px-3.5 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800 shadow-sm transition-colors">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            Home
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Tables</h1>
        </div>

        {/* Game filter badge */}
        {gameFilter && (
          <div className="mb-4 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-sm font-medium px-3 py-1.5 rounded-full">
              🎲 {gameFilter.name}
              <button
                onClick={() => setGameFilter(null)}
                className="ml-1 hover:text-indigo-900 dark:hover:text-indigo-100 transition-colors"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </span>
          </div>
        )}

        {loading || authLoading ? (
          <div className="flex justify-center py-16">
            <Spinner className="h-8 w-8" />
          </div>
        ) : !user ? (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <p className="text-gray-700 dark:text-gray-200 font-medium">Sign in to see your tables</p>
          </div>
        ) : upcoming.length === 0 && ongoing.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <p className="text-4xl mb-3">🎲</p>
            <p className="text-gray-700 dark:text-gray-200 font-medium">No tables yet</p>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Tables you create or join will appear here.</p>
            <Link href="/create">
              <button className="mt-5 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700">
                Create Table
              </button>
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {ongoing.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-indigo-500 dark:text-indigo-400 uppercase tracking-wide mb-3">Ongoing</h2>
                <div className="space-y-2">
                  {ongoing.map((table) => <TableRow key={table.id} table={table} />)}
                </div>
              </section>
            )}
            {upcoming.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Upcoming</h2>
                <div className="space-y-2">
                  {upcoming.map((table) => <TableRow key={table.id} table={table} />)}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </main>
  )
}

const badgeStyles: Record<EffectiveStatus, string> = {
  waiting:   'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
  full:      'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-300',
  ongoing:   'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
  ended:     'bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-white/40',
  cancelled: 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-300',
}

const badgeLabels: Record<EffectiveStatus, string> = {
  waiting:   'Waiting',
  full:      'Full',
  ongoing:   'Ongoing',
  ended:     'Ended',
  cancelled: 'Cancelled',
}

function TableRow({ table }: { table: TableWithRole }) {
  const { i18n } = useTranslation()
  const effectiveStatus = getEffectiveStatus(table)
  const router = useRouter()
  return (
    <div
      role="button"
      onClick={() => router.push(`/table/${table.id}`)}
      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 flex items-center gap-3 hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-sm transition-all cursor-pointer"
    >
      <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
        <span className="text-lg">🎲</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-gray-900 dark:text-white">{table.boardGame.name}</p>
          <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
            table.role === 'host' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
          }`}>
            {table.role === 'host' ? 'Host' : 'Guest'}
          </span>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">{formatDateTime(table.dateTime, i18n.language)}</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{table.address}</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badgeStyles[effectiveStatus]}`}>
          {badgeLabels[effectiveStatus]}
        </span>
        {table.role === 'host' && (
          <Link
            href={`/table/${table.id}/manage`}
            className="text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:underline"
          >
            Manage →
          </Link>
        )}
      </div>
    </div>
  )
}
