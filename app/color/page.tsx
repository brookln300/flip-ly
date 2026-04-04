'use client'

import { useState } from 'react'

const schemes = [
  {
    name: 'Primary (Locked)',
    description: 'The design system palette — Stripe-level confidence',
    bg: '#000000',
    surface: '#111111',
    border: '#1a1a1a',
    green: '#22C55E',
    amber: '#F59E0B',
    blue: '#3B82F6',
    purple: '#A78BFA',
    red: '#EF4444',
    textPrimary: '#FFFFFF',
    textSecondary: '#CCCCCC',
    textMuted: '#888888',
    textDim: '#555555',
  },
  {
    name: 'Variant A — Cooler Green',
    description: 'Shifts green toward teal — more fintech, less nature',
    bg: '#000000',
    surface: '#111111',
    border: '#1a1a1a',
    green: '#10B981',
    amber: '#F59E0B',
    blue: '#3B82F6',
    purple: '#A78BFA',
    red: '#EF4444',
    textPrimary: '#FFFFFF',
    textSecondary: '#CCCCCC',
    textMuted: '#888888',
    textDim: '#555555',
  },
  {
    name: 'Variant B — Warmer Accent',
    description: 'Amber shifts orange, green stays — more energy, deal-hunter edge',
    bg: '#000000',
    surface: '#111111',
    border: '#1a1a1a',
    green: '#22C55E',
    amber: '#FB923C',
    blue: '#60A5FA',
    purple: '#C084FC',
    red: '#F87171',
    textPrimary: '#FFFFFF',
    textSecondary: '#D4D4D4',
    textMuted: '#8B8B8B',
    textDim: '#525252',
  },
  {
    name: 'Variant C — Muted Professional',
    description: 'Lower saturation across the board — quieter, more Notion/Linear',
    bg: '#09090B',
    surface: '#18181B',
    border: '#27272A',
    green: '#4ADE80',
    amber: '#FCD34D',
    blue: '#93C5FD',
    purple: '#C4B5FD',
    red: '#FCA5A5',
    textPrimary: '#FAFAFA',
    textSecondary: '#D4D4D8',
    textMuted: '#A1A1AA',
    textDim: '#71717A',
  },
  {
    name: 'Variant D — Deep Navy Base',
    description: 'Near-black blue instead of pure black — adds depth without losing darkness',
    bg: '#0A0A1A',
    surface: '#12122A',
    border: '#1E1E3A',
    green: '#22C55E',
    amber: '#F59E0B',
    blue: '#3B82F6',
    purple: '#A78BFA',
    red: '#EF4444',
    textPrimary: '#FFFFFF',
    textSecondary: '#C8C8E0',
    textMuted: '#8888AA',
    textDim: '#555577',
  },
  {
    name: 'Variant E — Minimal Monochrome + Green',
    description: 'Kill all accent colors except green. Scores use white/gray intensity instead of color.',
    bg: '#000000',
    surface: '#111111',
    border: '#1a1a1a',
    green: '#22C55E',
    amber: '#FFFFFF',
    blue: '#CCCCCC',
    purple: '#999999',
    red: '#EF4444',
    textPrimary: '#FFFFFF',
    textSecondary: '#CCCCCC',
    textMuted: '#888888',
    textDim: '#555555',
  },
]

function ScoreCard({ score, color, mono }: { score: string; color: string; mono?: boolean }) {
  return (
    <span style={{
      fontFamily: mono ? "'JetBrains Mono', monospace" : "system-ui, sans-serif",
      fontSize: '18px', fontWeight: 700, color,
    }}>{score}</span>
  )
}

