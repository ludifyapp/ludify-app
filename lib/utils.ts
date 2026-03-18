import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { GameEvent } from '@/types'

export function getEffectiveStatus(event: GameEvent): 'active' | 'cancelled' | 'ended' {
  if (event.status === 'cancelled') return 'cancelled'
  if (new Date(event.dateTime) < new Date()) return 'ended'
  return 'active'
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
