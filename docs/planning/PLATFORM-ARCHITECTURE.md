# Platform Architecture — The Full Vision

**Created:** 2026-04-04
**Status:** Draft — review over coffee, build tonight
**Purpose:** This is the blueprint for Flip-ly as a PLATFORM, not a landing page with a search bar.

---

## The Mental Model

Think of Flip-ly as three layers:

```
┌─────────────────────────────────────────────────┐
│  MARKETING LAYER (convince)                      │
│  Landing page, pricing, about, social proof      │
│  Goal: visitor → signup                          │
├─────────────────────────────────────────────────┤
│  PRODUCT LAYER (deliver)                         │
│  Dashboard, search, deal feed, alerts, scores    │
│  Goal: free user → engaged user → paying user    │
├─────────────────────────────────────────────────┤
│  ENGINE LAYER (power)                            │
│  Scrapers, AI scoring, digests, cron jobs        │
│  Goal: data in → intelligence out                │
└─────────────────────────────────────────────────┘
```

Right now everything lives on one page (`page.tsx`) — marketing AND product mashed together. The landing page IS the dashboard IS the search tool. That worked for an MVP. It doesn't work for a platform.

---

## Sitemap — Every Page, Its Purpose, Who Sees It

### Public (Marketing Layer)

| Route | Purpose | Key Elements |
|-------|---------|-------------|
| `/` | **Home** — The pitch. Convert visitors to signups. | Hero, value props, live demo search, social proof, pricing, CTAs |
| `/pricing` | **Pricing** — Dedicated pricing page with full feature comparison | 3-tier cards, founding countdown, feature matrix, FAQ |
| `/about` | **About** — Who we are, why this exists | Story, team, mission — rewrite for deal discovery positioning |
| `/how-it-works` | **How It Works** — Deeper explanation with visuals | Step-by-step: sources → AI → you. Show the pipeline. |
| `/for/flippers` | **For Flippers** — Targeted landing page | Speak directly to resellers. ROI framing. "Find $500/week in deals." |
| `/for/bargain-hunters` | **For Bargain Hunters** — Targeted landing page | Speak to casual deal finders. Savings framing. "Stop overpaying." |
| `/blog` | **Blog / Dev Diary** — SEO + thought leadership | Deal-finding tips, market reports, platform updates |
| `/privacy` | Privacy Policy | Keep as-is |
| `/terms` | Terms of Service | Keep as-is |
| `/data-deletion` | Data Deletion | Keep as-is |

### Authenticated (Product Layer)

| Route | Purpose | Who Sees What |
|-------|---------|--------------|
| `/dashboard` | **Home base** — personalized deal feed + account overview | Free: basic feed, score numbers only. Pro: full scores, daily digest toggle. Power: everything + alerts config. |
| `/search` | **Full search experience** — not a section on the landing page | All tiers but gated: search limits, score details, source links |
| `/deals/[id]` | **Deal detail page** — full breakdown of a single listing | Free: partial. Pro: full breakdown. Power: full + category context + price trends. |
| `/alerts` | **Saved searches & alert management** | Pro: 3 saved searches. Power: unlimited + instant alert config. |
| `/markets` | **Market management** — add/remove markets | Free: view only (1 market). Pro: manage 3. Power: unlimited. |
| `/account` | **Account settings** — plan, billing, preferences | Plan management, upgrade/downgrade, digest preferences, notification settings |
| `/upgrade` | **Upgrade flow** — clear path from current tier to next | Contextual: shows what they're missing based on their usage patterns |

### Supporting

| Route | Purpose | Notes |
|-------|---------|-------|
| `/lobster-hunt` | Easter egg ARG | Keep — it's brand personality |
| `/links` | Social bio linktree | Update for new positioning |
| `/contest-rules` | Contest legal | Keep |
| `/garage-sales` | Google Ads landing | Rework — still valid keyword, redirect to broader value prop |

---

## User Journeys — How Each Persona Moves Through the Platform

### Journey 1: The Curious Visitor → Free User

```
Google "find deals near me"
    ↓
Landing page (/)
    ↓
Sees hero: "Find underpriced stuff near you before anyone else"
    ↓
Tries live search (no signup required, 3 preview results)
    ↓
Sees scored listings — "8.7/10" — intrigued but breakdown locked
    ↓
Signs up free to unlock 15 searches/day
    ↓
Dashboard — personal deal feed for their market
    ↓
Thursday: first digest email arrives
    ↓
Day 3: drip email with "here's what you missed" (deals they would have found with Pro)
    ↓
Day 7: hits a gate (search limit, score breakdown, market limit)
    ↓
Upgrade prompt → Pro at $5 founding / $9 regular
```

