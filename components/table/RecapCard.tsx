'use client'
import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import type { Recap } from '@/types'

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(diff / 3_600_000)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(diff / 86_400_000)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric' })
}

export function RecapCard({ recap }: { recap: Recap }) {
  const { t } = useTranslation()
  const [imgError, setImgError] = useState(false)
  return (
    <div className="bg-surface-container-high rounded-[1.5rem] overflow-hidden">
      {/* Game thumbnail banner */}
      {recap.game.thumbnail && !imgError ? (
        <div className="relative h-28 bg-surface-container-highest overflow-hidden">
          <Image
            src={recap.game.thumbnail}
            alt={recap.game.name}
            fill
            className="object-cover opacity-40 blur-[1px] scale-105"
            onError={() => setImgError(true)}
          />
          <div className="absolute inset-0 flex items-center gap-3 px-4">
            <div className="w-16 h-16 rounded-[1.5rem] overflow-hidden bg-surface-container flex-shrink-0 card-shadow">
              <Image
                src={recap.game.thumbnail}
                alt={recap.game.name}
                width={64}
                height={64}
                className="w-full h-full object-contain p-1"
                onError={() => setImgError(true)}
              />
            </div>
            <div>
              <p className="text-xs font-semibold text-on-primary-container/80 uppercase tracking-wide">Ludify Recap</p>
              <p className="text-on-primary-container font-extrabold text-lg leading-tight drop-shadow tracking-[-0.02em]">{recap.game.name}</p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="p-4">
        {/* Host row */}
        <div className="flex items-center gap-2.5 mb-3">
          {recap.hostPhoto ? (
            <Image src={recap.hostPhoto} alt={recap.hostName} width={32} height={32} className="rounded-full flex-shrink-0" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-semibold text-primary">{recap.hostName[0]}</span>
            </div>
          )}
          <div className="min-w-0">
            <Link href={`/profile/${recap.hostUid}`} className="text-sm font-semibold text-on-surface hover:text-primary transition-colors">
              {recap.hostName}
            </Link>
            <p className="text-xs text-on-surface-variant/60 font-meta">hosted · {timeAgo(recap.createdAt)}</p>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-3 mb-3">
          <span className="inline-flex items-center gap-1 text-xs font-medium text-on-surface-variant bg-surface-container-highest px-2.5 py-1 rounded-[0.75rem]">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {recap.playerCount} player{recap.playerCount !== 1 ? 's' : ''}
          </span>
          <span className="text-xs text-primary font-medium">🎲 {recap.game.name}</span>
        </div>

        {/* Winner */}
        {recap.winner && (
          <div className="flex items-center gap-2 mb-3 bg-primary-container/30 rounded-[0.75rem] px-3 py-2">
            <span className="text-base flex-shrink-0">🏆</span>
            <div className="min-w-0">
              <p className="text-xs font-medium text-on-primary-container/70 uppercase tracking-wide leading-none mb-0.5">{t('manage.recapWinner')}</p>
              <p className="text-sm font-semibold text-on-surface truncate">{recap.winner}</p>
            </div>
          </div>
        )}

        {/* Note */}
        {recap.note && (
          <p className="text-sm text-on-surface-variant leading-relaxed">
            {recap.note}
          </p>
        )}
      </div>
    </div>
  )
}
