import type { Metadata } from 'next'
import { Plus_Jakarta_Sans, Manrope } from 'next/font/google'
import { cookies } from 'next/headers'
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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const raw = cookieStore.get('gn_locale')?.value
  const locale: SupportedLocale = VALID_LOCALES.includes(raw as SupportedLocale) ? (raw as SupportedLocale) : 'en'

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
