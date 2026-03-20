'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/contexts/AuthContext'
import { Spinner } from '@/components/ui/Spinner'
import { Button } from '@/components/ui/Button'
import { CollectionManager } from '@/components/profile/CollectionManager'
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
  const { t } = useTranslation()
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
  const [locationSharing, setLocationSharing] = useState<boolean | null>(null) // null = unknown
  const [togglingLocation, setTogglingLocation] = useState(false)

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

    // Check if location is already stored
    fetch(`/api/users/${user.uid}`)
      .then((r) => r.json())
      .then((data) => setLocationSharing(!!data.geoEnabled))
      .catch(() => {})
  }, [user])

  const toggleLocation = async () => {
    if (togglingLocation) return
    setTogglingLocation(true)
    try {
      if (locationSharing) {
        await authedFetch('/api/profile/location', { method: 'DELETE' })
        setLocationSharing(false)
      } else {
        if (!navigator.geolocation) return
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            await authedFetch('/api/profile/location', {
              method: 'POST',
              body: JSON.stringify({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            })
            setLocationSharing(true)
            setTogglingLocation(false)
          },
          () => setTogglingLocation(false),
          { timeout: 10_000 }
        )
        return // geolocation callback handles setTogglingLocation
      }
    } finally {
      setTogglingLocation(false)
    }
  }

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
    <main className="min-h-screen bg-slate-50 dark:bg-zinc-950 px-4 py-10">
      <div className="max-w-lg mx-auto space-y-4">
        <div>
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-zinc-200 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 px-3.5 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800 shadow-sm transition-colors">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            {t('profile.home')}
          </Link>
        </div>

        {/* Profile card */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800 p-8">
          <div className="flex items-center gap-5 mb-6">
            {user.photoURL ? (
              <Image src={user.photoURL} alt={user.displayName ?? 'User'} width={72} height={72} className="rounded-full" />
            ) : (
              <div className="w-18 h-18 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center text-2xl font-semibold text-teal-700 dark:text-teal-300">
                {user.displayName?.[0] ?? '?'}
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">{user.displayName}</h1>
              <p className="text-sm text-slate-500 dark:text-zinc-400 mt-0.5">{user.email}</p>
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
                  placeholder={t('profile.tellAboutYourself')}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 dark:text-zinc-500">{bioInput.length}/160</span>
                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm" onClick={() => setEditingBio(false)}>{t('profile.cancel')}</Button>
                    <Button size="sm" onClick={saveBio} loading={savingBio}>{t('profile.save')}</Button>
                  </div>
                </div>
              </div>
            ) : (
              <button onClick={() => { setBioInput(bio); setEditingBio(true) }} className="w-full text-left group">
                {bio ? (
                  <p className="text-sm text-slate-700 dark:text-zinc-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{bio}</p>
                ) : (
                  <p className="text-sm text-slate-400 dark:text-zinc-500 italic group-hover:text-slate-600 dark:group-hover:text-zinc-300 transition-colors">{t('profile.addBio')}</p>
                )}
              </button>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 divide-x divide-slate-100 dark:divide-zinc-800 border-t border-b border-slate-100 dark:border-zinc-800 py-4 mb-6">
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-xl font-bold text-slate-900 dark:text-white">{stats?.hosted ?? '—'}</span>
              <span className="text-xs text-slate-500 dark:text-zinc-400">{t('profile.hosted')}</span>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-xl font-bold text-slate-900 dark:text-white">{stats?.played ?? '—'}</span>
              <span className="text-xs text-slate-500 dark:text-zinc-400">{t('profile.played')}</span>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-xl font-bold text-slate-900 dark:text-white">{stats?.friends ?? '—'}</span>
              <span className="text-xs text-slate-500 dark:text-zinc-400">{t('profile.friends')}</span>
            </div>
          </div>

          {/* Location sharing */}
          <div className="pt-2 pb-4 border-b border-slate-100 dark:border-zinc-800 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">{t('profile.shareLocation')}</p>
                <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">{t('profile.shareLocationDesc')}</p>
              </div>
              <button
                onClick={toggleLocation}
                disabled={togglingLocation || locationSharing === null}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900 ${locationSharing ? 'bg-teal-600' : 'bg-slate-200 dark:bg-zinc-700'} disabled:opacity-50`}
                aria-label={locationSharing ? t('profile.disableLocation') : t('profile.enableLocation')}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${locationSharing ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>

          <div className="pt-2">
            <Button variant="danger" onClick={signOutUser} className="w-full">{t('profile.signOut')}</Button>
          </div>
        </div>

        {/* Game collection */}
        <CollectionManager uid={user.uid} authedFetch={authedFetch} />

        {/* Saved addresses */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900 dark:text-white">{t('profile.savedAddresses')}</h2>
            {!addingAddress && (
              <button
                onClick={() => setAddingAddress(true)}
                className="text-sm font-medium text-teal-600 dark:text-teal-400 hover:text-teal-800 dark:hover:text-teal-300 transition-colors"
              >
                {t('profile.addAddress')}
              </button>
            )}
          </div>

          {addingAddress && (
            <div className="mb-4 space-y-2 p-3 bg-slate-50 dark:bg-zinc-800/50 rounded-xl">
              <input
                type="text"
                placeholder={t('profile.labelPlaceholder')}
                value={addrLabel}
                onChange={(e) => setAddrLabel(e.target.value)}
                maxLength={50}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <input
                type="text"
                placeholder={t('profile.addressPlaceholder')}
                autoComplete="street-address"
                value={addrValue}
                onChange={(e) => setAddrValue(e.target.value)}
                maxLength={200}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <div className="flex gap-2 justify-end">
                <Button variant="secondary" size="sm" onClick={() => { setAddingAddress(false); setAddrLabel(''); setAddrValue('') }}>{t('profile.cancel')}</Button>
                <Button size="sm" onClick={saveAddress} loading={savingAddr} disabled={!addrLabel.trim() || !addrValue.trim()}>{t('profile.save')}</Button>
              </div>
            </div>
          )}

          {addresses.length === 0 && !addingAddress ? (
            <p className="text-sm text-slate-400 dark:text-zinc-500 italic">{t('profile.noAddresses')}</p>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-zinc-800">
              {addresses.map((a) => (
                <li key={a.id} className="flex items-center justify-between py-3 gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{a.label}</p>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 truncate">{a.address}</p>
                  </div>
                  <button
                    onClick={() => deleteAddress(a.id)}
                    className="flex-shrink-0 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                    aria-label={t('profile.deleteAddress')}
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
