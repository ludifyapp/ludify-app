'use client'
import { useState } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

export interface AvatarProps {
  photoURL?: string | null
  name: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const BG_COLORS = [
  'bg-rose-200 text-rose-800 dark:bg-rose-900 dark:text-rose-200',
  'bg-sky-200 text-sky-800 dark:bg-sky-900 dark:text-sky-200',
  'bg-amber-200 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  'bg-emerald-200 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
  'bg-violet-200 text-violet-800 dark:bg-violet-900 dark:text-violet-200',
  'bg-orange-200 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  'bg-teal-200 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
  'bg-pink-200 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
]

function hashName(name: string): number {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return Math.abs(hash)
}

const SIZE_CLASSES = {
  sm: 'w-6 h-6 text-[10px]',
  md: 'w-8 h-8 text-sm',
  lg: 'w-12 h-12 text-lg',
}

const SIZE_PX = { sm: 24, md: 32, lg: 48 }

export function Avatar({ photoURL, name, size = 'md', className }: AvatarProps) {
  const [error, setError] = useState(false)

  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  if (photoURL && !error) {
    return (
      <Image
        src={photoURL}
        alt={name}
        width={SIZE_PX[size]}
        height={SIZE_PX[size]}
        className={cn('rounded-full flex-shrink-0 object-cover', SIZE_CLASSES[size], className)}
        onError={() => setError(true)}
      />
    )
  }

  const colorClass = BG_COLORS[hashName(name) % BG_COLORS.length]

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center flex-shrink-0 font-semibold',
        colorClass,
        SIZE_CLASSES[size],
        className,
      )}
      title={name}
    >
      {initials}
    </div>
  )
}
