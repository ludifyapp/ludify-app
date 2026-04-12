'use client'
import { useEffect } from 'react'
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from '../public/locales/en/common.json'
import es from '../public/locales/es/common.json'
import ptBR from '../public/locales/pt-BR/common.json'

const resources = {
  en: { common: en },
  es: { common: es },
  'pt-BR': { common: ptBR },
}

// Detect the user's preferred locale from localStorage or navigator.
// Only called on the client (inside useEffect).
function detectLocale(): string {
  try {
    const stored = localStorage.getItem('gn_locale')
    if (stored && stored in resources) return stored
    const nav = navigator.language
    if (nav === 'pt-BR' || nav.startsWith('pt')) return 'pt-BR'
    if (nav.startsWith('es')) return 'es'
  } catch {}
  return 'en'
}

// Initialize with 'en' as a neutral default. The serverLocale prop will
// synchronously set the real locale before children render, on both server
// and client — ensuring SSR and hydration produce identical text.
if (!i18n.isInitialized) {
  i18n
    .use(initReactI18next)
    .init({
      resources,
      fallbackLng: 'en',
      lng: 'en',
      defaultNS: 'common',
      interpolation: { escapeValue: false },
    })
}

export function I18nProvider({
  children,
  serverLocale,
}: {
  children: React.ReactNode
  serverLocale: string
}) {
  // Synchronously set the locale before children render.
  // This runs on both server (SSR) and client (hydration) with the same prop value,
  // so both renders produce identical text — no hydration mismatch.
  if (i18n.language !== serverLocale) {
    i18n.language = serverLocale
  }

  useEffect(() => {
    // After hydration: switch to user's locally-detected preference if different
    const locale = detectLocale()
    if (locale !== i18n.language) i18n.changeLanguage(locale)
  }, [])

  useEffect(() => {
    const setLang = (lng: string) => { document.documentElement.lang = lng }
    setLang(i18n.language)
    i18n.on('languageChanged', setLang)
    return () => { i18n.off('languageChanged', setLang) }
  }, [])

  return <>{children}</>
}
