'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { getIdToken } from '@/lib/getIdToken'
import { auth } from '@/lib/firebase/client'

interface SavedAddress { id: string; label: string; address: string }

export function CreateEventForm() {
  const router = useRouter()
  const [gameName, setGameName] = useState('')
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

  const minDateTime = new Date(Date.now() + 10 * 60 * 1000).toISOString().slice(0, 16)

  const validate = () => {
    const e: Record<string, string> = {}
    if (!gameName.trim()) e.gameName = 'Enter a board game name'
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
          boardGame: { bggId: '', name: gameName.trim(), thumbnail: '' },
          description: description.trim() || undefined,
          dateTime: new Date(dateTime).toISOString(),
          endDateTime: endDateTime ? new Date(endDateTime).toISOString() : undefined,
          address: address.trim(),
          ...(addressLabel && { addressLabel }),
          minPlayers: parseInt(minPlayers),
          maxPlayers: parseInt(maxPlayers),
          type,
        }),
      })

      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error || 'Failed to create event')
      }

      const { id } = await res.json()
      router.push(`/event/${id}/manage`)
    } catch (err) {
      setErrors({ form: (err as Error).message || 'Something went wrong' })
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Input
        id="gameName"
        label="Board Game"
        placeholder="e.g. Catan, Ticket to Ride..."
        value={gameName}
        onChange={(e) => {
          const v = e.target.value
          setGameName(v.length > 0 ? v.charAt(0).toUpperCase() + v.slice(1) : v)
        }}
        error={errors.gameName}
      />

      <div className="flex flex-col gap-1">
        <label className="text-sm font-semibold text-slate-700 dark:text-zinc-300">Description <span className="text-slate-400 dark:text-zinc-500 font-normal">(optional)</span></label>
        <textarea
          placeholder="Tell players what to expect..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-zinc-700 rounded-xl text-sm bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 hover:border-slate-300 dark:hover:border-zinc-600 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
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
                className={`px-3 py-1.5 text-xs font-medium rounded-xl border transition-colors ${
                  address === a.address
                    ? 'bg-teal-500 text-white border-teal-500'
                    : 'bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800 hover:bg-teal-100 dark:hover:bg-teal-900/50'
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
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Visibility</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setType('public')}
            className={`px-4 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
              type === 'public'
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
            }`}
          >
            🌍 Public
          </button>
          <button
            type="button"
            onClick={() => setType('private')}
            className={`px-4 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
              type === 'private'
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
            }`}
          >
            🔒 Private
          </button>
        </div>
        {type === 'private' && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Only people with the invite link can see this event.</p>
        )}
      </div>

      {errors.form && <p className="text-sm text-red-600">{errors.form}</p>}
      <Button type="submit" size="lg" loading={loading} className="w-full">
        Create Game Night 🎲
      </Button>
    </form>
  )
}
