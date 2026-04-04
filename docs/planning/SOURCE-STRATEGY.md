# Source Strategy — Integration Priority

**Created:** 2026-04-04
**Status:** LOCKED
**Principle:** Easy wins first. Legal clarity always. Each new source adds ~$2.70/mo to pipeline costs.

---

## Current Sources (Live)

| Source | Method | Cost | Listings/Day | Status |
|--------|--------|------|-------------|--------|
| Craigslist (sapi JSON) | Free fetch, structured JSON | $0 | ~50-80 | Live, stable |
| Eventbrite (LD+JSON) | Free fetch, HTML parse | $0 | ~10-20 | Live, stable |
| AI Extract (misc local sites) | Haiku parses HTML | ~$0.015/page | ~10-30 | Live, varies |

**Total current:** ~70-130 listings/day across 3 source types.

---

## Integration Priority Tiers

### TIER 1 — Ship First (Low risk, high value, minimal effort)

These are structured data sources with APIs, exports, or clean scraping surfaces.

| Source | Method | Difficulty | Legal Risk | Est. Listings/Day | Monthly Cost | Priority |
|--------|--------|-----------|-----------|-------------------|-------------|----------|
| **GarageSaleFinder / GSALR** | CSV/KML export | Easy | Low — public data exports | ~200+ | $0 (structured) | **#1** |
| **EstateSales.net API** | Official REST API (beta) | Easy | None — official API | ~50-100 | $0 (API) | **#2** |
| **ShopGoodwill** | GitHub scrapers exist | Easy | Low — public auction data | ~30-50 | ~$2.70 (AI extract) | **#3** |
| **Nextdoor (developer API)** | Official Search API | Medium | None — official API | ~20-40 | $0 (API) | **#4** |

**Impact:** 4 sources, ~300-400 new listings/day, cost increase ~$2.70/mo
**Timeline:** 1-2 weeks to integrate all four
**Why first:** Zero legal risk, structured data, some have actual APIs. GarageSaleFinder alone taps the entire Treasure Listings network (gsalr, YardSaleSearch, GarageSalesTracker, WeekendTreasure — 9 sites from 1 integration).

### TIER 2 — Ship Second (Moderate effort, strong value)

Require scraping but have clean, stable HTML and publicly accessible data.

| Source | Method | Difficulty | Legal Risk | Est. Listings/Day | Monthly Cost |
|--------|--------|-----------|-----------|-------------------|-------------|
| **OfferUp** | pyOfferUp library / Apify | Medium | Medium — no API, ToS gray | ~100-200 | ~$2.70 |
| **Yard Sale Treasure Map** | Scrape (no API) | Medium | Low — public listings | ~30-50 | ~$2.70 |
| **EstateSale.com** | Scrape | Medium | Low — public directory | ~20-30 | ~$2.70 |
| **EBTH** | Scrape | Medium | Low — public auction listings | ~20-40 | ~$2.70 |
| **HiBid** | Apify scraper available | Easy-Medium | Low — public auctions | ~30-50 | ~$2.70 |
| **MaxSold** | Scrape | Medium | Low — public auctions | ~10-20 | ~$2.70 |

**Impact:** 6 sources, ~200-400 new listings/day, cost increase ~$16/mo
**Timeline:** 2-4 weeks
**Why second:** Each requires a custom scraper or AI Extract config, but the data is public and the legal risk is manageable.

### TIER 3 — Strategic / Creative Approach Required

These are high-value but legally or technically complex.

| Source | Challenge | Creative Approach |
|--------|-----------|-------------------|
| **Facebook Marketplace** | No API, aggressive anti-scraping, account bans, legal risk (see Craigslist v. 3Taps) | **Don't scrape. Redirect.** (See FB strategy below) |
| **Facebook Groups** | Same as above but even harder — groups are semi-private | **Curate group directories.** Point users to relevant groups by category + market. We become the guide, not the scraper. |
| **Mercari** | No public API, app-first, anti-scraping | Deprioritize — shipped items, not local. Lower value for our use case. |
| **Poshmark** | No public API, fashion-only | Deprioritize — niche. Add later if fashion category grows. |
| **VarageSale** | Requires FB login, no API | Skip for now — small user base, declining. |

