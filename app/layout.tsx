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

/**
 * JSON-LD Structured Data
 *
 * This tells Google WHAT flip-ly.net IS in machine-readable format.
 * Without it, Google guesses. With it, Google knows:
 * - It's a web application for finding garage sales
 * - It's made by a specific organization
 * - It has social profiles
 * - It has a search feature
 *
 * This can unlock "rich results" in Google Search — things like
 * star ratings, FAQ dropdowns, sitelinks, and knowledge panels.
 * Most small sites don't bother. We do. Costs nothing, helps a lot.
 */
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebApplication',
      '@id': 'https://flip-ly.net/#app',
      name: 'Flip-ly',
      url: 'https://flip-ly.net',
      description: 'AI-powered garage sale finder. Find local garage sales, estate sales, and community markets.',
      applicationCategory: 'ShoppingApplication',
      operatingSystem: 'Web',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
        description: 'Free tier with local garage sale search',
      },
      creator: {
        '@type': 'Organization',
        '@id': 'https://flip-ly.net/#org',
      },
    },
    {
      '@type': 'Organization',
      '@id': 'https://flip-ly.net/#org',
      name: 'Flip-ly',
      url: 'https://flip-ly.net',
      logo: 'https://flip-ly.net/og-image.png',
      sameAs: [
        'https://x.com/ctrl_alt_flip',
        'https://www.instagram.com/ctrl_alt_flip/',
        'https://www.tiktok.com/@ctrl_alt_flip',
      ],
    },
    {
      '@type': 'WebSite',
      '@id': 'https://flip-ly.net/#website',
      url: 'https://flip-ly.net',
      name: 'Flip-ly',
      publisher: {
        '@id': 'https://flip-ly.net/#org',
      },
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: 'https://flip-ly.net/dashboard?q={search_term_string}',
        },
        'query-input': 'required name=search_term_string',
      },
    },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <GoogleAnalytics />
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
