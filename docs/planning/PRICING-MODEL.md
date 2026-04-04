# Pricing Model — Locked

**Created:** 2026-04-04
**Status:** LOCKED
**Decision Authority:** Keith (founder)

---

## Tier Structure

| | **Free** | **Pro** | **Power** |
|---|---|---|---|
| **Regular Price** | $0 | $9/mo | $29/mo |
| **Founding Price** | $0 | $5/mo for life | $19/mo for life |
| **Founding Window** | — | 14 days from relaunch | 14 days from relaunch |
| **Target User** | Casual browser, tire-kicker | Weekend deal hunter, side hustler | Serious reseller, eBay powerhouse |

---

## Feature Matrix

### Search & Discovery

| Feature | Free | Pro | Power |
|---------|------|-----|-------|
| Daily searches | 15 | Unlimited | Unlimited |
| Markets | 1 (signup market) | 3 (metro cluster) | Unlimited |
| Source links | Locked | Direct links | Direct links |
| Quick search tags | Yes | Yes | Yes |
| Saved searches | None | 3 | Unlimited |

### AI Scoring

| Feature | Free | Pro | Power |
|---------|------|-----|-------|
| Score visible | Number only (e.g. "8.7/10") | Full score | Full score |
| Score breakdown | Teaser line ("Upgrade to see why") | Full breakdown (price analysis, motivation signals, brand detection, condition assessment) | Full breakdown |
| Category trends | None | None | Yes — "this item type averages $X in your market" |
| Score history | None | None | 90-day score trends by category |

### Digest & Alerts

| Feature | Free | Pro | Power |
|---------|------|-----|-------|
| Weekly digest | Thursday noon | Thursday 6AM (6hrs early) | Thursday 6AM |
| Daily digest | None | Yes | Yes |
| Instant deal alerts | None | None | Email alert when saved search matches |
| Alert customization | None | None | Set score threshold, price range, category filters |

### Data & History

| Feature | Free | Pro | Power |
|---------|------|-----|-------|
| Deal history | 7 days | 30 days | 90 days |
| Listing detail | Title + source type | Title + source + city + description | Everything + price trends |

### Account

| Feature | Free | Pro | Power |
|---------|------|-----|-------|
| Founding member badge | No | Yes (if founding window) | Yes (if founding window) |
| Priority support | No | Email | Email + direct |

---

## Founding Member Program

**Duration:** 14 days from relaunch date (TBD)
**Mechanic:** Simple day counter on pricing page. No flashy countdown. Just: "Founding pricing ends in X days."
**Lock:** Founding members keep their price for life. Stored as `is_founding_member: true` in users table.
**Badge:** Small "Founding Member" indicator on dashboard. Subtle. Makes them feel invested.
**After window closes:** New signups see $9/$29. Founding members unaffected.

### DB Changes Required
```sql
ALTER TABLE users ADD COLUMN is_founding_member BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN founding_member_at TIMESTAMPTZ;
```

### Stripe Changes Required
- Create new Price IDs:
  - `pro_founding` — $5/mo recurring
  - `pro_regular` — $9/mo recurring  
  - `power_founding` — $19/mo recurring
  - `power_regular` — $29/mo recurring
- Founding members stay on their Price ID forever (Stripe handles this natively — price changes only affect new subscribers)

---

## Market Gating Logic

### How Markets Work

**Free (1 market):**
- User picks their market at signup (already implemented)
- All searches and digests scoped to that market only
- Can change market once per 30 days (prevents gaming)

**Pro (3 markets — metro cluster):**
- Primary market (signup market) + 2 additional
- UI: "Add nearby markets" with auto-suggestions based on geography
- Example: Dallas user sees "Also scan Fort Worth? Denton? McKinney?"
- Markets must be within same state or bordering state (no Dallas + Seattle)

**Power (unlimited):**
- All 413 markets available
- No restrictions
- Digest and alerts cover all selected markets

### Implementation Notes
```sql
-- New table or add to users
ALTER TABLE users ADD COLUMN additional_markets TEXT[]; -- array of market IDs
-- Pro: max 2 additional (3 total with primary)
-- Power: unlimited
```

Saved searches and digest generation already filter by market. This is a gating layer on top, not a schema rebuild.

---

## AI Score Breakdown — How It Works

This is the core value prop. The score must feel honest and explainable.

### Scoring Factors (All Tiers See the Number)

| Factor | Weight | What It Measures |
|--------|--------|-----------------|
| Price anomaly | 30% | Is this priced significantly below category average for this market? |
| Motivation signals | 20% | "Moving," "must go," "downsizing," "estate" — language that signals urgency/below-market pricing |
| Brand/item detection | 20% | Recognized brand names, model numbers, known high-value categories |
| Listing quality | 15% | Photo count, description length, specificity (detailed = more trustworthy) |
| Freshness | 15% | How recently posted. Older listings = likely picked over. |

