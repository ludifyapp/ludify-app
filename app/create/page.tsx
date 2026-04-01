'use client'
import { Suspense, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { CreateEventForm } from '@/components/forms/CreateEventForm'
import { Spinner } from '@/components/ui/Spinner'
import type { BggGame } from '@/types'

export default function CreatePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Spinner className="h-8 w-8" /></div>}>
      <CreatePageInner />
    </Suspense>
  )
}

function CreatePageInner() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/')
    }
  }, [user, loading, router])

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  const bggId = searchParams.get('bggId')
  const gameName = searchParams.get('gameName')
  const thumbnail = searchParams.get('thumbnail')
  const year = searchParams.get('year')

  const initialGame: BggGame | undefined = bggId && gameName
    ? { bggId, name: gameName, thumbnail: thumbnail ?? undefined, yearPublished: year ? Number(year) : null }
    : undefined

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 px-4 py-10">
      <div className="max-w-lg mx-auto">
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-zinc-200 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 px-3.5 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800 shadow-sm transition-colors">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            Back
          </Link>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Create an Event</h1>
          <CreateEventForm initialGame={initialGame} />
        </div>
      </div>
    </main>
  )
}
