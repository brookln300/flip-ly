'use client'

import { useState, useEffect } from 'react'

const LINKS = [
  {
    emoji: '🦞',
    title: 'SEARCH GARAGE SALES',
    subtitle: 'AI-scored deals near you',
    url: 'https://flip-ly.net/?utm_source=linkinbio&utm_medium=social&utm_campaign=links',
    color: 'var(--lime)',
    primary: true,
  },
  {
    emoji: '🔒',
    title: 'LOBSTER HUNT',
    subtitle: '7 decoys. 1 real password. 1 lobster dinner.',
    url: 'https://flip-ly.net/lobster-hunt?utm_source=linkinbio&utm_medium=social&utm_campaign=links&utm_content=contest',
    color: 'var(--hotpink)',
  },
  {
    emoji: '👑',
    title: 'GO PRO — from $5/mo',
    subtitle: 'Unlimited searches, full score breakdowns, early digest',
    url: 'https://flip-ly.net/pro?utm_source=linkinbio&utm_medium=social&utm_campaign=links&utm_content=pro',
    color: '#FFD700',
  },
  {
    emoji: '🐦',
    title: 'FOLLOW ON X',
    subtitle: '@fliply_dot_net',
    url: 'https://x.com/fliply_dot_net?utm_source=linkinbio&utm_medium=social&utm_campaign=links&utm_content=twitter',
    color: 'var(--electric)',
  },
  {
    emoji: '🎵',
    title: 'TIKTOK',
    subtitle: '@ctrl_alt_flip',
    url: 'https://tiktok.com/@ctrl_alt_flip?utm_source=linkinbio&utm_medium=social&utm_campaign=links&utm_content=tiktok',
    color: '#ff0050',
  },
  {
    emoji: '📸',
    title: 'INSTAGRAM',
    subtitle: '@ctrl_alt_flip',
    url: 'https://instagram.com/ctrl_alt_flip?utm_source=linkinbio&utm_medium=social&utm_campaign=links&utm_content=instagram',
    color: '#E1306C',
  },
  {
    emoji: '❓',
    title: 'WHY DOES THIS EXIST',
    subtitle: 'A genuine question we ask ourselves daily',
    url: 'https://flip-ly.net/why?utm_source=linkinbio&utm_medium=social&utm_campaign=links&utm_content=why',
    color: 'var(--mustard)',
  },
]

function VisitorCounter() {
  const [count, setCount] = useState(42069)
  useEffect(() => {
    const i = setInterval(() => setCount(c => c + Math.floor(Math.random() * 2)), 5000)
    return () => clearInterval(i)
  }, [])
  return <span>{count.toLocaleString()}</span>
}

export default function LinksPage() {
  return (
    <div className="min-h-screen flex flex-col items-center" style={{
      background: '#0D0D0D',
      padding: '32px 16px',
    }}>
      {/* Profile header */}
      <div className="text-center mb-8">
        <div className="text-5xl mb-3 jitter">🦞</div>
        <h1 style={{
          fontFamily: '"Comic Sans MS", cursive',
          fontSize: '28px', color: 'var(--lime)',
          textShadow: '2px 2px 0 var(--hotpink)',
        }}>
          flip-ly<span style={{ color: 'var(--hotpink)' }}>.net</span>
        </h1>
        <p style={{
          fontFamily: '"Courier New", monospace',
          fontSize: '12px', color: '#888', marginTop: '4px',
        }}>
          AI-powered garage sale finder. Comic Sans. Lobster cursor. Real deals.
        </p>
        <div className="mt-2 inline-flex items-center gap-2 px-3 py-1" style={{
          background: '#111', border: '1px solid #333',
          fontFamily: 'monospace', fontSize: '10px',
        }}>
          <span style={{ color: '#0f0' }}>●</span>
          <span style={{ color: '#0f0' }}>ONLINE</span>
          <span style={{ color: '#555' }}>|</span>
          <span style={{ color: '#ff0' }}>Visitor #<VisitorCounter /></span>
        </div>
      </div>

      {/* Links */}
      <div className="w-full max-w-md space-y-3">
        {LINKS.map((link, i) => (
          <a
            key={i}
            href={link.url}
            target={link.url.startsWith('https://flip-ly.net') ? '_self' : '_blank'}
            rel="noopener noreferrer"
            style={{
              display: 'block',
              background: link.primary ? 'var(--lime)' : '#111',
              border: `2px solid ${link.color}`,
              padding: '14px 20px',
              textDecoration: 'none',
              transition: 'all 0.2s',
              transform: `rotate(${(i % 2 === 0 ? -0.5 : 0.5)}deg)`,
            }}
          >
            <div className="flex items-center gap-3">
              <span style={{ fontSize: '24px' }}>{link.emoji}</span>
              <div>
                <div style={{
                  fontFamily: '"Comic Sans MS", cursive',
                  fontSize: '14px', fontWeight: 'bold',
                  color: link.primary ? '#000' : link.color,
                }}>
                  {link.title}
                </div>
                <div style={{
                  fontFamily: 'monospace',
                  fontSize: '10px',
                  color: link.primary ? '#333' : '#666',
                }}>
                  {link.subtitle}
                </div>
              </div>
            </div>
          </a>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-8 text-center">
        <p style={{ fontFamily: 'monospace', fontSize: '9px', color: '#333' }}>
          Best viewed in Netscape Navigator 4.0 at 800x600
        </p>
        <p style={{ fontFamily: '"Comic Sans MS", cursive', fontSize: '10px', color: '#222', marginTop: '4px' }}>
          Made by AetherCoreAI — the lobster sees all
        </p>
      </div>
    </div>
  )
}
