import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pro & Power Plans — flip-ly.net',
  description: 'Unlimited searches, full AI score breakdowns, early digest access, and instant deal alerts. Plans from $5/mo.',
  openGraph: {
    title: 'Flip-ly Pro & Power Plans',
    description: 'Unlimited searches, full AI score breakdowns, early digest access. Plans from $5/mo.',
    images: [{ url: '/api/og', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Flip-ly Pro & Power Plans',
    description: 'Unlimited searches, full AI score breakdowns, early digest access. Plans from $5/mo.',
    images: ['/api/og'],
  },
}

export default function ProLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
