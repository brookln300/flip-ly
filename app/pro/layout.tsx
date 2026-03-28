import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'First Dibs Pro — $5/mo — flip-ly.net',
  description: 'Get the weekly digest 6 hours before everyone else. Unlimited search. Full AI deal scores. The lobster approves.',
  openGraph: {
    title: 'First Dibs Pro — $5/month',
    description: 'Digest 6hrs early. Unlimited search. Full AI scores. We don\'t know what this is worth but $5 seems right for you n00bz.',
    images: [{ url: '/og-pro.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'First Dibs Pro — $5/month',
    description: 'Digest 6hrs early. Unlimited search. Full AI deal scores. The lobster approves.',
    images: ['/og-pro.png'],
  },
}

export default function ProLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
