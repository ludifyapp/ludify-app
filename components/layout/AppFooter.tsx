'use client'
import Image from 'next/image'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'

const BGG_BADGE_URL =
  'https://cf.geekdo-images.com/HZy35cmzmmyV9BarSuk6ug__thumb/img/gbE7sulIurZE_Tx8EQJXnZSKI6w=/fit-in/200x150/filters:strip_icc()/pic7779581.png'

export function AppFooter() {
  const { t } = useTranslation()
  return (
    // Desktop only — hidden on mobile (bottom nav occupies that space)
    <footer className="hidden md:block fixed bottom-0 left-0 right-0 z-30 bg-surface-container/95 backdrop-blur-md border-t border-outline-variant/10">
      <div className="max-w-7xl mx-auto px-8 h-14 flex items-center justify-between gap-8">
        {/* Left: wordmark + copyright */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-sm font-extrabold tracking-tight text-primary">Ludify</span>
          <span className="text-on-surface-variant/20 text-xs">·</span>
          <span className="text-[11px] text-on-surface-variant/40 font-meta">
            © {new Date().getFullYear()}
          </span>
        </div>

        {/* Center: links */}
        <div className="flex items-center gap-6">
          <a
            href="https://instagram.com/ludify.app"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-semibold text-on-surface-variant hover:text-primary transition-colors"
          >
            <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
            </svg>
            @ludify.app
          </a>

          <Link
            href="/faq"
            className="text-xs font-semibold text-on-surface-variant hover:text-primary transition-colors"
          >
            {t('footer.faq')}
          </Link>

          <a
            href="mailto:hello@ludify.app"
            className="text-xs font-semibold text-on-surface-variant hover:text-primary transition-colors"
          >
            {t('footer.contact')}
          </a>
        </div>

        {/* Right: BGG badge */}
        <a
          href="https://boardgamegeek.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity"
          title="Powered by BoardGameGeek"
        >
          <Image
            src={BGG_BADGE_URL}
            alt="Powered by BoardGameGeek"
            width={80}
            height={60}
            className="rounded-sm"
            unoptimized
          />
        </a>
      </div>
    </footer>
  )
}
