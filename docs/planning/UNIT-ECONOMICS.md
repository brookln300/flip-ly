# Unit Economics — Real Numbers

**Created:** 2026-04-04
**Status:** LOCKED
**Last Verified:** 2026-04-04 (against actual code + service pricing pages)

---

## Scraping & AI Pipeline Costs (The Real Numbers)

This is the part that was underweighted in the first pass. The scraping pipeline has 3 cost layers.

### Layer 1: Data Fetching (Scraping)

| Source Type | Method | Cost Per Run | Uses AI? |
|---|---|---|---|
| Craigslist | `fetch()` to sapi.craigslist.org JSON API | **$0.00** | No — structured JSON |
| Eventbrite | `fetch()` HTML + LD+JSON parse | **$0.00** | No — structured data |
| AI Extract (local sites, city permits) | `fetch()` HTML → Haiku extracts listings | **$0.003-$0.01/page** | Yes |

Craigslist and Eventbrite are free fetches — they return structured data that doesn't need AI.
AI Extract sources (local sites, city permits, future OfferUp/FB) send raw HTML to Haiku for parsing.
Each AI extraction call: ~4,500 input tokens (15K char HTML truncated) + ~2,000 output tokens.

**Cost per AI Extract page:** ($4.5K × $1/M) + ($2K × $5/M) = $0.0045 + $0.01 = **~$0.015/page**

### Layer 2: AI Enrichment (Scoring Every New Listing)

Every new listing gets scored — regardless of source.
- Batched: 5 listings per Haiku call
- Per batch: ~800 input tokens + ~600 output tokens
- **Cost per batch:** ($800 × $1/M) + ($600 × $5/M) = $0.0008 + $0.003 = **~$0.004**
- **Cost per listing scored:** ~$0.0008
- Up to 200 pending listings processed per scrape run (40 batches max)

### Layer 3: Source Discovery (Hourly Cron)

- Runs every hour, uses Haiku to find new sources for markets
- Only fires when markets need more sources (not every hour)
- Estimated: ~5-10 discovery calls/day when active
- **Cost per discovery call:** ~$0.01
- **Daily discovery cost:** ~$0.05-$0.10

### Layer 4: Vercel Serverless Execution

Every cron job runs as a Vercel serverless function.
- Scrape cron: 6x/day × 300s max duration = up to 30 min/day
- Discovery cron: 24x/day × ~10s each = ~4 min/day
- Digest/drip/alerts/cleanup: ~5 min/day combined
- **Total:** ~40 min/day = ~20 hrs/month
- Vercel Pro includes 1,000 hrs/month — plenty of headroom
- **But:** Vercel charges per-invocation on Hobby. We're on Pro ($20/mo) already, so this is covered.

### Monthly Pipeline Cost Summary (Current Scale)

| Component | Frequency | Volume | Monthly Cost |
|-----------|-----------|--------|-------------|
| CL + EB scraping (free fetches) | 6x/day | ~12 sources × 6 × 30 | **$0.00** |
| AI Extract scraping | 6x/day | ~5 AI sources × 6 × 30 = 900 pages | **$13.50** |
| Listing enrichment | Per new listing | ~100 new/day × 30 = 3,000 listings | **$2.40** |
| Source discovery | Hourly | ~5-10 calls/day × 30 | **$2.25** |
| **Total pipeline cost** | | | **~$18/mo** |

### Pipeline Cost at Scale (Post-Pivot, More Sources)

| Scale | AI Extract Sources | Listings/Day | Monthly Pipeline Cost |
|-------|-------------------|-------------|---------------------|
| Current (3 source types) | 5 AI sources | ~100 | **$18/mo** |
| +OfferUp, +FB, +Mercari | 15 AI sources | ~500 | **$52/mo** |
| 10 source types, 20+ markets active | 40 AI sources | ~1,500 | **$135/mo** |
| Aggressive (50+ AI sources) | 50+ AI sources | ~3,000 | **$250/mo** |

### The Local PC Opportunity

Keith has a secondary PC that can run cron jobs. If heavy scraping and AI extraction runs locally:

| Offloaded to Local PC | Vercel Savings | Net Cost Change |
|----------------------|----------------|-----------------|
| AI Extract scraping | ~$0 (fetch is free, AI API cost stays) | API cost stays the same, but Vercel serverless time freed up |
| Enrichment batching | Same — API cost is Anthropic, not Vercel | Frees Vercel function hours |
| Source discovery | Same | Frees Vercel function hours |

**Key insight:** Moving crons to local PC doesn't save on AI API costs — those are Anthropic charges regardless of where the code runs. What it saves is Vercel serverless execution time and reduces risk of hitting function timeouts. The real play is **local PC as primary, Vercel as failover** — if the PC is down, Vercel crons kick in automatically.

