import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import React from 'react'

// Use vi.hoisted so the variables are available inside vi.mock factories
const { mockFetchAndActivate, mockGetBoolean, mockGetRemoteConfig } = vi.hoisted(() => ({
  mockFetchAndActivate: vi.fn(),
  mockGetBoolean: vi.fn(),
  mockGetRemoteConfig: vi.fn(),
}))

vi.mock('firebase/remote-config', () => ({
  getRemoteConfig: mockGetRemoteConfig,
  fetchAndActivate: mockFetchAndActivate,
  getBoolean: mockGetBoolean,
}))

vi.mock('@/lib/firebase/client', () => ({
  app: {},
}))

import { FeatureFlagsProvider, useFeatureFlags } from '@/contexts/FeatureFlagsContext'

const fakeRc = { settings: {}, defaultConfig: {} }

function wrapper({ children }: { children: React.ReactNode }) {
  return <FeatureFlagsProvider>{children}</FeatureFlagsProvider>
}

describe('FeatureFlagsContext', () => {
  beforeEach(() => {
    mockGetRemoteConfig.mockReturnValue(fakeRc)
    mockGetBoolean.mockReset()
    mockFetchAndActivate.mockReset()
  })

  it('defaults all flags to true before fetch completes', () => {
    // fetchAndActivate never resolves in this test
    mockFetchAndActivate.mockReturnValue(new Promise(() => {}))

    const { result } = renderHook(() => useFeatureFlags(), { wrapper })
    expect(result.current.marketplace).toBe(true)
    expect(result.current.nearbyPlayers).toBe(true)
    expect(result.current.dms).toBe(true)
  })

  it('applies Remote Config values after a successful fetch', async () => {
    mockFetchAndActivate.mockResolvedValue(true)
    mockGetBoolean.mockImplementation((_rc: unknown, key: string) => {
      if (key === 'marketplace_enabled') return false
      if (key === 'nearby_players_enabled') return true
      if (key === 'dms_enabled') return false
      return true
    })

    const { result } = renderHook(() => useFeatureFlags(), { wrapper })

    await waitFor(() => {
      expect(result.current.marketplace).toBe(false)
      expect(result.current.nearbyPlayers).toBe(true)
      expect(result.current.dms).toBe(false)
    })
  })

  it('keeps default flags (all true) when fetch throws', async () => {
    mockFetchAndActivate.mockRejectedValue(new Error('network error'))

    const { result } = renderHook(() => useFeatureFlags(), { wrapper })

    // Give any async state updates a chance to settle
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10))
    })

    expect(result.current.marketplace).toBe(true)
    expect(result.current.nearbyPlayers).toBe(true)
    expect(result.current.dms).toBe(true)
  })
})
