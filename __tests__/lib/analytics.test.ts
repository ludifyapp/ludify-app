import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock firebase/analytics before importing the module under test
const mockLogEvent = vi.fn()
const mockIsSupported = vi.fn()
const mockGetAnalytics = vi.fn()

vi.mock('firebase/analytics', () => ({
  getAnalytics: mockGetAnalytics,
  logEvent: mockLogEvent,
  isSupported: mockIsSupported,
}))

vi.mock('@/lib/firebase/client', () => ({
  app: {},
}))

// Helper: reset the module singleton and reimport Analytics
async function freshAnalytics() {
  vi.resetModules()
  const mod = await import('@/lib/analytics')
  return mod.Analytics
}

describe('Analytics helpers', () => {
  const fakeInstance = { name: 'analytics' }

  beforeEach(() => {
    vi.resetModules()
    mockLogEvent.mockClear()
    mockGetAnalytics.mockReturnValue(fakeInstance)
    mockIsSupported.mockResolvedValue(true)
    // Ensure NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID is set
    process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID = 'G-TEST'
  })

  it('login fires login table with method param', async () => {
    const Analytics = await freshAnalytics()
    Analytics.login('google')
    await vi.waitFor(() => expect(mockLogEvent).toHaveBeenCalledWith(fakeInstance, 'login', { method: 'google' }))
  })

  it('tableJoined fires table_joined with correct params', async () => {
    const Analytics = await freshAnalytics()
    Analytics.tableJoined({ table_id: 'e1', game: 'Wingspan' })
    await vi.waitFor(() =>
      expect(mockLogEvent).toHaveBeenCalledWith(fakeInstance, 'table_joined', { table_id: 'e1', game: 'Wingspan' })
    )
  })

  it('listingViewed fires listing_viewed with correct params', async () => {
    const Analytics = await freshAnalytics()
    Analytics.listingViewed({ listing_id: 'l1', game: 'Catan' })
    await vi.waitFor(() =>
      expect(mockLogEvent).toHaveBeenCalledWith(fakeInstance, 'listing_viewed', { listing_id: 'l1', game: 'Catan' })
    )
  })

  it('does not throw when analytics is unsupported', async () => {
    mockIsSupported.mockResolvedValue(false)
    const Analytics = await freshAnalytics()
    await expect(async () => Analytics.signOut()).not.toThrow()
  })

  it('does not throw when isSupported rejects', async () => {
    mockIsSupported.mockRejectedValue(new Error('blocked'))
    const Analytics = await freshAnalytics()
    await expect(async () => Analytics.themeSwitched({ theme: 'dark' })).not.toThrow()
  })
})
