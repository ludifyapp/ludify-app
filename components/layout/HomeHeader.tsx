'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { auth } from '@/lib/firebase/client'

export function HomeHeader() {
  const { user, loading, signInWithGoogle, signOutUser } = useAuth()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [menuOpen, setMenuOpen] = useState(false)
  const [appearanceOpen, setAppearanceOpen] = useState(false)
  const [pendingInvites, setPendingInvites] = useState(0)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
        setAppearanceOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (!user) { setPendingInvites(0); return }
    auth.currentUser?.getIdToken().then((token) =>
      fetch('/api/invites', { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json())
        .then((data) => {
          const count = (data.invites ?? []).filter((i: any) => i.status === 'pending').length
          setPendingInvites(count)
        })
        .catch(() => {})
    )
  }, [user])

  return (
    <div className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">🎲 Game Night</h1>
      </div>

      <div className="flex items-center gap-2">
        {!loading && (
          <>
            {user ? (
              <>
                <Button size="sm" onClick={() => router.push('/create')}>+ Create</Button>

                <div className="relative ml-1" ref={menuRef}>
                  <button
                    onClick={() => { setMenuOpen((o) => !o); setAppearanceOpen(false) }}
                    className="relative flex items-center rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                  >
                    {user.photoURL ? (
                      <Image
                        src={user.photoURL}
                        alt={user.displayName ?? 'User'}
                        width={40}
                        height={40}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-indigo-200 flex items-center justify-center text-sm font-medium text-indigo-700">
                        {user.displayName?.[0] ?? '?'}
                      </div>
                    )}
                    {pendingInvites > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-white dark:border-gray-900" />
                    )}
                  </button>

                  {menuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 py-1 z-50">
                      <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                        <p className="text-xs font-medium text-gray-900 dark:text-white truncate">{user.displayName}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                      </div>
                      <Link
                        href="/profile"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                        onClick={() => setMenuOpen(false)}
                      >
                        Profile
                      </Link>
                      <Link
                        href="/friends"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                        onClick={() => setMenuOpen(false)}
                      >
                        Friends
                      </Link>
                      <Link
                        href="/invites"
                        className="flex items-center justify-between px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                        onClick={() => setMenuOpen(false)}
                      >
                        <span>Invites</span>
                        {pendingInvites > 0 && (
                          <span className="bg-red-500 text-white text-xs font-semibold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                            {pendingInvites}
                          </span>
                        )}
                      </Link>
                      <Link
                        href="/my-events"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                        onClick={() => setMenuOpen(false)}
                      >
                        My Events
                      </Link>
                      <Link
                        href="/settings"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                        onClick={() => setMenuOpen(false)}
                      >
                        Settings
                      </Link>

                      {/* Switch appearance */}
                      <div className="border-t border-gray-100 dark:border-gray-700 mt-1 pt-1">
                        <button
                          onClick={() => setAppearanceOpen((o) => !o)}
                          className="w-full flex items-center justify-between px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="4" />
                              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
                            </svg>
                            Switch appearance
                          </div>
                          <svg
                            className={`w-3.5 h-3.5 text-gray-400 transition-transform ${appearanceOpen ? 'rotate-180' : ''}`}
                            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
                          >
                            <path d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>

                        {appearanceOpen && (
                          <div className="mx-2 mb-1 rounded-lg overflow-hidden border border-gray-100 dark:border-gray-700">
                            {(['light', 'dark', 'system'] as const).map((opt) => (
                              <button
                                key={opt}
                                onClick={() => { setTheme(opt); setAppearanceOpen(false); setMenuOpen(false) }}
                                className={`w-full flex items-center justify-between px-3 py-2 text-sm transition-colors ${
                                  theme === opt
                                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-medium'
                                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/60'
                                }`}
                              >
                                <div className="flex items-center gap-2.5">
                                  {opt === 'light' && (
                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
                                      <circle cx="12" cy="12" r="4" />
                                      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
                                    </svg>
                                  )}
                                  {opt === 'dark' && (
                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
                                    </svg>
                                  )}
                                  {opt === 'system' && (
                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
                                      <rect x="2" y="3" width="20" height="14" rx="2" />
                                      <path d="M8 21h8M12 17v4" />
                                    </svg>
                                  )}
                                  <span className="capitalize">{opt}</span>
                                </div>
                                {theme === opt && (
                                  <svg className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="border-t border-gray-100 dark:border-gray-700 mt-1 pt-1">
                        <button
                          onClick={() => { setMenuOpen(false); signOutUser() }}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30"
                        >
                          Sign out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <button
                  onClick={signInWithGoogle}
                  className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 font-medium"
                >
                  Sign in
                </button>
                <Button size="sm" disabled title="Sign in to create an event">+ Create</Button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
