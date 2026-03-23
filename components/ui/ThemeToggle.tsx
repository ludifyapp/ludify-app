'use client'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  if (!mounted) return <div className="w-8 h-8" />

  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark')
    else if (theme === 'dark') setTheme('system')
    else setTheme('light')
  }

  const label =
    theme === 'light' ? '☀️' :
    theme === 'dark'  ? '🌙' : '💻'

  return (
    <button
      onClick={cycleTheme}
      title={`Theme: ${theme}`}
      className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container-high transition-colors text-base text-on-surface-variant"
    >
      {label}
    </button>
  )
}
