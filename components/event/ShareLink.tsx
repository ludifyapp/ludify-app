'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'

interface ShareLinkProps {
  eventId: string
}

export function ShareLink({ eventId }: ShareLinkProps) {
  const [copied, setCopied] = useState(false)

  const url = typeof window !== 'undefined'
    ? `${window.location.origin}/event/${eventId}`
    : `/event/${eventId}`

  const handleCopy = async () => {
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

  return (
    <div className="flex items-center gap-2">
      <input
        readOnly
        value={url}
        className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 truncate"
      />
      <Button variant="secondary" size="sm" onClick={handleCopy} className="flex-shrink-0">
        {copied ? '✓ Copied!' : 'Copy Link'}
      </Button>
    </div>
  )
}
