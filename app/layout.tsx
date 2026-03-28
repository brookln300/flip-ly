import type { Metadata } from 'next'
import Providers from './components/Providers'
import GoogleAnalytics from './components/GoogleAnalytics'
import './globals.css'

export const metadata: Metadata = {
  title: 'FLIP-LY.NET — Find Garbage. We Mean Treasures.',
  description: 'AI-powered garage sale finder. We scraped Craigslist so you don\'t have to. Built in Comic Sans because we respect you.',
  metadataBase: new URL('https://flip-ly.net'),
  openGraph: {
    title: 'FLIP-LY.NET — Find Garbage. We Mean Treasures.',
    description: 'AI-powered garage sale finder with a lobster cursor, a fake Winamp player, and actual real deals. This is not a joke. OK it\'s a little bit of a joke.',
    url: 'https://flip-ly.net',
    siteName: 'flip-ly.net',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'flip-ly.net — AI-powered garage sale chaos',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FLIP-LY.NET — Find Garbage. We Mean Treasures.',
    description: 'AI-powered garage sale finder. Comic Sans. Lobster cursor. Real deals. Yes, all of those things at once.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <GoogleAnalytics />
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
