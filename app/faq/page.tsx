'use client'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'

const FAQ_KEYS = ['1', '2', '3', '4', '5', '6'] as const

export default function FaqPage() {
  const { t } = useTranslation()
  return (
    <main className="min-h-screen bg-surface pt-8 pb-24">
      <div className="max-w-2xl mx-auto px-4">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary mb-8">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          {t('faq.back')}
        </Link>

        <h1 className="text-3xl font-extrabold tracking-tight text-on-surface mb-2">{t('faq.title')}</h1>
        <p className="text-sm text-on-surface-variant mb-10">{t('faq.subtitle')}</p>

        <div className="flex flex-col gap-4">
          {FAQ_KEYS.map((n) => (
            <div key={n} className="bg-surface-container-high rounded-[1.25rem] p-5">
              <p className="font-bold text-on-surface mb-2">{t(`faq.q${n}`)}</p>
              <p className="text-sm text-on-surface-variant leading-relaxed">{t(`faq.a${n}`)}</p>
            </div>
          ))}
        </div>

        <p className="mt-10 text-xs text-on-surface-variant/50 text-center">
          {t('faq.stillHaveQuestions')}{' '}
          <a href="mailto:hello@ludify.app" className="underline hover:text-on-surface-variant">
            hello@ludify.app
          </a>
        </p>
      </div>
    </main>
  )
}