### Journey 2: The Side Hustler → Pro User

```
Sees TikTok about flipping / Google Ads "flip garage sales"
    ↓
Landing page or /for/flippers
    ↓
Reads ROI framing: "Pro members find avg $200/week in deals"
    ↓
Signs up → immediately tries search
    ↓
Sees AI scores with full breakdown — "this KitchenAid is 62% below market"
    ↓
Saves 2-3 searches (tools, furniture, electronics)
    ↓
Daily digest arrives next morning — 15 new deals, scored
    ↓
Goes to 2 estate sales Saturday, nets $180
    ↓
Sees they can only scan 3 markets. Wants to add McKinney.
    ↓
Upgrade prompt → Power at $19 founding / $29 regular
```

### Journey 3: The Power User → Evangelist

```
Upgrades to Power for unlimited markets + instant alerts
    ↓
Sets up 8 saved searches across 5 markets
    ↓
Gets instant alert: "9.1/10 — Snap-On tool set, $40, posted 6 min ago"
    ↓
Drives 20 min, buys it, lists on eBay for $380
    ↓
Category trends show them: "Tool sets in DFW averaging $15-60 at source, $200-400 resale"
    ↓
They're making $800/week from deals Flip-ly finds
    ↓
Tells 3 friends → referral program → they sign up as Pro
    ↓
Power user becomes an evangelist because the platform literally makes them money
```

---

## Landing Page Architecture (The Rework)

This is the section-by-section blueprint for `/`.

