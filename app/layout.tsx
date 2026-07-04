import type { Metadata } from 'next'
import { Inter, JetBrains_Mono, Fraunces } from 'next/font/google'
import Providers from './components/Providers'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-primary',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  weight: ['400', '600'],
})

/**
 * flip-ly is a PRIVATE DFW opportunity hub (Mission Control) for Keith + family.
 * No public marketing, no third-party analytics, no consent banner, no indexing.
 */
export const metadata: Metadata = {
  title: 'flip-ly · DFW Mission Control',
  description: 'Private opportunity hub for the Dallas–Fort Worth area.',
  metadataBase: new URL('https://flip-ly.net'),
  robots: { index: false, follow: false },
  icons: { icon: '/favicon.ico' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${jetbrainsMono.variable} ${fraunces.variable}`}>
        <a href="#main" className="skip-to-main">Skip to main content</a>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
