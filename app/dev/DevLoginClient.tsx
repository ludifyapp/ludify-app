'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { signInWithCustomToken } from 'firebase/auth'
import { auth } from '@/lib/firebase/client'

const USERS = [
  { uid: 'seed_u_01', name: 'Alice Chen',     email: 'alice@gamenight.test',   bg: 'b6e3f4' },
  { uid: 'seed_u_02', name: 'Bob Martinez',   email: 'bob@gamenight.test',     bg: 'c0aede' },
  { uid: 'seed_u_03', name: 'Carol Johnson',  email: 'carol@gamenight.test',   bg: 'd1d4f9' },
  { uid: 'seed_u_04', name: 'David Kim',      email: 'david@gamenight.test',   bg: 'ffd5dc' },
  { uid: 'seed_u_05', name: 'Emma Wilson',    email: 'emma@gamenight.test',    bg: 'ffdfbf' },
  { uid: 'seed_u_06', name: 'Frank Davis',    email: 'frank@gamenight.test',   bg: 'b6e3f4' },
  { uid: 'seed_u_07', name: 'Grace Lee',      email: 'grace@gamenight.test',   bg: 'c0aede' },
  { uid: 'seed_u_08', name: 'Henry Brown',    email: 'henry@gamenight.test',   bg: 'd1d4f9' },
  { uid: 'seed_u_09', name: 'Iris Taylor',    email: 'iris@gamenight.test',    bg: 'ffd5dc' },
  { uid: 'seed_u_10', name: 'Jack Anderson',  email: 'jack@gamenight.test',    bg: 'ffdfbf' },
  { uid: 'seed_u_11', name: 'Kate Thomas',    email: 'kate@gamenight.test',    bg: 'b6e3f4' },
  { uid: 'seed_u_12', name: 'Leo Garcia',     email: 'leo@gamenight.test',     bg: 'c0aede' },
  { uid: 'seed_u_13', name: 'Maya Robinson',  email: 'maya@gamenight.test',    bg: 'd1d4f9' },
  { uid: 'seed_u_14', name: 'Noah Clark',     email: 'noah@gamenight.test',    bg: 'ffd5dc' },
  { uid: 'seed_u_15', name: 'Olivia White',   email: 'olivia@gamenight.test',  bg: 'ffdfbf' },
  { uid: 'seed_u_16', name: 'Peter Lewis',    email: 'peter@gamenight.test',   bg: 'b6e3f4' },
  { uid: 'seed_u_17', name: 'Quinn Hall',     email: 'quinn@gamenight.test',   bg: 'c0aede' },
  { uid: 'seed_u_18', name: 'Rose Allen',     email: 'rose@gamenight.test',    bg: 'd1d4f9' },
  { uid: 'seed_u_19', name: 'Sam Young',      email: 'sam@gamenight.test',     bg: 'ffd5dc' },
  { uid: 'seed_u_20', name: 'Tina Walker',    email: 'tina@gamenight.test',    bg: 'ffdfbf' },
]

function avatar(name: string, bg: string) {
  return `https://api.dicebear.com/9.x/avataaars/png?seed=${name.split(' ')[0]}&backgroundColor=${bg}`
}

export function DevLoginClient() {
  const router = useRouter()
  const [loadingUid, setLoadingUid] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const signIn = async (uid: string) => {
    setLoadingUid(uid)
    setError(null)
    try {
      const res = await fetch(`/api/dev/token?uid=${uid}`)
      if (!res.ok) throw new Error('Failed to get token')
      const { token } = await res.json()
      await signInWithCustomToken(auth, token)
      router.push('/')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign in failed')
      setLoadingUid(null)
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-zinc-950 px-4 py-10">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3 flex items-center gap-3">
          <svg className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Development / QA only</p>
            <p className="text-xs text-amber-700 dark:text-amber-400">This page is not available in production. Sign in instantly as any test user.</p>
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Test Accounts</h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400">20 seeded users — click any card to sign in immediately.</p>
        </div>

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
            {error}
          </p>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
          {USERS.map((u) => {
            const isLoading = loadingUid === u.uid
            const isDisabled = !!loadingUid
            return (
              <button
                key={u.uid}
                onClick={() => signIn(u.uid)}
                disabled={isDisabled}
                className="flex items-center gap-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-left hover:border-teal-400 dark:hover:border-teal-600 hover:shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Image
                  src={avatar(u.name, u.bg)}
                  alt={u.name}
                  width={40}
                  height={40}
                  className="rounded-full flex-shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-800 dark:text-zinc-100 truncate">{u.name}</p>
                  <p className="text-xs text-slate-400 dark:text-zinc-500 truncate">{u.email}</p>
                </div>
                {isLoading && (
                  <svg className="w-4 h-4 text-teal-500 animate-spin flex-shrink-0" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>
                )}
              </button>
            )
          })}
        </div>

        <p className="text-xs text-slate-400 dark:text-zinc-600 text-center">
          Run <code className="bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-slate-600 dark:text-zinc-300">npm run seed</code> to (re)populate the database.
        </p>
      </div>
    </main>
  )
}
