'use client'
import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { auth } from '@/lib/firebase/client'
import { Spinner } from '@/components/ui/Spinner'
import { Analytics } from '@/lib/analytics'

interface NearbyPlayer {
  uid: string
  displayName: string
  photoURL: string
  distanceKm: number
  topGames: string[]
  skillLevel: 'casual' | 'intermediate' | 'hardcore' | null
}

const SKILL_COLORS = {
  casual:       'bg-primary-container/60 text-on-primary-container',
  intermediate: 'bg-secondary-container/60 text-on-secondary-container',
  hardcore:     'bg-error-container/60 text-error',
}

function formatDist(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`
  return `${km.toFixed(1)} km`
}

export function NearbyPlayers() {
  const { t } = useTranslation()
  const [state, setState] = useState<'idle' | 'requesting' | 'loading' | 'done' | 'error' | 'denied'>('idle')
  const [players, setPlayers] = useState<NearbyPlayer[]>([])
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [radiusKm, setRadiusKm] = useState(20)

  const fetchNearby = useCallback(async (lat: number, lng: number, radius: number) => {
    setState('loading')
    try {
      const token = await auth.currentUser?.getIdToken()
      const res = await fetch(`/api/players/nearby?lat=${lat}&lng=${lng}&radius=${radius}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      const data = await res.json()
      setPlayers(data.players ?? [])
      setState('done')
    } catch {
      setState('error')
    }
  }, [])

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState('error')
      return
    }
    setState('requesting')
    Analytics.nearbyPlayersEnabled()
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        setCoords({ lat, lng })
        // Save location for profile discovery
        const token = await auth.currentUser?.getIdToken()
        fetch('/api/profile/location', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify({ lat, lng }),
        }).catch(() => {})
        fetchNearby(lat, lng, radiusKm)
      },
      (err) => {
        setState(err.code === err.PERMISSION_DENIED ? 'denied' : 'error')
      },
      { timeout: 10_000 }
    )
  }, [fetchNearby, radiusKm])

  // Re-fetch when radius changes (only if we already have coords)
  useEffect(() => {
    if (coords && state === 'done') fetchNearby(coords.lat, coords.lng, radiusKm)
  }, [radiusKm]) // eslint-disable-line react-hooks/exhaustive-deps

  if (state === 'idle') {
    return (
      <div className="bg-surface-container-high rounded-[1.5rem] p-5 flex items-center gap-4">
        <div className="w-10 h-10 rounded-[0.75rem] bg-primary-container flex items-center justify-center flex-shrink-0 text-xl">📍</div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-on-surface text-sm">{t('nearby.findNearby')}</p>
          <p className="text-xs text-on-surface-variant/60 font-meta mt-0.5">{t('nearby.findNearbyDesc')}</p>
        </div>
        <button
          onClick={requestLocation}
          className="flex-shrink-0 px-3.5 py-2 bg-secondary hover:brightness-110 text-on-secondary text-xs font-semibold rounded-[0.75rem] transition-all"
        >
          {t('nearby.enable')}
        </button>
      </div>
    )
  }

  if (state === 'requesting' || state === 'loading') {
    return (
      <div className="bg-surface-container-high rounded-[1.5rem] p-5 flex items-center gap-3">
        <Spinner className="h-5 w-5 flex-shrink-0" />
        <p className="text-sm text-on-surface-variant font-meta">
          {state === 'requesting' ? t('nearby.waitingLocation') : t('nearby.findingPlayers')}
        </p>
      </div>
    )
  }

  if (state === 'denied') {
    return (
      <div className="bg-surface-container-low rounded-[1.5rem] p-4 text-center">
        <p className="text-sm text-on-surface-variant font-meta">{t('nearby.locationDenied')}</p>
      </div>
    )
  }

  if (state === 'error') {
    return (
      <div className="bg-surface-container-low rounded-[1.5rem] p-4 text-center">
        <p className="text-sm text-on-surface-variant font-meta">{t('nearby.locationError')} <button onClick={requestLocation} className="text-primary underline">{t('nearby.tryAgain')}</button></p>
      </div>
    )
  }

  // state === 'done'
  return (
    <div className="bg-surface-container-high rounded-[1.5rem] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 pb-4">
        <div>
          <p className="font-semibold text-on-surface text-sm">{t('nearby.title')}</p>
          <p className="text-xs text-on-surface-variant/60 font-meta mt-0.5">
            {players.length === 0 ? t('nearby.noPlayersFound') : t('nearby.playersWithin', { count: players.length, km: radiusKm })}
          </p>
        </div>
        {/* Radius selector */}
        <select
          value={radiusKm}
          onChange={(e) => { const r = Number(e.target.value); setRadiusKm(r); Analytics.nearbyRadiusChanged({ radius_km: r }) }}
          className="text-xs bg-surface-container-highest ghost-border text-on-surface rounded-[0.75rem] px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {[5, 10, 20, 50].map((r) => (
            <option key={r} value={r}>{r} km</option>
          ))}
        </select>
      </div>

      {players.length === 0 ? (
        <div className="text-center py-10 px-6">
          <p className="text-3xl mb-2">🎲</p>
          <p className="text-sm font-semibold text-on-surface">{t('nearby.noNearbyYet')}</p>
          <p className="text-xs text-on-surface-variant/60 font-meta mt-1">{t('nearby.expandRadius')}</p>
        </div>
      ) : (
        <ul className="flex flex-col">
          {players.map((p) => (
            <li key={p.uid}>
              <Link href={`/profile/${p.uid}`} className="flex items-center gap-3 px-5 py-3.5 hover:bg-surface-container-highest transition-colors">
                {p.photoURL ? (
                  <Image src={p.photoURL} alt={p.displayName} width={40} height={40} className="rounded-full flex-shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-sm font-semibold text-primary flex-shrink-0">
                    {p.displayName[0] ?? '?'}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold text-on-surface truncate">{p.displayName}</p>
                    {p.skillLevel && (
                      <span className={`flex-shrink-0 text-xs font-medium px-1.5 py-0.5 rounded-full ${SKILL_COLORS[p.skillLevel]}`}>
                        {t(`skillLevel.${p.skillLevel}`)}
                      </span>
                    )}
                  </div>
                  {p.topGames.length > 0 && (
                    <p className="text-xs text-on-surface-variant/60 font-meta truncate mt-0.5">
                      {p.topGames.join(' · ')}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0 text-xs text-on-surface-variant/60 font-meta">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                  ~{formatDist(p.distanceKm)}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
