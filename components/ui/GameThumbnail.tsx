'use client'
import { useState } from 'react'
import Image from 'next/image'

interface GameThumbnailProps {
  src?: string | null
  name: string
  width: number
  height: number
  imgClassName?: string
  placeholderClassName?: string
}

export function GameThumbnail({ src, name, width, height, imgClassName, placeholderClassName }: GameThumbnailProps) {
  const [error, setError] = useState(false)

  if (src && !error) {
    return (
      <Image
        src={src}
        alt={name}
        width={width}
        height={height}
        className={imgClassName}
        onError={() => setError(true)}
      />
    )
  }

  return (
    <div className={placeholderClassName}>
      <span className="font-bold text-teal-600 dark:text-teal-400">
        {name.charAt(0).toUpperCase()}
      </span>
    </div>
  )
}
