# Landing Page Spec — Build Blueprint

**Created:** 2026-04-04
**Status:** LOCKED — ready to build
**Principle:** Every element is either the product working or a verifiable fact. Zero fabrication.

---

## Page Structure

8 sections. ~2,500px total scroll depth. No filler. Every section earns its space.

---

### Section 1: Hero

**Layout:** Split — left copy, right product screenshot. Full-width, #000 background.

**Left side:**
- Headline: "Every deal near you. Scored before you see it."
  - Display size, Inter Bold, -0.03em tracking, white
- Subhead: "We scan Craigslist, estate sales, OfferUp, and 20+ local sources. AI scores every listing for flip potential. You see what's worth your time."
  - 15px, Inter Regular, --text-secondary, 1.7 line-height, max-width 480px
- CTA: "Start finding deals" — one green button, primary style
- Trust line: "Free · 15 searches/day · No credit card" — 12px, --text-dim

**Right side:**
- Static product screenshot — dashboard showing a scored deal with breakdown visible
- Clean browser frame or shots.so treatment
- No video. No animation. The product, frozen, looking sharp.

**No badge/pill above headline. No second CTA. No "Free forever" language.**

---

### Section 2: Social Proof Bar

**Layout:** Single centered line, ~50px height, subtle top/bottom border.

```
20+ sources scanned  ·  [real number] deals scored  ·  413 US markets
```

Numbers pulled from DB at build time or via API. If we can't verify it, don't show it.

Source logos (SVGs) on the same row or tucked directly below — compact, not a separate section. Muted opacity (0.6-0.7). No header text ("Sources we scan daily" — killed).

---

### Section 3: Score Breakdown Card

**Layout:** Full-width section, #0a0a0a background. One deal card, centered, max-width ~600px.

**Content:** A real listing from the DB, styled as the Pro-tier breakdown will appear in the product.

```
[Title of real listing]                          [Score in color]
[Price] · [Source] · [City] · [Time ago]

Price      [X]% below market avg for [category] in [market]
Seller     [Motivation signal detected]
Brand      [Brand name] — [resale context]
Quality    [Photo count], [condition note]
Freshness  Posted [X] hours ago
```

**No title above the card.** No "See what the AI sees." The card IS the section. It explains the product by being the product.

**Below the card:** One line, centered, --text-dim, 13px: "Every listing, scored like this."

**Implementation note:** This can be a static example at first (hardcoded with real-looking data from our actual DB), then later wired to pull a featured high-scoring deal dynamically.

---

### Section 4: Live Search

**Layout:** Full-width, #0a0a0a background, subtle top border.

**Above search bar:** "Try it — no signup needed" in --text-dim, 13px, centered.

**Search bar:** Keep current implementation — input + market dropdown + search button + quick tags.

**Results behavior:**
- Anonymous: 3 results shown. Scores visible as numbers (colored). Breakdowns show "--" or locked indicator. Source links not clickable.
- Below results: "Sign up free for 15 searches/day and full results." + one green CTA
- No results disclaimer. No "Real-time results from..." narration.

**Quick tags stay:** tools, vintage, furniture, free, electronics, estate sale, kids, collectibles

---

### Section 5: Featured Deals

**Layout:** Same container, #000 background, subtle top border.

**Title:** Market name only. "Dallas-Fort Worth" — no "Hot Deals", no badges, no "Powered by AI."

**Content:** 4-6 real deals from DB. Each deal shows:
- Score (colored number, mono font)
- Title
- Price
- Source type (small, muted)
- City

**No HOT badges. No orange accents. Score color tells the story.**

**Bottom:** "Sign up to see all deals in your market." — secondary CTA or just a text link.

---

### Section 6: Pricing

**Layout:** #000 background. 3-column grid on desktop, stack on mobile. Max-width ~900px centered.

**Three cards:**

| Free | Pro | Power |
|------|-----|-------|
| $0/mo | $5/mo (founding) | $19/mo (founding) |
| 15 searches/day | Unlimited searches | Unlimited searches |
| 1 market | 3 markets | Unlimited markets |
| Score number only | Full score breakdown | Breakdown + trends |
| Weekly digest | Daily + weekly digest | Daily + instant alerts |
| | 3 saved searches | Unlimited saved searches |

**Pro card:** Subtly highlighted — slightly brighter border (--border-active) or thin green top border. Small text above tier name: "Most Popular" in --text-muted.

**Founding price display:** Just the price. Below it: "Founding price · Locks in [X] days" in --text-dim, 12px. No strikethrough. No regular price shown. No urgency formatting.

**CTAs:**
- Free: "Get Started" — ghost/secondary button
- Pro: "Start Pro" — green primary button
- Power: "Go Power" — ghost/secondary button

**Below cards:** "All plans include 20+ source coverage and AI scoring." — centered, --text-dim.
**Link:** "Compare all features →" — links to /pricing (future full page).

**Founding counter:** Below everything. Simple text. "[X] days left at founding price." --text-dim, 13px. No animation. No countdown widget. A fact.

---

### Section 7: Final CTA

**Layout:** #0a0a0a background. Centered. Minimal.

- Headline: "Every deal in your area. Scored." — H1 size, white, confident period.
- CTA: "Start finding deals" — green primary button.
- Nothing else. No subhead. No trust line. They've seen enough.

---

### Section 8: Footer

**Layout:** #0a0a0a background, top border. 4-column grid.

**Columns:**
1. **Product:** How It Works, Search, Pricing, Categories (Tools, Furniture, Vintage, Electronics)
2. **Company:** About, Blog (future), Contact
3. **Legal:** Privacy Policy, Terms of Service, Data Deletion
4. **Social:** X/Twitter, Instagram, TikTok, YouTube

**Bottom bar:** "© 2026 Flip-ly · Deal intelligence for resellers and bargain hunters"
**Keep the lobster pixel.**

---

## What's Removed From Current Page

| Element | Why |
|---------|-----|
| Hero video (hero-dashboard.webm) | Replaced by static screenshot. Quieter. |
| Second CTA in hero ("Try a Search") | One action per viewport. |
| "How It Works" 3-card section | Replaced by score card (Section 3) — show, don't explain. |
| Testimonials section (6 cards) | Removed entirely. Product IS the proof. |
| "What Users Are Saying" heading | Gone. |
| Stars on testimonials | Gone. |
| HOT badges on deals | Score color replaces them. |
| "Powered by AI" pill | Telling, not showing. |
| "Real data · Updated weekly" | Narrating. |
| "Sources we scan daily" header | Gone — logos speak for themselves. |
| Search disclaimer | Results prove it. |
| "Free forever" language | Implies product isn't worth paying for. |
| Rate limit banner styling (red/urgent) | Redesign to be calm, not alarming. |

---

## Build Order (Tonight)

1. Set up CSS custom properties from DESIGN-SYSTEM.md
2. Rewrite hero (headline, subhead, CTA, screenshot placement)
3. Slim social proof bar
4. Build score breakdown card (hardcoded with real data initially)
5. Simplify search section (remove title, disclaimer)
6. Simplify featured deals (remove badges, simplify title)
7. Build 3-tier pricing section with founding counter
8. Simplify final CTA
9. Update footer
10. Test on mobile (375px) and desktop (1280px)
11. Push to preview branch, verify on Vercel

---

## The Test

When someone loads this page, within 10 seconds they should understand:
1. **What it does** — finds deals across local sources
2. **How it's different** — AI scores everything
3. **What the score looks like** — the breakdown card
4. **That it's real** — live search with real data
5. **What it costs** — three clear tiers

If any of those take longer than 10 seconds, the page isn't done.
