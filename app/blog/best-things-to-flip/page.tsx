import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'The Best Things to Flip From Estate Sales and Garage Sales (2026 Data) — Flip-ly.net',
  description: 'Data-backed guide to the most profitable items to flip from estate sales and garage sales in 2026. Power tools, vintage furniture, electronics, and sleeper categories with real buy/sell prices.',
  keywords: ['best things to flip', 'what to buy at garage sales', 'estate sale finds worth money', 'flipping for profit', 'reselling guide 2026', 'garage sale flips'],
  openGraph: {
    title: 'The Best Things to Flip From Estate Sales and Garage Sales (2026 Data)',
    description: 'Data-backed guide to the most profitable items to flip from estate sales and garage sales in 2026.',
    url: 'https://flip-ly.net/blog/best-things-to-flip',
    type: 'article',
    publishedTime: '2026-04-15T00:00:00Z',
  },
  alternates: {
    canonical: 'https://flip-ly.net/blog/best-things-to-flip',
  },
}

export default function BestThingsToFlip() {
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'The Best Things to Flip From Estate Sales and Garage Sales (2026 Data)',
    datePublished: '2026-04-15T00:00:00Z',
    dateModified: '2026-04-15T00:00:00Z',
    author: { '@type': 'Organization', name: 'Flip-ly', url: 'https://flip-ly.net' },
    publisher: {
      '@type': 'Organization',
      name: 'Flip-ly',
      url: 'https://flip-ly.net',
      logo: { '@type': 'ImageObject', url: 'https://flip-ly.net/api/og' },
    },
    description: 'Data-backed guide to the most profitable items to flip from estate sales and garage sales in 2026.',
    mainEntityOfPage: 'https://flip-ly.net/blog/best-things-to-flip',
    wordCount: 1800,
    keywords: ['best things to flip', 'flipping for profit', 'estate sale finds', 'garage sale flips', 'reselling guide 2026'],
  }

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://flip-ly.net' },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://flip-ly.net/blog' },
      { '@type': 'ListItem', position: 3, name: 'Best Things to Flip', item: 'https://flip-ly.net/blog/best-things-to-flip' },
    ],
  }

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What are the most profitable items to flip from garage sales?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Power tools (DeWalt, Milwaukee, Snap-on), mid-century and vintage furniture, small electronics like vintage receivers and gaming consoles, and sleeper categories like cast iron cookware and vintage Pyrex. Estate sales and workshop cleanouts consistently yield the highest margins.',
        },
      },
      {
        '@type': 'Question',
        name: 'Where should I sell items I flip from estate sales?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'It depends on the category. Power tools sell fast on Facebook Marketplace and eBay. Vintage furniture does well on Chairish, Facebook Marketplace, and eBay. Electronics move quickly on eBay and OfferUp. For niche collectibles like vintage Pyrex or cast iron, eBay has the largest buyer pool.',
        },
      },
      {
        '@type': 'Question',
        name: 'How much money do I need to start flipping items?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'You can start with as little as $50-100 in buying capital. Focus on one category you know well, buy 3-5 items at a single sale, and reinvest the profits. Most successful flippers started small and scaled up as they learned which items move fast in their market.',
        },
      },
    ],
  }

  /* -- Styles -- */
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

        {/* -- Breadcrumb -- */}
        <nav aria-label="Breadcrumb" style={{ padding: '20px 0 0' }}>
          <ol style={{ display: 'flex', gap: '6px', listStyle: 'none', padding: 0, margin: 0, fontSize: '12px', color: 'var(--text-dim)' }}>
            <li><Link href="/" style={{ color: 'var(--text-dim)', textDecoration: 'none' }}>Flip-ly</Link></li>
            <li aria-hidden="true">/</li>
            <li><Link href="/blog" style={{ color: 'var(--text-dim)', textDecoration: 'none' }}>Blog</Link></li>
            <li aria-hidden="true">/</li>
            <li style={{ color: 'var(--text-muted)' }}>Best Things to Flip</li>
          </ol>
        </nav>

        <article style={{ padding: '0 0 64px' }}>

          {/* -- Article header -- */}
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
              <time dateTime="2026-04-15" style={{ fontSize: '13px', color: 'var(--text-dim)' }}>
                April 15, 2026
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
              The Best Things to Flip From Estate Sales and Garage Sales (2026 Data)
            </h1>

            <p style={{
              fontSize: '18px', color: 'var(--text-muted)', lineHeight: 1.55,
              maxWidth: '38rem',
            }}>
              Not everything at a garage sale is worth your time. Here are the categories that consistently flip for 3-10x what you pay — backed by real resale data.
            </p>
          </header>

          {/* -- Table of contents -- */}
          <nav aria-label="Table of contents" style={{
            background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
            borderRadius: '10px', padding: '20px 24px', marginBottom: '48px',
          }}>
            <p style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-dim)', marginBottom: '10px' }}>
              In this guide
            </p>
            <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {[
                { id: 'not-everything', label: 'Not everything is worth flipping' },
                { id: 'power-tools', label: 'Power tools & workshop equipment' },
                { id: 'vintage-furniture', label: 'Mid-century & vintage furniture' },
                { id: 'small-electronics', label: 'Small electronics & audio' },
                { id: 'sleeper-categories', label: 'The sleeper categories' },
                { id: 'spot-them-faster', label: 'How to spot them faster' },
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

          {/* -- Article body -- */}
          <div style={{ maxWidth: '40rem' }}>

            {/* Section 1 */}
            <section id="not-everything" style={sectionStyle}>
              <h2 style={h2Style}>Not everything is worth flipping</h2>
              <p style={prose}>
                Walk into any garage sale and you&apos;ll see tables full of clothing, kids&apos; toys, half-used candles, and paperback books priced at 50 cents. Most people buy that stuff. Most people don&apos;t make money flipping.
              </p>
              <p style={prose}>
                The 80/20 rule hits hard in reselling: roughly 20% of the categories at any given sale account for 80% of the profit potential. The rest is noise — items that are heavy, hard to ship, low-demand, or priced too close to retail to make the effort worthwhile.
              </p>
              <p style={prose}>
                The resellers who consistently clear $500-2,000 per weekend aren&apos;t buying everything in sight. They&apos;re walking past 90% of what&apos;s on the tables and zeroing in on the categories with high resale demand and low competition from other flippers. Here are those categories, with real buy/sell ranges from 2026 data.
              </p>
            </section>

            {/* Section 2 */}
            <section id="power-tools" style={sectionStyle}>
              <h2 style={h2Style}>Power tools &amp; workshop equipment</h2>
              <p style={prose}>
                This is the single most reliable flipping category at estate sales. When a retired carpenter, electrician, or mechanic passes away or downsizes, their family usually has no idea what the tools are worth. A DeWalt miter saw that retails for $400 gets a $30 sticker because &quot;it looks old.&quot;
              </p>

              <div style={{
                display: 'flex', flexDirection: 'column', gap: '1px',
                background: 'var(--border-subtle)', borderRadius: '10px',
                overflow: 'hidden', margin: '24px 0',
              }}>
                {[
                  { item: 'DeWalt cordless drills/saws', buy: '$15-40', sell: '$80-200', where: 'eBay, FB Marketplace' },
                  { item: 'Milwaukee M18 kits', buy: '$25-50', sell: '$120-300', where: 'eBay, FB Marketplace' },
                  { item: 'Snap-on hand tools', buy: '$10-30', sell: '$50-150', where: 'eBay, OfferUp' },
                  { item: 'Air compressors', buy: '$20-50', sell: '$100-250', where: 'FB Marketplace, Craigslist' },
                  { item: 'Table saws / miter saws', buy: '$25-75', sell: '$150-350', where: 'FB Marketplace, Craigslist' },
                ].map(f => (
                  <div key={f.item} style={{
                    display: 'grid', gridTemplateColumns: '1fr auto auto auto',
                    gap: '12px', padding: '14px 16px', background: 'var(--bg-surface)',
                    alignItems: 'baseline',
                  }}>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{f.item}</span>
                    <span style={{ fontSize: '13px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', minWidth: '64px', textAlign: 'right' }}>{f.buy}</span>
                    <span style={{ fontSize: '13px', fontFamily: 'var(--font-mono)', color: 'var(--accent-green)', minWidth: '72px', textAlign: 'right' }}>{f.sell}</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-dim)', minWidth: '120px', textAlign: 'right' }}>{f.where}</span>
                  </div>
                ))}
              </div>

              <p style={prose}>
                Estate sales are the #1 source for tools. Workshop cleanouts from retired tradespeople often have an entire garage full of professional-grade equipment priced like it&apos;s consumer-level. Look for listings that mention &quot;tools,&quot; &quot;workshop,&quot; &quot;garage cleanout,&quot; or specific brand names in the description.
              </p>
              <p style={prose}>
                Pro tip: cordless tool batteries alone can sell for $30-60 on eBay. If a drill doesn&apos;t work but the batteries are good, the batteries are your profit.
              </p>
            </section>

            {/* Section 3 */}
            <section id="vintage-furniture" style={sectionStyle}>
              <h2 style={h2Style}>Mid-century &amp; vintage furniture</h2>
              <p style={prose}>
                Danish modern chairs, teak credenzas, solid walnut tables, Eames-era pieces — this category has some of the highest margins in reselling, but it requires a bit more knowledge to spot the good stuff.
              </p>
              <p style={prose}>
                The key is construction quality. Solid wood with dovetail joints, real teak or walnut (not veneer), clean lines, tapered legs. If a piece feels heavy, has no particle board, and looks like it belongs in a design magazine from the 1960s, it&apos;s probably worth real money.
              </p>

              <div style={{
                display: 'flex', flexDirection: 'column', gap: '1px',
                background: 'var(--border-subtle)', borderRadius: '10px',
                overflow: 'hidden', margin: '24px 0',
              }}>
                {[
                  { item: 'Danish modern chairs', buy: '$25-75', sell: '$200-500', where: 'Chairish, FB Marketplace' },
                  { item: 'Teak credenzas / sideboards', buy: '$50-100', sell: '$400-800', where: 'Chairish, eBay' },
                  { item: 'Solid wood dining tables', buy: '$30-80', sell: '$200-600', where: 'FB Marketplace' },
                  { item: 'Lane cedar chests', buy: '$15-40', sell: '$100-250', where: 'eBay, FB Marketplace' },
                  { item: 'MCM lamps / lighting', buy: '$10-30', sell: '$75-300', where: 'eBay, Chairish, Etsy' },
                ].map(f => (
                  <div key={f.item} style={{
                    display: 'grid', gridTemplateColumns: '1fr auto auto auto',
                    gap: '12px', padding: '14px 16px', background: 'var(--bg-surface)',
                    alignItems: 'baseline',
                  }}>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{f.item}</span>
                    <span style={{ fontSize: '13px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', minWidth: '64px', textAlign: 'right' }}>{f.buy}</span>
                    <span style={{ fontSize: '13px', fontFamily: 'var(--font-mono)', color: 'var(--accent-green)', minWidth: '72px', textAlign: 'right' }}>{f.sell}</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-dim)', minWidth: '120px', textAlign: 'right' }}>{f.where}</span>
                  </div>
                ))}
              </div>

              <p style={prose}>
                Selling platforms matter here. Facebook Marketplace is best for local pickup of large pieces. Chairish targets design-conscious buyers who will pay premium prices. eBay works for smaller items and pieces with identifiable maker marks.
              </p>
              <p style={prose}>
                Avoid anything with water damage, major veneer lifting, or structural cracks. Minor cosmetic wear is fine — buyers expect patina on vintage furniture. But a wobbly chair or a warped tabletop kills the resale value.
              </p>
            </section>

            {/* Section 4 */}
            <section id="small-electronics" style={sectionStyle}>
              <h2 style={h2Style}>Small electronics &amp; audio</h2>
              <p style={prose}>
                Vintage audio is one of the best-kept secrets in reselling. A Marantz receiver, a Technics turntable, or a pair of Bose 901 speakers sitting in a basement for 20 years can be worth hundreds — sometimes thousands — to the right buyer.
              </p>
              <p style={prose}>
                The key rule: it has to work. Tested-working electronics flip fast. &quot;As-is&quot; or &quot;untested&quot; items sell too, but for 40-60% less. If the estate sale lets you plug something in, always test it.
              </p>
              <ul style={{ fontSize: '16px', color: 'var(--text-secondary)', lineHeight: 1.85, paddingLeft: '20px', margin: '20px 0' }}>
                <li style={{ marginBottom: '8px' }}><strong style={{ color: 'var(--text-primary)' }}>Vintage receivers</strong> (Marantz, Pioneer, Sansui) — buy $20-50, sell $100-400. The silver-face models from the 1970s are the sweet spot.</li>
                <li style={{ marginBottom: '8px' }}><strong style={{ color: 'var(--text-primary)' }}>Turntables</strong> (Technics, Dual, Thorens) — buy $10-40, sell $80-250. The vinyl revival keeps demand high.</li>
                <li style={{ marginBottom: '8px' }}><strong style={{ color: 'var(--text-primary)' }}>Retro gaming consoles</strong> (N64, GameCube, SNES, original PlayStation) — buy $5-25, sell $50-150. Games sell separately and often for more than the console.</li>
                <li style={{ marginBottom: '8px' }}><strong style={{ color: 'var(--text-primary)' }}>Camera gear</strong> (Canon, Nikon film bodies, vintage lenses) — buy $10-30, sell $50-200. Film photography is back, and old glass is in demand.</li>
              </ul>
              <p style={prose}>
                Estate sales are particularly strong for vintage audio because older homeowners tend to have high-quality systems that their families don&apos;t recognize as valuable. A garage sale might have an old boombox. An estate sale has a Marantz 2270 for $25.
              </p>
            </section>

            {/* -- Inline CTA (after section 4) -- */}
            <aside style={{
              background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
              borderRadius: '12px', padding: '28px 24px', margin: '48px 0 40px',
            }}>
              <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: '16px' }}>
                Flip-ly scans estate sales, garage sales, and moving sales across 400+ markets — then scores them so you know which ones are worth the drive. Free tier includes 15 searches a day.
              </p>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <Link href="/" style={{
                  display: 'inline-block', padding: '10px 20px',
                  background: 'var(--accent-green)', color: '#000',
                  borderRadius: '8px', fontSize: '14px', fontWeight: 600,
                  textDecoration: 'none',
                }}>
                  Try it free
                </Link>
                <Link href="/pro" style={{
                  display: 'inline-block', padding: '10px 20px',
                  background: 'transparent', color: 'var(--accent-green)',
                  borderRadius: '8px', fontSize: '14px', fontWeight: 600,
                  textDecoration: 'none', border: '1px solid var(--accent-green)',
                }}>
                  See Pro features
                </Link>
              </div>
            </aside>

            {/* Section 5 */}
            <section id="sleeper-categories" style={sectionStyle}>
              <h2 style={h2Style}>The sleeper categories</h2>
              <p style={prose}>
                These are the categories most flippers walk right past. Lower competition means you&apos;re not racing five other resellers to the same table. The margins can be just as good as tools and furniture — sometimes better.
              </p>

              <ul style={{ fontSize: '16px', color: 'var(--text-secondary)', lineHeight: 1.85, paddingLeft: '20px', margin: '20px 0' }}>
                <li style={{ marginBottom: '12px' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>Cast iron cookware</strong> — Griswold, Wagner, Lodge. A Griswold #8 skillet bought for $5-15 sells for $50-200 depending on condition and age. Look for smooth cooking surfaces (older = more valuable) and gate marks on the bottom. Clean up nicely with an oven self-clean cycle.
                </li>
                <li style={{ marginBottom: '12px' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>Vintage Pyrex</strong> — certain patterns (Butterprint, Lucky in Love, Starburst) sell for $40-300 per piece. Even common patterns in good condition sell for $15-40. Entire sets multiply the value. Estate sales are the best source because grandma&apos;s kitchen is where this stuff lives.
                </li>
                <li style={{ marginBottom: '12px' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>Commercial kitchen equipment</strong> — restaurant closures and estate sales from retired caterers. Commercial mixers (KitchenAid Pro, Hobart), hotel pans, and commercial baking sheets. Buy for $20-80, sell for $100-400. Heavy, so local pickup sales work best.
                </li>
                <li style={{ marginBottom: '12px' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>Architectural salvage</strong> — old doorknobs, vintage light fixtures, stained glass, solid wood doors, iron railings. Renovators and designers pay premium prices for authentic period hardware. Buy for $5-30, sell for $40-200+. Estate sales from older homes are the goldmine.
                </li>
                <li style={{ marginBottom: '12px' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>Vintage signs &amp; advertising</strong> — neon beer signs, metal gas station signs, enamel advertising pieces. Condition is everything. A clean porcelain Coca-Cola sign can sell for $200-500. Even reproduction signs from the 1980s-90s have a market.
                </li>
              </ul>

              <p style={prose}>
                The pattern across all sleeper categories: items that are heavy, fragile, or hard to photograph tend to have less online competition. That&apos;s your advantage. The work of picking it up, cleaning it, and listing it well is the moat.
              </p>
            </section>

            {/* Section 6 */}
            <section id="spot-them-faster" style={sectionStyle}>
              <h2 style={h2Style}>How to spot them faster</h2>
              <p style={prose}>
                Knowing what to buy is half the equation. The other half is finding the right sales before everyone else. In any metro area, there are hundreds of listings posted every week. You can&apos;t visit them all, so you need a filter.
              </p>
              <p style={prose}>
                The fastest signal is the listing description itself. A sale that mentions &quot;workshop cleanout,&quot; &quot;estate sale,&quot; or &quot;retiring after 40 years&quot; almost always has power tools. A sale in an older neighborhood with &quot;antiques,&quot; &quot;vintage,&quot; or &quot;mid-century&quot; in the description is furniture territory.
              </p>
              <p style={prose}>
                AI scoring takes this further. Instead of manually reading 300 listings on a Thursday night, a scoring algorithm evaluates the description, category signals, price language, freshness, and location to surface the top 5-10 sales worth your time. A listing that scores 8+ on a 10-point scale almost always has high-value items in the categories above.
              </p>
              <p style={prose}>
                The difference between a $50 Saturday and a $500 Saturday usually isn&apos;t luck — it&apos;s which sales you chose to visit. The scoring just makes the choosing faster.
              </p>
            </section>

            {/* -- FAQ Section -- */}
            <section id="faq" style={sectionStyle}>
              <h2 style={h2Style}>Frequently asked questions</h2>

              <div style={{
                display: 'flex', flexDirection: 'column', gap: '1px',
                background: 'var(--border-subtle)', borderRadius: '10px',
                overflow: 'hidden', margin: '24px 0',
              }}>
                <div style={{ padding: '20px 16px', background: 'var(--bg-surface)' }}>
                  <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                    What are the most profitable items to flip?
                  </p>
                  <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.65 }}>
                    Power tools consistently offer the best combination of high margins, fast turnover, and easy sourcing. A single estate sale with workshop tools can yield $300-800 in resale value from a $50-100 investment. Vintage furniture has higher per-item margins but moves slower and requires space. Start with tools if you&apos;re new.
                  </p>
                </div>
                <div style={{ padding: '20px 16px', background: 'var(--bg-surface)' }}>
                  <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                    Where should I sell the items I flip?
                  </p>
                  <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.65 }}>
                    Facebook Marketplace and Craigslist for large, heavy items (furniture, power tools, appliances) — local pickup avoids shipping costs. eBay for anything small enough to ship, especially electronics, collectibles, and brand-name tools with national demand. Chairish and Etsy for vintage furniture and decor where buyers expect to pay premium prices.
                  </p>
                </div>
                <div style={{ padding: '20px 16px', background: 'var(--bg-surface)' }}>
                  <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                    How much money do I need to start?
                  </p>
                  <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.65 }}>
                    $50-100 is enough. Pick one category you want to learn (tools are the easiest starting point), hit 3-5 sales on a Saturday, and buy 2-3 items you&apos;re confident about. Sell them within a week, reinvest the profit, and repeat. Most flippers who stick with it are self-funding within a month.
                  </p>
                </div>
              </div>
            </section>

            {/* -- End CTA -- */}
            <aside style={{
              background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
              borderRadius: '12px', padding: '28px 24px', margin: '48px 0 40px',
            }}>
              <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: '16px' }}>
                Stop scrolling five sites every morning. Flip-ly aggregates estate sales, garage sales, and moving sales across 400+ markets, scores them with AI, and delivers the best ones to you every week. Free tier gets you 15 searches a day.
              </p>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <Link href="/" style={{
                  display: 'inline-block', padding: '10px 20px',
                  background: 'var(--accent-green)', color: '#000',
                  borderRadius: '8px', fontSize: '14px', fontWeight: 600,
                  textDecoration: 'none',
                }}>
                  Try it free
                </Link>
                <Link href="/pro" style={{
                  display: 'inline-block', padding: '10px 20px',
                  background: 'transparent', color: 'var(--accent-green)',
                  borderRadius: '8px', fontSize: '14px', fontWeight: 600,
                  textDecoration: 'none', border: '1px solid var(--accent-green)',
                }}>
                  See Pro features
                </Link>
              </div>
            </aside>

            {/* -- Read next -- */}
            <div style={{
              background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
              borderRadius: '10px', padding: '20px 24px', margin: '16px 0 40px',
            }}>
              <p style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-dim)', marginBottom: '8px' }}>
                Read next
              </p>
              <Link href="/blog/ai-deal-scoring-explained" style={{
                fontSize: '15px', color: 'var(--accent-green)', textDecoration: 'none', fontWeight: 500,
              }}>
                How AI Deal Scoring Works (And Why It Finds Deals You Miss)
              </Link>
            </div>
          </div>

          {/* -- Article footer -- */}
          <footer style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            paddingTop: '24px', borderTop: '1px solid var(--border-subtle)',
            flexWrap: 'wrap', gap: '12px',
          }}>
            <Link href="/blog" style={{ fontSize: '14px', color: 'var(--accent-green)', textDecoration: 'none', fontWeight: 500 }}>
              &larr; All guides
            </Link>
            <Link href="/" style={{ fontSize: '13px', color: 'var(--text-dim)', textDecoration: 'none' }}>
              Flip-ly.net &rarr;
            </Link>
          </footer>

        </article>
      </div>
    </>
  )
}
