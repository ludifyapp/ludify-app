'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { GameSearch } from '@/components/bgg/GameSearch'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useTranslation } from 'react-i18next'
import { auth } from '@/lib/firebase/client'
import { Analytics } from '@/lib/analytics'
import type { BggGame, ListingCondition } from '@/types'

const CONDITIONS: ListingCondition[] = ['new', 'like_new', 'good', 'fair', 'poor']

export function CreateListingForm() {
  const { t } = useTranslation()
  const router = useRouter()
  const [game, setGame] = useState<BggGame | null>(null)
  const [condition, setCondition] = useState<ListingCondition>('good')
  const [priceDisplay, setPriceDisplay] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  const validate = () => {
    const e: Record<string, string> = {}
    if (!game) e.game = 'Select a board game'
    const cents = Math.round(parseFloat(priceDisplay) * 100)
    if (!priceDisplay || isNaN(cents) || cents < 1) e.price = 'Enter a valid price'
    if (cents > 9999999) e.price = 'Price is too high'
    if (!location.trim()) e.location = 'Enter a location'
    if (!whatsapp.trim()) e.whatsapp = 'Enter your WhatsApp number'
    else if (!/^\+?[\d\s\-()]{7,20}$/.test(whatsapp.trim())) e.whatsapp = 'Enter a valid phone number'
    return e
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }

    setLoading(true)
    try {
      const token = await auth.currentUser?.getIdToken()
      const cents = Math.round(parseFloat(priceDisplay) * 100)

      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          boardGame: game,
          condition,
          price: cents,
          description: description.trim(),
          location: location.trim(),
          whatsapp: whatsapp.trim(),
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setErrors({ form: data.error ?? 'Something went wrong' })
        return
      }

      const { id } = await res.json()
      Analytics.listingCreated({ game: game!.name, condition, price: cents })
      router.push(`/marketplace/listing/${id}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Game */}
      <GameSearch value={game} onSelect={setGame} error={errors.game} />

      {/* Condition */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-slate-700 dark:text-zinc-200">Condition</label>
        <div className="flex flex-wrap gap-2">
          {CONDITIONS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCondition(c)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                condition === c
                  ? 'bg-teal-600 border-teal-600 text-white'
                  : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 hover:border-teal-400'
              }`}
            >
              {t(`condition.${c}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Price */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-slate-700 dark:text-zinc-200">Asking Price (USD)</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 text-sm">$</span>
          <input
            type="number"
            min="0.01"
            step="0.01"
            placeholder="0.00"
            value={priceDisplay}
            onChange={(e) => setPriceDisplay(e.target.value)}
            className={`w-full pl-7 pr-3 py-2 border rounded-lg text-sm bg-white dark:bg-zinc-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 ${
              errors.price ? 'border-red-400' : 'border-slate-200 dark:border-zinc-700'
            }`}
          />
        </div>
        {errors.price && <p className="text-xs text-red-500">{errors.price}</p>}
      </div>

      {/* Description */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-slate-700 dark:text-zinc-200">
          Description <span className="text-slate-400 dark:text-zinc-500 font-normal">(optional)</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Condition details, missing pieces, expansions included…"
          maxLength={500}
          rows={3}
          className="w-full px-3 py-2 border border-slate-200 dark:border-zinc-700 rounded-lg text-sm bg-white dark:bg-zinc-900 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
        />
        <p className="text-xs text-slate-400 dark:text-zinc-500 text-right">{description.length}/500</p>
      </div>

      {/* Location */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-slate-700 dark:text-zinc-200">Location</label>
        <Input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="City, neighborhood or area"
          error={errors.location}
        />
      </div>

      {/* WhatsApp */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-slate-700 dark:text-zinc-200">WhatsApp Number</label>
        <Input
          value={whatsapp}
          onChange={(e) => setWhatsapp(e.target.value)}
          placeholder="+1 555 000 0000"
          error={errors.whatsapp}
        />
        <p className="text-xs text-slate-400 dark:text-zinc-500">
          Buyers will contact you via WhatsApp. Include country code.
        </p>
      </div>

      {errors.form && (
        <p className="text-sm text-red-500 text-center">{errors.form}</p>
      )}

      <Button type="submit" loading={loading} className="w-full">
        List for Sale
      </Button>
    </form>
  )
}
