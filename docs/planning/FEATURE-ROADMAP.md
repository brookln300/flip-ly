# Feature Roadmap

**Created:** 2026-04-04
**Status:** LOCKED
**Rule:** Every feature must answer: "Which tier does this serve?" and "Does this drive upgrades?"

---

## Phase 0 — Polish & Relaunch (This Week)

**Goal:** Ship the landing page polish, update pricing to 3-tier model, launch founding member program. No new features — just presentation and positioning.

| Task | Tied To | Status |
|------|---------|--------|
| Testimonials redesign (2-col, 6 personas, stars) | Landing page | Done |
| Header overhaul (blur, icon, mobile menu) | Landing page | Done |
| Pricing section — 3 tiers (Free/Pro/Power) | Pricing model | Pending |
| Founding member countdown (14-day, simple counter) | Pricing model | Pending |
| Stats bar — verify against real DB numbers | Landing page | Pending |
| Overall polish pass (spacing, mobile, typography) | Landing page | Pending |
| Update hero copy: "garage sales" → broader positioning | Product pivot | Pending |
| Update About, Why, meta tags for new positioning | Product pivot | Pending |
| Create new Stripe Price IDs (pro_founding, pro_regular, power_founding, power_regular) | Pricing model | Pending |
| Add `is_founding_member` + `founding_member_at` to users table | Pricing model | Pending |

**Ships by:** Monday April 7

---

## Phase 1 — Core Pivot (Week of April 7-13)

**Goal:** Integrate Tier 1 sources, build AI score breakdown, implement new tier gating.

### Source Integrations

| Source | Method | Listings Expected | Effort |
|--------|--------|------------------|--------|
| GarageSaleFinder / GSALR | CSV/KML import | +200/day | 1-2 days |
| EstateSales.net | Official API | +50-100/day | 1-2 days |
| ShopGoodwill | AI Extract | +30-50/day | 1 day |
| Nextdoor | Developer API (apply) | +20-40/day | 2 days (includes approval wait) |

### Feature Work

| Feature | Tier | What It Does | Effort |
|---------|------|-------------|--------|
| **AI Score Breakdown** | Pro/Power | Restructure Haiku prompt to output factor-by-factor scoring. Store as JSONB in `fliply_listings.ai_score_breakdown` | 2-3 days |
| **Score display by tier** | All | Free: number + teaser. Pro: full breakdown. Power: breakdown + category context. | 1 day |
| **15 search/day limit** | Free | Update from 10 → 15 | 30 min |
| **Market gating (1/3/unlimited)** | All | Add `additional_markets` to users table. Gate search + digest by market count. | 1-2 days |
| **"Add nearby markets" UI** | Pro | Auto-suggest adjacent markets when user hits market limit | 1 day |
| **Daily digest** | Pro/Power | New cron job — same format as weekly, runs Mon-Fri | 1 day |
| **Founding member badge** | Pro/Power | Dashboard indicator for founding members | 2 hours |

**Ships by:** April 13

---

## Phase 2 — Upgrade Triggers & Retention (Week of April 14-20)

**Goal:** Build the conversion machinery. Every gate should feel like a door, not a wall.

| Feature | Tier | What It Does | Effort |
|---------|------|-------------|--------|
| **Saved searches** | Pro (3) / Power (unl) | Save search query + market + filters. Runs against new listings. | 2-3 days |
| **Upgrade prompts (contextual)** | Free/Pro | Smart nudges when user hits a gate (search limit, locked score, market limit) | 1-2 days |
| **"Daily digest sample" drip** | Free | After 14 days on free, send ONE daily digest as taste. Then pitch Pro. | 1 day |
| **Deal history (7/30/90 days)** | Tiered | Dashboard section showing past viewed/saved deals. Gated by tier. | 1-2 days |
| **Power tier Stripe setup** | Power | New checkout flow, plan management, upgrade/downgrade paths | 1-2 days |
| **FB Group Directory** | All | Curated FB groups by market + category. "Also check these FB groups for [query]" cards in search results. | 2-3 days |

**Ships by:** April 20

---

## Phase 3 — Tier 2 Sources & Intelligence (Weeks of April 21 - May 4)

**Goal:** More sources, smarter scoring, instant alerts for Power users.

### Source Integrations