---

## Cost Inputs (Verified)

### AI Scoring — Claude Haiku 4.5
- **Model:** `claude-haiku-4-5-20251001`
- **Pricing:** $1.00/M input tokens, $5.00/M output tokens
- **Per enrichment batch:** 5 listings per call, ~800 input tokens, ~600 output tokens
- **Cost per batch:** $0.0008 (input) + $0.003 (output) = **~$0.004 per 5 listings**
- **Cost per listing:** ~$0.0008
- **Source:** [enrich-listing.ts](../../app/lib/ai/enrich-listing.ts) — confirmed batch size of 5, maxTokens 2000

### Post-Pivot: Score Breakdown (New)
- Score breakdown requires a richer prompt — roughly 2x the output tokens
- **Cost per listing with breakdown:** ~$0.0015
- Only generated once per listing (stored as JSONB), served to all tiers from cache
- **Net impact:** Negligible. The breakdown is generated at scrape time, not per-user-request.

### Email — Resend
| Plan | Monthly Cost | Emails/Month | Cost Per Email |
|------|-------------|-------------|----------------|
| Free | $0 | 3,000 (100/day cap) | $0.00 |
| Pro ($20/mo) | $20 | 50,000 | $0.0004 |
| Business ($80/mo) | $80 | 200,000 | $0.0004 |

### Emails Per User Per Month (Current)

| Email Type | Free User | Pro User | Power User |
|-----------|-----------|----------|------------|
| Welcome drip (first 21 days only) | 7 total (amortized ~2.3/mo for 3 months, then 0) | Same | Same |
| Weekly digest | 4 | 4 | 4 |
| Daily digest | 0 | ~26 (weekdays) | ~26 |
| Instant alerts | 0 | 0 | ~15 (estimated, depends on saved searches) |
| **Monthly steady-state** | **4** | **30** | **45** |
| **First month** | **11** | **37** | **52** |

### Database — Supabase
| Plan | Monthly Cost | Storage | Bandwidth |
|------|-------------|---------|-----------|
| Free | $0 | 500MB | 2GB |
| Pro ($25/mo) | $25 | 8GB | 250GB |

**Current usage:** ~50MB storage, minimal bandwidth
**Growth driver:** `fliply_listings` table (grows with more sources) and `fliply_search_log` (grows with users)

**Storage math:**
- Each listing: ~500 bytes (with AI enrichment JSONB, ~800 bytes)
- 1,000 listings/day × 800 bytes × 30 days = ~24MB/month of new listing data
- Each search log row: ~100 bytes  
- 500 users × 10 searches/day × 100 bytes × 30 days = ~15MB/month
- **500MB free tier breaks at:** ~6-8 months of operation with 500+ users
- With listing rotation (archive listings older than 90 days), storage stays manageable longer

### Hosting — Vercel
| Plan | Monthly Cost | Serverless Hours | Bandwidth |
|------|-------------|-----------------|-----------|
| Hobby (Free) | $0 | 100hrs | 100GB |
| Pro ($20/mo) | $20 | 1,000hrs | 1TB |

**Currently on:** Pro ($20/mo) — needed for 300s function timeout on scraper crons

### Payments — Stripe
- **Per transaction:** 2.9% + $0.30
- **On $5/mo (founding Pro):** You keep $4.56 → Stripe takes $0.44 (8.8%)
- **On $9/mo (regular Pro):** You keep $8.44 → Stripe takes $0.56 (6.2%)
- **On $19/mo (founding Power):** You keep $18.15 → Stripe takes $0.85 (4.5%)
- **On $29/mo (regular Power):** You keep $27.86 → Stripe takes $1.14 (3.9%)

### Domain
- flip-ly.net: ~$12/year = $1/month

---

## Fixed Costs (Regardless of Users)

| Item | Monthly Cost | Notes |
|------|-------------|-------|
| Vercel Pro | $20 | Required for scraper timeout |
| Domain | $1 | flip-ly.net |
| AI pipeline (current) | $18 | Scraping + enrichment + discovery (see above) |
| **Total fixed (current)** | **$39/mo** | |
| **Total fixed (post-pivot, more sources)** | **$73/mo** | With OfferUp + FB + Mercari added |
| **Total fixed (aggressive scale)** | **$271/mo** | 50+ AI sources, 3K listings/day |

**Supabase and Resend stay free until thresholds below.**

**Critical realization:** The AI pipeline cost ($18-250/mo) is a FIXED cost, not per-user. Whether 10 users or 10,000 users view those scored listings, the scraping and enrichment cost is the same. This is the structural advantage of the model — costs scale with SOURCES, not USERS.

---

## Variable Costs Per User Per Month (Steady State)

### Free User

