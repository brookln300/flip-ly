import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Zen redesign — near-monochrome, one green accent (see .zen in globals.css)
        'zen': {
          bg: '#111315',
          panel: '#16181B',
          text: '#E6E6E6',
          muted: '#8A8F98',
          line: '#2A2E33',
          accent: '#4ADE80',
        },
        'lime': '#0FFF50',
        'hotpink': '#FF10F0',
        'mustard': '#FFB81C',
        'electric': '#9D4EDD',
        'neon-orange': '#FF6600',
        'dark': '#1A1A1A',
        'darker': '#0D0D0D',
      },
      fontFamily: {
        'comic': ['"Comic Sans MS"', '"Comic Sans"', 'cursive'],
        'papyrus': ['Papyrus', 'fantasy'],
        'mono': ['"Courier New"', 'Courier', 'monospace'],
        // Hearth redesign — next/font variables set in app/layout.tsx
        'display': ['var(--font-display)', 'Georgia', 'serif'],
        'data': ['var(--font-mono)', '"JetBrains Mono"', 'monospace'],
      },
      rotate: {
        '2': '2deg',
        '3': '3deg',
        '5': '5deg',
        '15': '15deg',
        '45': '45deg',
        '-2': '-2deg',
        '-3': '-3deg',
        '-5': '-5deg',
      },
      animation: {
        'blink': 'blink 1.5s step-end infinite',
        'jitter': 'jitter 0.3s ease-in-out infinite',
        'fall': 'fall 0.8s ease-in forwards',
        'pulse-wrong': 'pulseWrong 2s ease-in-out infinite',
        'grow-shrink': 'growShrink 1s ease-in-out infinite',
        'ember-pulse': 'emberPulse 2.6s ease-in-out infinite',
      },
      keyframes: {
        blink: { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0' } },
        emberPulse: {
          '0%, 100%': { boxShadow: '0 0 10px rgba(249,115,22,0.45)' },
          '50%': { boxShadow: '0 0 22px rgba(249,115,22,0.8)' },
        },
        jitter: { '0%, 100%': { transform: 'translateX(0)' }, '25%': { transform: 'translateX(-3px)' }, '75%': { transform: 'translateX(3px)' } },
        fall: { '0%': { transform: 'translateY(-100px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        pulseWrong: { '0%, 100%': { transform: 'scale(1)' }, '50%': { transform: 'scale(1.15)' } },
        growShrink: { '0%, 100%': { transform: 'scale(1)' }, '50%': { transform: 'scale(2)', fontSize: '8px' } },
      },
    },
  },
  plugins: [],
}

export default config
