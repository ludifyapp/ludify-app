'use client'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { Analytics } from '@/lib/analytics'

interface OnboardingModalProps {
  onExplore: () => void
  onDismiss: () => void
}

export function OnboardingModal({ onExplore, onDismiss }: OnboardingModalProps) {
  const { t } = useTranslation()

  const dismiss = (skipped = false) => {
    onDismiss()
    if (skipped) Analytics.onboardingSkipped()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-surface-container rounded-[1.5rem] card-shadow overflow-hidden">
        {/* Header */}
        <div className="bg-primary-container px-6 pt-8 pb-6 text-on-primary-container text-center">
          <div className="text-4xl mb-3">🎲</div>
          <h2 className="text-xl font-bold">{t('onboarding.welcome')}</h2>
          <p className="text-sm text-on-primary-container/70 mt-1.5 leading-relaxed">
            {t('onboarding.tagline')}
          </p>
        </div>

        {/* Action cards */}
        <div className="px-5 py-5 space-y-3">
          <button
            onClick={() => { dismiss(); Analytics.onboardingActionTaken({ action: 'browse_events' }); onExplore() }}
            className="w-full flex items-center gap-4 p-4 rounded-[1.5rem] bg-surface-container-high hover:bg-surface-container-highest transition-colors text-left group"
          >
            <div className="w-10 h-10 rounded-[0.75rem] bg-surface-container-highest flex items-center justify-center flex-shrink-0 text-xl">📅</div>
            <div>
              <p className="text-sm font-semibold text-on-surface group-hover:text-primary transition-colors">{t('onboarding.browseTables')}</p>
              <p className="text-xs text-on-surface-variant/60">{t('onboarding.browseTablesDesc')}</p>
            </div>
          </button>

          <Link
            href="/profile"
            onClick={() => { dismiss(); Analytics.onboardingActionTaken({ action: 'add_collection' }) }}
            className="w-full flex items-center gap-4 p-4 rounded-[1.5rem] bg-surface-container-high hover:bg-surface-container-highest transition-colors group"
          >
            <div className="w-10 h-10 rounded-[0.75rem] bg-surface-container-highest flex items-center justify-center flex-shrink-0 text-xl">🃏</div>
            <div>
              <p className="text-sm font-semibold text-on-surface group-hover:text-primary transition-colors">{t('onboarding.addCollection')}</p>
              <p className="text-xs text-on-surface-variant/60">{t('onboarding.addCollectionDesc')}</p>
            </div>
          </Link>

          <Link
            href="/friends"
            onClick={() => { dismiss(); Analytics.onboardingActionTaken({ action: 'find_friends' }) }}
            className="w-full flex items-center gap-4 p-4 rounded-[1.5rem] bg-surface-container-high hover:bg-surface-container-highest transition-colors group"
          >
            <div className="w-10 h-10 rounded-[0.75rem] bg-surface-container-highest flex items-center justify-center flex-shrink-0 text-xl">👥</div>
            <div>
              <p className="text-sm font-semibold text-on-surface group-hover:text-primary transition-colors">{t('onboarding.findFriends')}</p>
              <p className="text-xs text-on-surface-variant/60">{t('onboarding.findFriendsDesc')}</p>
            </div>
          </Link>
        </div>

        <div className="px-5 pb-6">
          <button
            onClick={() => dismiss(true)}
            className="w-full text-sm text-on-surface-variant hover:text-on-surface transition-colors py-1"
          >
            {t('onboarding.skip')}
          </button>
        </div>
      </div>
    </div>
  )
}
