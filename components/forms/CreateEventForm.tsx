'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { getIdToken } from '@/lib/getIdToken'
import { Analytics } from '@/lib/analytics'
import { auth } from '@/lib/firebase/client'
import { GameSearch } from '@/components/bgg/GameSearch'
import { BggGame } from '@/types'

interface SavedAddress { id: string; label: string; address: string }

export function CreateEventForm({ initialGame }: { initialGame?: BggGame }) {
  const router = useRouter()
  const { t } = useTranslation()
  const [selectedGame, setSelectedGame] = useState<BggGame | null>(initialGame ?? null)
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([])

  useEffect(() => {
    auth.currentUser?.getIdToken().then((token) =>
      fetch('/api/addresses', { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json())
        .then((data) => setSavedAddresses(data.addresses ?? []))
        .catch(() => {})
    )
  }, [])
  const [description, setDescription] = useState('')
  const [dateTime, setDateTime] = useState('')
  const [endDateTime, setEndDateTime] = useState('')
  const [address, setAddress] = useState('')
  const [addressLabel, setAddressLabel] = useState('')
  const [minPlayers, setMinPlayers] = useState('2')
  const [maxPlayers, setMaxPlayers] = useState('4')
  const [type, setType] = useState<'public' | 'private'>('public')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [allowComments, setAllowComments] = useState(true)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const minDateTime = new Date(Date.now() + 10 * 60 * 1000).toISOString().slice(0, 16)

  const validate = () => {
    const e: Record<string, string> = {}
    if (!selectedGame) e.gameName = 'Select a board game'
    if (!dateTime) e.dateTime = 'Select a date and time'
    else if (new Date(dateTime) < new Date(Date.now() + 10 * 60 * 1000))
      e.dateTime = 'Event must start at least 10 minutes from now'
    if (endDateTime && new Date(endDateTime) <= new Date(dateTime))
      e.endDateTime = 'End time must be after start time'
    if (!address.trim()) e.address = 'Enter an address'
    const min = parseInt(minPlayers)
    const max = parseInt(maxPlayers)
    if (isNaN(min) || min < 2 || min > 20) e.minPlayers = 'Between 2 and 20'
    if (isNaN(max) || max < 2 || max > 20) e.maxPlayers = 'Between 2 and 20'
    if (!isNaN(min) && !isNaN(max) && min > max) e.minPlayers = 'Min cannot exceed max'
    return e
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }

    setLoading(true)
    try {
      const token = await getIdToken()
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          boardGame: selectedGame,
          description: description.trim() || undefined,
          dateTime: new Date(dateTime).toISOString(),
          endDateTime: endDateTime ? new Date(endDateTime).toISOString() : undefined,
          address: address.trim(),
          ...(addressLabel && { addressLabel }),
          minPlayers: parseInt(minPlayers),
          maxPlayers: parseInt(maxPlayers),
          type,
          allowComments,
        }),
      })

      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error || 'Failed to create event')
      }

      const { id } = await res.json()
      Analytics.eventCreated({ game: selectedGame!.name, type })
      router.push(`/event/${id}/manage`)
    } catch (err) {
      setErrors({ form: (err as Error).message || 'Something went wrong' })
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <GameSearch value={selectedGame} onSelect={setSelectedGame} error={errors.gameName} />

      <div className="flex flex-col gap-1">
        <label className="text-sm font-semibold text-on-surface-variant">Description <span className="text-on-surface-variant/50 font-normal">(optional)</span></label>
        <textarea
          placeholder="Tell players what to expect..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full px-3.5 py-2.5 ghost-border rounded-[0.75rem] text-sm bg-surface-container-high text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
        />
      </div>

      <Input
        id="dateTime"
        label="Start Date & Time"
        type="datetime-local"
        min={minDateTime}
        value={dateTime}
        onChange={(e) => setDateTime(e.target.value)}
        error={errors.dateTime}
      />

      <Input
        id="endDateTime"
        label={<>End Date & Time <span className="text-gray-400 font-normal">(optional)</span></>}
        type="datetime-local"
        min={dateTime || minDateTime}
        value={endDateTime}
        onChange={(e) => setEndDateTime(e.target.value)}
        error={errors.endDateTime}
      />

      <div className="flex flex-col gap-1">
        {savedAddresses.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-1">
            {savedAddresses.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => { setAddress(a.address); setAddressLabel(a.label) }}
                className={`px-3 py-1.5 text-xs font-medium rounded-[0.75rem] transition-colors ${
                  address === a.address
                    ? 'bg-primary-container text-on-primary-container'
                    : 'bg-surface-container-highest text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                {a.label}
              </button>
            ))}
          </div>
        )}
        <Input
          id="address"
          label="Address"
          placeholder="123 Main St, City, State"
          autoComplete="street-address"
          value={address}
          onChange={(e) => { setAddress(e.target.value); setAddressLabel('') }}
          error={errors.address}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          id="minPlayers"
          label="Min Players"
          type="number"
          min={2}
          max={20}
          value={minPlayers}
          onChange={(e) => setMinPlayers(e.target.value)}
          error={errors.minPlayers}
        />
        <Input
          id="maxPlayers"
          label="Max Players"
          type="number"
          min={2}
          max={20}
          value={maxPlayers}
          onChange={(e) => setMaxPlayers(e.target.value)}
          error={errors.maxPlayers}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-semibold text-on-surface-variant">Visibility</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setType('public')}
            className={`px-4 py-2.5 rounded-[0.75rem] text-sm font-medium transition-colors ${
              type === 'public'
                ? 'bg-primary-container text-on-primary-container'
                : 'bg-surface-container-highest text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            🌍 Public
          </button>
          <button
            type="button"
            onClick={() => setType('private')}
            className={`px-4 py-2.5 rounded-[0.75rem] text-sm font-medium transition-colors ${
              type === 'private'
                ? 'bg-primary-container text-on-primary-container'
                : 'bg-surface-container-highest text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            🔒 Private
          </button>
        </div>
        {type === 'private' && (
          <p className="text-xs text-on-surface-variant/60 mt-1">Only people with the invite link can see this event.</p>
        )}
      </div>

      <div className="pt-3">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors"
        >
          <svg
            className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-90' : ''}`}
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          {t('manage.advancedSettings')}
        </button>

        {showAdvanced && (
          <div className="mt-4 p-4 bg-surface-container-high rounded-[1.5rem] animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-bold text-on-surface">{t('manage.allowComments')}</label>
                <p className="text-xs text-on-surface-variant/60">{t('manage.allowCommentsDesc')}</p>
              </div>
              <button
                type="button"
                onClick={() => setAllowComments(!allowComments)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                  allowComments ? 'bg-primary' : 'bg-surface-container-highest'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    allowComments ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        )}
      </div>

      {errors.form && <p className="text-sm text-error">{errors.form}</p>}
      <Button type="submit" size="lg" loading={loading} className="w-full">
        Create Event 🎲
      </Button>
    </form>
  )
}
