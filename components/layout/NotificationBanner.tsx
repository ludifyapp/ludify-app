'use client'
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

export function NotificationBanner() {
  const { t } = useTranslation()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Only run on client
    if (!('Notification' in window)) return
    
    // Check if user dismissed it this session
    const dismissed = sessionStorage.getItem('notificationBannerDismissed')
    if (dismissed) return

    // If notifications aren't granted or denied yet, show banner
    if (Notification.permission === 'default') {
      setIsVisible(true)
    }
  }, [])

  const handleClose = () => {
    sessionStorage.setItem('notificationBannerDismissed', 'true')
    setIsVisible(false)
  }

  const handleEnable = async () => {
    if (!('Notification' in window)) return
    try {
      await Notification.requestPermission()
      // App's existing service worker / subscription logic handles the push side elsewhere 
      // or will prompt during user flow.
    } catch (e) {
      console.error(e)
    }
    setIsVisible(false) // Whether granted or denied, hide it
  }

  if (!isVisible) return null

  return (
    <div className="bg-teal-600 dark:bg-teal-700 text-white px-4 py-3 flex items-center justify-between shadow-md relative z-50">
      <div className="flex-1 text-sm font-medium pr-4">
        {t('notificationBanner.text')}
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <button onClick={handleEnable} className="bg-white text-teal-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-teal-50 transition-colors">
          {t('notificationBanner.enable')}
        </button>
        <button onClick={handleClose} className="text-teal-100 hover:text-white transition-colors" aria-label={t('notificationBanner.dismiss')}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}
