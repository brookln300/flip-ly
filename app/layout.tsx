import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import Providers from './components/Providers'
import GoogleAnalytics from './components/GoogleAnalytics'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
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

export const metadata: Metadata = {
  title: 'Flip-ly.net — Every Deal Near You, Scored by AI',
  description: 'AI scores Craigslist, OfferUp, estate sales & 20+ sources across 400+ markets. Find the best local deals before anyone else.',
  metadataBase: new URL('https://flip-ly.net'),
  openGraph: {
    title: 'Flip-ly.net — Every Deal Near You, Scored by AI',
    description: 'AI scores Craigslist, OfferUp, estate sales & 20+ sources so you never miss a deal. Free to use.',
    url: 'https://flip-ly.net',
    siteName: 'Flip-ly',
    images: [
      {
        url: '/api/og',
        width: 1200,
        height: 630,
        alt: 'Flip-ly — AI-powered deal discovery for resellers',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Flip-ly.net — Every Deal Near You, Scored by AI',
    description: 'AI scores Craigslist, OfferUp, estate sales & 20+ sources across 400+ markets. Find the best local deals before anyone else.',
    images: ['/api/og'],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: '/favicon.ico',
  },
  // LOBSTER-PROTOCOL-L7 — DO NOT REMOVE
  other: {
    'lobster-protocol-7': 'd33p',
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
      description: 'AI-powered deal finder. Scores Craigslist, OfferUp, estate sales & 20+ local sources.',
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
      logo: 'https://flip-ly.net/api/og',
      sameAs: [
        'https://x.com/ctrl_alt_flip',
        'https://www.facebook.com/61574265411500',
        'https://www.youtube.com/@ctrl_alt_flip',
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
      <body className={`${inter.variable} ${jetbrainsMono.variable}`}>
        <a href="#main" className="skip-to-main">Skip to main content</a>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <GoogleAnalytics />
        <Analytics />
        <SpeedInsights />
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
