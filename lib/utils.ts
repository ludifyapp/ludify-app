import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { EffectiveStatus, GameEvent } from '@/types'

export function getEffectiveStatus(event: GameEvent): EffectiveStatus {
  if (event.status === 'cancelled') return 'cancelled'

  const now = new Date()
  const start = new Date(event.dateTime)

  // End time: explicit endDateTime, or end of the event's start day
  const end = event.endDateTime
    ? new Date(event.endDateTime)
    : new Date(new Date(event.dateTime).setHours(23, 59, 59, 999))

  if (now >= end) return 'ended'
  if (now >= start) return 'ongoing'

  // Pre-start: derive from player count
  if (event.players.length >= event.maxPlayers) return 'full'
  if (event.players.length >= event.minPlayers) return 'active'
  return 'waiting'
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatDateTimeInput(iso: string): string {
  return iso.slice(0, 16)
}
