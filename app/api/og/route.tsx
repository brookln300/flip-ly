import { ImageResponse } from 'next/og'

export const runtime = 'edge'

/**
 * GET /api/og
 *
 * Dynamic OG image for social sharing (Twitter, Discord, iMessage, etc.)
 * Uses @vercel/og (built into Next.js) to render JSX → PNG at the edge.
 * Output: 1200x630 PNG, ~40-60KB (vs old static og-image.png at 1.9MB)
 */
export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(145deg, #ffffff 0%, #f5f5f7 50%, #eef2e6 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          position: 'relative',
        }}
      >
        {/* Subtle grid pattern */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'linear-gradient(rgba(0,0,0,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.02) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        {/* Logo / Brand */}
        <div
          style={{
            fontSize: 80,
            fontWeight: 800,
            color: '#1d1d1f',
            letterSpacing: '-0.04em',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <span>flip-ly</span>
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 28,
            color: '#6e6e73',
            marginTop: 16,
            letterSpacing: '-0.01em',
          }}
        >
          AI-powered deal discovery for resellers
        </div>

        {/* Stats row */}
        <div
          style={{
            display: 'flex',
            gap: 64,
            marginTop: 48,
          }}
        >
          {[
            { value: '413', label: 'Markets' },
            { value: '20+', label: 'Sources' },
            { value: '6x', label: 'Daily Scans' },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <span
                style={{
                  fontSize: 42,
                  fontWeight: 700,
                  color: '#16a34a',
                  letterSpacing: '-0.02em',
                }}
              >
                {stat.value}
              </span>
              <span
                style={{
                  fontSize: 16,
                  color: '#86868b',
                  marginTop: 4,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                {stat.label}
              </span>
            </div>
          ))}
        </div>

        {/* Domain */}
        <div
          style={{
            position: 'absolute',
            bottom: 32,
            fontSize: 18,
            color: '#aeaeb2',
            letterSpacing: '0.02em',
          }}
        >
          flip-ly.net
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
