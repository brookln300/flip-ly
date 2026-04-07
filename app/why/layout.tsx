import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Why flip-ly.net Looks Like This — On Purpose',
  description: 'We built an AI-powered garage sale finder that looks like GeoCities. Here\'s why Comic Sans, lobster cursors, and chaos are the point.',
  openGraph: {
    title: 'Why flip-ly.net Looks Like This',
    description: 'AI garage sale finder that looks like 1997. On purpose. Here\'s why.',
    images: [{ url: '/api/og', width: 1200, height: 630 }],
  },
}

export default function WhyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
