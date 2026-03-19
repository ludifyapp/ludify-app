'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { getIdToken } from '@/lib/getIdToken'

export function CreateEventForm() {
  const router = useRouter()
  const [gameName, setGameName] = useState('')
  const [description, setDescription] = useState('')
  const [dateTime, setDateTime] = useState('')
  const [endDateTime, setEndDateTime] = useState('')
  const [address, setAddress] = useState('')
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
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Description <span className="text-gray-400 dark:text-gray-500 font-normal">(optional)</span></label>
        <textarea
          placeholder="Tell players what to expect..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
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

      <Input
        id="address"
        label="Address"
        placeholder="123 Main St, City, State"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        error={errors.address}
      />

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
