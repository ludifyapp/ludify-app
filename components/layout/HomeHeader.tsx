'use client'
import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useTheme } from 'next-themes'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/contexts/AuthContext'
import { usePendingInvites } from '@/hooks/usePendingInvites'
import { useUnreadMessages } from '@/hooks/useUnreadMessages'
import { Analytics } from '@/lib/analytics'
import { useFeatureFlags } from '@/contexts/FeatureFlagsContext'

const LOCALES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'pt-BR', label: 'Português (BR)' },
] as const

interface NavTab {
  id: string
  label: string
}

interface HomeHeaderProps {
  currentTab?: string
  navTabs?: NavTab[]
  onTabChange?: (id: string) => void
}

export function HomeHeader({ currentTab, navTabs, onTabChange }: HomeHeaderProps) {
  const { user, loading, signInWithGoogle, signOutUser } = useAuth()
  const { theme, setTheme } = useTheme()
  const { t, i18n } = useTranslation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [appearanceOpen, setAppearanceOpen] = useState(false)
  const [languageOpen, setLanguageOpen] = useState(false)
  const flags = useFeatureFlags()
  const pendingInvites = usePendingInvites(user?.uid)
  const unreadMessages = useUnreadMessages(user?.uid)
  const menuRef = useRef<HTMLDivElement>(null)

  const currentLocale = i18n.language === 'pt-BR' ? 'pt-BR' : i18n.language.split('-')[0]

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
        setAppearanceOpen(false)
        setLanguageOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-nav border-b border-outline-variant/10">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">

        {/* Logo */}
        <div className="flex-shrink-0">
          <span className="text-2xl font-extrabold text-primary tracking-[-0.02em]">Ludify</span>
        </div>

        {/* Desktop center nav tabs */}
        {navTabs && navTabs.length > 0 && (
          <nav className="hidden md:flex items-center gap-8">
            {navTabs.map((tb, i) => (
              <React.Fragment key={tb.id}>
                <button
                  key={tb.id}
                  onClick={() => onTabChange?.(tb.id)}
                  className={`text-sm transition-colors duration-200 relative pb-0.5 ${
                    currentTab === tb.id
                      ? 'text-primary font-bold'
                      : 'text-on-surface-variant font-medium hover:text-secondary'
                  }`}
                >
                  {tb.label}
                  {currentTab === tb.id && (
                    <span className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-primary rounded-full" />
                  )}
                </button>
                {user && i === navTabs.findIndex((t) => t.id === 'events') && (
                  <Link
                    key="messages"
                    href="/messages"
                    className="relative text-sm font-medium text-on-surface-variant hover:text-secondary transition-colors duration-200 pb-0.5"
                  >
                    {t('menu.messages')}
                    {unreadMessages > 0 && (
                      <span className="absolute -top-2 -right-4 min-w-[16px] h-4 bg-error text-on-error text-[9px] font-bold rounded-full flex items-center justify-center px-0.5">
                        {unreadMessages > 9 ? '9+' : unreadMessages}
                      </span>
                    )}
                  </Link>
                )}
              </React.Fragment>
            ))}
          </nav>
        )}

        {/* Right side: bell + avatar/menu */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {!loading && (
            <>
              {user ? (
                <>
                  {/* Notification bell */}
                  <Link
                    href="/invites"
                    className="relative p-2 text-on-surface-variant hover:text-primary transition-colors rounded-full hover:bg-surface-container-high"
                    aria-label={t('menu.invites')}
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    </svg>
                    {pendingInvites > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-secondary rounded-full" />
                    )}
                  </Link>

                  {/* Avatar + dropdown */}
                  <div className="relative flex items-center gap-1" ref={menuRef}>
                    <Link href="/profile" className="relative flex items-center rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-surface">
                      {user.photoURL ? (
                        <Image
                          src={user.photoURL}
                          alt={user.displayName ?? 'User'}
                          width={36}
                          height={36}
                          className="rounded-full border-2 border-primary/20"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-surface-container-highest flex items-center justify-center text-sm font-medium text-primary border-2 border-primary/20">
                          {user.displayName?.[0] ?? '?'}
                        </div>
                      )}
                    </Link>
                    <button
                      onClick={() => { setMenuOpen((o) => !o); setAppearanceOpen(false); setLanguageOpen(false) }}
                      className="flex items-center justify-center w-5 h-5 text-on-surface-variant hover:text-on-surface focus:outline-none"
                    >
                      <svg className={`w-3.5 h-3.5 transition-transform ${menuOpen ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {menuOpen && (
                      <div className="absolute right-0 top-full mt-2 w-56 bg-surface-container rounded-[1.5rem] card-shadow py-2 z-50">
                        <div className="px-4 py-2 pb-3">
                          <p className="text-xs font-medium text-on-surface truncate">{user.displayName}</p>
                          <p className="text-xs text-on-surface-variant/60 truncate">{user.email}</p>
                        </div>
                        <Link
                          href="/profile"
                          className="flex items-center gap-2 mx-2 px-3 py-2 text-sm text-on-surface hover:bg-surface-container-highest rounded-[0.75rem] transition-colors"
                          onClick={() => setMenuOpen(false)}
                        >
                          {t('menu.profile')}
                        </Link>
                        <Link
                          href="/friends"
                          className="flex items-center gap-2 mx-2 px-3 py-2 text-sm text-on-surface hover:bg-surface-container-highest rounded-[0.75rem] transition-colors"
                          onClick={() => setMenuOpen(false)}
                        >
                          {t('menu.friends')}
                        </Link>
                        {flags.marketplace && (
                          <Link
                            href="/marketplace/my-listings"
                            className="flex items-center gap-2 mx-2 px-3 py-2 text-sm text-on-surface hover:bg-surface-container-highest rounded-[0.75rem] transition-colors"
                            onClick={() => setMenuOpen(false)}
                          >
                            {t('menu.myListings')}
                          </Link>
                        )}
                        {flags.dms && (
                          <Link
                            href="/messages"
                            className="flex items-center justify-between mx-2 px-3 py-2 text-sm text-on-surface hover:bg-surface-container-highest rounded-[0.75rem] transition-colors"
                            onClick={() => setMenuOpen(false)}
                          >
                            <span>{t('menu.messages')}</span>
                            {unreadMessages > 0 && (
                              <span className="bg-primary text-on-primary text-xs font-semibold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                                {unreadMessages}
                              </span>
                            )}
                          </Link>
                        )}
                        <Link
                          href="/invites"
                          className="flex items-center justify-between mx-2 px-3 py-2 text-sm text-on-surface hover:bg-surface-container-highest rounded-[0.75rem] transition-colors"
                          onClick={() => setMenuOpen(false)}
                        >
                          <span>{t('menu.invites')}</span>
                          {pendingInvites > 0 && (
                            <span className="bg-red-500 text-white text-xs font-semibold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                              {pendingInvites}
                            </span>
                          )}
                        </Link>
                        <Link
                          href="/settings"
                          className="flex items-center gap-2 mx-2 px-3 py-2 text-sm text-on-surface hover:bg-surface-container-highest rounded-[0.75rem] transition-colors"
                          onClick={() => setMenuOpen(false)}
                        >
                          {t('menu.settings')}
                        </Link>

                        {/* Switch appearance */}
                        <div className="mt-1 pt-1">
                          <button
                            onClick={() => { setAppearanceOpen((o) => !o); setLanguageOpen(false) }}
                            className="flex items-center justify-between mx-2 px-3 py-2 text-sm text-on-surface hover:bg-surface-container-highest rounded-[0.75rem] transition-colors"
                            style={{ width: 'calc(100% - 1rem)' }}
                          >
                            <div className="flex items-center gap-2">
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="4" />
                                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
                              </svg>
                              {t('menu.switchAppearance')}
                            </div>
                            <svg
                              className={`w-3.5 h-3.5 text-on-surface-variant transition-transform ${appearanceOpen ? 'rotate-180' : ''}`}
                              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
                            >
                              <path d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>

                          {appearanceOpen && (
                            <div className="mx-2 mb-1 bg-surface-container-low rounded-[0.75rem] overflow-hidden">
                              {(['light', 'dark', 'system'] as const).map((opt) => (
                                <button
                                  key={opt}
                                  onClick={() => { setTheme(opt); Analytics.themeSwitched({ theme: opt }); setAppearanceOpen(false); setMenuOpen(false) }}
                                  className={`w-full flex items-center justify-between px-3 py-2 text-sm transition-colors ${
                                    theme === opt
                                      ? 'bg-surface-container-highest text-on-surface font-medium'
                                      : 'text-on-surface-variant hover:bg-surface-container-highest/60'
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5">
                                    {opt === 'light' && (
                                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="4" />
                                        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
                                      </svg>
                                    )}
                                    {opt === 'dark' && (
                                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
                                      </svg>
                                    )}
                                    {opt === 'system' && (
                                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="2" y="3" width="20" height="14" rx="2" />
                                        <path d="M8 21h8M12 17v4" />
                                      </svg>
                                    )}
                                    <span>{t(`menu.${opt}`)}</span>
                                  </div>
                                  {theme === opt && (
                                    <svg className="w-3.5 h-3.5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Language switcher */}
                        <div className="mt-1 pt-1">
                          <button
                            onClick={() => { setLanguageOpen((o) => !o); setAppearanceOpen(false) }}
                            className="flex items-center justify-between mx-2 px-3 py-2 text-sm text-on-surface hover:bg-surface-container-highest rounded-[0.75rem] transition-colors"
                            style={{ width: 'calc(100% - 1rem)' }}
                          >
                            <div className="flex items-center gap-2">
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" />
                              </svg>
                              {t('menu.language')}
                            </div>
                            <svg
                              className={`w-3.5 h-3.5 text-on-surface-variant transition-transform ${languageOpen ? 'rotate-180' : ''}`}
                              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
                            >
                              <path d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>

                          {languageOpen && (
                            <div className="mx-2 mb-1 bg-surface-container-low rounded-[0.75rem] overflow-hidden">
                              {LOCALES.map(({ code, label }) => (
                                <button
                                  key={code}
                                  onClick={() => { localStorage.setItem('gn_locale', code); i18n.changeLanguage(code); Analytics.languageSwitched({ language: code }); setLanguageOpen(false); setMenuOpen(false) }}
                                  className={`w-full flex items-center justify-between px-3 py-2 text-sm transition-colors ${
                                    currentLocale === code
                                      ? 'bg-surface-container-highest text-on-surface font-medium'
                                      : 'text-on-surface-variant hover:bg-surface-container-highest/60'
                                  }`}
                                >
                                  <span>{label}</span>
                                  {currentLocale === code && (
                                    <svg className="w-3.5 h-3.5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="mt-1 pt-1 pb-1 px-2">
                          <button
                            onClick={() => { setMenuOpen(false); signOutUser() }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-error hover:bg-error-container/20 rounded-[0.75rem] transition-colors"
                          >
                            {t('menu.signOut')}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <button
                  onClick={signInWithGoogle}
                  className="text-sm text-primary font-semibold hover:text-primary/80 transition-colors"
                >
                  {t('menu.signIn')}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  )
}
