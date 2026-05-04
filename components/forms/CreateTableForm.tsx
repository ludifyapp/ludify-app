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
interface SuggestedDate { label: string; value: string }

function getNextOccurrence(dayOfWeek: number, hours: number, minutes: number): string {
  const now = new Date()
  const result = new Date(now)
  result.setHours(hours, minutes, 0, 0)
  const daysUntil = (dayOfWeek - now.getDay() + 7) % 7
  result.setDate(now.getDate() + (daysUntil === 0 && result <= now ? 7 : daysUntil))
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${result.getFullYear()}-${pad(result.getMonth() + 1)}-${pad(result.getDate())}T${pad(result.getHours())}:${pad(result.getMinutes())}`
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function CreateTableForm({ initialGame }: { initialGame?: BggGame }) {
  const router = useRouter()
  const { t } = useTranslation()
  const [selectedGame, setSelectedGame] = useState<BggGame | null>(initialGame ?? null)
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([])
  const [suggestedDates, setSuggestedDates] = useState<SuggestedDate[]>([])

  useEffect(() => {
    auth.currentUser?.getIdToken().then((token) =>
      fetch('/api/addresses', { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json())
        .then((data) => setSavedAddresses(data.addresses ?? []))
        .catch(() => {})
    )
  }, [])

  useEffect(() => {
    const uid = auth.currentUser?.uid
    if (!uid) return
    auth.currentUser?.getIdToken().then((token) =>
      fetch(`/api/tables?player=${uid}`, { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json())
        .then((data) => {
          const hosted: { dateTime: string }[] = (data.tables ?? [])
            .filter((e: { hostUid: string }) => e.hostUid === uid)
            .sort((a: { dateTime: string }, b: { dateTime: string }) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime())
            .slice(0, 3)
          const seen = new Set<string>()
          const suggestions: SuggestedDate[] = []
          for (const e of hosted) {
            const d = new Date(e.dateTime)
            const key = `${d.getDay()}-${d.getHours()}-${d.getMinutes()}`
            if (seen.has(key)) continue
            seen.add(key)
            const value = getNextOccurrence(d.getDay(), d.getHours(), d.getMinutes())
            const hour = d.getHours()
            const min = String(d.getMinutes()).padStart(2, '0')
            const ampm = hour >= 12 ? 'PM' : 'AM'
            const h12 = hour % 12 || 12
            suggestions.push({ label: `${DAY_NAMES[d.getDay()]} ${h12}:${min} ${ampm}`, value })
          }
          setSuggestedDates(suggestions)
        })
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

  const minDateTime = (() => {
    const d = new Date(Date.now() + 10 * 60 * 1000)
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  })()

  const validate = () => {
    const e: Record<string, string> = {}
    if (!selectedGame) e.gameName = 'Select a board game'
    if (!dateTime) e.dateTime = 'Select a date and time'
    else if (new Date(dateTime) < new Date(Date.now() + 10 * 60 * 1000))
      e.dateTime = 'Table must start at least 10 minutes from now'
    if (endDateTime && new Date(endDateTime) <= new Date(dateTime))
      e.endDateTime = 'End time must be after start time'
    if (!address.trim()) e.address = 'Enter an address'
    const min = parseInt(minPlayers)
    const max = parseInt(maxPlayers)
    if (isNaN(min) || min < 1 || min > 64) e.minPlayers = 'Between 1 and 64'
    if (isNaN(max) || max < 1 || max > 64) e.maxPlayers = 'Between 1 and 64'
    if (!isNaN(min) && !isNaN(max) && min > max) e.minPlayers = 'Min cannot exceed max'
    return e
  }

  const revalidateField = (field: string) => {
    if (!errors[field]) return
    const fresh = validate()
    setErrors(prev => {
      const next = { ...prev }
      if (fresh[field]) next[field] = fresh[field]
      else delete next[field]
      return next
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }

    setLoading(true)
    try {
      const token = await getIdToken()
      const res = await fetch('/api/tables', {
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
        throw new Error(body.error || 'Failed to create table')
      }

      const { id } = await res.json()
      Analytics.tableCreated({ game: selectedGame!.name, type })
      router.push(`/table/${id}/manage`)
    } catch (err) {
      setErrors({ form: (err as Error).message || 'Something went wrong' })
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <GameSearch
        value={selectedGame}
        onSelect={(game) => {
          setSelectedGame(game)
          if (game) setErrors(prev => { const next = { ...prev }; delete next.gameName; return next })
        }}
        error={errors.gameName}
      />

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

      <div className="flex flex-col gap-1">
        <Input
          id="dateTime"
          label="Start Date & Time"
          type="datetime-local"
          min={minDateTime}
          value={dateTime}
          onChange={(e) => setDateTime(e.target.value)}
          onBlur={() => revalidateField('dateTime')}
          error={errors.dateTime}
        />
        {suggestedDates.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {suggestedDates.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => setDateTime(s.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-[0.75rem] transition-colors ${
                  dateTime === s.value
                    ? 'bg-primary-container text-on-primary-container'
                    : 'bg-surface-container-highest text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <Input
          id="address"
          label="Address"
          placeholder="123 Main St, City, State"
          autoComplete="street-address"
          value={address}
          onChange={(e) => { setAddress(e.target.value); setAddressLabel('') }}
          onBlur={() => revalidateField('address')}
          error={errors.address}
        />
        {savedAddresses.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1.5">
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
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-on-surface-variant">Min Players</label>
          <div className="flex items-center rounded-[0.75rem] overflow-hidden border border-outline-variant bg-surface-container-highest">
            <button
              type="button"
              onClick={() => setMinPlayers(v => String(Math.max(1, Number(v) - 1)))}
              className="px-3 py-2.5 text-on-surface-variant hover:bg-surface-container-high active:bg-surface-container transition-colors text-base font-bold select-none"
            >−</button>
            <input
              id="minPlayers"
              type="number"
              min={1}
              max={64}
              value={minPlayers}
              onChange={(e) => setMinPlayers(e.target.value)}
              onBlur={() => revalidateField('minPlayers')}
              className="flex-1 text-center bg-transparent text-on-surface font-semibold text-sm py-2.5 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <button
              type="button"
              onClick={() => setMinPlayers(v => String(Math.min(Number(maxPlayers) || 64, Number(v) + 1)))}
              className="px-3 py-2.5 text-on-surface-variant hover:bg-surface-container-high active:bg-surface-container transition-colors text-base font-bold select-none"
            >+</button>
          </div>
          {errors.minPlayers && <p className="text-xs text-error mt-0.5">{errors.minPlayers}</p>}
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-on-surface-variant">Max Players</label>
          <div className="flex items-center rounded-[0.75rem] overflow-hidden border border-outline-variant bg-surface-container-highest">
            <button
              type="button"
              onClick={() => setMaxPlayers(v => String(Math.max(Number(minPlayers) || 1, Number(v) - 1)))}
              className="px-3 py-2.5 text-on-surface-variant hover:bg-surface-container-high active:bg-surface-container transition-colors text-base font-bold select-none"
            >−</button>
            <input
              id="maxPlayers"
              type="number"
              min={1}
              max={64}
              value={maxPlayers}
              onChange={(e) => setMaxPlayers(e.target.value)}
              onBlur={() => revalidateField('maxPlayers')}
              className="flex-1 text-center bg-transparent text-on-surface font-semibold text-sm py-2.5 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <button
              type="button"
              onClick={() => setMaxPlayers(v => String(Math.min(64, Number(v) + 1)))}
              className="px-3 py-2.5 text-on-surface-variant hover:bg-surface-container-high active:bg-surface-container transition-colors text-base font-bold select-none"
            >+</button>
          </div>
          {errors.maxPlayers && <p className="text-xs text-error mt-0.5">{errors.maxPlayers}</p>}
        </div>
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
          <p className="text-xs text-on-surface-variant/60 mt-1">Only people with the invite link can see this table.</p>
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
          <div className="mt-4 flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex flex-col gap-1">
              <Input
                id="endDateTime"
                label={<>End Date & Time <span className="text-on-surface-variant/50 font-normal text-xs">(optional)</span></>}
                type="datetime-local"
                min={dateTime || minDateTime}
                value={endDateTime}
                onChange={(e) => setEndDateTime(e.target.value)}              onBlur={() => revalidateField('endDateTime')}                error={errors.endDateTime}
              />
              {dateTime && (
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {(() => {
                    const start = new Date(dateTime)
                    const pad = (n: number) => String(n).padStart(2, '0')
                    const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
                    const plus2 = new Date(start.getTime() + 2 * 3600_000)
                    const plus4 = new Date(start.getTime() + 4 * 3600_000)
                    const midnight = new Date(start)
                    midnight.setHours(23, 59, 0, 0)
                    if (midnight <= start) midnight.setDate(midnight.getDate() + 1)
                    return [
                      { label: '+2h', value: fmt(plus2) },
                      { label: '+4h', value: fmt(plus4) },
                      { label: 'Midnight', value: fmt(midnight) },
                    ].map((s) => (
                      <button
                        key={s.label}
                        type="button"
                        onClick={() => setEndDateTime(s.value)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-[0.75rem] transition-colors ${
                          endDateTime === s.value
                            ? 'bg-primary-container text-on-primary-container'
                            : 'bg-surface-container-highest text-on-surface-variant hover:bg-surface-container-high'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))
                  })()}
                </div>
              )}
            </div>
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
        Create Table 🎲
      </Button>
    </form>
  )
}