function DealCard({ scheme }: { scheme: typeof schemes[0] }) {
  return (
    <div style={{
      background: scheme.surface, border: `1px solid ${scheme.border}`,
      borderRadius: '12px', padding: '20px', maxWidth: '500px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div>
          <div style={{ color: scheme.textPrimary, fontSize: '15px', fontWeight: 600, fontFamily: 'system-ui, sans-serif', marginBottom: '4px' }}>
            KitchenAid Artisan Stand Mixer
          </div>
          <div style={{ color: scheme.textMuted, fontSize: '12px', fontFamily: 'system-ui, sans-serif' }}>
            $45 · Craigslist · DFW · 2 hours ago
          </div>
        </div>
        <ScoreCard score="8.7" color={scheme.amber} mono />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {[
          { label: 'Price', value: '62% below market avg for stand mixers', color: scheme.green },
          { label: 'Seller', value: '"Moving next week" — urgency signal', color: scheme.textSecondary },
          { label: 'Brand', value: 'KitchenAid Artisan — strong resale', color: scheme.textSecondary },
          { label: 'Quality', value: '4 photos, good condition visible', color: scheme.textSecondary },
        ].map(f => (
          <div key={f.label} style={{ display: 'flex', gap: '12px', fontSize: '13px', fontFamily: 'system-ui, sans-serif' }}>
            <span style={{ color: scheme.textDim, width: '52px', flexShrink: 0 }}>{f.label}</span>
            <span style={{ color: f.color }}>{f.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function PricingCard({ scheme, tier, price, features, highlighted }: {
  scheme: typeof schemes[0]; tier: string; price: string; features: string[]; highlighted?: boolean
}) {
  return (
    <div style={{
      background: scheme.surface,
      border: `1px solid ${highlighted ? scheme.green : scheme.border}`,
      borderRadius: '12px', padding: '24px', textAlign: 'center', flex: 1,
      boxShadow: highlighted ? `0 0 30px ${scheme.green}08` : 'none',
    }}>
      {highlighted && (
        <div style={{ fontSize: '10px', color: scheme.textMuted, fontFamily: 'system-ui, sans-serif', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>Most Popular</div>
      )}
      <div style={{ fontSize: '13px', color: highlighted ? scheme.green : scheme.textMuted, fontFamily: 'system-ui, sans-serif', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>{tier}</div>
      <div style={{ fontSize: '36px', fontWeight: 700, color: scheme.textPrimary, fontFamily: 'system-ui, sans-serif', marginBottom: '4px' }}>{price}</div>
      <div style={{ fontSize: '11px', color: scheme.textDim, fontFamily: 'system-ui, sans-serif', marginBottom: '20px' }}>
        {tier === 'Free' ? 'Forever' : 'Founding price · Locks in 12 days'}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left' }}>
        {features.map(f => (
          <div key={f} style={{ fontSize: '13px', color: scheme.textSecondary, fontFamily: 'system-ui, sans-serif' }}>{f}</div>
        ))}
      </div>
      <button style={{
        marginTop: '20px', width: '100%', padding: '10px',
        background: highlighted ? scheme.green : 'transparent',
        color: highlighted ? '#000' : scheme.textMuted,
        border: highlighted ? 'none' : `1px solid ${scheme.border}`,
        borderRadius: '8px', fontSize: '13px', fontWeight: 600,
        fontFamily: 'system-ui, sans-serif', cursor: 'pointer',
      }}>
        {tier === 'Free' ? 'Get Started' : tier === 'Pro' ? 'Start Pro' : 'Go Power'}
      </button>
    </div>
  )
}

export default function ColorPage() {
  const [active, setActive] = useState(0)
  const scheme = schemes[active]

  return (
    <div style={{ background: scheme.bg, minHeight: '100vh', padding: '40px 20px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>

        {/* Scheme selector */}
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{ color: scheme.textPrimary, fontSize: '24px', fontWeight: 700, fontFamily: 'system-ui, sans-serif', marginBottom: '8px' }}>
            Flip-ly Color System Preview
          </h1>
          <p style={{ color: scheme.textDim, fontSize: '13px', fontFamily: 'system-ui, sans-serif', marginBottom: '20px' }}>
            Tap a scheme to preview it across all components.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {schemes.map((s, i) => (
              <button key={i} onClick={() => setActive(i)} style={{
                padding: '8px 16px', borderRadius: '8px', fontSize: '12px',
                fontFamily: 'system-ui, sans-serif', fontWeight: 500, cursor: 'pointer',
                background: i === active ? scheme.green : scheme.surface,
                color: i === active ? '#000' : scheme.textMuted,
                border: `1px solid ${i === active ? scheme.green : scheme.border}`,
              }}>
                {s.name}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <p style={{ color: scheme.textSecondary, fontSize: '14px', fontFamily: 'system-ui, sans-serif', marginBottom: '32px' }}>
          {scheme.description}
        </p>

        {/* Color swatches */}
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ color: scheme.textPrimary, fontSize: '16px', fontWeight: 600, fontFamily: 'system-ui, sans-serif', marginBottom: '16px' }}>Palette</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            {[
              { label: 'Green (CTA)', color: scheme.green },
              { label: 'Amber (Scores)', color: scheme.amber },
              { label: 'Blue (Info)', color: scheme.blue },
              { label: 'Purple (Power)', color: scheme.purple },
              { label: 'Red (Error)', color: scheme.red },
              { label: 'Background', color: scheme.bg },
              { label: 'Surface', color: scheme.surface },
              { label: 'Text', color: scheme.textPrimary },
              { label: 'Muted', color: scheme.textMuted },
              { label: 'Dim', color: scheme.textDim },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '8px',
                  background: s.color, border: `1px solid ${scheme.border}`,
                  marginBottom: '4px',
                }} />
                <div style={{ fontSize: '9px', color: scheme.textDim, fontFamily: 'system-ui, sans-serif' }}>{s.label}</div>
                <div style={{ fontSize: '9px', color: scheme.textDim, fontFamily: 'monospace' }}>{s.color}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Score scale */}
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ color: scheme.textPrimary, fontSize: '16px', fontWeight: 600, fontFamily: 'system-ui, sans-serif', marginBottom: '16px' }}>Score Scale</h2>
          <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
            <ScoreCard score="9.4" color={scheme.green} mono />
            <ScoreCard score="7.8" color={scheme.amber} mono />
            <ScoreCard score="5.2" color={scheme.textMuted} mono />
            <ScoreCard score="3.1" color={scheme.textDim} mono />
          </div>
        </div>

        {/* Deal card preview */}
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ color: scheme.textPrimary, fontSize: '16px', fontWeight: 600, fontFamily: 'system-ui, sans-serif', marginBottom: '16px' }}>Score Breakdown Card</h2>
          <DealCard scheme={scheme} />
        </div>

        {/* Hero preview */}
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ color: scheme.textPrimary, fontSize: '16px', fontWeight: 600, fontFamily: 'system-ui, sans-serif', marginBottom: '16px' }}>Hero Preview</h2>
          <div style={{ padding: '40px 0' }}>
            <h3 style={{
              fontFamily: 'system-ui, sans-serif', fontSize: 'clamp(28px, 5vw, 48px)',
              color: scheme.textPrimary, fontWeight: 700, letterSpacing: '-0.03em',
              lineHeight: 1.1, marginBottom: '16px',
            }}>
              Every deal near you.<br />Scored before you see it.
            </h3>
            <p style={{
              color: scheme.textSecondary, fontSize: '15px', lineHeight: 1.7,
              fontFamily: 'system-ui, sans-serif', maxWidth: '480px', marginBottom: '24px',
            }}>
              We scan Craigslist, estate sales, OfferUp, and 20+ local sources. AI scores every listing for flip potential. You see what's worth your time.
            </p>
            <button style={{
              padding: '12px 28px', background: scheme.green, color: '#000',
              border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600,
              fontFamily: 'system-ui, sans-serif', cursor: 'pointer',
            }}>
              Start finding deals
            </button>
            <p style={{ color: scheme.textDim, fontSize: '12px', fontFamily: 'system-ui, sans-serif', marginTop: '12px' }}>
              Free · 15 searches/day · No credit card
            </p>
          </div>
        </div>

        {/* Pricing preview */}
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ color: scheme.textPrimary, fontSize: '16px', fontWeight: 600, fontFamily: 'system-ui, sans-serif', marginBottom: '16px' }}>Pricing Preview</h2>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <PricingCard scheme={scheme} tier="Free" price="$0" features={[
              '15 searches/day', '1 market', 'Score numbers only', 'Weekly digest',
            ]} />
            <PricingCard scheme={scheme} tier="Pro" price="$5" highlighted features={[
              'Unlimited searches', '3 markets', 'Full score breakdown', 'Daily + weekly digest', '3 saved searches',
            ]} />
            <PricingCard scheme={scheme} tier="Power" price="$19" features={[
              'Unlimited everything', 'Unlimited markets', 'Breakdown + trends', 'Instant deal alerts', 'Unlimited saved searches',
            ]} />
          </div>
          <p style={{ color: scheme.textDim, fontSize: '12px', fontFamily: 'system-ui, sans-serif', marginTop: '12px', textAlign: 'center' }}>
            Founding pricing ends in 12 days.
          </p>
        </div>

        {/* Buttons */}
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ color: scheme.textPrimary, fontSize: '16px', fontWeight: 600, fontFamily: 'system-ui, sans-serif', marginBottom: '16px' }}>Buttons</h2>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button style={{
              padding: '12px 24px', background: scheme.green, color: '#000',
              border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600,
              fontFamily: 'system-ui, sans-serif', cursor: 'pointer',
            }}>Primary CTA</button>
            <button style={{
              padding: '12px 24px', background: 'transparent', color: scheme.textMuted,
              border: `1px solid ${scheme.border}`, borderRadius: '8px', fontSize: '14px', fontWeight: 600,
              fontFamily: 'system-ui, sans-serif', cursor: 'pointer',
            }}>Secondary</button>
            <span style={{ color: scheme.textMuted, fontSize: '14px', fontFamily: 'system-ui, sans-serif', cursor: 'pointer' }}>
              Text link →
            </span>
          </div>
        </div>

      </div>
    </div>
  )
}
