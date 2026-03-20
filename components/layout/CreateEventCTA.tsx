'use client'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'

export function CreateEventCTA() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const router = useRouter()

  return (
    <Button
      className="mt-5"
      disabled={!user}
      title={!user ? t('createEventCTA.signInToCreate') : undefined}
      onClick={() => router.push('/create')}
    >
      {t('createEventCTA.createEvent')}
    </Button>
  )
}
