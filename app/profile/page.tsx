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
import { ActivityGrid } from '@/components/profile/ActivityGrid'
import { auth } from '@/lib/firebase/client'
import { Analytics } from '@/lib/analytics'
import type { GameTable } from '@/types'

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
  const [hostedTables, setHostedEvents] = useState<GameTable[]>([])
  const [joinedTables, setJoinedEvents] = useState<GameTable[]>([])
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
  const [skillLevel, setSkillLevel] = useState<'casual' | 'intermediate' | 'hardcore' | null>(null)
  const [savingSkill, setSavingSkill] = useState(false)

  useEffect(() => {
    if (!loading && !user) router.replace('/')
  }, [user, loading, router])

  useEffect(() => {
    if (!user) return
    fetch(`/api/users/${user.uid}/tables`)
      .then((r) => r.json())
      .then((data) => {
        const hosted = data.hosted ?? []
        const joined = data.joined ?? []
        setHostedEvents(hosted)
        setJoinedEvents(joined)
        setStats({
          hosted: hosted.length,
          played: joined.length,
          friends: data.friendCount ?? 0,
        })
      })
      .catch(() => setStats({ hosted: 0, played: 0, friends: 0 }))

    fetch(`/api/users/${user.uid}`)
      .then((r) => r.json())
      .then((data) => {
        setBio(data.bio ?? '')
        setSkillLevel(data.skillLevel ?? null)
      })
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
        Analytics.locationSharingToggled({ enabled: false })
      } else {
        if (!navigator.geolocation) return
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            await authedFetch('/api/profile/location', {
              method: 'POST',
              body: JSON.stringify({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            })
            setLocationSharing(true)
            Analytics.locationSharingToggled({ enabled: true })
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

  const saveSkillLevel = async (level: 'casual' | 'intermediate' | 'hardcore' | null) => {
    if (!user || savingSkill) return
    setSavingSkill(true)
    try {
      const res = await authedFetch(`/api/users/${user.uid}`, {
        method: 'PATCH',
        body: JSON.stringify({ skillLevel: level }),
      })
      if (res.ok) { setSkillLevel(level); Analytics.skillLevelSet({ skill_level: level ?? 'none' }) }
    } finally {
      setSavingSkill(false)
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
    <main className="min-h-screen bg-surface px-4 py-10">
      <div className="max-w-lg mx-auto space-y-4">
        <div>
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-on-surface bg-surface-container-high px-3.5 py-2 rounded-[0.75rem] hover:bg-surface-container-highest transition-colors">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            {t('profile.home')}
          </Link>
        </div>

        {/* Profile card */}
        <div className="bg-surface-container-high rounded-[1.5rem] p-8">
          <div className="flex items-center gap-5 mb-6">
            {user.photoURL ? (
              <Image src={user.photoURL} alt={user.displayName ?? 'User'} width={72} height={72} className="rounded-full" />
            ) : (
              <div className="w-18 h-18 rounded-full bg-primary-container flex items-center justify-center text-2xl font-semibold text-primary">
                {user.displayName?.[0] ?? '?'}
              </div>
            )}
            <div>
              <h1 className="text-xl font-extrabold text-on-surface tracking-[-0.02em]">{user.displayName}</h1>
              <p className="text-sm text-on-surface-variant font-meta mt-0.5">{user.email}</p>
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
                  className="w-full px-3 py-2 text-sm bg-surface-container ghost-border rounded-[0.75rem] text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-on-surface-variant/60 font-meta">{bioInput.length}/160</span>
                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm" onClick={() => setEditingBio(false)}>{t('profile.cancel')}</Button>
                    <Button size="sm" onClick={saveBio} loading={savingBio}>{t('profile.save')}</Button>
                  </div>
                </div>
              </div>
            ) : (
              <button onClick={() => { setBioInput(bio); setEditingBio(true) }} className="w-full text-left group">
                {bio ? (
                  <p className="text-sm text-on-surface group-hover:text-on-surface/80 transition-colors">{bio}</p>
                ) : (
                  <p className="text-sm text-on-surface-variant/50 italic group-hover:text-on-surface-variant transition-colors">{t('profile.addBio')}</p>
                )}
              </button>
            )}
          </div>

          {/* Skill level */}
          <div className="mb-6">
            <p className="text-xs font-medium text-on-surface-variant mb-2">{t('skillLevel.label')}</p>
            <div className="flex gap-2">
              {(['casual', 'intermediate', 'hardcore'] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => saveSkillLevel(skillLevel === level ? null : level)}
                  disabled={savingSkill}
                  className={`flex-1 py-2 px-1 text-xs font-medium rounded-[0.75rem] transition-colors disabled:opacity-50 ${
                    skillLevel === level
                      ? 'bg-primary-container text-on-primary-container'
                      : 'bg-surface-container-highest text-on-surface-variant hover:bg-surface-container-highest/70'
                  }`}
                >
                  {t(`skillLevel.${level}`)}
                </button>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 py-4 mb-6">
            <div className="flex flex-col items-center gap-0.5 bg-surface-container rounded-[1.5rem] py-4">
              <span className="text-xl font-extrabold text-primary tracking-[-0.02em]">{stats?.hosted ?? 0}</span>
              <span className="text-xs text-on-surface-variant font-meta">{t('profile.hosted')}</span>
            </div>
            <div className="flex flex-col items-center gap-0.5 bg-surface-container rounded-[1.5rem] py-4">
              <span className="text-xl font-extrabold text-primary tracking-[-0.02em]">{stats?.played ?? 0}</span>
              <span className="text-xs text-on-surface-variant font-meta">{t('profile.played')}</span>
            </div>
            <div className="flex flex-col items-center gap-0.5 bg-surface-container rounded-[1.5rem] py-4">
              <span className="text-xl font-extrabold text-primary tracking-[-0.02em]">{stats?.friends ?? 0}</span>
              <span className="text-xs text-on-surface-variant font-meta">{t('profile.friends')}</span>
            </div>
          </div>

          {/* Location sharing */}
          <div className="pt-2 pb-4 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-on-surface">{t('profile.shareLocation')}</p>
                <p className="text-xs text-on-surface-variant/60 font-meta mt-0.5">{t('profile.shareLocationDesc')}</p>
              </div>
              <button
                onClick={toggleLocation}
                disabled={togglingLocation || locationSharing === null}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${locationSharing ? 'bg-primary' : 'bg-surface-container-highest'} disabled:opacity-50`}
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

        {/* Saved addresses */}
        <div className="bg-surface-container-high rounded-[1.5rem] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-on-surface">{t('profile.savedAddresses')}</h2>
            {!addingAddress && (
              <button
                onClick={() => setAddingAddress(true)}
                className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
              >
                {t('profile.addAddress')}
              </button>
            )}
          </div>

          {addingAddress && (
            <div className="mb-4 space-y-2 p-3 bg-surface-container rounded-[0.75rem]">
              <input
                type="text"
                placeholder={t('profile.labelPlaceholder')}
                value={addrLabel}
                onChange={(e) => setAddrLabel(e.target.value)}
                maxLength={50}
                className="w-full px-3 py-2 text-sm bg-surface-container-high ghost-border rounded-[0.75rem] text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <input
                type="text"
                placeholder={t('profile.addressPlaceholder')}
                autoComplete="street-address"
                value={addrValue}
                onChange={(e) => setAddrValue(e.target.value)}
                maxLength={200}
                className="w-full px-3 py-2 text-sm bg-surface-container-high ghost-border rounded-[0.75rem] text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <div className="flex gap-2 justify-end">
                <Button variant="secondary" size="sm" onClick={() => { setAddingAddress(false); setAddrLabel(''); setAddrValue('') }}>{t('profile.cancel')}</Button>
                <Button size="sm" onClick={saveAddress} loading={savingAddr} disabled={!addrLabel.trim() || !addrValue.trim()}>{t('profile.save')}</Button>
              </div>
            </div>
          )}

          {addresses.length === 0 && !addingAddress ? (
            <p className="text-sm text-on-surface-variant/50 italic">{t('profile.noAddresses')}</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {addresses.map((a) => (
                <li key={a.id} className="flex items-center justify-between py-3 gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-on-surface">{a.label}</p>
                    <p className="text-xs text-on-surface-variant font-meta truncate">{a.address}</p>
                  </div>
                  <button
                    onClick={() => deleteAddress(a.id)}
                    className="flex-shrink-0 text-on-surface-variant/40 hover:text-error transition-colors"
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

        {/* Game collection */}
        <CollectionManager uid={user.uid} authedFetch={authedFetch} isOwner />

        {/* Activity grid */}
        <div className="bg-surface-container-high rounded-[1.5rem] p-6 space-y-4">
          <h2 className="font-semibold text-on-surface">{t('profile.activity')}</h2>
          <ActivityGrid hostedTables={hostedTables} joinedTables={joinedTables} />
        </div>
      </div>
    </main>
  )
}
