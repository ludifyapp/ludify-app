'use client'
import { useState, useEffect } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase/client'
import { GameTable } from '@/types'

export function useTable(tableId: string) {
  const [table, setTable] = useState<GameTable | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, 'tables', tableId),
      (snap) => {
        if (snap.exists()) {
          setTable({ id: snap.id, ...snap.data() } as GameTable)
        } else {
          setError('Table not found')
        }
        setLoading(false)
      },
      () => {
        setError('Failed to load table')
        setLoading(false)
      }
    )
    return unsubscribe
  }, [tableId])

  return { table, loading, error }
}