### What Each Tier Sees

**Free:** `8.7/10` + "High flip potential — upgrade to see the full breakdown"

**Pro:** 
```
8.7/10 — High flip potential
- Price: 62% below avg for "stand mixers" in DFW ($45 vs $120 avg)
- Motivation: Seller says "moving next week" — urgency signal
- Brand: KitchenAid Artisan detected — strong resale demand
- Photos: 4 photos, good condition visible
- Posted: 2 hours ago — still available
```

**Power:** Everything Pro sees + category context:
```
Category insight: Stand mixers in DFW sell for $80-150 on FB Marketplace.
This listing at $45 has ~$55-105 profit potential.
Similar items scored 7+ have sold within 48 hours (last 90 days).
```

### Implementation Approach
- Claude Haiku already generates scores. Current prompt needs to be restructured to output structured JSON with factor breakdown, not just a number.
- Store breakdown in `fliply_listings` as a JSONB column: `ai_score_breakdown`
- Frontend renders based on tier gating
- Category trends (Power tier) require aggregation queries — build as a separate background job

---

## Conversion Strategy

### Free → Pro Triggers
1. **Search limit hit** — "You've used 15/15 searches today. Pro = unlimited."
2. **Score teaser** — Every locked breakdown is a mini-ad for Pro.
3. **Source link gating** — "This deal scored 9.1. See the listing → Pro only."
4. **Daily digest sample** — After 2 weeks on free, send ONE daily digest as a taste. Then: "Want this every day? $5/mo founding price."
5. **Saved search prompt** — When user searches the same thing 3x: "Save this search and get alerts? Pro feature."

### Pro → Power Triggers
1. **Market limit hit** — "You're searching McKinney but it's outside your 3 markets. Add unlimited markets with Power."
2. **Category trends teaser** — "This item is 40% below market avg. Want to see trends? Power feature."
3. **Instant alert value** — "This deal scored 9.3 and was posted 12 minutes ago. Power members get instant alerts."
4. **Deal history** — "Your 30-day history expires tomorrow. Power keeps 90 days."

---

## Pricing Page Design Direction

- 3-column layout (Free | Pro | Power)
- Pro column highlighted as "Most Popular" (even before it is — social proof framing)
- Founding price shown with strikethrough on regular: ~~$9/mo~~ **$5/mo for life**
- Simple day counter below pricing cards: "Founding pricing ends in X days"
- Feature comparison table below cards (expandable on mobile)
- No annual pricing at launch (keep it simple, add later based on data)

---

## Revenue Projections (Post-Pivot)

### Conservative (low conversion, high churn)
| Month | Free Users | Pro ($5 founding / $9 regular) | Power ($19/$29) | MRR |
|-------|-----------|-------------------------------|-----------------|-----|
| 1 | 100 | 10 × $5 = $50 | 2 × $19 = $38 | $88 |
| 3 | 300 | 30 × $5 + 10 × $9 = $240 | 5 × $19 + 2 × $29 = $153 | $393 |
| 6 | 600 | 40 × $5 + 30 × $9 = $470 | 8 × $19 + 8 × $29 = $384 | $854 |
| 12 | 1,200 | 50 × $5 + 80 × $9 = $970 | 10 × $19 + 25 × $29 = $915 | $1,885 |

### Baseline (expected)
| Month | Free Users | Pro | Power | MRR |
|-------|-----------|-----|-------|-----|
| 1 | 200 | $100 | $76 | $176 |
| 3 | 600 | $520 | $325 | $845 |
| 6 | 1,500 | $1,200 | $900 | $2,100 |
| 12 | 3,000 | $2,500 | $2,200 | $4,700 |

### Aggressive (viral + referral loop)
| Month | Free Users | Pro | Power | MRR |
|-------|-----------|-----|-------|-----|
| 12 | 10,000 | $8,000 | $7,000 | $15,000 |

**Breakeven (covers all infra costs at scale):** ~15 Pro subscribers OR ~5 Power subscribers.

---

## Decisions Locked in This Document

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | 3 tiers: Free / Pro / Power | 2 tiers leaves money on the table. 3 tiers = clear upgrade path. |
| 2 | $0 / $9 / $29 regular pricing | $9 = impulse buy for side hustlers. $29 = serious tool for serious resellers. Both validated by marketing research. |
| 3 | Founding member program at $5 / $19 for 14 days | Creates urgency, builds initial subscriber base, rewards early believers. |
| 4 | Market gating (1 / 3 / unlimited) | Most natural upsell lever. Flippers want coverage. Metro-cluster approach is honest. |
| 5 | AI score visible to all, breakdown gated | Score hooks them. Breakdown converts them. Honest — you see the number, you pay for the "why." |
| 6 | No annual pricing at launch | Keep it simple. Add annual option once we have churn data to model the discount. |
| 7 | Founding members tracked with DB flag + badge | Low cost, high loyalty. They become evangelists. |
