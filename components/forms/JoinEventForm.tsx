'use client'
import { useState } from 'react'
import Image from 'next/image'
import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/contexts/AuthContext'
import type { EffectiveStatus } from '@/types'

interface JoinEventFormProps {
  onJoin: (name: string) => Promise<void>
  status: EffectiveStatus
}

export function JoinEventForm({ onJoin, status }: JoinEventFormProps) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [joined, setJoined] = useState(false)

  if (joined) {
    return (
      <div className="bg-tertiary-container rounded-[1.5rem] p-4 text-center">
        <p className="text-on-tertiary-container font-medium">{t('joinForm.youreIn')}</p>
        <p className="text-on-tertiary-container/70 text-sm mt-1">{t('joinForm.youveJoined')}</p>
      </div>
    )
  }

  if (status === 'ended' || status === 'ongoing') {
    return (
      <div className="bg-surface-container-high rounded-[1.5rem] p-4 text-center">
        <p className="text-on-surface font-medium">
          {status === 'ongoing' ? t('joinForm.eventOngoing') : t('joinForm.eventEnded')}
        </p>
      </div>
    )
  }

  if (status === 'cancelled') {
    return (
      <div className="bg-error-container rounded-[1.5rem] p-4 text-center">
        <p className="text-error font-medium">{t('joinForm.eventCancelled')}</p>
      </div>
    )
  }

  if (status === 'full') {
    return (
      <div className="bg-secondary-container rounded-[1.5rem] p-4 text-center">
        <p className="text-on-secondary-container font-medium">{t('joinForm.eventFull')}</p>
        <p className="text-on-secondary-container/70 text-sm mt-1">{t('joinForm.noMoreSpots')}</p>
      </div>
    )
  }

  const handleJoin = async (joinName: string) => {
    setLoading(true)
    setError('')
    try {
      await onJoin(joinName)
      setJoined(true)
    } catch (err) {
      setError((err as Error).message || 'Failed to join. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Logged-in: one-click join using Google display name
  if (user) {
    return (
      <div className="bg-surface-container-high rounded-[1.5rem] p-6">
        <h2 className="font-semibold text-on-surface mb-4">{t('joinForm.joinGameNight')}</h2>
        {status === 'waiting' && (
          <p className="text-sm text-on-primary-container bg-primary-container rounded-[0.75rem] px-3 py-2 mb-4">
            {t('joinForm.waitingNote')}
          </p>
        )}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {user.photoURL ? (
              <Image src={user.photoURL} alt={user.displayName ?? ''} width={36} height={36} className="rounded-full" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-primary-container flex items-center justify-center text-sm font-medium text-primary">
                {user.displayName?.[0] ?? '?'}
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-on-surface">{user.displayName}</p>
              <p className="text-xs text-on-surface-variant/60 font-meta">{user.email}</p>
            </div>
          </div>
          <Button variant="primary" onClick={() => handleJoin(user.displayName ?? user.email ?? 'Guest')} loading={loading}>
            {t('joinForm.join')}
          </Button>
        </div>
        {error && <p className="text-sm text-error mt-3">{error}</p>}
      </div>
    )
  }

  // Guest: name input form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { setError(t('joinForm.enterName')); return }
    await handleJoin(name.trim())
  }

  return (
    <form onSubmit={handleSubmit} className="bg-surface-container-high rounded-[1.5rem] p-6">
      <h2 className="font-semibold text-on-surface mb-4">{t('joinForm.joinGameNight')}</h2>
      {status === 'waiting' && (
        <p className="text-sm text-on-primary-container bg-primary-container rounded-[0.75rem] px-3 py-2 mb-4">
          {t('joinForm.waitingNote')}
        </p>
      )}
      <div className="flex gap-3">
        <div className="flex-1">
          <Input
            placeholder={t('joinForm.yourName')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={error}
          />
        </div>
        <Button type="submit" variant="primary" loading={loading} className="self-start mt-0">
          {t('joinForm.join')}
        </Button>
      </div>
    </form>
  )
}
