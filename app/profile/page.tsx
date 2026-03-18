'use client'
import { useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Spinner } from '@/components/ui/Spinner'
import { Button } from '@/components/ui/Button'

export default function ProfilePage() {
  const { user, loading, signOutUser } = useAuth()
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
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="max-w-lg mx-auto">
        <div className="mb-6">
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">← Home</Link>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-8">
          <div className="flex items-center gap-5 mb-8">
            {user.photoURL ? (
              <Image
                src={user.photoURL}
                alt={user.displayName ?? 'User'}
                width={72}
                height={72}
                className="rounded-full"
              />
            ) : (
              <div className="w-18 h-18 rounded-full bg-indigo-100 flex items-center justify-center text-2xl font-semibold text-indigo-700">
                {user.displayName?.[0] ?? '?'}
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold text-gray-900">{user.displayName}</h1>
              <p className="text-sm text-gray-500 mt-0.5">{user.email}</p>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <Button variant="danger" onClick={signOutUser} className="w-full">
              Sign out
            </Button>
          </div>
        </div>
      </div>
    </main>
  )
}
