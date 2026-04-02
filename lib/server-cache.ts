interface Entry<T> { data: T; expiresAt: number }

export function createTTLCache<T>() {
  const store = new Map<string, Entry<T>>()
  return {
    get(key: string): T | null {
      const e = store.get(key)
      if (!e || Date.now() >= e.expiresAt) { store.delete(key); return null }
      return e.data
    },
    set(key: string, data: T, ttlMs: number) {
      store.set(key, { data, expiresAt: Date.now() + ttlMs })
    },
    delete(key: string) { store.delete(key) },
  }
}