### Section 1: Hero
**Layout:** Full-width, split — left copy, right product mockup
**Background:** Deep black (#000) to dark gradient

| Element | Content Direction |
|---------|-------------------|
| **Badge** | Small pill above headline: "AI-Powered Deal Discovery" or "Scan 20+ sources in seconds" |
| **Headline** | "Find deals worth flipping — before anyone else." |
| **Subheadline** | "We scan Craigslist, OfferUp, estate sales, and 20+ local sources. AI scores every listing. You get the ones worth your time." |
| **Primary CTA** | "Start Finding Deals — Free" (green, prominent) |
| **Secondary CTA** | "See How It Works" (ghost button, scrolls to demo) |
| **Trust line** | "Free forever · No credit card · 15 searches/day" |
| **Right side** | Product mockup — dashboard showing scored deals with breakdown visible. NOT a video — a static screenshot or animated GIF of the score breakdown popping in. The score IS the hero. |

### Section 2: Social Proof Bar (Slim)
**Layout:** Single row, centered, subtle

```
20+ Sources Scanned  ·  1,200+ Deals Scored  ·  413 US Markets  ·  Updated Daily
```

Followed by source logos (same SVG trust bar — CL, Eventbrite, FB, EstateSales, + 20 more).

### Section 3: Live Demo Search
**Layout:** Full-width dark section with search bar
**Title:** "Try it now — no signup required"
**Behavior:** Anonymous visitors get 3 preview results (scores visible, breakdowns + links locked). Results show the AI score prominently. Every result is a mini-ad for signing up.
**Gate message after 3 results:** "Sign up free for 15 searches/day and full results."

This is the HOOK. Let them experience the product before asking for anything.

### Section 4: How the AI Works (Value Props)
**Layout:** 3-column cards → but reframed around the AI, not the process
**Title:** "Your AI deal analyst"

| Card | Title | Description |
|------|-------|-------------|
| 1 | **Scans Everything** | "We pull from Craigslist, estate sales, auctions, OfferUp, and 20+ sources in your area. Every 4 hours. You never check another app." |
| 2 | **Scores Every Deal** | "Our AI evaluates price vs. market value, seller motivation, brand recognition, and listing quality. You see the score. We show you why." |
| 3 | **Delivers What Matters** | "Daily digest with the best deals. Instant alerts for 9+ scores. Saved searches that run while you sleep. The deals come to you." |

### Section 5: Score Breakdown Showcase
**Layout:** Full-width, centered — a single deal card blown up large
**Title:** "See what the AI sees"
**Content:** A realistic-looking deal with the full score breakdown visible:

```
┌────────────────────────────────────────────────────┐
│  KitchenAid Artisan Stand Mixer — $45              │
│  ★ 8.7/10 — High flip potential                    │
│  ────────────────────────────────────               │
│  Price:  62% below avg for stand mixers in DFW     │
│  Signal: Seller says "moving next week" — urgency  │
│  Brand:  KitchenAid Artisan — strong resale demand │
│  Photos: 4 photos, good condition visible           │
│  Posted: 2 hours ago — likely still available       │
│  ────────────────────────────────────               │
│  💡 Similar items sell for $120-180 on Marketplace  │
│  Estimated profit: $75-135                          │
└────────────────────────────────────────────────────┘
```

This section SELLS the product. It's the thing no one else has. Make it unmissable.

### Section 6: Featured Deals (Live Data)
**Layout:** Same as current — deal feed from real DB data
**Title:** "[Market Name] Deals Right Now"
**Change:** Show AI scores more prominently. Add "Pro" and "Power" feature teasers inline.

### Section 7: Who It's For
**Layout:** 3-column cards or alternating rows
**Title:** "Built for people who find things worth more than their asking price"

| Persona | Headline | One-liner |
|---------|----------|-----------|
| **Weekend Flipper** | "Find $200 weekends" | "Saturday morning estate sales, scored and sorted. Know where to go before you leave the house." |
| **Side Hustle Builder** | "Source inventory smarter" | "Stop scrolling 6 apps. One dashboard, every deal, scored by AI. Build your resale business on intelligence." |
| **Bargain Hunter** | "Never overpay again" | "Furnishing a house? Hunting vintage? Our AI tells you when the price is right — across every local source." |

### Section 8: Testimonials
**Layout:** Keep the 2-col grid we just built
**Content:** Rewrite the 6 testimonials for deal discovery positioning (not garage sales)

### Section 9: Pricing
**Layout:** 3-column cards (Free / Pro highlighted / Power)
**New elements:**
- Founding member countdown: "Founding pricing ends in X days"
- Feature comparison matrix below cards (expandable)
- "Most Popular" badge on Pro
- Strikethrough regular price: ~~$9/mo~~ **$5/mo for life**

### Section 10: Final CTA
**Layout:** Full-width, centered
**Title:** "Every deal in your area. Scored before you see it."
**CTA:** "Start Finding Deals — Free"
**Trust:** "Join [X] deal hunters already using Flip-ly"

### Section 11: Footer
**Layout:** Keep current 4-column grid
**Updates:** 
- Change tagline from "AetherCoreAI" to something user-facing
- Add category links (Tools, Furniture, Electronics, Vintage, Free Stuff)
- Keep the lobster pixel

---

## Visual Direction

### Current vs. Target

| Element | Current | Target |
|---------|---------|--------|
| **Overall feel** | Dark SaaS landing page | Dark SaaS PLATFORM — feels like logging into a tool, not reading a brochure |
| **Hero energy** | "Come check this out" | "This is a weapon. You should have it." |
| **Color use** | Green (#22C55E) for everything | Green for primary CTAs, amber/orange (#F59E0B) for deal scores, blue (#3B82F6) for informational, keep hierarchy tight |
| **Typography** | system-ui throughout | Same family but tighter hierarchy — hero headline LARGE, section heads medium, body small. More contrast between levels. |
| **Data density** | Low — lots of whitespace | Medium — the product IS data. Show more of it. The score breakdown, the deal feed, the search results should feel rich, not sparse. |
| **Mobile** | Functional but afterthought | Mobile-first for the product layer. People search for deals on their phone in the car. |

### Color System (Expanded)

| Color | Hex | Usage |
|-------|-----|-------|
| Background (primary) | `#000000` | Hero, header, pricing |
| Background (alt) | `#0a0a0a` | Alternating sections |
| Surface | `#111111` | Cards, inputs, modals |
| Border | `#1a1a1a` | Subtle card borders |
| Border (hover) | `#333333` | Active states |
| Text (primary) | `#FFFFFF` | Headlines |
| Text (secondary) | `#CCCCCC` | Body copy |
| Text (muted) | `#888888` | Labels, metadata |
| Text (dim) | `#555555` | Timestamps, fine print |
| **Green (CTA)** | `#22C55E` | Primary buttons, "go" signals |
| **Amber (Scores)** | `#F59E0B` | Deal scores, price highlights, "attention" |
| **Orange (Hot)** | `#FF6600` | HOT badges, urgency signals |
| **Blue (Info)** | `#3B82F6` | Links, informational badges, Pro features |
| **Purple (Power)** | `#A78BFA` | Power tier accent, premium features |
| **Red (Alert)** | `#EF4444` | Limits, errors, warnings |

### Score Color Scale

| Score | Color | Meaning |
|-------|-------|---------|
| 9-10 | `#22C55E` (green) | Treasure — go NOW |
| 7-8 | `#F59E0B` (amber) | Good deal — worth the trip |
| 5-6 | `#888888` (gray) | Average — if you're nearby |
| 1-4 | `#555555` (dim) | Skip |

---

## Dashboard Vision (Post-Pivot)

The dashboard is where users LIVE. It's not a profile page — it's a deal command center.

### Layout

```
┌──────────────────────────────────────────────────────────┐
│  HEADER (same as landing — sticky, blurred)               │
├──────────────┬───────────────────────────────────────────┤
│  SIDEBAR     │  MAIN CONTENT                             │
│              │                                           │
│  My Markets  │  ┌─────────────────────────────────────┐  │
│  · DFW ✓    │  │  DEAL FEED (scrollable)              │  │
│  · Fort W.  │  │  ┌──────────────────────────────┐    │  │
│  + Add       │  │  │ 8.7 │ KitchenAid $45  [HOT] │    │  │
│              │  │  │     │ DFW · Craigslist       │    │  │
│  Saved       │  │  └──────────────────────────────┘    │  │
│  Searches    │  │  ┌──────────────────────────────┐    │  │
│  · tools     │  │  │ 7.2 │ Vintage desk $30       │    │  │
│  · vintage   │  │  │     │ McKinney · Estate Sale  │    │  │
│  + Add (Pro) │  │  └──────────────────────────────┘    │  │
│              │  │  ...                                  │  │
│  Quick Stats │  └─────────────────────────────────────┘  │
│  12 new      │                                           │
│  3 hot       │  ┌─────────────────────────────────────┐  │
│  $240 est.   │  │  DIGEST PREVIEW                      │  │
│              │  │  "Your Thursday digest is ready"      │  │
│  [Upgrade]   │  └─────────────────────────────────────┘  │
├──────────────┴───────────────────────────────────────────┤
│  BOTTOM: Source coverage bar — "Scanning 8 sources in DFW" │
└──────────────────────────────────────────────────────────┘
```

**Mobile:** Sidebar collapses to bottom nav or hamburger. Feed is full-width.

### Key Dashboard Elements

| Element | Free | Pro | Power |
|---------|------|-----|-------|
| Deal feed | Last 7 days, scores visible (no breakdown) | 30 days, full breakdown on tap | 90 days, breakdown + trends |
| Sidebar: Markets | 1 market, greyed "Add" button | 3 markets, "Add" up to limit | Unlimited, "Add" always available |
| Sidebar: Saved Searches | Locked with upgrade prompt | 3 slots | Unlimited |
| Quick Stats | Basic (new deals count) | + hot deal count + estimated savings | + profit estimates + trend arrows |
| Source coverage | Show sources | Show sources + last scraped time | Show sources + health status |

---

## Page-by-Page Priority for Rework

| Priority | Page | Effort | Why |
|----------|------|--------|-----|
| **1** | `/` (Landing) | 3-4 hours | First impression. Must sell the new positioning. |
| **2** | `/pricing` (New) | 1-2 hours | Dedicated page with full feature matrix + founding countdown |
| **3** | `/dashboard` | 2-3 hours | Where users live. Needs to feel like a tool, not a page. |
| **4** | `/search` (Extract from landing) | 1-2 hours | Make search its own full-page experience |
| **5** | `/for/flippers` | 1 hour | Targeted landing for ads + organic |
| **6** | `/about` | 30 min | Rewrite copy for new positioning |
| **7** | `/how-it-works` | 1 hour | Deeper explainer with visuals |
| **8** | Everything else | As needed | Update copy, links, meta tags |

**Total estimated effort:** 10-14 hours across multiple sessions

---

## What to Think About Over Coffee

1. **The hero headline.** "Find deals worth flipping — before anyone else" is my draft. But you know your audience better. Does it land? Is "flipping" too niche? Something broader like "Find things worth more than their asking price"?

2. **The score breakdown showcase (Section 5).** This is the single most important section on the page. It's the thing nobody else has. How prominent do we make it? Full-width? Interactive? Animated?

3. **Dashboard as separate product.** Right now dashboard is a page. Should it FEEL like a separate app? Different nav, different density, different energy than the marketing pages?

4. **The "For Flippers" / "For Bargain Hunters" split.** Two landing pages for two audiences, or one page that speaks to both? Google Ads can target different pages for different keywords.

5. **Mobile-first or desktop-first?** Flippers search deals on their phone in the car. But they might sign up and configure on desktop. Which screen do we optimize for?

6. **Brand voice.** Are we confident and bold ("Your unfair advantage in local deals") or approachable and helpful ("We do the hunting, you do the finding")? The tone shapes everything.

---

## Session Plan for Tonight

When you're back with fresh eyes:

1. **Lock the hero messaging** — headline + subhead (10 min discussion)
2. **Build the landing page top-to-bottom** — section by section per this blueprint (2-3 hours)
3. **Build the pricing page** — 3-tier cards + founding countdown (1 hour)
4. **Push to preview branch** — review on mobile + desktop
5. **If time:** Start dashboard rework

We don't need to ship everything tonight. But the landing page + pricing page should be done — that's the front door to the entire platform.
