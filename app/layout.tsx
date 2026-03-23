import type { Metadata } from 'next'
import { Plus_Jakarta_Sans, Manrope } from 'next/font/google'
import { AuthProvider } from '@/contexts/AuthContext'
import { FeatureFlagsProvider } from '@/contexts/FeatureFlagsContext'
import { ThemeProvider } from '@/components/ThemeProvider'
import { I18nProvider } from '@/components/I18nProvider'
import { PWAInstallPrompt } from '@/components/layout/PWAInstallPrompt'
import { NotificationBanner } from '@/components/layout/NotificationBanner'
import './globals.css'

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#040d22" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className={`${plusJakartaSans.variable} ${manrope.variable} font-sans antialiased bg-surface text-on-surface min-h-screen`}>
        <ThemeProvider>
          <I18nProvider>
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
