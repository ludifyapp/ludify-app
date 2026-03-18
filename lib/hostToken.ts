const HOST_KEY_PREFIX = 'host_token_'
const PLAYER_KEY_PREFIX = 'player_id_'

// Keep old name for compatibility
export const KEY_PREFIX = HOST_KEY_PREFIX

export function saveHostToken(eventId: string, token: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(`${HOST_KEY_PREFIX}${eventId}`, token)
}

export function getHostToken(eventId: string): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(`${HOST_KEY_PREFIX}${eventId}`)
}

export function savePlayerId(eventId: string, playerId: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(`${PLAYER_KEY_PREFIX}${eventId}`, playerId)
}

export function getJoinedEventIds(): string[] {
  if (typeof window === 'undefined') return []
  const ids: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key?.startsWith(PLAYER_KEY_PREFIX)) {
      ids.push(key.replace(PLAYER_KEY_PREFIX, ''))
    }
  }
  return ids
}

export function getHostedEventIds(): string[] {
  if (typeof window === 'undefined') return []
  const ids: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key?.startsWith(HOST_KEY_PREFIX)) {
      ids.push(key.replace(HOST_KEY_PREFIX, ''))
    }
  }
  return ids
}
