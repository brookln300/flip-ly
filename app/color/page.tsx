'use client'

import { useState } from 'react'

const schemes = [
  // ── DARK VARIANTS ──────────────────────────────────────
  {
    name: 'Dark — Original',
    description: 'Pure black base — the original design system palette',
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
    name: 'Dark — Deep Navy',
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
    name: 'Dark — Navy Teal',
    description: 'Navy base with teal-shifted green — fintech meets deal intelligence',
    bg: '#0B0E1A',
    surface: '#111528',
    border: '#1A1F38',
    green: '#10B981',
    amber: '#F59E0B',
    blue: '#38BDF8',
    purple: '#A78BFA',
    red: '#EF4444',
    textPrimary: '#F0F4FF',
    textSecondary: '#B8C4E0',
    textMuted: '#7B8AAE',
    textDim: '#4A5578',
  },
  {
    name: 'Dark — Warm Charcoal',
    description: 'Warm dark gray instead of cold black — approachable, less intimidating',
    bg: '#141210',
    surface: '#1C1A17',
    border: '#2A2722',
    green: '#22C55E',
    amber: '#F59E0B',
    blue: '#60A5FA',
    purple: '#C084FC',
    red: '#EF4444',
    textPrimary: '#FAF8F5',
    textSecondary: '#D4D0C8',
    textMuted: '#9B9588',
    textDim: '#6B6560',
  },
  {
    name: 'Dark — Slate',
    description: 'Cool gray foundation — professional, neutral, lets data pop',
    bg: '#0F1114',
    surface: '#181B20',
    border: '#252830',
    green: '#22C55E',
    amber: '#FBBF24',
    blue: '#3B82F6',
    purple: '#A78BFA',
    red: '#EF4444',
    textPrimary: '#F1F5F9',
    textSecondary: '#CBD5E1',
    textMuted: '#94A3B8',
    textDim: '#64748B',
  },

  // ── LIGHT VARIANTS ─────────────────────────────────────
  {
    name: 'Light — Clean White',
    description: 'Pure white base — Stripe/Notion clean. Maximum readability. Green CTA pops.',
    bg: '#FFFFFF',
    surface: '#F8F9FA',
    border: '#E5E7EB',
    green: '#16A34A',
    amber: '#D97706',
    blue: '#2563EB',
    purple: '#7C3AED',
    red: '#DC2626',
    textPrimary: '#111827',
    textSecondary: '#374151',
    textMuted: '#6B7280',
    textDim: '#9CA3AF',
  },
  {
    name: 'Light — Warm Gray',
    description: 'Off-white with warm undertone — softer than pure white, feels premium',
    bg: '#FAFAF8',
    surface: '#F3F2EE',
    border: '#E0DFDA',
    green: '#16A34A',
    amber: '#CA8A04',
    blue: '#2563EB',
    purple: '#7C3AED',
    red: '#DC2626',
    textPrimary: '#1A1A17',
    textSecondary: '#3D3D35',
    textMuted: '#71716A',
    textDim: '#A3A39B',
  },
  {
    name: 'Light — Cool Gray',
    description: 'Blue-tinted light gray — modern SaaS, Linear/Vercel docs energy',
    bg: '#F8FAFC',
    surface: '#F1F5F9',
    border: '#E2E8F0',
    green: '#16A34A',
    amber: '#D97706',
    blue: '#2563EB',
    purple: '#7C3AED',
    red: '#DC2626',
    textPrimary: '#0F172A',
    textSecondary: '#334155',
    textMuted: '#64748B',
    textDim: '#94A3B8',
  },
  {
    name: 'Light — Navy Contrast',
    description: 'White base with navy text instead of black — softer contrast, premium editorial feel',
    bg: '#FFFFFF',
    surface: '#F5F7FA',
    border: '#DDE1E9',
    green: '#059669',
    amber: '#D97706',
    blue: '#1D4ED8',
    purple: '#6D28D9',
    red: '#DC2626',
    textPrimary: '#1E293B',
    textSecondary: '#3B4F6B',
    textMuted: '#6880A0',
    textDim: '#9FAFC5',
  },
  {
    name: 'Light — Cream',
    description: 'Warm cream base — feels handcrafted, boutique, less clinical than pure white',
    bg: '#FDF9F3',
    surface: '#F5F0E8',
    border: '#E6DFD3',
    green: '#15803D',
    amber: '#B45309',
    blue: '#1D4ED8',
    purple: '#6D28D9',
    red: '#B91C1C',
    textPrimary: '#1C1712',
    textSecondary: '#44382C',
    textMuted: '#7D7060',
    textDim: '#A89E90',
  },
  {
    name: 'Light — Minimal',
    description: 'Almost no color — black/white + green only. Maximum confidence. Stripe annual report energy.',
    bg: '#FFFFFF',
    surface: '#FAFAFA',
    border: '#EEEEEE',
    green: '#16A34A',
    amber: '#374151',
    blue: '#374151',
    purple: '#374151',
    red: '#DC2626',
    textPrimary: '#000000',
    textSecondary: '#333333',
    textMuted: '#777777',
    textDim: '#AAAAAA',
  },

  // ── HYBRID / UNIQUE ────────────────────────────────────
  {
    name: 'Hybrid — Dark Header, Light Body',
    description: 'Dark hero/header transitions to light content sections — best of both worlds',
    bg: '#F8FAFC',
    surface: '#FFFFFF',
    border: '#E2E8F0',
    green: '#16A34A',
    amber: '#D97706',
    blue: '#2563EB',
    purple: '#7C3AED',
    red: '#DC2626',
    textPrimary: '#0F172A',
    textSecondary: '#334155',
    textMuted: '#64748B',
    textDim: '#94A3B8',
  },
  {
    name: 'Hybrid — Navy + White Cards',
    description: 'Deep navy background with white content cards — high contrast, premium, unique',
    bg: '#0A0F1E',
    surface: '#FFFFFF',
    border: '#E5E7EB',
    green: '#16A34A',
    amber: '#D97706',
    blue: '#2563EB',
    purple: '#7C3AED',
    red: '#DC2626',
    textPrimary: '#111827',
    textSecondary: '#374151',
    textMuted: '#6B7280',
    textDim: '#9CA3AF',
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
          {[
            { label: 'Dark', start: 0, end: 5 },
            { label: 'Light', start: 5, end: 11 },
            { label: 'Hybrid', start: 11, end: 13 },
          ].map(group => (
            <div key={group.label} style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '10px', color: scheme.textDim, fontFamily: 'system-ui, sans-serif', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '6px' }}>{group.label}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {schemes.slice(group.start, group.end).map((s, i) => {
                  const idx = group.start + i
                  return (
                    <button key={idx} onClick={() => setActive(idx)} style={{
                      padding: '6px 12px', borderRadius: '6px', fontSize: '11px',
                      fontFamily: 'system-ui, sans-serif', fontWeight: 500, cursor: 'pointer',
                      background: idx === active ? scheme.green : scheme.surface,
                      color: idx === active ? '#000' : scheme.textMuted,
                      border: `1px solid ${idx === active ? scheme.green : scheme.border}`,
                    }}>
                      {s.name.replace(/^(Dark|Light|Hybrid) — /, '')}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
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
