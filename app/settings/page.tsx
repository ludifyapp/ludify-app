'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Spinner } from '@/components/ui/Spinner'
import { usePushNotifications } from '@/hooks/usePushNotifications'
import { auth } from '@/lib/firebase/client'

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
        checked ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-600'
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
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 px-4 py-10">
      <div className="max-w-lg mx-auto">
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-zinc-200 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 px-3.5 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800 shadow-sm transition-colors">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            Home
          </Link>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Settings</h1>

        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
          <div className="px-6 py-4">
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Notifications</h2>
          </div>

          {/* Master browser toggle */}
          {supported && !browserBlocked && (
            <div className="px-6 py-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Browser notifications</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {isSubscribed ? 'Notifications are enabled' : 'Enable to receive push notifications'}
                </p>
              </div>
              <Toggle
                checked={isSubscribed}
                onChange={(v) => v ? subscribe() : unsubscribe()}
                disabled={pushLoading}
              />
            </div>
          )}

          {browserBlocked && (
            <div className="px-6 py-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Notifications are blocked by your browser.{' '}
                <span className="text-gray-700 dark:text-gray-200 font-medium">Enable them in your browser settings.</span>
              </p>
            </div>
          )}

          {!supported && (
            <div className="px-6 py-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">Push notifications are not supported in this browser.</p>
            </div>
          )}

          {/* Invite notifications */}
          <div className="px-6 py-4 flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${notificationsActive ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-600'}`}>
                Event invites
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Notify when a friend invites you to an event</p>
            </div>
            <Toggle
              checked={notificationsActive ? prefs.invites : false}
              onChange={(v) => updatePref('invites', v)}
              disabled={!notificationsActive || prefsLoading}
            />
          </div>

          {/* Join/leave notifications */}
          <div className="px-6 py-4 flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${notificationsActive ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-600'}`}>
                Player activity
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Notify when someone joins or leaves your event</p>
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
