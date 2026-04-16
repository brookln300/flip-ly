import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import Providers from './components/Providers'
import GoogleAnalytics from './components/GoogleAnalytics'
import CookieConsentBanner from './components/CookieConsentBanner'
import ConsentGatedAnalytics from './components/ConsentGatedAnalytics'
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
  alternates: {
    canonical: 'https://flip-ly.net',
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
      name: 'Duskfall Ventures LLC',
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
    {
      '@type': 'SoftwareApplication',
      name: 'Flip-ly',
      applicationCategory: 'LifestyleApplication',
      operatingSystem: 'Web',
      offers: [
        { '@type': 'Offer', price: '0', priceCurrency: 'USD', name: 'Free', description: '15 searches/day, 1 market, weekly digest' },
        { '@type': 'Offer', price: '5', priceCurrency: 'USD', name: 'Pro (Founding)', description: 'Unlimited search, 3 markets, daily digest, full AI scores' },
        { '@type': 'Offer', price: '19', priceCurrency: 'USD', name: 'Power (Founding)', description: 'Unlimited everything, instant alerts, trend data' },
      ],
      aggregateRating: undefined,
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'How does Flip-ly find garage sales near me?',
          acceptedAnswer: { '@type': 'Answer', text: 'Flip-ly scans Craigslist, EstateSales.NET, and 20+ local sources across 400+ US markets every few hours. Our AI scores each listing 1-10 based on price signals, category, description quality, and timing so you see the best deals first.' },
        },
        {
          '@type': 'Question',
          name: 'Is Flip-ly free?',
          acceptedAnswer: { '@type': 'Answer', text: 'Yes. The free tier includes 15 searches per day, 1 market, and a weekly deals digest. Pro ($5/mo) unlocks unlimited searches, 3 markets, and daily digests. Power ($19/mo) adds instant alerts and trend data.' },
        },
        {
          '@type': 'Question',
          name: 'What is AI deal scoring?',
          acceptedAnswer: { '@type': 'Answer', text: 'Every listing gets a score from 1 to 10 based on five factors: price signals (underpriced items), category depth (tools, electronics, furniture), description quality (detail = serious seller), freshness (just posted), and timing (weekend sales). Scores of 8+ are flagged as hot deals worth driving to.' },
        },
        {
          '@type': 'Question',
          name: 'What cities does Flip-ly cover?',
          acceptedAnswer: { '@type': 'Answer', text: 'Flip-ly currently covers 400+ markets across the US including Dallas, Houston, Austin, Los Angeles, Phoenix, Seattle, Salt Lake City, South Florida, and San Antonio. New markets are added weekly.' },
        },
      ],
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
        <ConsentGatedAnalytics />
        <Providers>{children}</Providers>
        <CookieConsentBanner />
      </body>
    </html>
  )
}
