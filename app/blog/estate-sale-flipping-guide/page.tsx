import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Estate Sale Flipping: How to Find $500+ Deals Before Anyone Else — Flip-ly.net',
  description: 'The scoring framework resellers use to filter thousands of listings down to the 3-5 worth driving to. Real numbers, no fluff.',
  keywords: ['estate sale flipping', 'reselling guide', 'estate sale tips', 'flipping for profit', 'deal scoring', 'garage sale finds', 'estate sale deals', 'reseller framework'],
  openGraph: {
    title: 'Estate Sale Flipping: How to Find $500+ Deals',
    description: 'The scoring framework resellers use to filter thousands of listings down to the 3-5 worth driving to.',
    url: 'https://flip-ly.net/blog/estate-sale-flipping-guide',
    type: 'article',
    publishedTime: '2026-04-05T00:00:00Z',
  },
  alternates: {
    canonical: 'https://flip-ly.net/blog/estate-sale-flipping-guide',
  },
}

export default function EstateSaleFlippingGuide() {
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'Estate Sale Flipping: How to Find $500+ Deals Before Anyone Else',
    datePublished: '2026-04-05T00:00:00Z',
    dateModified: '2026-04-05T00:00:00Z',
    author: { '@type': 'Organization', name: 'Flip-ly', url: 'https://flip-ly.net' },
    publisher: {
      '@type': 'Organization',
      name: 'Flip-ly',
      url: 'https://flip-ly.net',
      logo: { '@type': 'ImageObject', url: 'https://flip-ly.net/api/og' },
    },
    description: 'The scoring framework resellers use to filter thousands of listings down to the 3-5 worth driving to.',
    mainEntityOfPage: 'https://flip-ly.net/blog/estate-sale-flipping-guide',
    wordCount: 1200,
    keywords: ['estate sale flipping', 'reselling', 'deal scoring', 'flipping for profit'],
  }

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://flip-ly.net' },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://flip-ly.net/blog' },
      { '@type': 'ListItem', position: 3, name: 'Estate Sale Flipping Guide', item: 'https://flip-ly.net/blog/estate-sale-flipping-guide' },
    ],
  }

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'How do you find good deals at estate sales?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Score every listing on five factors: price signal, category depth, freshness, description quality, and location/timing. A listing that hits 4-5 signals is worth the drive. Focus on estate sales, workshop cleanouts, and moving sales over regular garage sales.',
        },
      },
      {
        '@type': 'Question',
        name: 'What sells best from estate sales?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Power tools, vintage furniture, jewelry, collectibles, and commercial equipment. Workshop/garage cleanouts from retired tradespeople often have Milwaukee, DeWalt, and Snap-on tools at garage sale prices.',
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
            <li style={{ color: 'var(--text-muted)' }}>Estate Sale Flipping Guide</li>
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
                Strategy
              </span>
              <time dateTime="2026-04-05" style={{ fontSize: '13px', color: 'var(--text-dim)' }}>
                April 5, 2026
              </time>
              <span style={{ fontSize: '13px', color: 'var(--text-dim)' }}>
                6 min read
              </span>
            </div>

            <h1 style={{
              fontSize: 'clamp(30px, 5vw, 42px)', fontWeight: 700,
              color: 'var(--text-primary)', lineHeight: 1.12,
              letterSpacing: '-0.03em', marginBottom: '20px',
            }}>
              Estate Sale Flipping: How to Find $500+ Deals Before Anyone Else
            </h1>

            <p style={{
              fontSize: '18px', color: 'var(--text-muted)', lineHeight: 1.55,
              maxWidth: '38rem',
            }}>
              Most resellers check the same 2-3 sites on Saturday morning and hope for the best. The ones making real money run a system. Here&apos;s the framework.
            </p>
          </header>

          {/* ── Table of contents ── */}
          <nav aria-label="Table of contents" style={{
            background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
            borderRadius: '10px', padding: '20px 24px', marginBottom: '48px',
          }}>
            <p style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-dim)', marginBottom: '10px' }}>
              In this guide
            </p>
            <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {[
                { id: 'math-problem', label: 'The math problem nobody talks about' },
                { id: 'scoring-framework', label: 'The 5-factor scoring framework' },
                { id: 'where-deals-come-from', label: 'Where the $500+ deals actually come from' },
                { id: 'source-problem', label: 'The source problem' },
                { id: 'start-this-week', label: 'How to start this week' },
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
            <section id="math-problem" style={sectionStyle}>
              <h2 style={h2Style}>The math problem nobody talks about</h2>
              <p style={prose}>
                In a metro area like DFW, there are 200-400 garage sales and estate sales posted every week across Craigslist, EstateSales.net, Facebook Marketplace, OfferUp, and a dozen local sites. You have time to hit maybe 5-8 on a Saturday.
              </p>
              <p style={prose}>
                That means you&apos;re filtering 400 listings down to 5. A 98.75% rejection rate. If your filter is &quot;scroll until something looks good,&quot; you&apos;re leaving money on the table every single week.
              </p>
              <p style={prose}>
                The resellers consistently finding $500+ items (vintage furniture, power tools, mid-century pieces, commercial equipment) use scoring — whether they call it that or not.
              </p>
            </section>

            {/* Section 2 */}
            <section id="scoring-framework" style={sectionStyle}>
              <h2 style={h2Style}>The 5-factor scoring framework</h2>
              <p style={prose}>
                Every listing gets scored on five signals. You can do this manually in 30 seconds per listing, or let software do it across hundreds:
              </p>

              <div style={{
                display: 'flex', flexDirection: 'column', gap: '1px',
                background: 'var(--border-subtle)', borderRadius: '10px',
                overflow: 'hidden', margin: '24px 0',
              }}>
                {[
                  { factor: 'Price signal', desc: 'Below-market pricing, "everything must go," "make an offer" language', weight: 'High' },
                  { factor: 'Category depth', desc: 'Multi-family, estate (not garage), commercial cleanout, workshop/tools', weight: 'High' },
                  { factor: 'Freshness', desc: 'Posted in last 24h = uncompeted. 3+ days old = picked over.', weight: 'Medium' },
                  { factor: 'Description quality', desc: 'Detailed descriptions + photos = organized seller. One line + no photos = lottery.', weight: 'Medium' },
                  { factor: 'Location + timing', desc: 'Saturday 7am start = serious. "Rain or shine" = motivated. Your drive radius matters.', weight: 'Low' },
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
                A listing that hits 4-5 of these signals is worth the drive. 2-3 is a maybe. 0-1 is a skip — no matter how good the headline looks.
              </p>
            </section>

            {/* Section 3 */}
            <section id="where-deals-come-from" style={sectionStyle}>
              <h2 style={h2Style}>Where the $500+ deals actually come from</h2>
              <p style={prose}>
                After analyzing 50,000+ listings across 400+ markets, the pattern is clear. High-value finds cluster in specific sale types:
              </p>
              <ul style={{ fontSize: '16px', color: 'var(--text-secondary)', lineHeight: 1.85, paddingLeft: '20px', margin: '20px 0' }}>
                <li style={{ marginBottom: '8px' }}><strong style={{ color: 'var(--text-primary)' }}>Estate sales</strong> — family liquidating a lifetime of stuff. Power tools, vintage furniture, jewelry, collectibles. Highest average deal score.</li>
                <li style={{ marginBottom: '8px' }}><strong style={{ color: 'var(--text-primary)' }}>Workshop/garage cleanouts</strong> — retired tradespeople selling Milwaukee, DeWalt, Snap-on at garage sale prices.</li>
                <li style={{ marginBottom: '8px' }}><strong style={{ color: 'var(--text-primary)' }}>Moving sales</strong> — especially cross-country moves. Furniture priced to leave, not to profit.</li>
                <li style={{ marginBottom: '8px' }}><strong style={{ color: 'var(--text-primary)' }}>Multi-family sales</strong> — volume increases your odds. More tables = more chances.</li>
              </ul>
              <p style={prose}>
                Regular single-family garage sales? Bottom of the list. The stuff is priced retail-minus-10%, the selection is random, and everyone on Facebook already knows about it.
              </p>
            </section>

            {/* Section 4 */}
            <section id="source-problem" style={sectionStyle}>
              <h2 style={h2Style}>The source problem</h2>
              <p style={prose}>
                The best listings aren&apos;t all on one site. Estate sales post on EstateSales.net. Craigslist still dominates tools and furniture. OfferUp and Facebook have the impulse sellers who underprice because they want it gone today.
              </p>
              <p style={prose}>
                Checking 5+ sites every morning isn&apos;t realistic for most people. This is where aggregation changes the game — pulling every listing from every source into one feed, pre-scored, so you can scan 300 listings in the time it takes to check one site.
              </p>
              <p style={prose}>
                The early-morning resellers who show up at 6:55am to the best sale? They didn&apos;t get lucky. They had the listing scored and route-planned before anyone else finished their first coffee.
              </p>
            </section>

            {/* Section 5 */}
            <section id="start-this-week" style={sectionStyle}>
              <h2 style={h2Style}>How to start this week</h2>
              <ol style={{ fontSize: '16px', color: 'var(--text-secondary)', lineHeight: 1.85, paddingLeft: '20px', margin: '20px 0' }}>
                <li style={{ marginBottom: '12px' }}><strong style={{ color: 'var(--text-primary)' }}>Pick your 3 sources.</strong> EstateSales.net + Craigslist + one local (Facebook group, OfferUp, or a community board).</li>
                <li style={{ marginBottom: '12px' }}><strong style={{ color: 'var(--text-primary)' }}>Score every listing.</strong> Price signal + category + freshness. Takes 30 seconds each. Skip anything below 3/5.</li>
                <li style={{ marginBottom: '12px' }}><strong style={{ color: 'var(--text-primary)' }}>Route-plan Thursday night.</strong> Top 5 sales, mapped, with arrival times. Saturday morning is execution, not research.</li>
                <li style={{ marginBottom: '12px' }}><strong style={{ color: 'var(--text-primary)' }}>Track your hits.</strong> What you found, what you paid, what it sold for. After 4 weeks, your scoring gets sharp.</li>
              </ol>
            </section>

            {/* ── Inline CTA ── */}
            <aside style={{
              background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
              borderRadius: '12px', padding: '28px 24px', margin: '48px 0 40px',
            }}>
              <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: '16px' }}>
                Flip-ly does this scoring automatically across 20+ sources in 400+ markets. Free tier gets you 15 searches a day. The weekly digest lands every Thursday with the top-scored deals in your area.
              </p>
              <Link href="/?signup=pro" style={{
                display: 'inline-block', padding: '10px 20px',
                background: 'var(--accent-green)', color: '#000',
                borderRadius: '8px', fontSize: '14px', fontWeight: 600,
                textDecoration: 'none',
              }}>
                Try it free
              </Link>
            </aside>
          </div>

          {/* ── Related guides ── */}
          <div style={{
            display: 'flex', flexDirection: 'column', gap: '12px',
            margin: '0 0 40px',
          }}>
            <p style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-dim)', marginBottom: '0' }}>
              Read next
            </p>
            <Link href="/blog/best-things-to-flip" style={{
              display: 'block', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
              borderRadius: '10px', padding: '16px 20px', textDecoration: 'none',
            }}>
              <span style={{ fontSize: '15px', color: 'var(--accent-green)', fontWeight: 500 }}>
                The Best Things to Flip From Estate Sales and Garage Sales (2026 Data)
              </span>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px', lineHeight: 1.5 }}>
                Data-backed picks for maximum ROI — power tools, vintage furniture, and the sleeper categories most flippers miss.
              </p>
            </Link>
            <Link href="/blog/ai-deal-scoring-explained" style={{
              display: 'block', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
              borderRadius: '10px', padding: '16px 20px', textDecoration: 'none',
            }}>
              <span style={{ fontSize: '15px', color: 'var(--accent-green)', fontWeight: 500 }}>
                How AI Deal Scoring Works: Why a 9/10 Find Is Worth the Drive
              </span>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px', lineHeight: 1.5 }}>
                The 5-factor system that separates a 3/10 listing from a 9/10. How Flip-ly scores thousands of listings so you only drive to the good ones.
              </p>
            </Link>
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
