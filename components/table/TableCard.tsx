'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { GameTable } from '@/types'
import { formatDateOnly, formatTimeOnly, isSameDay, getEffectiveStatus } from '@/lib/utils'
import { Analytics } from '@/lib/analytics'

function googleCalendarUrl(table: GameTable): string {
  const start = new Date(table.dateTime)
  const end = table.endDateTime
    ? new Date(table.endDateTime)
    : new Date(start.getTime() + 2 * 60 * 60 * 1000)
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `Ludify: ${table.boardGame.name}`,
    dates: `${fmt(start)}/${fmt(end)}`,
    details: table.description ?? `Join us for a game of ${table.boardGame.name}!`,
    location: table.address,
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

const statusStyle: Record<string, { bg: string; text: string }> = {
  waiting:   { bg: 'bg-amber-500/15',   text: 'text-amber-300' },
  full:      { bg: 'bg-rose-500/15',    text: 'text-rose-300' },
  ongoing:   { bg: 'bg-emerald-500/15', text: 'text-emerald-300' },
  ended:     { bg: 'bg-zinc-500/15',    text: 'text-zinc-400' },
  cancelled: { bg: 'bg-red-500/15',     text: 'text-red-300' },
}

const AVATAR_COLORS = [
  'bg-violet-500', 'bg-blue-500', 'bg-emerald-500',
  'bg-amber-500',  'bg-rose-500', 'bg-cyan-500',
  'bg-fuchsia-500','bg-orange-500',
]
function avatarColor(name: string) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0
  return AVATAR_COLORS[h % AVATAR_COLORS.length]
}

interface TableCardProps {
  table: GameTable
  backHref?: string
  manageHref?: string
}

