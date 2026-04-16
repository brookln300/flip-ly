import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'How AI Deal Scoring Works: Why a 9/10 Garage Sale Find Is Worth the Drive — Flip-ly.net',
  description: 'How Flip-ly scores thousands of garage sale and estate sale listings with AI so you only drive to the deals worth your time. See the 5-factor breakdown.',
  keywords: ['AI deal scoring', 'garage sale AI', 'deal finder app', 'flip-ly scoring', 'estate sale scoring', 'resale value finder'],
  openGraph: {
    title: 'How AI Deal Scoring Works: Why a 9/10 Garage Sale Find Is Worth the Drive',
    description: 'How Flip-ly scores thousands of garage sale and estate sale listings with AI so you only drive to the deals worth your time.',
    url: 'https://flip-ly.net/blog/ai-deal-scoring-explained',
    type: 'article',
    publishedTime: '2026-04-15T00:00:00Z',
  },
  alternates: {
    canonical: 'https://flip-ly.net/blog/ai-deal-scoring-explained',
  },
}

export default function AiDealScoringExplained() {
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'How AI Deal Scoring Works: Why a 9/10 Garage Sale Find Is Worth the Drive',
    datePublished: '2026-04-15T00:00:00Z',
    dateModified: '2026-04-15T00:00:00Z',
    author: { '@type': 'Organization', name: 'Flip-ly', url: 'https://flip-ly.net' },
    publisher: {
      '@type': 'Organization',
      name: 'Flip-ly',
      url: 'https://flip-ly.net',
      logo: { '@type': 'ImageObject', url: 'https://flip-ly.net/api/og' },
    },
    description: 'How Flip-ly scores thousands of garage sale and estate sale listings with AI so you only drive to the deals worth your time.',
    mainEntityOfPage: 'https://flip-ly.net/blog/ai-deal-scoring-explained',
    wordCount: 1400,
    keywords: ['AI deal scoring', 'garage sale AI', 'deal finder app', 'flip-ly scoring'],
  }

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://flip-ly.net' },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://flip-ly.net/blog' },
      { '@type': 'ListItem', position: 3, name: 'AI Deal Scoring Explained', item: 'https://flip-ly.net/blog/ai-deal-scoring-explained' },
    ],
  }

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'How accurate is AI deal scoring for garage sales?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'AI deal scoring analyzes price signals, category, description quality, freshness, and timing to rank listings on a 1-10 scale. It catches patterns humans miss when scanning hundreds of listings, but the final call is always yours. Think of it as a filter that surfaces the top 5% so you can focus your judgment where it matters.',
        },
      },
      {
        '@type': 'Question',
        name: 'How often do deal scores update on Flip-ly?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Scores are generated when listings are first discovered and enriched by the AI pipeline. New listings are scanned multiple times per week, so freshly posted sales get scored within hours of appearing on source sites.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can I search or filter by deal score on Flip-ly?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. Free users can sort results by score to see the highest-rated deals first. Pro members get score-filtered alerts and weekly digests that only include listings above a score threshold, so the best deals land in your inbox automatically.',
        },
      },
    ],
  }

  /* ── Styles ── */
  const prose = {
    fontSize: '16px',
    color: 'var(--text-secondary)',
    lineHeight: 1.75,
    marginBottom: '16px',
  } as const

  const h2Style = {
    fontSize: 'clamp(22px, 3vw, 28px)',
    fontWeight: 700 as const,
    color: 'var(--text-primary)',
    letterSpacing: '-0.02em',
    lineHeight: 1.2,
    marginBottom: '16px',
    marginTop: '48px',
  }

  const sectionStyle = {
    marginBottom: '24px',
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <div style={{ maxWidth: '52rem', margin: '0 auto', padding: '0 20px' }}>

        {/* ── Breadcrumb ── */}
        <nav aria-label="Breadcrumb" style={{ padding: '20px 0 0' }}>
          <ol style={{ display: 'flex', gap: '6px', listStyle: 'none', padding: 0, margin: 0, fontSize: '12px', color: 'var(--text-dim)' }}>
            <li><Link href="/" style={{ color: 'var(--text-dim)', textDecoration: 'none' }}>Flip-ly</Link></li>
            <li aria-hidden="true">/</li>
            <li><Link href="/blog" style={{ color: 'var(--text-dim)', textDecoration: 'none' }}>Blog</Link></li>
            <li aria-hidden="true">/</li>
            <li style={{ color: 'var(--text-muted)' }}>AI Deal Scoring Explained</li>
          </ol>
        </nav>

        <article style={{ padding: '0 0 64px' }}>

          {/* ── Article header ── */}
          <header style={{ padding: '56px 0 40px', borderBottom: '1px solid var(--border-subtle)', marginBottom: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <span style={{
                fontSize: '11px', fontWeight: 600, textTransform: 'uppercase',
                letterSpacing: '0.06em', color: 'var(--accent-green)',
                padding: '3px 8px', background: 'rgba(22, 163, 74, 0.08)',
                borderRadius: '4px',
              }}>
                How It Works
              </span>
              <time dateTime="2026-04-15" style={{ fontSize: '13px', color: 'var(--text-dim)' }}>
                April 15, 2026
              </time>
              <span style={{ fontSize: '13px', color: 'var(--text-dim)' }}>
                4 min read
              </span>
            </div>

            <h1 style={{
              fontSize: 'clamp(30px, 5vw, 42px)', fontWeight: 700,
              color: 'var(--text-primary)', lineHeight: 1.12,
              letterSpacing: '-0.03em', marginBottom: '20px',
            }}>
              How AI Deal Scoring Works: Why a 9/10 Garage Sale Find Is Worth the Drive
            </h1>

            <p style={{
              fontSize: '18px', color: 'var(--text-muted)', lineHeight: 1.55,
              maxWidth: '38rem',
            }}>
              Every weekend, thousands of listings go live across Craigslist, EstateSales.net, and local sites. Most aren&apos;t worth your gas. Here&apos;s how AI separates the 9s from the noise.
            </p>
          </header>

          {/* ── Table of contents ── */}
          <nav aria-label="Table of contents" style={{
            background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
            borderRadius: '10px', padding: '20px 24px', marginBottom: '48px',
          }}>
            <p style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-dim)', marginBottom: '10px' }}>
              In this article
            </p>
            <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {[
                { id: 'the-problem', label: 'The problem: 500 listings, 5 worth your time' },
                { id: 'five-factors', label: 'Five factors that make a deal score high' },
                { id: 'score-breakdown', label: 'Score breakdown: what 1-10 actually means' },
                { id: 'real-example', label: 'Real example: DeWalt table saw, score 9' },
                { id: 'at-scale', label: 'How Flip-ly runs this at scale' },
                { id: 'faq', label: 'FAQ' },
              ].map((item, i) => (
                <li key={item.id}>
                  <a href={`#${item.id}`} style={{
                    fontSize: '14px', color: 'var(--text-muted)', textDecoration: 'none',
                    display: 'flex', alignItems: 'baseline', gap: '8px',
                  }}>
                    <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', minWidth: '16px' }}>
                      {i + 1}.
                    </span>
                    {item.label}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          {/* ── Article body ── */}
          <div style={{ maxWidth: '40rem' }}>

            {/* Section 1 */}
            <section id="the-problem" style={sectionStyle}>
              <h2 style={h2Style}>The problem: 500 listings, 5 worth your time</h2>
              <p style={prose}>
                Open Craigslist garage sales in any metro area on a Thursday. You&apos;ll see 300-500 listings for the coming weekend. Estate sale sites add another hundred. Facebook groups pile on more.
              </p>
              <p style={prose}>
                You have Saturday morning. Maybe Sunday too. That&apos;s 5-8 stops if you plan your route tight. Which means you need to filter 500+ listings down to single digits — and get it right, because a bad pick costs you an hour of driving for a table of used candles and romance novels.
              </p>
              <p style={prose}>
                Most people scroll until something catches their eye. That works okay. But &quot;okay&quot; means you&apos;re missing the DeWalt planer buried in a two-line listing that didn&apos;t mention brand names in the title. You need a system that reads every listing, not just the ones with good headlines.
              </p>
            </section>

            {/* Section 2 */}
            <section id="five-factors" style={sectionStyle}>
              <h2 style={h2Style}>Five factors that make a deal score high</h2>
              <p style={prose}>
                Flip-ly&apos;s AI evaluates every listing across five dimensions. Each one is a signal. Stack enough signals and you&apos;ve got a deal worth driving to.
              </p>

              <div style={{
                display: 'flex', flexDirection: 'column', gap: '1px',
                background: 'var(--border-subtle)', borderRadius: '10px',
                overflow: 'hidden', margin: '24px 0',
              }}>
                {[
                  { factor: 'Price signals', desc: 'Below-market pricing, "make an offer," "everything must go," or no price listed (motivated sellers often skip pricing)', weight: 'High' },
                  { factor: 'Category depth', desc: 'Tools, electronics, furniture, and collectibles score higher than "misc household." Specific categories mean resale-ready inventory.', weight: 'High' },
                  { factor: 'Description quality', desc: 'Detailed descriptions with brand names, conditions, and photos = a serious seller who knows what they have. One-liners are a gamble.', weight: 'Medium' },
                  { factor: 'Freshness', desc: 'Posted in the last 24 hours means uncompeted inventory. Three days old? The flippers already hit it.', weight: 'Medium' },
                  { factor: 'Timing', desc: 'Weekend sales, multi-day estate sales, and early-bird-friendly start times all boost score. Rain-or-shine language signals motivation.', weight: 'Low' },
                ].map(f => (
                  <div key={f.factor} style={{
                    display: 'grid', gridTemplateColumns: '140px 1fr auto',
                    gap: '12px', padding: '14px 16px', background: 'var(--bg-surface)',
                    alignItems: 'baseline',
                  }}>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{f.factor}</span>
                    <span style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.5 }}>{f.desc}</span>
                    <span style={{
                      fontSize: '11px', fontWeight: 600, fontFamily: 'var(--font-mono)',
                      color: f.weight === 'High' ? 'var(--accent-green)' : f.weight === 'Medium' ? 'var(--accent-amber)' : 'var(--text-dim)',
                      textTransform: 'uppercase', letterSpacing: '0.04em',
                    }}>{f.weight}</span>
                  </div>
                ))}
              </div>

              <p style={prose}>
                No single factor makes a 9. It&apos;s the combination. A fresh listing with strong category signals, below-market pricing, and a detailed description — that&apos;s how scores climb.
              </p>
            </section>

            {/* Section 3 */}
            <section id="score-breakdown" style={sectionStyle}>
              <h2 style={h2Style}>Score breakdown: what 1-10 actually means</h2>
              <p style={prose}>
                Not every listing deserves your attention. Here&apos;s how to read the number:
              </p>

              <div style={{
                display: 'flex', flexDirection: 'column', gap: '1px',
                background: 'var(--border-subtle)', borderRadius: '10px',
                overflow: 'hidden', margin: '24px 0',
              }}>
                {[
                  { range: '1 – 3', label: 'Skip', desc: 'Vague description, no price info, stale listing, generic category. Not worth opening.', color: 'var(--text-dim)' },
                  { range: '4 – 5', label: 'Average', desc: 'Some positive signals but nothing compelling. Might check if it is on your route already.', color: 'var(--text-dim)' },
                  { range: '6 – 7', label: 'Worth checking', desc: 'Good category, decent description, reasonable freshness. Add to your maybe list.', color: 'var(--accent-amber)' },
                  { range: '8 – 9', label: 'Hot deal', desc: 'Multiple strong signals. Below-market price on in-demand category, fresh posting, detailed listing. Drive-worthy.', color: 'var(--accent-green)' },
                  { range: '10', label: 'Rare unicorn', desc: 'Every signal lit up. Specific high-value items, priced to move, just posted, great timing. Drop what you are doing.', color: 'var(--accent-green)' },
                ].map(tier => (
                  <div key={tier.range} style={{
                    display: 'grid', gridTemplateColumns: '64px 120px 1fr',
                    gap: '12px', padding: '14px 16px', background: 'var(--bg-surface)',
                    alignItems: 'baseline',
                  }}>
                    <span style={{ fontSize: '14px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: tier.color }}>{tier.range}</span>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: tier.color, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{tier.label}</span>
                    <span style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.5 }}>{tier.desc}</span>
                  </div>
                ))}
              </div>

              <p style={prose}>
                Most listings land between 3 and 6. That&apos;s normal — the majority of garage sales are average. The scores that matter are 7+, and those make up roughly 10-15% of what gets posted in a given week.
              </p>
            </section>

            {/* Mid-article CTA */}
            <aside style={{
              background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
              borderRadius: '12px', padding: '28px 24px', margin: '48px 0 40px',
            }}>
              <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: '16px' }}>
                Flip-ly scores every listing automatically. Free users get 15 searches a day with scores included. <Link href="/pro" style={{ color: 'var(--accent-green)', textDecoration: 'none', fontWeight: 500 }}>Pro members</Link> get score-filtered alerts and a weekly digest of only the top-rated deals in their market.
              </p>
              <Link href="/" style={{
                display: 'inline-block', padding: '10px 20px',
                background: 'var(--accent-green)', color: '#000',
                borderRadius: '8px', fontSize: '14px', fontWeight: 600,
                textDecoration: 'none',
              }}>
                Try it free
              </Link>
            </aside>

            {/* Section 4 */}
            <section id="real-example" style={sectionStyle}>
              <h2 style={h2Style}>Real example: DeWalt table saw, score 9</h2>
              <p style={prose}>
                Let&apos;s walk through how a realistic listing would score. Imagine this hits Craigslist on a Thursday afternoon:
              </p>

              <div style={{
                background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
                borderRadius: '10px', padding: '20px 24px', margin: '24px 0',
                fontFamily: 'var(--font-mono)', fontSize: '13px', lineHeight: 1.7,
                color: 'var(--text-muted)',
              }}>
                <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px', fontFamily: 'inherit' }}>
                  Estate Sale — Retired Carpenter&apos;s Workshop
                </p>
                <p style={{ fontFamily: 'inherit', marginBottom: '4px' }}>
                  DeWalt DWE7491RS 10&quot; table saw, barely used. Also: Makita miter saw, Ridgid shop vac, assorted clamps and hand tools. Everything priced to go — downsizing to a condo. Saturday 7am-2pm, rain or shine. Cash preferred.
                </p>
              </div>

              <p style={prose}>
                Here&apos;s how each factor scores:
              </p>

              <div style={{
                display: 'flex', flexDirection: 'column', gap: '1px',
                background: 'var(--border-subtle)', borderRadius: '10px',
                overflow: 'hidden', margin: '24px 0',
              }}>
                {[
                  { factor: 'Price signals', score: 'Strong', detail: '"Priced to go" + "downsizing" = motivated seller. No inflated prices.', color: 'var(--accent-green)' },
                  { factor: 'Category depth', score: 'Strong', detail: 'Power tools from three major brands. Estate sale, not random garage sale.', color: 'var(--accent-green)' },
                  { factor: 'Description quality', score: 'Strong', detail: 'Specific model numbers, brand names, condition noted. Seller knows what they have.', color: 'var(--accent-green)' },
                  { factor: 'Freshness', score: 'Strong', detail: 'Posted Thursday for Saturday sale. Two days out = prime window.', color: 'var(--accent-green)' },
                  { factor: 'Timing', score: 'Good', detail: '7am start = early bird friendly. Rain or shine = committed. Single-day sale adds urgency.', color: 'var(--accent-amber)' },
                ].map(f => (
                  <div key={f.factor} style={{
                    display: 'grid', gridTemplateColumns: '140px auto 1fr',
                    gap: '12px', padding: '14px 16px', background: 'var(--bg-surface)',
                    alignItems: 'baseline',
                  }}>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{f.factor}</span>
                    <span style={{
                      fontSize: '11px', fontWeight: 600, fontFamily: 'var(--font-mono)',
                      color: f.color, textTransform: 'uppercase', letterSpacing: '0.04em',
                    }}>{f.score}</span>
                    <span style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.5 }}>{f.detail}</span>
                  </div>
                ))}
              </div>

              <p style={prose}>
                Four strong signals and one good. That&apos;s a 9. The DeWalt DWE7491RS retails for $600+ new. At an estate sale with &quot;priced to go&quot; language, you&apos;re likely looking at $150-250. That&apos;s a $350+ margin before you factor in eBay fees. Worth the drive.
              </p>
              <p style={prose}>
                Now imagine scanning 400 listings manually to find this one. Or imagine it showed up in your feed already flagged with a 9 next to it. That&apos;s the difference.
              </p>
            </section>

            {/* Section 5 */}
            <section id="at-scale" style={sectionStyle}>
              <h2 style={h2Style}>How Flip-ly runs this at scale</h2>
              <p style={prose}>
                Doing this manually for 10 listings is feasible. Doing it for 10,000 listings across 10 markets is not. Here&apos;s what happens behind the scenes:
              </p>
              <ol style={{ fontSize: '16px', color: 'var(--text-secondary)', lineHeight: 1.85, paddingLeft: '20px', margin: '20px 0' }}>
                <li style={{ marginBottom: '12px' }}><strong style={{ color: 'var(--text-primary)' }}>Scrapers pull listings</strong> from Craigslist, EstateSales.net, and other sources multiple times per week. Every new listing gets captured with its full text, price, location, and posting date.</li>
                <li style={{ marginBottom: '12px' }}><strong style={{ color: 'var(--text-primary)' }}>AI enrichment kicks in.</strong> Claude (the same AI family behind this article) reads each listing, extracts structured data — categories, brands, condition signals, pricing intent — and assigns a deal score.</li>
                <li style={{ marginBottom: '12px' }}><strong style={{ color: 'var(--text-primary)' }}>Batch processing handles volume.</strong> Listings are enriched in batches, not one at a time. This keeps costs low and throughput high — thousands of listings scored per day.</li>
                <li style={{ marginBottom: '12px' }}><strong style={{ color: 'var(--text-primary)' }}>You see the results, not the plumbing.</strong> Scores appear next to every listing in your <Link href="/" style={{ color: 'var(--accent-green)', textDecoration: 'none', fontWeight: 500 }}>Flip-ly feed</Link>. Sort by score. Filter by category. Plan your Saturday in two minutes.</li>
              </ol>
              <p style={prose}>
                The goal isn&apos;t to replace your judgment — it&apos;s to point your judgment at the right 5% of listings instead of making you wade through the other 95%.
              </p>
            </section>

            {/* Section 6: FAQ */}
            <section id="faq" style={sectionStyle}>
              <h2 style={h2Style}>Frequently asked questions</h2>

              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                  Is AI scoring actually accurate?
                </h3>
                <p style={prose}>
                  It&apos;s pattern matching at scale, not a crystal ball. The AI reads the same signals an experienced flipper reads — price language, brand names, sale type, freshness — but it reads every listing, not just the ones with catchy titles. You still make the final call. The score tells you where to look, not what to buy.
                </p>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                  How often do scores update?
                </h3>
                <p style={prose}>
                  Scores are generated when a listing is first discovered and enriched. Scrapers run multiple times per week, so new listings get scored within hours. Scores don&apos;t change after they&apos;re set — a listing&apos;s signals are strongest at posting time, and that&apos;s when the score matters most.
                </p>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                  Can I search or filter by score?
                </h3>
                <p style={prose}>
                  Yes. Free users can sort results by deal score to see the highest-rated listings first. <Link href="/pro" style={{ color: 'var(--accent-green)', textDecoration: 'none', fontWeight: 500 }}>Pro members</Link> get weekly digest emails that only include deals above a score threshold, plus filtered alerts so the best listings come to you.
                </p>
              </div>
            </section>

            {/* ── End CTA ── */}
            <aside style={{
              background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
              borderRadius: '12px', padding: '28px 24px', margin: '48px 0 40px',
            }}>
              <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: '16px' }}>
                Stop scrolling through 500 listings every week. Flip-ly scores them all and surfaces the deals worth your time. Free tier, no credit card, 15 searches a day.
              </p>
              <Link href="/" style={{
                display: 'inline-block', padding: '10px 20px',
                background: 'var(--accent-green)', color: '#000',
                borderRadius: '8px', fontSize: '14px', fontWeight: 600,
                textDecoration: 'none',
              }}>
                Start searching free
              </Link>
            </aside>

            {/* ── Read next ── */}
            <div style={{
              display: 'flex', flexDirection: 'column', gap: '12px',
              margin: '0 0 40px',
            }}>
              <p style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-dim)', marginBottom: '0' }}>
                Read next
              </p>
              <Link href="/blog/estate-sale-flipping-guide" style={{
                display: 'block', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
                borderRadius: '10px', padding: '16px 20px', textDecoration: 'none',
              }}>
                <span style={{ fontSize: '15px', color: 'var(--accent-green)', fontWeight: 500 }}>
                  Estate Sale Flipping: How to Find $500+ Deals Before Anyone Else
                </span>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px', lineHeight: 1.5 }}>
                  The scoring framework resellers use to filter thousands of listings down to the 3-5 worth driving to.
                </p>
              </Link>
              <Link href="/blog/best-things-to-flip" style={{
                display: 'block', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
                borderRadius: '10px', padding: '16px 20px', textDecoration: 'none',
              }}>
                <span style={{ fontSize: '15px', color: 'var(--accent-green)', fontWeight: 500 }}>
                  The Best Things to Flip From Estate Sales and Garage Sales (2026 Data)
                </span>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px', lineHeight: 1.5 }}>
                  Power tools, vintage furniture, audio gear, and the sleeper categories most flippers miss.
                </p>
              </Link>
            </div>

          </div>

          {/* ── Article footer ── */}
          <footer style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            paddingTop: '24px', borderTop: '1px solid var(--border-subtle)',
            flexWrap: 'wrap', gap: '12px',
          }}>
            <Link href="/blog" style={{ fontSize: '14px', color: 'var(--accent-green)', textDecoration: 'none', fontWeight: 500 }}>
              ← All guides
            </Link>
            <Link href="/" style={{ fontSize: '13px', color: 'var(--text-dim)', textDecoration: 'none' }}>
              Flip-ly.net →
            </Link>
          </footer>

        </article>
      </div>
    </>
  )
}
