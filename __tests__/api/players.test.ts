// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Use vi.hoisted so mock variables are accessible inside vi.mock factories
const { mockGet, mockUpdate, mockGetDecodedToken } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockUpdate: vi.fn(),
  mockGetDecodedToken: vi.fn(),
}))

vi.mock('@/lib/firebase/admin', () => ({
  db: {
    collection: () => ({ doc: () => ({ get: mockGet, update: mockUpdate }) }),
  },
}))

vi.mock('firebase-admin/firestore', () => ({
  FieldValue: {
    arrayUnion: (...args: unknown[]) => args[0],
  },
}))

vi.mock('@/lib/api-auth', () => ({
  getDecodedToken: mockGetDecodedToken,
}))

vi.mock('@/lib/push', () => ({
  sendPushToUser: vi.fn().mockResolvedValue(undefined),
}))

import { POST } from '@/app/api/events/[id]/players/route'

function makeRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/events/evt1/players', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function makeParams(id = 'evt1') {
  return { params: Promise.resolve({ id }) }
}

const futureEvent = {
  status: 'active',
  dateTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
  endDateTime: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
  maxPlayers: 4,
  players: [],
  playerUids: [],
  hostUid: 'host1',
  boardGame: { name: 'Catan' },
  address: '123 Main St',
}

describe('POST /api/events/[id]/players', () => {
  beforeEach(() => {
    mockGetDecodedToken.mockResolvedValue(null)
    mockGet.mockReset()
    mockUpdate.mockReset()
    mockUpdate.mockResolvedValue(undefined)
  })

  it('returns 404 when event does not exist', async () => {
    mockGet.mockResolvedValue({ exists: false })
    const res = await POST(makeRequest({ name: 'Alice' }), makeParams())
    expect(res.status).toBe(404)
    const json = await res.json()
    expect(json.error).toMatch(/not found/i)
  })

  it('returns 400 when name is missing', async () => {
    mockGet.mockResolvedValue({ exists: true, data: () => futureEvent })
    const res = await POST(makeRequest({}), makeParams())
    expect(res.status).toBe(400)
  })

  it('returns 400 when name is empty string', async () => {
    mockGet.mockResolvedValue({ exists: true, data: () => futureEvent })
    const res = await POST(makeRequest({ name: '' }), makeParams())
    expect(res.status).toBe(400)
  })

  it('returns 409 when authenticated user has already joined', async () => {
    mockGetDecodedToken.mockResolvedValue({ uid: 'user1', picture: null })
    mockGet.mockResolvedValue({
      exists: true,
      data: () => ({ ...futureEvent, playerUids: ['user1'] }),
    })
    const res = await POST(makeRequest({ name: 'Alice' }), makeParams())
    expect(res.status).toBe(409)
    const json = await res.json()
    expect(json.error).toMatch(/already joined/i)
  })

  it('returns 409 for cancelled event', async () => {
    mockGet.mockResolvedValue({
      exists: true,
      data: () => ({ ...futureEvent, status: 'cancelled' }),
    })
    const res = await POST(makeRequest({ name: 'Alice' }), makeParams())
    expect(res.status).toBe(409)
    const json = await res.json()
    expect(json.error).toMatch(/cancelled/i)
  })

  it('returns 409 for ended event', async () => {
    mockGet.mockResolvedValue({
      exists: true,
      data: () => ({
        ...futureEvent,
        dateTime: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        endDateTime: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      }),
    })
    const res = await POST(makeRequest({ name: 'Alice' }), makeParams())
    expect(res.status).toBe(409)
    const json = await res.json()
    expect(json.error).toMatch(/ended/i)
  })

  it('returns 409 for ongoing event', async () => {
    mockGet.mockResolvedValue({
      exists: true,
      data: () => ({
        ...futureEvent,
        dateTime: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        endDateTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      }),
    })
    const res = await POST(makeRequest({ name: 'Alice' }), makeParams())
    expect(res.status).toBe(409)
    const json = await res.json()
    expect(json.error).toMatch(/ongoing/i)
  })

  it('returns 409 for full event', async () => {
    mockGet.mockResolvedValue({
      exists: true,
      data: () => ({
        ...futureEvent,
        maxPlayers: 2,
        players: [
          { id: 'p1', name: 'Bob', isHost: false, joinedAt: '' },
          { id: 'p2', name: 'Carol', isHost: false, joinedAt: '' },
        ],
      }),
    })
    const res = await POST(makeRequest({ name: 'Alice' }), makeParams())
    expect(res.status).toBe(409)
    const json = await res.json()
    expect(json.error).toMatch(/full/i)
  })

  it('returns 201 and calls update for a valid join', async () => {
    mockGet.mockResolvedValue({ exists: true, data: () => futureEvent })
    const res = await POST(makeRequest({ name: 'Alice' }), makeParams())
    expect(res.status).toBe(201)
    expect(mockUpdate).toHaveBeenCalledOnce()
    const json = await res.json()
    expect(json.success).toBe(true)
  })

  it('returns 201 for authenticated user and includes playerUids update', async () => {
    mockGetDecodedToken.mockResolvedValue({ uid: 'user42', picture: null })
    mockGet.mockResolvedValue({ exists: true, data: () => futureEvent })
    const res = await POST(makeRequest({ name: 'Alice' }), makeParams())
    expect(res.status).toBe(201)
    const updateArg = mockUpdate.mock.calls[0][0] as Record<string, unknown>
    expect(updateArg).toHaveProperty('playerUids')
  })
})
