'use client'
import { useState, useEffect } from 'react'
import { getHostToken } from '@/lib/hostToken'

export function useHostToken(eventId: string) {
  const [hostToken, setHostToken] = useState<string | null>(null)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    setHostToken(getHostToken(eventId))
    setChecked(true)
  }, [eventId])

  return { hostToken, checked }
}
