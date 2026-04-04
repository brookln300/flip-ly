import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Garage Sales Near You — AI-Scored Deals | Flip-ly.net',
  description: 'Find the best garage sales, estate sales, and yard sales near you. AI scans 20+ sources daily and delivers curated deals to your inbox every Thursday. Free.',
  openGraph: {
    title: 'Garage Sales Near You — AI-Scored Deals | Flip-ly.net',
    description: 'Stop scrolling Craigslist. Get the best garage sales near you delivered every Thursday. Free, AI-powered, 20+ sources.',
    url: 'https://flip-ly.net/garage-sales',
    siteName: 'Flip-ly',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Flip-ly.net — AI-powered garage sale finder' }],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Garage Sales Near You | Flip-ly.net',
    description: 'AI scans 20+ sources daily. Get the best garage sales near you every Thursday. Free.',
    images: ['/og-image.png'],
  },
  robots: { index: true, follow: true },
}

export default function GarageSalesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
