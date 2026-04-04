# Product Pivot: Garage Sale Aggregator → Local Deal Discovery Platform

**Created:** 2026-04-04
**Status:** Draft — awaiting Keith's review
**Depends on:** PRICING-MODEL.md, SOURCE-STRATEGY.md

---

## The Shift (One Sentence)

**Before:** "Every garage sale near you" — a weekly email about weekend sales.
**After:** "Find underpriced stuff near you before anyone else" — an AI-powered deal discovery engine across all local sources.

---

## Why Now

1. **Garage sales alone cap the business.** Seasonal (Mar-Oct in most markets), weekend-only, casual audience. WTP ceiling is ~$3-5/mo. That's a hobby project, not a business.

2. **The engine already works.** Multi-source scraping, AI scoring, digest delivery, search with gating, user lifecycle management — all built. The infrastructure doesn't care if the listing comes from a garage sale or Craigslist.

3. **The market research already pointed here.** The executive summary (docs/marketing-analysis/08-EXECUTIVE-SUMMARY.md) identified 7.2M Gen Z/Millennials actively flipping items. Core positioning recommendation was "Find deals like a pro. Flip for profit." — not "Get a garage sale email."

4. **No competitor bundles all local sources + AI scoring.** OfferUp, Mercari, FB Marketplace — they're marketplaces. They don't aggregate across each other. Nobody is the "Kayak for local deals."

5. **Year-round retention.** Craigslist, FB Marketplace, OfferUp, liquidation sites post deals 365 days/year. No winter churn cliff.

---

## What Stays (The Foundation)

| Component | Why It Stays |
|-----------|-------------|
| AI deal scoring (Claude Haiku) | This IS the product. Scores any listing from any source. |
| Multi-source scraping engine | Just needs more sources plugged in. Architecture is source-agnostic. |
| Weekly digest | Stays as one delivery mechanism. Gets joined by daily + instant options. |
| Supabase schema (fliply_listings, fliply_sources, fliply_markets) | Listings are listings. Schema works for any source type. |
| Search with free/pro gating | Stays and gets refined with new tier logic. |
| User lifecycle (trial → active → lapsed → churned) | Stays as-is. |
| Stripe integration | Stays. Needs new price IDs for new tiers. |
| Telegram alerts | Stays as internal monitoring. |
| Estate sale + garage sale scrapers | Stay as source feeds. Become a differentiator, not the whole product. |

## What Changes

| Component | Before | After |
|-----------|--------|-------|
| **Positioning** | "Every garage sale near you" | "Find underpriced stuff near you before anyone else" |
| **Value prop** | Convenience (we check sites so you don't have to) | Money (we help you find things worth more than their asking price) |
| **Primary user** | Weekend garage sale browser | Side hustler / reseller / flipper |
| **Sources** | Craigslist + EstateSales.net + Eventbrite | All local platforms: CL, FB Marketplace, OfferUp, Mercari, estate sales, garage sales, liquidation, thrift |
| **Digest frequency** | Weekly only | Weekly (free), Daily (pro), Instant alerts (top tier) |
| **Market scope per user** | All 413 markets (no limit) | Tiered: 1 market (free), 3 (pro), unlimited (top) |
| **AI scores** | Gated behind Pro | Visible to all tiers (at varying detail levels) — the score IS the hook |
| **Pricing** | $0 / $5 | $0 / $9 / $29 |
| **Landing page** | "Garage sale discovery" | "Local deal discovery for flippers and bargain hunters" |
| **Brand voice** | Casual weekend hobbyist | Side hustle enabler, money-finding tool |

## What Gets Built (New)

| Feature | Tier | Priority | Notes |
|---------|------|----------|-------|
| FB Marketplace scraping | All | High | Largest source of local deals. Legal gray area — needs research. |
| OfferUp integration | All | High | API or scrape. Major source. |
| Saved searches with alerts | Pro+ | High | "Tell me when a KitchenAid under $50 appears within 20 miles" |
| Daily digest | Pro+ | High | Differentiator from free tier |
| Instant deal alerts (email) | Top tier | Medium | When a listing matching saved search appears, email immediately |
| Multi-market support | Tiered | Medium | Already architecturally supported, just needs UI + gating |
| Category intelligence | Pro+ | Medium | "Furniture deals in your area average $X — this one is 60% below" |
| Deal history / trends | Top tier | Low | 90-day lookback, price tracking by category |
| Push notifications | Top tier | Later | Requires PWA service worker or native app |
| Mercari/Poshmark tracking | All | Later | Online-only sources, different scraping approach |

---

## What Gets Slimmed Down

| Component | Action | Why |
|-----------|--------|-----|
| Garage-sale-specific branding | Rewrite landing page, about, taglines | No longer the whole product |
| "Thursday at noon" messaging | Replace with flexible digest timing | Digest frequency is now tiered |
| Lobster hunt / easter eggs | Keep but deprioritize | Fun but not revenue-driving |
| Chaos mode remnants | Already removed | N/A |

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| FB Marketplace blocks scraping | High | High | Research legal approaches, consider browser extension model, proxy rotation |
| Scope creep — trying to build everything at once | High | High | Strict NOW/NEXT/LATER discipline. Ship one source at a time. |
| Existing users confused by pivot | Low | Low | We have <20 users. Communicate directly. The product gets better for them. |
| OfferUp/Mercari API access denied | Medium | Medium | Scraping fallback, or deprioritize those sources |
| AI scoring costs increase with more listings | Low | Medium | Haiku is cheap ($0.003/listing). Even at 10x volume, costs are manageable. |
| Competing with OfferUp/FB directly | Medium | Medium | We don't compete as a marketplace — we're a discovery layer ON TOP of them. They're sources, not competitors. |

---

## Success Metrics (Post-Pivot)

| Metric | Current | 30-Day Target | 90-Day Target |
|--------|---------|---------------|---------------|
| Weekly active users | ~5 | 50 | 200 |
| Pro subscribers ($9/mo) | 0 | 10 | 50 |
| Power subscribers ($29/mo) | N/A | 2 | 15 |
| Monthly revenue | $0 | $148 | $885 |
| Sources integrated | 3 | 5 | 8 |
| Daily listings scored | ~50 | 200 | 1,000 |
| Free → Pro conversion | Unknown | 15% | 25% |
| Pro → Power conversion | N/A | 5% | 10% |

---

## Open Questions (Moved to OPEN-QUESTIONS.md)

1. FB Marketplace scraping — legal? Technical approach? Browser extension vs server-side?
2. Do we rebrand or keep "Flip-ly"? (Flip-ly actually works better for the pivoted product)
3. Annual pricing — yes/no? What discount?
4. Referral program mechanics — free month? Credit?
5. Should AI scores be partially visible on free tier (show score, hide breakdown) to drive upgrades?
6. Mobile app vs PWA vs email-only?
