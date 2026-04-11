import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'The Lobster Protocol — Live Leaderboard | Flip-ly',
  description: 'Live leaderboard for the Lobster Protocol easter egg challenge. Every attempt is tracked. Every agent is watched.',
  openGraph: {
    title: 'The Lobster Protocol — Live Leaderboard',
    description: '7 levels. 5 winners. Every attempt is tracked. Can you crack the Lobster Protocol?',
    images: [{ url: '/og-lobster-hunt.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The Lobster Protocol — Live Leaderboard',
    description: '7 levels. 5 winners. Every attempt is tracked. Can you crack the Lobster Protocol?',
    images: ['/og-lobster-hunt.png'],
  },
}

export default function LobsterHuntLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
