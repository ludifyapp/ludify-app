'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'

const STORAGE_KEY = 'gn_onboarded'

interface OnboardingModalProps {
  onExplore: () => void
}

export function OnboardingModal({ onExplore }: OnboardingModalProps) {
  const { t } = useTranslation()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) setVisible(true)
  }, [])

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, '1')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-teal-500 to-teal-600 px-6 pt-8 pb-6 text-white text-center">
          <div className="text-4xl mb-3">🎲</div>
          <h2 className="text-xl font-bold">{t('onboarding.welcome')}</h2>
          <p className="text-sm text-teal-100 mt-1.5 leading-relaxed">
            {t('onboarding.tagline')}
          </p>
        </div>

        {/* Action cards */}
        <div className="px-5 py-5 space-y-3">
          <button
            onClick={() => { dismiss(); onExplore() }}
            className="w-full flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800 hover:bg-teal-50 dark:hover:bg-teal-900/20 border border-slate-100 dark:border-zinc-700 hover:border-teal-200 dark:hover:border-teal-800 transition-colors text-left group"
          >
            <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center flex-shrink-0 text-xl">📅</div>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-teal-700 dark:group-hover:text-teal-300 transition-colors">{t('onboarding.browseEvents')}</p>
              <p className="text-xs text-slate-500 dark:text-zinc-400">{t('onboarding.browseEventsDesc')}</p>
            </div>
          </button>

          <Link
            href="/profile"
            onClick={dismiss}
            className="w-full flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800 hover:bg-teal-50 dark:hover:bg-teal-900/20 border border-slate-100 dark:border-zinc-700 hover:border-teal-200 dark:hover:border-teal-800 transition-colors group"
          >
            <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center flex-shrink-0 text-xl">🃏</div>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-teal-700 dark:group-hover:text-teal-300 transition-colors">{t('onboarding.addCollection')}</p>
              <p className="text-xs text-slate-500 dark:text-zinc-400">{t('onboarding.addCollectionDesc')}</p>
            </div>
          </Link>

          <Link
            href="/friends"
            onClick={dismiss}
            className="w-full flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800 hover:bg-teal-50 dark:hover:bg-teal-900/20 border border-slate-100 dark:border-zinc-700 hover:border-teal-200 dark:hover:border-teal-800 transition-colors group"
          >
            <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center flex-shrink-0 text-xl">👥</div>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-teal-700 dark:group-hover:text-teal-300 transition-colors">{t('onboarding.findFriends')}</p>
              <p className="text-xs text-slate-500 dark:text-zinc-400">{t('onboarding.findFriendsDesc')}</p>
            </div>
          </Link>
        </div>

        <div className="px-5 pb-6">
          <button
            onClick={dismiss}
            className="w-full text-sm text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300 transition-colors py-1"
          >
            {t('onboarding.skip')}
          </button>
        </div>
      </div>
    </div>
  )
}
