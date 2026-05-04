import { describe, it, expect } from 'vitest'
import { getEffectiveStatus, cn, formatDateTimeInput, isSameDay } from '@/lib/utils'
import type { GameTable } from '@/types'

// Minimal GameTable factory
function makeEvent(overrides: Partial<GameTable> = {}): GameTable {
  return {
    id: 'evt1',
    boardGame: { bggId: '1', name: 'Catan', thumbnail: null, yearPublished: 1995, minPlayers: 3, maxPlayers: 4, playingTime: 90, description: '', categories: [], mechanics: [] },
    dateTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour from now
    address: '123 Main St',
    minPlayers: 3,
    maxPlayers: 4,
    type: 'public',
    status: 'active',
    hostUid: 'host1',
    playerUids: [],
    players: [],
    createdAt: new Date().toISOString(),
    ...overrides,
  }
}

describe('getEffectiveStatus', () => {
  it('returns cancelled when status is cancelled', () => {
    const table = makeEvent({ status: 'cancelled' })
    expect(getEffectiveStatus(table)).toBe('cancelled')
  })

  it('returns ended when now is past end of start day (no endDateTime)', () => {
    // Table started yesterday
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const table = makeEvent({ dateTime: yesterday.toISOString() })
    expect(getEffectiveStatus(table)).toBe('ended')
  })

  it('returns ended when now is past explicit endDateTime', () => {
    const past = new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
    const table = makeEvent({
      dateTime: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      endDateTime: past.toISOString(),
    })
    expect(getEffectiveStatus(table)).toBe('ended')
  })

  it('returns ongoing when now is between start and end', () => {
    const start = new Date(Date.now() - 30 * 60 * 1000) // started 30 min ago
    const end = new Date(Date.now() + 60 * 60 * 1000)   // ends in 1 hour
    const table = makeEvent({ dateTime: start.toISOString(), endDateTime: end.toISOString() })
    expect(getEffectiveStatus(table)).toBe('ongoing')
  })

  it('returns full when table is in the future and at max capacity', () => {
    const table = makeEvent({
      maxPlayers: 2,
      players: [
        { id: 'p1', name: 'Alice', isHost: false, joinedAt: '' },
        { id: 'p2', name: 'Bob',   isHost: false, joinedAt: '' },
      ],
    })
    expect(getEffectiveStatus(table)).toBe('full')
  })

  it('returns waiting for a future table with open spots', () => {
    const table = makeEvent({ maxPlayers: 4, players: [] })
    expect(getEffectiveStatus(table)).toBe('waiting')
  })
})

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('handles conditional classes', () => {
    expect(cn('base', false && 'hidden', 'visible')).toBe('base visible')
  })

  it('deduplicates tailwind conflicts', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4')
  })

  it('handles undefined/null gracefully', () => {
    expect(cn('a', undefined, null, 'b')).toBe('a b')
  })
})

describe('formatDateTimeInput', () => {
  it('returns the first 16 chars of an ISO string', () => {
    expect(formatDateTimeInput('2025-06-15T14:30:00.000Z')).toBe('2025-06-15T14:30')
  })
})

describe('isSameDay', () => {
  it('returns true for the same date at different times', () => {
    expect(isSameDay('2025-06-15T08:00:00', '2025-06-15T23:59:00')).toBe(true)
  })

  it('returns false for different dates', () => {
    expect(isSameDay('2025-06-15T10:00:00', '2025-06-16T10:00:00')).toBe(false)
  })
})
