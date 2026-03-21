'use client'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { Analytics } from '@/lib/analytics'

interface ShareLinkProps {
  eventId: string
  eventName: string
  onInviteFriends: () => void
}

export function ShareLink({ eventId, eventName, onInviteFriends }: ShareLinkProps) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)

  const url = typeof window !== 'undefined'
    ? `${window.location.origin}/event/${eventId}`
    : `/event/${eventId}`

  const handleCopy = async () => {
    Analytics.shareLinkCopied({ event_id: eventId })
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback
      const input = document.createElement('input')
      input.value = url
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleWhatsApp = () => {
    Analytics.shareLinkCopied({ event_id: eventId }) // Track generic share copy as proxy if dedicated not available, or just ignore. 
    const text = t('share.whatsappText', 'Join my game night for {{game}}! {{url}}', { game: eventName, url })
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  return (
    <div className="flex flex-row gap-2 sm:gap-3">
      <Button variant="secondary" onClick={onInviteFriends} className="flex-1 justify-center py-2.5 sm:py-3 h-auto px-2 sm:px-4">
        <svg className="w-5 h-5 sm:mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
        <span className="hidden sm:inline">{t('event.inviteFriends', 'Invite Friends')}</span>
      </Button>
      <Button variant="secondary" onClick={handleCopy} className="flex-1 justify-center py-2.5 sm:py-3 h-auto px-2 sm:px-4">
        <svg className="w-5 h-5 sm:mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
        <span className="hidden sm:inline">{copied ? t('share.copied', 'Copied!') : t('share.copyLink', 'Copy Link')}</span>
      </Button>
      <Button variant="secondary" onClick={handleWhatsApp} className="flex-1 justify-center py-2.5 sm:py-3 h-auto px-2 sm:px-4 text-[#25D366] hover:bg-green-50 dark:hover:bg-green-900/20 border-gray-200 dark:border-gray-700">
        <svg className="w-5 h-5 sm:mr-2" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zm-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437-9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
        <span className="hidden sm:inline">WhatsApp</span>
      </Button>
    </div>
  )
}
