'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Spinner } from '@/components/ui/Spinner'
import { Button } from '@/components/ui/Button'
import { auth } from '@/lib/firebase/client'

interface SavedAddress {
  id: string
  label: string
  address: string
}

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

export default function ProfilePage() {
  const { user, loading, signOutUser } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<{ hosted: number; played: number; friends: number } | null>(null)
  const [bio, setBio] = useState<string>('')
  const [editingBio, setEditingBio] = useState(false)
  const [bioInput, setBioInput] = useState('')
  const [savingBio, setSavingBio] = useState(false)
  const [addresses, setAddresses] = useState<SavedAddress[]>([])
  const [addingAddress, setAddingAddress] = useState(false)
  const [addrLabel, setAddrLabel] = useState('')
  const [addrValue, setAddrValue] = useState('')
  const [savingAddr, setSavingAddr] = useState(false)

  useEffect(() => {
    if (!loading && !user) router.replace('/')
  }, [user, loading, router])

  useEffect(() => {
    if (!user) return
    fetch(`/api/users/${user.uid}/events`)
      .then((r) => r.json())
      .then((data) => setStats({
        hosted: (data.hosted ?? []).length,
        played: (data.joined ?? []).length,
        friends: data.friendCount ?? 0,
      }))
      .catch(() => setStats({ hosted: 0, played: 0, friends: 0 }))

    fetch(`/api/users/${user.uid}`)
      .then((r) => r.json())
      .then((data) => setBio(data.bio ?? ''))
      .catch(() => {})

    authedFetch('/api/addresses')
      .then((r) => r.json())
      .then((data) => setAddresses(data.addresses ?? []))
      .catch(() => {})
  }, [user])

  const saveBio = async () => {
    if (!user) return
    setSavingBio(true)
    try {
      const res = await authedFetch(`/api/users/${user.uid}`, {
        method: 'PATCH',
        body: JSON.stringify({ bio: bioInput }),
      })
      if (res.ok) { setBio(bioInput.trim()); setEditingBio(false) }
    } finally {
      setSavingBio(false)
    }
  }

  const saveAddress = async () => {
    if (!addrLabel.trim() || !addrValue.trim()) return
    setSavingAddr(true)
    try {
      const res = await authedFetch('/api/addresses', {
        method: 'POST',
        body: JSON.stringify({ label: addrLabel, address: addrValue }),
      })
      if (res.ok) {
        const data = await res.json()
        setAddresses((prev) => [...prev, data.address])
        setAddrLabel('')
        setAddrValue('')
        setAddingAddress(false)
      }
    } finally {
      setSavingAddr(false)
    }
  }

  const deleteAddress = async (id: string) => {
    await authedFetch(`/api/addresses/${id}`, { method: 'DELETE' })
    setAddresses((prev) => prev.filter((a) => a.id !== id))
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 px-4 py-10">
      <div className="max-w-lg mx-auto space-y-4">
        <div>
          <Link href="/" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">← Home</Link>
        </div>

        {/* Profile card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8">
          <div className="flex items-center gap-5 mb-6">
            {user.photoURL ? (
              <Image src={user.photoURL} alt={user.displayName ?? 'User'} width={72} height={72} className="rounded-full" />
            ) : (
              <div className="w-18 h-18 rounded-full bg-indigo-100 flex items-center justify-center text-2xl font-semibold text-indigo-700">
                {user.displayName?.[0] ?? '?'}
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">{user.displayName}</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{user.email}</p>
            </div>
          </div>

          {/* Bio */}
          <div className="mb-6">
            {editingBio ? (
              <div className="space-y-2">
                <textarea
                  value={bioInput}
                  onChange={(e) => setBioInput(e.target.value)}
                  maxLength={160}
                  rows={3}
                  placeholder="Tell people about yourself…"
                  className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400 dark:text-gray-500">{bioInput.length}/160</span>
                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm" onClick={() => setEditingBio(false)}>Cancel</Button>
                    <Button size="sm" onClick={saveBio} loading={savingBio}>Save</Button>
                  </div>
                </div>
              </div>
            ) : (
              <button onClick={() => { setBioInput(bio); setEditingBio(true) }} className="w-full text-left group">
                {bio ? (
                  <p className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">{bio}</p>
                ) : (
                  <p className="text-sm text-gray-400 dark:text-gray-500 italic group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors">Add a bio…</p>
                )}
              </button>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 divide-x divide-gray-100 dark:divide-gray-700 border-t border-b border-gray-100 dark:border-gray-700 py-4 mb-6">
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-xl font-bold text-gray-900 dark:text-white">{stats?.hosted ?? '—'}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">Hosted</span>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-xl font-bold text-gray-900 dark:text-white">{stats?.played ?? '—'}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">Played</span>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-xl font-bold text-gray-900 dark:text-white">{stats?.friends ?? '—'}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">Friends</span>
            </div>
          </div>

          <div className="pt-2">
            <Button variant="danger" onClick={signOutUser} className="w-full">Sign out</Button>
          </div>
        </div>

        {/* Saved addresses */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 dark:text-white">Saved Addresses</h2>
            {!addingAddress && (
              <button
                onClick={() => setAddingAddress(true)}
                className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
              >
                + Add
              </button>
            )}
          </div>

          {addingAddress && (
            <div className="mb-4 space-y-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <input
                type="text"
                placeholder="Label (e.g. My Home)"
                value={addrLabel}
                onChange={(e) => setAddrLabel(e.target.value)}
                maxLength={50}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <input
                type="text"
                placeholder="Address (e.g. Av. Irarrázaval, Santiago)"
                value={addrValue}
                onChange={(e) => setAddrValue(e.target.value)}
                maxLength={200}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <div className="flex gap-2 justify-end">
                <Button variant="secondary" size="sm" onClick={() => { setAddingAddress(false); setAddrLabel(''); setAddrValue('') }}>Cancel</Button>
                <Button size="sm" onClick={saveAddress} loading={savingAddr} disabled={!addrLabel.trim() || !addrValue.trim()}>Save</Button>
              </div>
            </div>
          )}

          {addresses.length === 0 && !addingAddress ? (
            <p className="text-sm text-gray-400 dark:text-gray-500 italic">No saved addresses yet</p>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-gray-700">
              {addresses.map((a) => (
                <li key={a.id} className="flex items-center justify-between py-3 gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{a.label}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{a.address}</p>
                  </div>
                  <button
                    onClick={() => deleteAddress(a.id)}
                    className="flex-shrink-0 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                    aria-label="Delete address"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  )
}
