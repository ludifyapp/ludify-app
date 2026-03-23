'use client'
import { useEffect, useState } from 'react'
import { Analytics } from '@/lib/analytics'

const DISMISSED_KEY = 'gn_pwa_dismissed'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function PWAInstallPrompt() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Don't show if already dismissed or already installed (standalone mode)
    if (localStorage.getItem(DISMISSED_KEY)) return
    if (window.matchMedia('(display-mode: standalone)').matches) return

    const handler = (e: Event) => {
      e.preventDefault()
      setPrompt(e as BeforeInstallPromptEvent)
      // Show after a brief delay so it doesn't pop up immediately on first load
      setTimeout(() => setVisible(true), 3000)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!prompt) return
    Analytics.pwaInstallClicked()
    await prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'accepted') {
      Analytics.pwaInstallAccepted()
      setVisible(false)
    }
    setPrompt(null)
  }

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, '1')
    Analytics.pwaInstallDismissed()
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40 md:left-auto md:right-6 md:w-80">
      <div className="bg-surface-container rounded-[1.5rem] ghost-border card-shadow p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-[0.75rem] bg-primary-container flex items-center justify-center flex-shrink-0 text-xl">
          🎲
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-on-surface">Add to Home Screen</p>
          <p className="text-xs text-on-surface-variant mt-0.5">Play faster — no browser needed</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleDismiss}
            className="text-xs text-on-surface-variant hover:text-on-surface transition-colors px-1 py-1"
            aria-label="Dismiss"
          >
            ✕
          </button>
          <button
            onClick={handleInstall}
            className="text-xs font-semibold bg-secondary hover:brightness-110 text-on-secondary px-3 py-1.5 rounded-[0.75rem] transition-all"
          >
            Install
          </button>
        </div>
      </div>
    </div>
  )
}
