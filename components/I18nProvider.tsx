'use client'
import { useEffect } from 'react'
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import en from '../public/locales/en/common.json'
import es from '../public/locales/es/common.json'
import ptBR from '../public/locales/pt-BR/common.json'

if (!i18n.isInitialized) {
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources: {
        en: { common: en },
        es: { common: es },
        'pt-BR': { common: ptBR },
      },
      fallbackLng: 'en',
      defaultNS: 'common',
      detection: {
        order: ['localStorage', 'navigator'],
        lookupLocalStorage: 'gn_locale',
        caches: ['localStorage'],
      },
      interpolation: {
        escapeValue: false,
      },
    })
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const setLang = (lng: string) => {
      document.documentElement.lang = lng
    }
    setLang(i18n.language)
    i18n.on('languageChanged', setLang)
    return () => { i18n.off('languageChanged', setLang) }
  }, [])

  return <>{children}</>
}
