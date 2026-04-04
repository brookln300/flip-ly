# Competitive Landscape — Post-Pivot

**Created:** 2026-04-04
**Status:** LOCKED
**Key Finding:** No competitor combines multi-source local/secondhand aggregation with AI deal scoring. This is genuine whitespace.

---

## The One-Liner

Everyone else is either a **single-source marketplace** or a **retail price tracker**. Nobody is building a unified intelligence layer across the fragmented secondhand market. That's the gap.

---

## Direct Competitors (Deal Aggregators)

| Name | What They Do | Pricing | Strength | Weakness | Our Edge |
|------|-------------|---------|----------|----------|----------|
| **SearchTempest** | Aggregates Craigslist + some eBay with geo search | Free (ads) | Wide CL geo coverage | CL-only, no scoring, stale UX | We aggregate ALL sources + AI scoring |
| **CPlus (Craigslist+)** | Mobile Craigslist browser with saved searches | Free + $3.99 Pro | Clean mobile UX, push alerts | Single source, no deal analysis | Multi-source + scoring makes single-source apps obsolete |
| **BriskSale** | Local classifieds app — largely defunct | Was free | Had clean UI | Dead product | Non-factor. Validates single-source apps struggle. |

**No direct competitor does what we do.**

---

## Source Marketplaces (We Aggregate FROM Them)

| Name | What They Do | Our Relationship | Their Weakness We Exploit |
|------|-------------|-----------------|--------------------------|
| **Facebook Marketplace** | P2P local selling in FB | Source — we scan their listings | Garbage UX, algorithm pushes ads, requires FB account, no scoring |
| **OfferUp** | Local buy/sell app | Source — we include their inventory | Own ecosystem only, increasingly pay-to-play, no intelligence layer |
| **Mercari** | Shipped secondhand goods | Source — we surface their deals | Not local-first, 10% seller fees, own ecosystem only |
| **Poshmark** | Fashion resale social commerce | Source (fashion deals) | Fashion-only, 20% commission, own ecosystem |
| **Craigslist** | Original local classifieds | Source — primary data feed | Zero intelligence, archaic UX, no app, fragmented by city, rampant scams |

**Key insight:** These aren't competitors — they're our supply chain. We make their inventory discoverable and scoreable. They're sources, not threats.

---

## Niche Competitors (Flipping/Reselling)

| Name | What They Do | Pricing | Our Edge |
|------|-------------|---------|----------|
| **EstateSales.net** | Estate sale directory with dates/locations/photos | Free (companies pay to list) | We pull their data AND combine with every other source + scoring |
| **GarageSaleFinder / GSALR** | Map-based garage sale listings (user-submitted) | Free | Highly incomplete. We aggregate all garage sale sources + add item-level intel |
| **AuctionZip** | Auction house directory | Free | Auction-only. We include auctions as one source among many |
| **Whatnot** | Live-stream auction app | Free to buy | Different model entirely — live entertainment vs async discovery |
| **Flipper Tools (various)** | Chrome extensions for eBay arbitrage (Terapeak, etc.) | $10-30/mo | Retail arbitrage focused. We build scoring intelligence in — no separate tool needed |

---

## Broader Context (Not Direct Competitors)

| Name | What They Do | Why They Don't Compete With Us |
|------|-------------|-------------------------------|
| **Google Shopping Alerts** | Retail price tracking | New/retail only — zero secondhand/local coverage |
| **Honey / Capital One Shopping** | Browser coupon finders | Retail/online-only. They save $3 on Amazon; we find a $50 couch worth $300 |
| **CamelCamelCamel** | Amazon price history | Amazon-only, new items. Could be a comp data source for OUR scoring though |

---

## Moat Analysis

### Does anyone do multi-source aggregation + AI deal scoring for local/secondhand?

**No. Nobody.**

Closest attempts:
- SearchTempest aggregates Craigslist only, zero AI
- FB Marketplace has algorithmic recommendations but only for their own listings
- Various flipper Chrome extensions do eBay sold comps, not multi-source discovery

### Why the gap exists:

1. **Data fragmentation** — each source has different structure, APIs (or none), and anti-scraping measures. Hard to build, hard to maintain.
2. **Local is hard** — geographic relevance adds complexity that national aggregators avoid
3. **Scoring requires domain knowledge** — knowing a Vitamix at $40 is a steal but a Mr. Coffee at $40 isn't requires product intelligence
4. **Incumbents are complacent** — Craigslist hasn't innovated in 20 years. FB Marketplace is a feature, not a product. OfferUp is focused on being a marketplace, not an aggregator.

### Our moat layers:

| Layer | What It Is | How It Grows |
|-------|-----------|-------------|
| **Technical** | Multi-source scraping pipeline is genuinely hard to build/maintain | More sources = harder to replicate |
| **Data** | Historical deal data improves scoring accuracy over time | Every scored listing makes the AI smarter |
| **Habit** | Flippers rely on our scores → high switching cost | They'd have to go back to checking 6 apps manually |
| **Brand** | "The deal discovery tool" becomes the category name | First mover in an empty space |

### Key risks:

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Facebook builds this into Marketplace | Low | High | FB has never aggregated competitors' listings. Not in their DNA. |
| Google enters local secondhand | Low | High | Google Shopping is retail-focused. They've ignored secondhand for 20 years. |
| Craigslist sues over scraping | Medium | High | Use public APIs (sapi.craigslist.org), respect rate limits, see legal precedent (Craigslist v. 3Taps). |
| A funded startup copies the idea | Medium | Medium | First-mover advantage + data moat. Hard to catch up on scored listing history. |
| Source marketplaces block scraping | Medium | Medium | Diversify sources. Browser extension model as fallback. Some sources have APIs. |

---

## Positioning Statement (Post-Pivot)

**For** side hustlers, flippers, and bargain hunters
**Who** waste hours checking Craigslist, FB Marketplace, OfferUp, estate sale sites, and garage sale listings individually
**Flip-ly is** the only deal discovery platform
**That** scans all local sources and uses AI to score every deal before you see it
**Unlike** SearchTempest (CL only), Facebook Marketplace (own listings only), or manual browsing (10+ hours/week)
**We** tell you what's worth your time, where it is, and why — across every source, in one place.

---

## The "Bloomberg Terminal for Local Deals" Analogy

Bloomberg didn't invent stocks. It aggregated data from every exchange, added analytics, and became indispensable to traders. The exchanges are still there. Bloomberg just made them usable.

We don't sell couches. We aggregate listings from every local source, add AI intelligence, and become indispensable to deal hunters. The marketplaces are still there. We just make them usable.
