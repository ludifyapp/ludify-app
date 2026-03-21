import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { AuthProvider } from '@/contexts/AuthContext'
import { FeatureFlagsProvider } from '@/contexts/FeatureFlagsContext'
import { ThemeProvider } from '@/components/ThemeProvider'
import { I18nProvider } from '@/components/I18nProvider'
import { PWAInstallPrompt } from '@/components/layout/PWAInstallPrompt'
import { NotificationBanner } from '@/components/layout/NotificationBanner'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
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
        <meta name="theme-color" content="#0d9488" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className={`${inter.variable} font-sans antialiased bg-slate-50 dark:bg-zinc-950 min-h-screen`}>
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
