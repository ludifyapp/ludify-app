'use client'
import { useState, useEffect } from 'react'
import { BggGame } from '@/types'

export function useBggSearch(query: string) {
  const [results, setResults] = useState<BggGame[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([])
      return
    }

    const controller = new AbortController()
    const timer = setTimeout(async () => {
      setIsLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/bgg/search?q=${encodeURIComponent(query)}`, {
          signal: controller.signal,
        })
        const data = await res.json()
        setResults(data.games ?? [])
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setError('Search failed')
        }
      } finally {
        setIsLoading(false)
      }
    }, 350)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [query])

  return { results, isLoading, error }
}
