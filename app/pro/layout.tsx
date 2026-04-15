import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pricing — Pro & Power Plans | Flip-ly.net',
  description: 'Unlock unlimited searches, AI deal score breakdowns, daily digests, and instant alerts. Pro from $5/mo, Power from $19/mo. Founding price locked for life.',
  alternates: {
    canonical: 'https://flip-ly.net/pro',
  },
  openGraph: {
    title: 'Pricing — Pro & Power Plans | Flip-ly.net',
    description: 'Unlimited searches, full AI score breakdowns, and daily deal digests. Founding price locked for life. Cancel anytime.',
    url: 'https://flip-ly.net/pro',
    siteName: 'Flip-ly',
    images: [{ url: '/api/og', width: 1200, height: 630, alt: 'Flip-ly Pro — AI-powered deal scoring' }],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pricing — Pro & Power Plans | Flip-ly.net',
    description: 'Unlimited searches, full AI score breakdowns, and daily deal digests. From $5/mo.',
    images: ['/api/og'],
  },
  robots: { index: true, follow: true },
}

export default function ProLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
