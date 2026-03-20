'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { getRemoteConfig, fetchAndActivate, getBoolean } from 'firebase/remote-config'
import { app } from '@/lib/firebase/client'

export interface FeatureFlags {
  marketplace: boolean
  nearbyPlayers: boolean
  dms: boolean
}

const DEFAULTS: FeatureFlags = {
  marketplace: true,
  nearbyPlayers: true,
  dms: true,
}

const FeatureFlagsContext = createContext<FeatureFlags>(DEFAULTS)

export function FeatureFlagsProvider({ children }: { children: React.ReactNode }) {
  const [flags, setFlags] = useState<FeatureFlags>(DEFAULTS)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const rc = getRemoteConfig(app)
    // 1-hour cache in production; 0 in dev so changes apply immediately
    rc.settings.minimumFetchIntervalMillis =
      process.env.NODE_ENV === 'development' ? 0 : 3_600_000
    rc.defaultConfig = {
      marketplace_enabled: true,
      nearby_players_enabled: true,
      dms_enabled: true,
    }

    fetchAndActivate(rc)
      .then(() => {
        setFlags({
          marketplace:    getBoolean(rc, 'marketplace_enabled'),
          nearbyPlayers:  getBoolean(rc, 'nearby_players_enabled'),
          dms:            getBoolean(rc, 'dms_enabled'),
        })
      })
      .catch(() => {
        // Network error or RC not configured — DEFAULTS stay in place
      })
  }, [])

  return (
    <FeatureFlagsContext.Provider value={flags}>
      {children}
    </FeatureFlagsContext.Provider>
  )
}

export function useFeatureFlags(): FeatureFlags {
  return useContext(FeatureFlagsContext)
}
