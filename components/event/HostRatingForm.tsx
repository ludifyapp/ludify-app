'use client'
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { auth } from '@/lib/firebase/client'
import { Analytics } from '@/lib/analytics'

interface HostRatingFormProps {
  eventId: string
  hostName: string
}

function StarIcon({ filled, hovered }: { filled: boolean; hovered: boolean }) {
  const active = filled || hovered
  return (
    <svg
      className={`w-8 h-8 transition-colors ${active ? 'text-amber-400' : 'text-slate-200 dark:text-zinc-700'}`}
      viewBox="0 0 24 24"
      fill={active ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={active ? 0 : 1.5}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
    </svg>
  )
}

export function HostRatingForm({ eventId, hostName }: HostRatingFormProps) {
  const { t } = useTranslation()
  const [existingRating, setExistingRating] = useState<number | null | undefined>(undefined)
  const [hovered, setHovered] = useState(0)
  const [selected, setSelected] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    auth.currentUser?.getIdToken().then((token) => {
      fetch(`/api/events/${eventId}/rating`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((d) => setExistingRating(d.rating ? d.rating.score : null))
        .catch(() => setExistingRating(null))
    })
  }, [eventId])

  const submit = async (score: number) => {
    if (submitting) return
    setSelected(score)
    setSubmitting(true)
    try {
      const token = await auth.currentUser?.getIdToken()
      const res = await fetch(`/api/events/${eventId}/rating`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ score }),
      })
      if (res.ok) {
        setSubmitted(true)
        setExistingRating(score)
        Analytics.hostRated({ event_id: eventId, score })
      }
    } finally {
      setSubmitting(false)
    }
  }

  // Still loading existing rating
  if (existingRating === undefined) return null

  const displayScore = existingRating ?? selected

  if (existingRating !== null || submitted) {
    return (
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-xl p-4 flex items-center gap-3">
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map((s) => (
            <svg key={s} className={`w-4 h-4 ${s <= displayScore ? 'text-amber-400' : 'text-slate-200 dark:text-zinc-700'}`} viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
            </svg>
          ))}
        </div>
        <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
          {submitted ? t('hostRating.thanksForRating') : t('hostRating.youRated', { name: hostName, count: existingRating ?? 0 })}
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800 p-6">
      <p className="text-sm font-semibold text-slate-900 dark:text-white mb-1">{t('hostRating.rateHost')}</p>
      <p className="text-xs text-slate-500 dark:text-zinc-400 mb-4">{t('hostRating.howWas', { name: hostName })}</p>
      <div
        className="flex gap-1"
        onMouseLeave={() => setHovered(0)}
      >
        {[1, 2, 3, 4, 5].map((s) => (
          <button
            key={s}
            disabled={submitting}
            onMouseEnter={() => setHovered(s)}
            onClick={() => submit(s)}
            className="transition-transform hover:scale-110 active:scale-95 disabled:opacity-50"
            aria-label={t('hostRating.rateStar', { count: s })}
          >
            <StarIcon filled={s <= selected} hovered={s <= hovered} />
          </button>
        ))}
      </div>
    </div>
  )
}
