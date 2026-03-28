import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'flip-ly.net — Links',
  description: 'AI-powered garage sale finder. Comic Sans. Lobster cursor. Real deals. All the links in one place.',
  openGraph: {
    title: 'flip-ly.net 🦞',
    description: 'AI garage sale finder. Hidden easter egg. Lobster Hunt contest. All links here.',
    images: [{ url: '/og-links.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'flip-ly.net 🦞',
    description: 'AI garage sale finder. Hidden easter egg. Lobster Hunt contest. All links here.',
    images: ['/og-links.png'],
  },
}

export default function LinksLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
