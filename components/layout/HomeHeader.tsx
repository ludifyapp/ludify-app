'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { auth } from '@/lib/firebase/client'

export function HomeHeader() {
  const { user, loading, signInWithGoogle, signOutUser } = useAuth()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [pendingInvites, setPendingInvites] = useState(0)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
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
        <h1 className="text-3xl font-bold text-gray-900">🎲 Game Night</h1>
        <p className="text-gray-500 text-sm mt-1">Upcoming events</p>
      </div>

      <div className="flex items-center gap-2">
        {!loading && (
          <>
            {user ? (
              <>
                <Button size="sm" onClick={() => router.push('/create')}>+ Create</Button>

                <div className="relative ml-1" ref={menuRef}>
                  <button
                    onClick={() => setMenuOpen((o) => !o)}
                    className="relative flex items-center rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  >
                    {user.photoURL ? (
                      <Image
                        src={user.photoURL}
                        alt={user.displayName ?? 'User'}
                        width={32}
                        height={32}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-indigo-200 flex items-center justify-center text-sm font-medium text-indigo-700">
                        {user.displayName?.[0] ?? '?'}
                      </div>
                    )}
                    {pendingInvites > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-white" />
                    )}
                  </button>

                  {menuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-xs font-medium text-gray-900 truncate">{user.displayName}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                      <Link
                        href="/profile"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setMenuOpen(false)}
                      >
                        Profile
                      </Link>
                      <Link
                        href="/friends"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setMenuOpen(false)}
                      >
                        Friends
                      </Link>
                      <Link
                        href="/invites"
                        className="flex items-center justify-between px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
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
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setMenuOpen(false)}
                      >
                        My Events
                      </Link>
                      <button
                        onClick={() => { setMenuOpen(false); signOutUser() }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <button
                  onClick={signInWithGoogle}
                  className="text-sm text-gray-500 hover:text-gray-700 font-medium"
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
