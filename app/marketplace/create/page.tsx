'use client'
import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Spinner } from '@/components/ui/Spinner'
import { CreateListingForm } from '@/components/marketplace/CreateListingForm'

export default function CreateListingPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) router.replace('/')
  }, [user, loading, router])

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-zinc-950 px-4 py-10">
      <div className="max-w-lg mx-auto">
        <div className="mb-6">
          <Link href="/marketplace" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-zinc-200 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 px-3.5 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800 shadow-sm transition-colors">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            Marketplace
          </Link>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">List a Game for Sale</h1>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800 p-6">
          <CreateListingForm />
        </div>
      </div>
    </main>
  )
}