| Cost Item | Calculation | Monthly Cost |
|-----------|------------|-------------|
| AI scoring | $0 — scoring happens at scrape time, shared across all users | $0.00 |
| Weekly digest | 4 emails × $0.0004 | $0.002 |
| Search API calls | 15/day max × serverless compute | ~$0.00 (negligible) |
| DB reads | Search queries + listing views | ~$0.00 (within free tier) |
| **Total per free user** | | **~$0.002/mo** |

Free users are essentially free to serve. The cost rounds to zero.

### Pro User ($9/mo regular, $5/mo founding)

| Cost Item | Calculation | Monthly Cost |
|-----------|------------|-------------|
| Weekly digest | 4 emails | $0.002 |
| Daily digest | 26 emails | $0.010 |
| Stripe fee ($9) | 2.9% + $0.30 | $0.56 |
| Stripe fee ($5 founding) | 2.9% + $0.30 | $0.44 |
| Incremental AI (breakdown serving) | $0 — served from cache | $0.00 |
| **Total per Pro user (regular)** | | **$0.57** |
| **Total per Pro user (founding)** | | **$0.45** |

### Power User ($29/mo regular, $19/mo founding)

| Cost Item | Calculation | Monthly Cost |
|-----------|------------|-------------|
| Weekly digest | 4 emails | $0.002 |
| Daily digest | 26 emails | $0.010 |
| Instant alerts | ~15 emails | $0.006 |
| Stripe fee ($29) | 2.9% + $0.30 | $1.14 |
| Stripe fee ($19 founding) | 2.9% + $0.30 | $0.85 |
| Multi-market scrape load | More listings to score for wider coverage | ~$0.01 |
| **Total per Power user (regular)** | | **$1.17** |
| **Total per Power user (founding)** | | **$0.88** |

---

## Margin Analysis Per Tier

| Tier | Revenue | Variable Cost | Gross Margin | Margin % |
|------|---------|--------------|-------------|----------|
| Free | $0 | $0.002 | -$0.002 | N/A (acquisition cost) |
| Pro (founding $5) | $5.00 | $0.45 | **$4.55** | **91%** |
| Pro (regular $9) | $9.00 | $0.57 | **$8.43** | **94%** |
| Power (founding $19) | $19.00 | $0.88 | **$18.12** | **95%** |
| Power (regular $29) | $29.00 | $1.17 | **$27.83** | **96%** |

**Key insight:** Margins are exceptionally high because the expensive work (AI scoring, scraping) happens once per listing, not once per user. 100 users viewing the same scored listing costs the same as 1 user viewing it. The marginal cost of adding a user is almost entirely Stripe fees + email sends.

---

## Infrastructure Threshold Triggers

| Threshold | What Breaks | Upgrade Cost | When It Hits |
|-----------|------------|-------------|-------------|
| ~250 users | Resend free tier (3,000 emails/mo) | +$20/mo | Pro users at 30 emails/mo = 100 Pro users max on free Resend |
| ~500 users | Supabase storage approaches 500MB | +$25/mo | Depends on listing volume + search log growth |
| ~2,000 users | Resend Pro tier (50,000 emails/mo) | +$60/mo (upgrade to Business) | Power users with instant alerts push email volume |
| ~5,000 users | Vercel bandwidth | Already on Pro | Likely fine up to 50K+ monthly visitors |

---

## Breakeven Analysis (Corrected)

### Current fixed costs ($39/mo — Vercel + domain + current AI pipeline)

| Scenario | Users Needed |
|----------|-------------|
| Pro founding only ($5) | 9 subscribers |
| Pro regular only ($9) | 5 subscribers |
| Power founding only ($19) | 3 subscribers |
| Power regular only ($29) | 2 subscribers |
| Blended (5 Pro founding + 1 Power founding) | $25 + $19 = $44 → covered |

### Post-pivot fixed costs ($93/mo — more sources + Resend upgrade)

| Scenario | Users Needed |
|----------|-------------|
| Pro founding only | 21 subscribers |
| Pro regular only | 11 subscribers |
| Power founding only | 5 subscribers |
| Blended (10 Pro founding + 3 Power founding) | $50 + $57 = $107 → covered |

### Full scale fixed costs ($261/mo — all infra upgrades)

| Scenario | Users Needed |
|----------|-------------|
| Pro founding only | 58 subscribers |
| Blended (20 Pro + 5 Power at regular pricing) | $180 + $145 = $325 → covered |

**Bottom line:** Even with corrected pipeline costs, this business breaks even with ~20-25 blended paid subscribers. The AI pipeline is the biggest new cost ($18-250/mo depending on source count) but it's FIXED — it doesn't grow with users. Once you cover it, every new subscriber is nearly pure margin.**

