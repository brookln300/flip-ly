'use client'

export default function WhyPage() {
  return (
    <div className="min-h-screen" style={{ background: '#0D0D0D', color: '#fff' }}>
      {/* Header */}
      <header className="px-4 py-3 flex items-center justify-between" style={{
        background: '#000', borderBottom: '4px solid var(--lime)',
      }}>
        <a href="/" className="flex items-center gap-2" style={{ textDecoration: 'none' }}>
          <span className="text-xl jitter">🦞</span>
          <span style={{ fontFamily: '"Comic Sans MS", cursive', fontSize: '20px', color: 'var(--lime)' }}>
            FLIP-LY<span style={{ color: 'var(--hotpink)' }}>.NET</span>
          </span>
        </a>
        <a href="/" className="text-xs" style={{
          color: 'var(--electric)', fontFamily: '"Comic Sans MS", cursive',
        }}>
          ← back to chaos
        </a>
      </header>

      <div className="rainbow-divider" />

      <main className="max-w-2xl mx-auto px-6 py-16">
        {/* Title in a Win98 window */}
        <div className="win98-window mb-12" style={{ transform: 'rotate(-1deg)' }}>
          <div className="win98-titlebar">
            <span className="win98-titlebar-text">C:\FLIP-LY\WHY.TXT — Notepad</span>
            <div className="flex gap-1">
              <div className="win98-btn">_</div>
              <div className="win98-btn">□</div>
              <div className="win98-btn">✕</div>
            </div>
          </div>
          <div style={{ background: '#fff', padding: '20px', color: '#000', fontFamily: '"Courier New", monospace', fontSize: '13px', lineHeight: 2 }}>
            <p style={{ color: '#808080', fontSize: '10px' }}>File Edit Search Help</p>
            <br />
            <p style={{ fontWeight: 700 }}>WHY DOES THIS WEBSITE EXIST?</p>
            <p style={{ fontWeight: 700 }}>Last modified: March 26, 2026 3:47 AM</p>
            <p style={{ fontWeight: 700 }}>Author: someone who should have been sleeping</p>
            <br />
            <p>==================================================</p>
          </div>
        </div>

        {/* The actual content — 1999 Geocities writing style */}
        <div className="space-y-8" style={{ fontFamily: '"Courier New", monospace', lineHeight: 2.2 }}>

          <div className="card-wonky" style={{ transform: 'rotate(-1deg)' }}>
            <h2 className="text-xl font-bold mb-4" style={{ fontFamily: '"Comic Sans MS", cursive', color: 'var(--lime)' }}>
              Chapter 1: The Problem
            </h2>
            <p className="text-sm" style={{ color: '#ccc' }}>
              Real life is boring. The internet used to be fun. Remember when websites had visitor counters
              and construction GIFs and everything was in Comic Sans and NOBODY COMPLAINED?
            </p>
            <p className="text-sm mt-3" style={{ color: '#ccc' }}>
              Now everything is &ldquo;clean&rdquo; and &ldquo;minimal&rdquo; and &ldquo;accessible&rdquo; and honestly?
              We miss the chaos. We miss the raw, unfiltered, dial-up-powered, seizure-inducing glory of 1999.
            </p>
          </div>

          <div className="card-wonky" style={{ transform: 'rotate(1.5deg)' }}>
            <h2 className="text-xl font-bold mb-4" style={{ fontFamily: '"Comic Sans MS", cursive', color: 'var(--hotpink)' }}>
              Chapter 2: The Solution
            </h2>
            <p className="text-sm" style={{ color: '#ccc' }}>
              We built flip-ly.net. A garage sale aggregator that looks like it was made in 1996
              by someone who just discovered HTML and had strong opinions about font choices.
            </p>
            <p className="text-sm mt-3" style={{ color: '#ccc' }}>
              The search results are fake. The Winamp player doesn&apos;t play real music.
              The LimeWire downloads aren&apos;t real files. The visitor counter started at 69,420.
              The construction banner has been there since day one and will never come down.
            </p>
            <p className="text-sm mt-3" style={{ color: 'var(--mustard)' }}>
              None of this makes sense. That&apos;s the point.
            </p>
          </div>

          <div className="card-wonky" style={{ transform: 'rotate(-0.5deg)' }}>
            <h2 className="text-xl font-bold mb-4" style={{ fontFamily: '"Comic Sans MS", cursive', color: 'var(--mustard)' }}>
              Chapter 3: But Does It Actually Do Anything?
            </h2>
            <p className="text-sm" style={{ color: '#ccc' }}>
              Technically, yes. If you sign up, we will eventually send you a weekly email
              with actual garage sale listings near your zip code. Like a newsletter.
              But delivered by a website that looks like it was possessed by Winamp and LimeWire.
            </p>
            <p className="text-sm mt-3" style={{ color: '#ccc' }}>
              Think of it as Craigslist meets Geocities meets your uncle&apos;s forwarded email chain
              from 2003. But with better deals and worse CSS.
            </p>
          </div>

          <div className="card-wonky" style={{ transform: 'rotate(2deg)' }}>
            <h2 className="text-xl font-bold mb-4" style={{ fontFamily: '"Comic Sans MS", cursive', color: 'var(--electric)' }}>
              Chapter 4: Who Made This?
            </h2>
            <p className="text-sm" style={{ color: '#ccc' }}>
              A small team in Dallas, TX who believe that the internet peaked in 1999
              and has been going downhill ever since. We&apos;re trying to bring it back.
              One Comic Sans headline at a time.
            </p>
            <p className="text-sm mt-3" style={{ color: '#888' }}>
              We also have a real business. It&apos;s called AetherCoreAI. We do serious things there.
              This is not one of them.
            </p>
          </div>

          <div className="card-wonky" style={{ transform: 'rotate(-1.5deg)' }}>
            <h2 className="text-xl font-bold mb-4" style={{ fontFamily: '"Comic Sans MS", cursive', color: 'var(--neon-orange)' }}>
              Chapter 5: FAQ
            </h2>
            <div className="space-y-4 text-sm" style={{ color: '#ccc' }}>
              <div>
                <p style={{ color: 'var(--lime)', fontWeight: 700 }}>Q: Is this a real website?</p>
                <p>A: Technically yes. Emotionally? Unclear.</p>
              </div>
              <div>
                <p style={{ color: 'var(--lime)', fontWeight: 700 }}>Q: Are the garage sales real?</p>
                <p>A: Not yet. But the vibes are authentic.</p>
              </div>
              <div>
                <p style={{ color: 'var(--lime)', fontWeight: 700 }}>Q: Why Comic Sans?</p>
                <p>A: Why NOT Comic Sans? It&apos;s the font of the people.</p>
              </div>
              <div>
                <p style={{ color: 'var(--lime)', fontWeight: 700 }}>Q: Will you ever fix the design?</p>
                <p>A: Absolutely not. The design IS the product.</p>
              </div>
              <div>
                <p style={{ color: 'var(--lime)', fontWeight: 700 }}>Q: What&apos;s with the lobster?</p>
                <p>A: 🦞 We don&apos;t talk about the lobster.</p>
              </div>
              <div>
                <p style={{ color: 'var(--lime)', fontWeight: 700 }}>Q: Is there a Blue Screen of Death easter egg?</p>
                <p>A: ... maybe. Look harder.</p>
              </div>
            </div>
          </div>

          {/* Guestbook-style sign-off */}
          <div className="text-center py-8" style={{ borderTop: '2px dashed var(--lime)' }}>
            <p className="text-lg font-bold mb-2" style={{ fontFamily: '"Comic Sans MS", cursive', color: 'var(--lime)' }}>
              Thanks for visiting!
            </p>
            <p className="text-sm mb-4" style={{ color: '#888' }}>
              Please sign our guestbook. (We don&apos;t have one. Sign up instead.)
            </p>
            <a href="/" className="btn-chaos" style={{ fontSize: '16px', textDecoration: 'none', display: 'inline-block' }}>
              BACK TO THE CHAOS 🦞
            </a>
            <p className="text-xs mt-6" style={{ color: '#444' }}>
              This page was made with 100% recycled HTML and zero respect for web standards.
            </p>
          </div>
        </div>
      </main>

      <div className="rainbow-divider" />

      <footer className="px-4 py-6 text-center" style={{ background: '#000' }}>
        <p className="text-xs" style={{ color: '#555', fontFamily: '"Comic Sans MS", cursive' }}>
          &copy; 1997&ndash;2026 FLIP-LY.NET | &ldquo;We made the internet fun again&rdquo;
        </p>
      </footer>
    </div>
  )
}
