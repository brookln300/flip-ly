import type { Metadata } from 'next'
import { getFoundingSnapshot } from '../lib/founding'
import { getPowerVisibility } from '../lib/pricing'

// Captured at module load — redeploy required to reflect an env-var flip.
const _founding = getFoundingSnapshot()
const _powerVisibility = getPowerVisibility()
const _proPrice = _founding.priceVariant === 'founding' ? _founding.foundingPrice : _founding.normalPrice
const _isFounding = _founding.priceVariant === 'founding'
const _showPower = _powerVisibility === 'public'

const _title = _showPower
  ? 'Pricing — Pro & Power Plans | Flip-ly.net'
  : 'Pricing — Pro Plan | Flip-ly.net'

const _primaryDescription = [
  'Unlock unlimited searches, AI deal score breakdowns, and daily digests.',
  _showPower
    ? `Pro from $${_proPrice}/mo, Power from $19/mo.`
    : `Pro from $${_proPrice}/mo.`,
  _isFounding ? 'Founding price locked for life.' : 'Cancel anytime.',
].join(' ')

const _ogDescription = [
  'Unlimited searches, full AI score breakdowns, and daily deal digests.',
  _isFounding ? 'Founding price locked for life.' : 'Cancel anytime.',
].join(' ')

const _twitterDescription = `Unlimited searches, full AI score breakdowns, and daily deal digests. From $${_proPrice}/mo.`

export const metadata: Metadata = {
  title: _title,
  description: _primaryDescription,
  alternates: {
    canonical: 'https://flip-ly.net/pro',
  },
  openGraph: {
    title: _title,
    description: _ogDescription,
    url: 'https://flip-ly.net/pro',
    siteName: 'Flip-ly',
    images: [{ url: '/api/og', width: 1200, height: 630, alt: 'Flip-ly Pro — AI-powered deal scoring' }],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: _title,
    description: _twitterDescription,
    images: ['/api/og'],
  },
  robots: { index: true, follow: true },
}

export default function ProLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
