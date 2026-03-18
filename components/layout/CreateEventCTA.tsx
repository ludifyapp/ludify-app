'use client'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'

export function CreateEventCTA() {
  const { user } = useAuth()
  const router = useRouter()

  return (
    <Button
      className="mt-5"
      disabled={!user}
      title={!user ? 'Sign in to create an event' : undefined}
      onClick={() => router.push('/create')}
    >
      Create Event
    </Button>
  )
}
