import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
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
      },
      keyframes: {
        blink: { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0' } },
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
