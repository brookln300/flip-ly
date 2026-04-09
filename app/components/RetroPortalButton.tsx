'use client'

import Link from 'next/link'

export default function RetroPortalButton() {
  return (
    <>
      <style>{`
        @keyframes retro-glitch {
          0%   { text-shadow: none; transform: translate(0, 0); }
          20%  { text-shadow: -2px 0 #0ff, 2px 0 #f0f; transform: translate(-1px, 0); }
          40%  { text-shadow: 2px 0 #0ff, -2px 0 #f0f; transform: translate(1px, 0); }
          60%  { text-shadow: -1px 0 #ff0, 1px 0 #0ff; transform: translate(0, -1px); }
          80%  { text-shadow: 1px 0 #f0f, -1px 0 #ff0; transform: translate(0, 1px); }
          100% { text-shadow: none; transform: translate(0, 0); }
        }
        @keyframes crt-flicker {
          0%, 100% { opacity: 1; }
          92%       { opacity: 1; }
          93%       { opacity: 0.7; }
          94%       { opacity: 1; }
          96%       { opacity: 0.85; }
          97%       { opacity: 1; }
        }
        .retro-portal-btn {
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 50;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 14px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 600;
          font-family: ui-monospace, 'Courier New', monospace;
          letter-spacing: 0.03em;
          color: #6e6e73;
          background: transparent;
          border: 1px solid #d1d1d6;
          text-decoration: none;
          cursor: pointer;
          transition: color 0.2s, border-color 0.2s, background 0.2s, box-shadow 0.2s;
          user-select: none;
        }
        .retro-portal-btn:hover {
          color: #00ff41;
          border-color: #00ff41;
          background: rgba(0, 255, 65, 0.06);
          box-shadow: 0 0 10px rgba(0, 255, 65, 0.2), inset 0 0 8px rgba(0, 255, 65, 0.05);
          animation: crt-flicker 2s ease-in-out infinite;
        }
        .retro-portal-btn:hover .retro-portal-label {
          animation: retro-glitch 0.4s steps(1) 0.1s 1;
        }
        .retro-portal-btn .retro-portal-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #6e6e73;
          transition: background 0.2s, box-shadow 0.2s;
          flex-shrink: 0;
        }
        .retro-portal-btn:hover .retro-portal-dot {
          background: #00ff41;
          box-shadow: 0 0 6px #00ff41;
        }
      `}</style>
      <Link href="/retro" className="retro-portal-btn" aria-label="Enter 90s retro mode">
        <span className="retro-portal-dot" aria-hidden="true" />
        <span className="retro-portal-label">&#128433;&#xFE0E; 90s Mode</span>
      </Link>
    </>
  )
}