---

## The Facebook Strategy — Pointer, Not Pipeline

**Problem:** FB Marketplace is the #1 source of local deals by volume. We can't ignore it. But scraping it is legally risky, technically fragile, and gets accounts banned.

**Solution: We don't scrape FB. We send people TO FB — intelligently.**

### How it works:

1. **FB Group Directory** — We curate and maintain a database of FB buy/sell/garage sale groups organized by market and category.

2. **Smart Redirect** — User searches "vintage lamps" in DFW → We show results from our scraped sources (CL, OfferUp, estate sales) AND show a card:
   > "Also check these FB groups for vintage finds in DFW:"
   > - DFW Vintage & Antique Buy/Sell (12K members)
   > - Dallas Estate & Garage Sales (8K members)
   > [Open on Facebook →]

3. **Value without risk** — We're a directory, not a scraper. We're sending traffic TO Facebook, not taking data FROM it. This is the same thing Google does with search results.

4. **Category intelligence** — Over time, we tag which FB groups are best for which categories. "Looking for tools? This group has the most tool listings." This becomes its own valuable dataset.

5. **Future option** — If/when Facebook opens an API, or if we build a browser extension where users opt-in to share their FB Marketplace data, we can integrate properly. Until then, the pointer model adds value without legal risk.

### DB Schema Addition:
```sql
CREATE TABLE fb_group_directory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id UUID REFERENCES fliply_markets(id),
  group_name TEXT NOT NULL,
  group_url TEXT NOT NULL,
  category_tags TEXT[], -- ['vintage', 'furniture', 'tools', 'estate-sale']
  member_count INTEGER,
  activity_level TEXT, -- 'high', 'medium', 'low'
  verified_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE
);
```

---

## Source Addition Cost Model

Each new source adds cost in two ways:

| Cost Type | Amount | Notes |
|-----------|--------|-------|
| AI Extract scraping | ~$2.70/mo per source | 6 scrapes/day × 30 days × $0.015/page |
| AI Enrichment | ~$0.0008 per new listing | Shared — already running for all listings |
| API sources (CL, EB, EstateSales.net, Nextdoor) | $0.00 | Structured data, no AI extraction needed |

**Running total by phase:**

| Phase | Sources | New Listings/Day | Pipeline Cost |
|-------|---------|-----------------|---------------|
| Current | 3 | ~100 | $18/mo |
| After Tier 1 | 7 | ~400 | $21/mo |
| After Tier 2 | 13 | ~800 | $37/mo |
| With FB Group Directory | 13 + directory | ~800 + FB referrals | $37/mo (directory is free) |

---

## Legal Risk Framework

| Risk Level | Definition | Sources | Our Approach |
|-----------|-----------|---------|-------------|
| **None** | Official API, explicit permission | EstateSales.net API, Nextdoor API, Eventbrite | Use as intended |
| **Low** | Public data, no anti-scraping measures, common practice | Craigslist (SAPI), GarageSaleFinder exports, ShopGoodwill, auction sites | Respectful scraping, rate limiting, User-Agent headers |
| **Medium** | No API, ToS may restrict, but data is public | OfferUp, Yard Sale Treasure Map, local sites | Monitor ToS, rotate headers, keep volume reasonable |
| **High** | Active anti-scraping, account bans, litigation history | Facebook Marketplace, Mercari | **Don't scrape. Use pointer/directory model.** |

### Standing Rule:
> If a source has an API, use the API.
> If a source has data exports, use the exports.
> If a source is public but has no API, use AI Extract with respectful rate limits.
> If a source is legally risky, find a creative way to add value without touching their data.

---

## Decisions Locked

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | GarageSaleFinder/GSALR first (taps 9-site network) | Highest listing volume from a single integration |
| 2 | EstateSales.net official API second | Zero legal risk, already researched |
| 3 | Facebook = pointer model, not scraping | Legal risk too high, pointer model adds value without risk |
| 4 | OfferUp in Tier 2 (pyOfferUp library) | High value but medium legal risk — ship after easy wins |
| 5 | Mercari/Poshmark deprioritized | Shipped items, not local. Lower value for our core user. |
| 6 | Each source costs ~$2.70/mo to run | Budget source additions deliberately |
