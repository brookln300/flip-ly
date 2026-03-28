import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Lobster Hunt — 7 Decoys. 1 Real Password. 1 Lobster Dinner.',
  description: 'Hidden clues in hex, base64, morse, and NATO alphabet. Can you crack the real password? The Hall of Almost awaits.',
  openGraph: {
    title: 'Lobster Hunt — Can You Crack It?',
    description: '7 decoy passwords. 1 real one. 1 lobster dinner delivered to your door. The clues are hidden in the source code.',
    images: [{ url: '/og-lobster-hunt.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Lobster Hunt — Can You Crack It?',
    description: '7 decoys. 1 real password. 1 lobster dinner. Hidden in the source code of flip-ly.net.',
    images: ['/og-lobster-hunt.png'],
  },
}

export default function LobsterHuntLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
