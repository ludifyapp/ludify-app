'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/contexts/AuthContext'
import { Spinner } from '@/components/ui/Spinner'
import { usePushNotifications } from '@/hooks/usePushNotifications'
import { auth } from '@/lib/firebase/client'
import { Analytics } from '@/lib/analytics'

interface Preferences {
  invites: boolean
  joinLeave: boolean
}

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none disabled:opacity-40 ${
        checked ? 'bg-primary' : 'bg-surface-container-highest'
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  )
}

export default function SettingsPage() {
  const { t } = useTranslation()
  const { user, loading } = useAuth()
  const router = useRouter()
  const { supported, permission, isSubscribed, loading: pushLoading, subscribe, unsubscribe } = usePushNotifications()
  const [prefs, setPrefs] = useState<Preferences>({ invites: true, joinLeave: true })
  const [prefsLoading, setPrefsLoading] = useState(false)

  useEffect(() => {
    if (!loading && !user) router.replace('/')
  }, [user, loading, router])

  // Load preferences from server when subscribed
  useEffect(() => {
    if (!user || !isSubscribed) return
    auth.currentUser?.getIdToken().then((token) =>
      fetch('/api/push/subscribe', { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json())
        .then((data) => {
          if (data.preferences) setPrefs(data.preferences)
        })
        .catch(() => {})
    )
  }, [user, isSubscribed])

  async function updatePref(key: keyof Preferences, value: boolean) {
    Analytics.notificationPrefChanged({ pref: key, enabled: value })
    const next = { ...prefs, [key]: value }
    setPrefs(next)
    try {
      const token = await auth.currentUser?.getIdToken()
      await fetch('/api/push/subscribe', {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences: next }),
      })
    } catch {}
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  const browserBlocked = permission === 'denied'
  const notificationsActive = supported && isSubscribed && !browserBlocked

  return (
    <main className="min-h-screen bg-surface px-4 py-10">
      <div className="max-w-lg mx-auto">
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-on-surface bg-surface-container-high px-3.5 py-2 rounded-[0.75rem] hover:bg-surface-container-highest transition-colors">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            {t('settings.home')}
          </Link>
        </div>

        <h1 className="text-2xl font-extrabold text-on-surface tracking-[-0.02em] mb-6">{t('settings.title')}</h1>

        <div className="bg-surface-container-high rounded-[1.5rem] overflow-hidden">
          <div className="px-6 py-4">
            <h2 className="text-sm font-semibold text-on-surface-variant/60 uppercase tracking-wide font-meta">{t('settings.notifications')}</h2>
          </div>

          {/* Master browser toggle */}
          {supported && !browserBlocked && (
            <div className="px-6 py-4 flex items-center justify-between hover:bg-surface-container-highest transition-colors">
              <div>
                <p className="text-sm font-medium text-on-surface">{t('settings.browserNotifications')}</p>
                <p className="text-xs text-on-surface-variant/60 font-meta mt-0.5">
                  {isSubscribed ? t('settings.notificationsEnabled') : t('settings.enableNotifications')}
                </p>
              </div>
              <Toggle
                checked={isSubscribed}
                onChange={(v) => { Analytics.notificationsToggled({ enabled: v }); v ? subscribe() : unsubscribe() }}
                disabled={pushLoading}
              />
            </div>
          )}

          {browserBlocked && (
            <div className="px-6 py-4">
              <p className="text-sm text-on-surface-variant">
                {t('settings.notificationsBlocked')}{' '}
                <span className="text-on-surface font-medium">{t('settings.enableInBrowser')}</span>
              </p>
            </div>
          )}

          {!supported && (
            <div className="px-6 py-4">
              <p className="text-sm text-on-surface-variant">{t('settings.notificationsNotSupported')}</p>
            </div>
          )}

          {/* Invite notifications */}
          <div className="px-6 py-4 flex items-center justify-between hover:bg-surface-container-highest transition-colors">
            <div>
              <p className={`text-sm font-medium ${notificationsActive ? 'text-on-surface' : 'text-on-surface-variant/40'}`}>
                {t('settings.eventInvites')}
              </p>
              <p className="text-xs text-on-surface-variant/60 font-meta mt-0.5">{t('settings.eventInvitesDesc')}</p>
            </div>
            <Toggle
              checked={notificationsActive ? prefs.invites : false}
              onChange={(v) => updatePref('invites', v)}
              disabled={!notificationsActive || prefsLoading}
            />
          </div>

          {/* Join/leave notifications */}
          <div className="px-6 py-4 flex items-center justify-between hover:bg-surface-container-highest transition-colors">
            <div>
              <p className={`text-sm font-medium ${notificationsActive ? 'text-on-surface' : 'text-on-surface-variant/40'}`}>
                {t('settings.playerActivity')}
              </p>
              <p className="text-xs text-on-surface-variant/60 font-meta mt-0.5">{t('settings.playerActivityDesc')}</p>
            </div>
            <Toggle
              checked={notificationsActive ? prefs.joinLeave : false}
              onChange={(v) => updatePref('joinLeave', v)}
              disabled={!notificationsActive || prefsLoading}
            />
          </div>
        </div>
      </div>
    </main>
  )
}
