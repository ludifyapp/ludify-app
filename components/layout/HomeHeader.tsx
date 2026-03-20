'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useTheme } from 'next-themes'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { usePendingInvites } from '@/hooks/usePendingInvites'
import { useUnreadMessages } from '@/hooks/useUnreadMessages'
import { Analytics } from '@/lib/analytics'
import { useFeatureFlags } from '@/contexts/FeatureFlagsContext'

const LOCALES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'pt-BR', label: 'Português (BR)' },
] as const

export function HomeHeader() {
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
    <div className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Ludify</h1>
      </div>

      <div className="flex items-center gap-2">
        {!loading && (
          <>
            {user ? (
              <>
                <div className="relative ml-1 flex items-center gap-1" ref={menuRef}>
                  <Link href="/profile" className="relative flex items-center rounded-full focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-950">
                    {user.photoURL ? (
                      <Image
                        src={user.photoURL}
                        alt={user.displayName ?? 'User'}
                        width={40}
                        height={40}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center text-sm font-medium text-teal-700 dark:text-teal-300">
                        {user.displayName?.[0] ?? '?'}
                      </div>
                    )}
                    {pendingInvites > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-white dark:border-zinc-950" />
                    )}
                  </Link>
                  <button
                    onClick={() => { setMenuOpen((o) => !o); setAppearanceOpen(false); setLanguageOpen(false) }}
                    className="flex items-center justify-center w-5 h-5 text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300 focus:outline-none"
                  >
                    <svg className={`w-3.5 h-3.5 transition-transform ${menuOpen ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {menuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-slate-100 dark:border-zinc-800 py-1 z-50">
                      <div className="px-4 py-2 border-b border-slate-100 dark:border-zinc-800">
                        <p className="text-xs font-medium text-slate-900 dark:text-white truncate">{user.displayName}</p>
                        <p className="text-xs text-slate-500 dark:text-zinc-400 truncate">{user.email}</p>
                      </div>
                      <Link
                        href="/profile"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800"
                        onClick={() => setMenuOpen(false)}
                      >
                        {t('menu.profile')}
                      </Link>
                      <Link
                        href="/friends"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800"
                        onClick={() => setMenuOpen(false)}
                      >
                        {t('menu.friends')}
                      </Link>
                      {flags.marketplace && (
                        <Link
                          href="/marketplace/my-listings"
                          className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800"
                          onClick={() => setMenuOpen(false)}
                        >
                          {t('menu.myListings')}
                        </Link>
                      )}
                      {flags.dms && (
                        <Link
                          href="/messages"
                          className="flex items-center justify-between px-4 py-2 text-sm text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800"
                          onClick={() => setMenuOpen(false)}
                        >
                          <span>{t('menu.messages')}</span>
                          {unreadMessages > 0 && (
                            <span className="bg-teal-500 text-white text-xs font-semibold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                              {unreadMessages}
                            </span>
                          )}
                        </Link>
                      )}
                      <Link
                        href="/invites"
                        className="flex items-center justify-between px-4 py-2 text-sm text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800"
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
                        className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800"
                        onClick={() => setMenuOpen(false)}
                      >
                        {t('menu.settings')}
                      </Link>

                      {/* Switch appearance */}
                      <div className="border-t border-slate-100 dark:border-zinc-800 mt-1 pt-1">
                        <button
                          onClick={() => { setAppearanceOpen((o) => !o); setLanguageOpen(false) }}
                          className="w-full flex items-center justify-between px-4 py-2 text-sm text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800"
                        >
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="4" />
                              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
                            </svg>
                            {t('menu.switchAppearance')}
                          </div>
                          <svg
                            className={`w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 transition-transform ${appearanceOpen ? 'rotate-180' : ''}`}
                            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
                          >
                            <path d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>

                        {appearanceOpen && (
                          <div className="mx-2 mb-1 rounded-lg overflow-hidden border border-slate-100 dark:border-zinc-800">
                            {(['light', 'dark', 'system'] as const).map((opt) => (
                              <button
                                key={opt}
                                onClick={() => { setTheme(opt); Analytics.themeSwitched({ theme: opt }); setAppearanceOpen(false); setMenuOpen(false) }}
                                className={`w-full flex items-center justify-between px-3 py-2 text-sm transition-colors ${
                                  theme === opt
                                    ? 'bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-white font-medium'
                                    : 'text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800/60'
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
                                  <svg className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Language switcher */}
                      <div className="border-t border-slate-100 dark:border-zinc-800 mt-1 pt-1">
                        <button
                          onClick={() => { setLanguageOpen((o) => !o); setAppearanceOpen(false) }}
                          className="w-full flex items-center justify-between px-4 py-2 text-sm text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800"
                        >
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10" />
                              <path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" />
                            </svg>
                            {t('menu.language')}
                          </div>
                          <svg
                            className={`w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 transition-transform ${languageOpen ? 'rotate-180' : ''}`}
                            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
                          >
                            <path d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>

                        {languageOpen && (
                          <div className="mx-2 mb-1 rounded-lg overflow-hidden border border-slate-100 dark:border-zinc-800">
                            {LOCALES.map(({ code, label }) => (
                              <button
                                key={code}
                                onClick={() => { localStorage.setItem('gn_locale', code); i18n.changeLanguage(code); Analytics.languageSwitched({ language: code }); setLanguageOpen(false); setMenuOpen(false) }}
                                className={`w-full flex items-center justify-between px-3 py-2 text-sm transition-colors ${
                                  currentLocale === code
                                    ? 'bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-white font-medium'
                                    : 'text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800/60'
                                }`}
                              >
                                <span>{label}</span>
                                {currentLocale === code && (
                                  <svg className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="border-t border-slate-100 dark:border-zinc-800 mt-1 pt-1">
                        <button
                          onClick={() => { setMenuOpen(false); signOutUser() }}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30"
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
                className="text-sm text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200 font-medium"
              >
                {t('menu.signIn')}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
