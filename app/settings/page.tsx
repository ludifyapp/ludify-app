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
        checked ? 'bg-indigo-600' : 'bg-gray-200'
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
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="max-w-lg mx-auto">
        <div className="mb-6">
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">← Home</Link>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

        <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100">
          <div className="px-6 py-4">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Notifications</h2>
          </div>

          {/* Master browser toggle */}
          {supported && !browserBlocked && (
            <div className="px-6 py-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Browser notifications</p>
                <p className="text-xs text-gray-500 mt-0.5">
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
              <p className="text-sm text-gray-500">
                Notifications are blocked by your browser.{' '}
                <span className="text-gray-700 font-medium">Enable them in your browser settings.</span>
              </p>
            </div>
          )}

          {!supported && (
            <div className="px-6 py-4">
              <p className="text-sm text-gray-500">Push notifications are not supported in this browser.</p>
            </div>
          )}

          {/* Invite notifications */}
          <div className="px-6 py-4 flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${notificationsActive ? 'text-gray-900' : 'text-gray-400'}`}>
                Event invites
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Notify when a friend invites you to an event</p>
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
              <p className={`text-sm font-medium ${notificationsActive ? 'text-gray-900' : 'text-gray-400'}`}>
                Player activity
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Notify when someone joins or leaves your event</p>
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
