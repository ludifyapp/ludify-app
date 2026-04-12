import type { Metadata } from 'next'
import { Plus_Jakarta_Sans, Manrope } from 'next/font/google'
import { cookies, headers } from 'next/headers'
import { AuthProvider } from '@/contexts/AuthContext'
import { FeatureFlagsProvider } from '@/contexts/FeatureFlagsContext'
import { ThemeProvider } from '@/components/ThemeProvider'
import { I18nProvider } from '@/components/I18nProvider'
import { PWAInstallPrompt } from '@/components/layout/PWAInstallPrompt'
import { NotificationBanner } from '@/components/layout/NotificationBanner'
import './globals.css'

const VALID_LOCALES = ['en', 'es', 'pt-BR'] as const
type SupportedLocale = typeof VALID_LOCALES[number]

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta-sans',
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
})

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Ludify',
  description: 'Discover players, organize game nights, and trade board games',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Ludify',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
}

function detectLocaleFromHeader(acceptLanguage: string): SupportedLocale {
  for (const part of acceptLanguage.split(',')) {
    const tag = part.split(';')[0].trim().toLowerCase()
    if (tag === 'pt-br' || tag.startsWith('pt')) return 'pt-BR'
    if (tag.startsWith('es')) return 'es'
    if (tag.startsWith('en')) return 'en'
  }
  return 'en'
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const raw = cookieStore.get('gn_locale')?.value

  let locale: SupportedLocale
  if (VALID_LOCALES.includes(raw as SupportedLocale)) {
    // User has an explicit preference stored
    locale = raw as SupportedLocale
  } else {
    // First visit — use the browser/OS language from the Accept-Language header
    const headersList = await headers()
    locale = detectLocaleFromHeader(headersList.get('accept-language') ?? '')
  }

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#040d22" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        {/* Embed locale for the i18n client so SSR and hydration render identical text */}
        <script dangerouslySetInnerHTML={{ __html: `window.__GN_LOCALE__=${JSON.stringify(locale)}` }} />
      </head>
      <body className={`${plusJakartaSans.variable} ${manrope.variable} font-sans antialiased bg-surface text-on-surface min-h-screen`}>
        <ThemeProvider>
          <I18nProvider serverLocale={locale}>
            <FeatureFlagsProvider>
              <AuthProvider>
                <NotificationBanner />
                {children}
                <PWAInstallPrompt />
              </AuthProvider>
            </FeatureFlagsProvider>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