**The local PC play:** If heavy AI Extract scraping runs on Keith's local machine instead of Vercel serverless, the pipeline cost stays the same (Anthropic API charges don't change) but Vercel serverless hours are freed up and timeout risk is eliminated. The real savings come from being able to run longer, more thorough scrapes without the 300s Vercel function limit.

---

## Revenue Scenarios at Scale (Corrected for Pipeline Costs)

### 500 Users (6-month target)

| | Count | Revenue | Variable Cost | Gross |
|---|---|---|---|---|
| Free | 375 (75%) | $0 | $0.75 | -$0.75 |
| Pro (mix founding + regular) | 100 (20%) | $700 | $51 | $649 |
| Power (mix) | 25 (5%) | $575 | $24 | $551 |
| **Subtotal** | **500** | **$1,275/mo** | **$76** | **$1,199/mo** |

| Fixed Cost | Amount |
|-----------|--------|
| Vercel Pro | $20 |
| Domain | $1 |
| AI pipeline (post-pivot, ~15 AI sources) | $52 |
| Resend upgrade (needed at 250+ users) | $20 |
| **Total fixed** | **$93/mo** |

| **Net profit** | **$1,106/mo ($13.3K/yr)** |
|---|---|

### 2,000 Users (12-month target)

| | Count | Revenue | Variable Cost | Gross |
|---|---|---|---|---|
| Free | 1,400 (70%) | $0 | $2.80 | -$2.80 |
| Pro | 400 (20%) | $3,200 | $220 | $2,980 |
| Power | 200 (10%) | $5,200 | $220 | $4,980 |
| **Subtotal** | **2,000** | **$8,400/mo** | **$443** | **$7,957/mo** |

| Fixed Cost | Amount |
|-----------|--------|
| Vercel Pro | $20 |
| Domain | $1 |
| AI pipeline (scaled, ~40 AI sources) | $135 |
| Supabase Pro | $25 |
| Resend Business | $80 |
| **Total fixed** | **$261/mo** |

| **Net profit** | **$7,696/mo ($92K/yr)** |
|---|---|

### 10,000 Users (18-month aggressive)

| | Count | Revenue | Variable Cost | Gross |
|---|---|---|---|---|
| Free | 7,000 | $0 | $14 | -$14 |
| Pro | 2,000 | $16,000 | $1,100 | $14,900 |
| Power | 1,000 | $26,000 | $1,100 | $24,900 |
| **Subtotal** | **10,000** | **$42,000/mo** | **$2,214** | **$39,786/mo** |

| Fixed Cost | Amount |
|-----------|--------|
| Vercel Pro | $20 |
| Domain | $1 |
| AI pipeline (aggressive, 50+ AI sources) | $250 |
| Supabase Pro | $25 |
| Resend Business | $80 |
| **Total fixed** | **$376/mo** |

| **Net profit** | **$39,410/mo ($473K/yr)** |
|---|---|

---

## Critical Takeaways

1. **Margins are 91-96%.** This is a software business with near-zero marginal cost. The AI scoring happens once per listing and is served from cache. Email is the only real per-user cost.

2. **Stripe fees are the largest variable cost.** At every tier, Stripe's cut ($0.44-$1.14) dwarfs all other per-user costs combined. There's no way around this short of annual billing (one transaction instead of 12).

3. **Power tier is where the money lives.** At the 2,000-user scenario, Power generates $5,200/mo from 200 users vs Pro's $3,200 from 400 users. Half the users, 60% more revenue. Every feature decision should nudge toward Power.

4. **Free users cost almost nothing.** Don't be afraid of a generous free tier (15 searches, 1 market). The cost is $0.002/user/month. The conversion opportunity is worth 1000x that.

5. **Annual billing would significantly improve margins.** One Stripe transaction per year instead of 12 saves ~$3-$12 per user per year. Worth adding once we have churn data.

6. **The AI pipeline ($18-250/mo) is the new largest fixed cost.** Scales with number of SOURCES, not users. Every new AI Extract source adds ~$2.70/mo (6x/day × 30 days × $0.015/page). Add sources deliberately.

7. **Local PC as primary scraper eliminates Vercel timeout risk**, not API costs. The Anthropic bill is the same regardless of where the code runs. But local PC can run 10-minute scrapes that would timeout on Vercel's 300s limit.

---

## Decisions Locked

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | Free users cost ~$0/mo to serve | Don't restrict free tier out of cost fear. Restrict for conversion value. |
| 2 | Stripe fees are the primary cost driver | Look into annual billing once churn is understood. |
| 3 | AI scoring is NOT a per-user cost | One enrichment serves all users. This is our structural advantage. |
| 4 | Resend upgrade at ~250 users ($20/mo) | First real cost threshold. Plan for it, don't panic. |
| 5 | Power tier produces the most profit per user | Feature roadmap should prioritize Power-tier differentiators. |