export function TableCard({ table, backHref, manageHref }: TableCardProps) {
  const { t, i18n } = useTranslation()
  const [showMap, setShowMap] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [imgError, setImgError] = useState(false)

  const effectiveStatus = getEffectiveStatus(table)
  const style = statusStyle[effectiveStatus]
  const host = table.players.find(p => p.isHost)

  const tableUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/table/${table.id}`
    : `/table/${table.id}`

  const handleCopyLink = async () => {
    Analytics.shareLinkCopied({ table_id: table.id })
    try {
      await navigator.clipboard.writeText(tableUrl)
    } catch {
      const el = document.createElement('input')
      el.value = tableUrl
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  const handleWhatsApp = () => {
    const text = t('share.whatsappText', { game: table.boardGame.name, url: tableUrl })
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  // All sections share this horizontal padding
  const PAD = 'px-5'

  return (
    <>
      {/* ── Hero — padded + rounded to match page layout ── */}
      <div className="max-w-lg mx-auto w-full px-5 pt-5">
        <div className="relative w-full h-[220px] md:h-[260px] rounded-2xl overflow-hidden">
          {table.boardGame.thumbnail && !imgError ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={table.boardGame.thumbnail}
              alt={table.boardGame.name}
              className="w-full h-full object-cover object-center"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full bg-surface-container-high flex items-center justify-center">
              <span style={{ fontSize: '5rem', fontWeight: 900, opacity: 0.15, color: 'var(--color-primary)', userSelect: 'none' }}>
                {table.boardGame.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          {/* Gradient — strong bottom fade */}
          <div className="absolute inset-0 bg-gradient-to-t from-surface from-10% via-surface/60 via-50% to-transparent pointer-events-none" />

          {/* Nav — floats inside the hero card */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
            {backHref && (
              <Link
                href={backHref}
                className="inline-flex items-center gap-2 text-sm font-semibold text-on-surface bg-[#040d22]/60 backdrop-blur-md px-4 py-2 rounded-full"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 5l-7 7 7 7"/>
                </svg>
                {t('table.home', 'Back')}
              </Link>
            )}
            {manageHref && (
              <Link
                href={manageHref}
                className="bg-secondary text-surface text-sm font-bold px-4 py-2 rounded-full"
              >
                {t('table.manageTable', 'Manage Table')}
              </Link>
            )}
          </div>

          {/* Status badge — bottom-left */}
          <div className="absolute bottom-4 left-4">
            <span className={`${style.bg} ${style.text} px-3 py-1 rounded-full font-bold text-[11px] tracking-wider uppercase`}>
              {t(`tableStatus.${effectiveStatus}`)}
            </span>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-lg mx-auto w-full">

        {/* Title */}
        <section className={`${PAD} mt-5`}>
          <h1 className="text-4xl font-extrabold text-on-surface tracking-tight mb-2">
            {table.boardGame.name}
          </h1>
          {host ? (
            <p className="text-on-surface-variant font-medium">
              {t('tableCard.hostedBy', 'Hosted by')}{' '}
              <span className="text-primary font-semibold">{host.name.split(' ')[0]}</span>
            </p>
          ) : table.boardGame.yearPublished ? (
            <p className="text-on-surface-variant font-medium">{table.boardGame.yearPublished}</p>
          ) : null}
        </section>

        {/* Quick Actions */}
        <section className={`${PAD} mt-6 flex gap-3`}>
          {/* Share */}
          <button
            onClick={() => setShowShare(v => !v)}
            className={`flex-1 rounded-2xl py-4 flex flex-col items-center justify-center gap-1.5 transition-colors ${showShare ? 'bg-primary/20 text-primary' : 'bg-surface-container-high text-primary hover:bg-surface-container-highest'}`}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/>
            </svg>
            <span className="text-center font-bold text-[10px] uppercase tracking-widest">{t('share.shareTable', 'Share')}</span>
          </button>

          {/* Calendar */}
          <a
            href={googleCalendarUrl(table)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 bg-surface-container-high text-primary rounded-2xl py-4 flex flex-col items-center justify-center gap-1.5 hover:bg-surface-container-highest transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z"/>
            </svg>
            <span className="text-center font-bold text-[10px] uppercase tracking-widest">{t('tableCard.addToCalendar', 'Calendar')}</span>
          </a>

          {/* Map */}
          <button
            onClick={() => setShowMap(v => !v)}
            className={`flex-1 rounded-2xl py-4 flex flex-col items-center justify-center gap-1.5 transition-colors ${showMap ? 'bg-primary/20 text-primary' : 'bg-surface-container-high text-primary hover:bg-surface-container-highest'}`}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z"/>
            </svg>
            <span className="text-center font-bold text-[10px] uppercase tracking-widest">{t('tableCard.map', 'Map')}</span>
          </button>
        </section>

        {/* Share sheet */}
        {showShare && (
          <div className={`${PAD} mt-3`}>
            <div className="bg-surface-container-high rounded-xl overflow-hidden">
              <button
                onClick={handleCopyLink}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-container-highest transition-colors text-left"
              >
                {copiedLink ? (
                  <svg className="w-5 h-5 text-tertiary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                )}
                <span className={`text-sm font-semibold ${copiedLink ? 'text-tertiary' : 'text-on-surface'}`}>
                  {copiedLink ? t('share.copied', 'Copied!') : t('share.copyLink', 'Copy link')}
                </span>
              </button>
              <div className="h-px bg-surface-container-highest mx-4" />
              <button
                onClick={handleWhatsApp}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-container-highest transition-colors text-left"
              >
                <svg className="w-5 h-5 flex-shrink-0" style={{ color: '#25D366' }} fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zm-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                <span className="text-sm font-semibold text-on-surface">WhatsApp</span>
              </button>
            </div>
          </div>
        )}

        {/* Table Metadata — date + location */}
        <section className={`${PAD} mt-10 flex flex-col gap-4`}>

          {/* Date + Time */}
          {table.endDateTime && !isSameDay(table.dateTime, table.endDateTime) ? (
            <>
              <div className="flex items-start gap-4 p-4 bg-surface-container rounded-xl">
                <div className="w-12 h-12 rounded-lg bg-surface-container-highest flex items-center justify-center text-primary flex-shrink-0">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z"/>
                  </svg>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-0.5">{t('tableCard.startingDate')}</p>
                  <h3 className="font-bold text-lg text-on-surface leading-tight">{formatDateOnly(table.dateTime, i18n.language)}</h3>
                  <p className="text-sm text-on-surface-variant">{formatTimeOnly(table.dateTime, i18n.language)}</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-surface-container rounded-xl">
                <div className="w-12 h-12 rounded-lg bg-surface-container-highest flex items-center justify-center text-primary flex-shrink-0">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z"/>
                  </svg>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-0.5">{t('tableCard.endingDate')}</p>
                  <h3 className="font-bold text-lg text-on-surface leading-tight">{formatDateOnly(table.endDateTime, i18n.language)}</h3>
                  <p className="text-sm text-on-surface-variant">{formatTimeOnly(table.endDateTime, i18n.language)}</p>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-start gap-4 p-4 bg-surface-container rounded-xl">
              <div className="w-12 h-12 rounded-lg bg-surface-container-highest flex items-center justify-center text-primary flex-shrink-0">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z"/>
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-lg text-on-surface leading-tight">{formatDateOnly(table.dateTime, i18n.language)}</h3>
                <p className="text-sm text-on-surface-variant">
                  {formatTimeOnly(table.dateTime, i18n.language)}
                  {table.endDateTime && ` – ${formatTimeOnly(table.endDateTime, i18n.language)}`}
                </p>
              </div>
            </div>
          )}

          {/* Location */}
          <div
            className="flex items-start gap-4 p-4 bg-surface-container rounded-xl cursor-pointer hover:bg-surface-container-high transition-colors"
            onClick={() => setShowMap(v => !v)}
          >
            <div className="w-12 h-12 rounded-lg bg-surface-container-highest flex items-center justify-center text-primary flex-shrink-0">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z"/>
              </svg>
            </div>
            <div className="min-w-0">
              {table.addressLabel ? (
                <>
                  <h3 className="font-bold text-lg text-on-surface leading-tight">{table.addressLabel}</h3>
                  <p className="text-sm text-on-surface-variant">{table.address}</p>
                </>
              ) : (
                <h3 className="font-bold text-lg text-on-surface leading-tight break-words">{table.address}</h3>
              )}
            </div>
          </div>
        </section>

        {/* Embedded map */}
        {showMap && (
          <div className={`${PAD} mt-3`}>
            <iframe
              title={t('tableCard.tableLocation')}
              src={`https://maps.google.com/maps?q=${encodeURIComponent(table.address)}&output=embed`}
              className="w-full h-48 border-0 rounded-xl"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        )}

        {/* Players bubble carousel */}
        {table.players.length > 0 && (
          <section className={`${PAD} mt-8`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-on-surface">
                {t('players.players', 'Players')}
              </h2>
              <span className="text-xs font-semibold text-on-surface-variant bg-surface-container-high px-3 py-1 rounded-full">
                {table.players.length}{table.maxPlayers ? ` / ${table.maxPlayers}` : ''}
              </span>
            </div>
            {/* px-1 pt-2 so ring shadows on first/host avatar aren't clipped */}
            <div className="flex gap-4 overflow-x-auto pb-2 px-1 pt-2 -mx-1">
              {table.players.map((player, i) => (
                <div key={`${player.id}-${i}`} className="flex flex-col items-center gap-2 flex-shrink-0">
                  {player.photoURL ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={player.photoURL}
                      alt={player.name}
                      className={`w-16 h-16 rounded-full object-cover ${player.isHost ? 'ring-2 ring-primary ring-offset-2 ring-offset-surface' : ''}`}
                    />
                  ) : (
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl ${avatarColor(player.name)} ${player.isHost ? 'ring-2 ring-primary ring-offset-2 ring-offset-surface' : ''}`}>
                      {player.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className={`text-[11px] font-medium text-center w-16 truncate ${player.isHost ? 'text-primary font-bold' : 'text-on-surface-variant'}`}>
                    {player.name.split(' ')[0]}
                  </span>
                </div>
              ))}
              {/* Empty slots */}
              {table.maxPlayers && Array.from({ length: Math.max(0, table.maxPlayers - table.players.length) }).map((_, i) => (
                <div key={`empty-${i}`} className="flex flex-col items-center gap-2 flex-shrink-0">
                  <div className="w-16 h-16 rounded-full border-2 border-dashed border-on-surface/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-on-surface/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
                    </svg>
                  </div>
                  <span className="text-[11px] font-medium text-on-surface/30 text-center w-16">
                    {t('players.open', 'Open')}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* About the Table */}
        {table.description && (
          <section className={`${PAD} mt-8 mb-2`}>
            <h2 className="text-base font-bold text-on-surface mb-3">{t('tableCard.aboutTable', 'About the Table')}</h2>
            <p className="text-on-surface-variant leading-relaxed text-sm">{table.description}</p>
          </section>
        )}

      </div>
    </>
  )
}