| Source | Method | Effort |
|--------|--------|--------|
| OfferUp | pyOfferUp / AI Extract | 2-3 days |
| Yard Sale Treasure Map | AI Extract | 1 day |
| EstateSale.com | AI Extract | 1 day |
| EBTH | AI Extract | 1 day |
| HiBid | Apify scraper | 1-2 days |

### Feature Work

| Feature | Tier | What It Does | Effort |
|---------|------|-------------|--------|
| **Instant deal alerts** | Power | When a saved search matches a new listing scoring 8+, email immediately | 2-3 days |
| **Category price intelligence** | Power | "Stand mixers in DFW average $80-150. This one is $45." Aggregate stats from listing history. | 3-4 days |
| **Source filter in search** | All | Filter results by source type (Craigslist, estate sales, auctions, etc.) | 1 day |
| **Local PC cron fallback** | Infra | Move heavy scraping to Keith's secondary PC, Vercel as failover | 2-3 days |

**Ships by:** May 4

---

## Phase 4 — Growth & Optimization (May 5+)

**Goal:** Referral program, content marketing, ad optimization, retention analysis.

| Feature | Tier | What It Does | Priority |
|---------|------|-------------|----------|
| **Referral program** | All | "Invite a friend, get a free month of Pro" | High |
| **Annual billing option** | Pro/Power | Yearly plans at 15-20% discount. Reduces Stripe fee impact + improves LTV. | High |
| **Email drip overhaul** | Free | Rewrite 7-email drip for post-pivot positioning | Medium |
| **Google Ads optimization** | Growth | New ad copy + landing pages for broader "local deals" keywords | Medium |
| **Social content pivot** | Growth | Buffer/content pipeline updated for deal discovery positioning | Medium |
| **PWA push notifications** | Power | Service worker for instant alerts without email | Medium |
| **Dashboard redesign for multi-source** | All | Show source diversity, score breakdowns, category filters | Medium |
| **Churn analysis + win-back** | Pro/Power | Track why people cancel, automated win-back email | Low (need data first) |
| **Browser extension (opt-in FB data)** | Power | Users share their FB Marketplace browsing → we enrich + score it | Low (complex) |

---

## What We Are NOT Building (Scope Discipline)

| Idea | Why Not |
|------|---------|
| Mobile native app | PWA first. Native is a $50K+ commitment for uncertain upside. |
| Our own marketplace (let users list items) | We're a discovery layer, not a marketplace. Adding listings = competing with our sources. |
| Chat/messaging between buyers and sellers | We link to the source listing. The source handles communication. |
| Payment processing for transactions | We're not in the transaction. We find the deal, they close it. |
| Price prediction / "what's it worth" tool | Adjacent but different product. Maybe later as a Power feature. |
| Inventory management for resellers | Different product entirely. Stay focused. |

---

## Feature → Tier Mapping (Quick Reference)

| Feature | Free | Pro | Power |
|---------|------|-----|-------|
| Search | 15/day | Unlimited | Unlimited |
| Markets | 1 | 3 | Unlimited |
| AI Score | Number only | Full breakdown | Breakdown + trends |
| Source links | Locked | Direct | Direct |
| Weekly digest | Thursday noon | Thursday 6AM | Thursday 6AM |
| Daily digest | No | Yes | Yes |
| Instant alerts | No | No | Yes (saved search matches) |
| Saved searches | No | 3 | Unlimited |
| Deal history | 7 days | 30 days | 90 days |
| Category intel | No | No | Yes |
| FB Group directory | Yes | Yes | Yes |
| Founding badge | No | Yes | Yes |
| Source filtering | Yes | Yes | Yes |

---

## Decisions Locked

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | Phase 0 (polish) ships before any new features | Can't sell a new pricing model on an old landing page |
| 2 | AI Score Breakdown is Phase 1 priority | This is the core value prop — needs to work before we market aggressively |
| 3 | FB Group Directory, not FB scraping | Adds FB value without legal risk. Ship in Phase 2. |
| 4 | No mobile app | PWA covers mobile needs. Native is premature. |
| 5 | No marketplace features | We find deals, we don't facilitate transactions. Stay in our lane. |
| 6 | Instant alerts are Power-only | Highest-value feature for highest tier. Strong upgrade driver. |
| 7 | Annual billing deferred to Phase 4 | Need churn data first to model the discount correctly |
