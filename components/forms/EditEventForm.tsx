'use client'
import { useState } from 'react'
import { GameEvent } from '@/types'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { formatDateTimeInput } from '@/lib/utils'

interface EditEventFormProps {
  event: GameEvent
  onSave: (data: Partial<GameEvent>) => Promise<void>
  onClose: () => void
}

export function EditEventForm({ event, onSave, onClose }: EditEventFormProps) {
  const [gameName, setGameName] = useState(event.boardGame.name)
  const [description, setDescription] = useState(event.description ?? '')
  const [dateTime, setDateTime] = useState(formatDateTimeInput(event.dateTime))
  const [endDateTime, setEndDateTime] = useState(event.endDateTime ? formatDateTimeInput(event.endDateTime) : '')
  const [address, setAddress] = useState(event.address)
  const [minPlayers, setMinPlayers] = useState(String(event.minPlayers ?? 2))
  const [maxPlayers, setMaxPlayers] = useState(String(event.maxPlayers))
  const [type, setType] = useState<'public' | 'private'>(event.type ?? 'public')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  const originalDateTime = formatDateTimeInput(event.dateTime)
  const minDateTime = new Date(Date.now() + 10 * 60 * 1000).toISOString().slice(0, 16)

  const validate = () => {
    const e: Record<string, string> = {}
    if (!gameName.trim()) e.gameName = 'Enter a board game name'
    if (!dateTime) e.dateTime = 'Select a date and time'
    else if (dateTime !== originalDateTime && new Date(dateTime) < new Date(Date.now() + 10 * 60 * 1000))
      e.dateTime = 'Event must start at least 10 minutes from now'
    if (endDateTime && new Date(endDateTime) <= new Date(dateTime))
      e.endDateTime = 'End time must be after start time'
    if (!address.trim()) e.address = 'Enter an address'
    const min = parseInt(minPlayers)
    const max = parseInt(maxPlayers)
    if (isNaN(min) || min < 2 || min > 20) e.minPlayers = 'Between 2 and 20'
    if (isNaN(max) || max < 2 || max > 20) e.maxPlayers = 'Between 2 and 20'
    if (!isNaN(min) && !isNaN(max) && min > max) e.minPlayers = 'Min cannot exceed max'
    if (max < event.players.length) e.maxPlayers = `Cannot be less than current players (${event.players.length})`
    return e
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }

    setLoading(true)
    try {
      await onSave({
        boardGame: { bggId: event.boardGame.bggId, name: gameName.trim(), thumbnail: event.boardGame.thumbnail ?? '' },
        description: description.trim() || undefined,
        dateTime: new Date(dateTime).toISOString(),
        endDateTime: endDateTime ? new Date(endDateTime).toISOString() : undefined,
        address: address.trim(),
        minPlayers: parseInt(minPlayers),
        maxPlayers: parseInt(maxPlayers),
        type,
      })
      onClose()
    } catch (err) {
      setErrors({ form: (err as Error).message || 'Failed to save changes' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
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
        label="Start Date & Time"
        type="datetime-local"
        min={minDateTime}
        value={dateTime}
        onChange={(e) => setDateTime(e.target.value)}
        error={errors.dateTime}
      />

      <Input
        label={<>End Date & Time <span className="text-gray-400 font-normal">(optional)</span></>}
        type="datetime-local"
        min={dateTime || minDateTime}
        value={endDateTime}
        onChange={(e) => setEndDateTime(e.target.value)}
        error={errors.endDateTime}
      />

      <Input
        label="Address"
        placeholder="123 Main St, City, State"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        error={errors.address}
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Min Players"
          type="number"
          min={2}
          max={20}
          value={minPlayers}
          onChange={(e) => setMinPlayers(e.target.value)}
          error={errors.minPlayers}
        />
        <Input
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
      </div>

      {errors.form && <p className="text-sm text-red-600">{errors.form}</p>}
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
        <Button type="submit" loading={loading}>Save Changes</Button>
      </div>
    </form>
  )
}
