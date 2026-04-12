'use client'
import { useEffect } from 'react'
import { createInstance } from 'i18next'
import { initReactI18next, I18nextProvider } from 'react-i18next'
import en from '../public/locales/en/common.json'
import es from '../public/locales/es/common.json'
import ptBR from '../public/locales/pt-BR/common.json'

const resources = {
  en: { common: en },
  es: { common: es },
  'pt-BR': { common: ptBR },
}

// One isolated i18n instance per locale, created once and cached.
// Using isolated instances (not the global singleton) means each render uses
// the instance locked to that locale — React context propagates it to all
// useTranslation() hooks, so SSR and hydration always produce identical text.
const instances: Partial<Record<string, ReturnType<typeof createInstance>>> = {}

function getI18nInstance(locale: string) {
  const key = (locale in resources ? locale : 'en') as keyof typeof resources
  if (!instances[key]) {
    const inst = createInstance()
    inst.use(initReactI18next).init({
      resources,
      lng: key,
      fallbackLng: 'en',
      defaultNS: 'common',
      interpolation: { escapeValue: false },
      initImmediate: false, // synchronous init — resources are already bundled
    })
    instances[key] = inst
  }
  return instances[key]!
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

export function I18nProvider({
  children,
  serverLocale,
}: {
  children: React.ReactNode
  serverLocale: string
}) {
  // Get the per-locale instance. The same cached object is returned on both
  // server (SSR) and client (hydration) for the same serverLocale, so every
  // useTranslation() call in the subtree sees the same translations.
  const i18nInstance = getI18nInstance(serverLocale)

  useEffect(() => {
    // After hydration: switch to user's locally-detected preference if different
    const locale = detectLocale()
    if (locale !== i18nInstance.language) i18nInstance.changeLanguage(locale)
  }, [i18nInstance])

  useEffect(() => {
    const setLang = (lng: string) => { document.documentElement.lang = lng }
    setLang(i18nInstance.language)
    i18nInstance.on('languageChanged', setLang)
    return () => { i18nInstance.off('languageChanged', setLang) }
  }, [i18nInstance])

  return <I18nextProvider i18n={i18nInstance}>{children}</I18nextProvider>
}
