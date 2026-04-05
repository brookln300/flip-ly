# Flip-ly Project Status

**Last Updated:** 2026-04-04 (evening)
**Status:** BUILD PHASE — 2-week sprint to launch (deadline: April 18)
**Current Branch:** `polish/monday-deadline` (Vercel preview active)
**Orchestrator:** `docs/ORCHESTRATOR.md` — daily execution plan

---

## PICK UP HERE

**Read `docs/ORCHESTRATOR.md` first.** It has the day-by-day plan through April 18.

**Day 1 (April 5) — COMPLETE.** Next up: Day 2 (April 6) — Score card polish, search simplification, deals cleanup.

**Keith needs to provide (not blocking Day 2):**
- Dashboard screenshot for hero (scored deal with breakdown visible) — currently using placeholder score card
- Stripe Price IDs for new tiers (needed by Day 4)
- Confirm hero headline: "Every deal near you. Scored before you see it."

---

## What Shipped (2026-04-05, Day 1 Sprint)

### Landing Page Rewrite
- [x] Full design system CSS tokens in globals.css (backgrounds, borders, text, accents, scores, spacing)
- [x] Inter + JetBrains Mono loaded via next/font/google
- [x] 8-section landing page scaffold (replaces 1600-line old page)
- [x] Section 1: Hero — new headline, single CTA, score card placeholder (replacing video + dual CTA)
- [x] Section 2: Social Proof Bar — real DB stats via new /api/stats endpoint
- [x] Section 3: Score Breakdown Card — hardcoded with real-looking data
- [x] Section 4: Live Search — simplified, anonymous limited to 3 results
- [x] Section 5: Featured Deals — clean, no HOT badges, score color only
- [x] Section 6: Pricing — 3-tier (Free/Pro $5/Power $19), founding prices
- [x] Section 7: Final CTA — minimal
- [x] Section 8: Footer — 4-column, updated tagline, lobster pixel preserved
- [x] Removed: testimonials, How It Works cards, HOT badges, video, "free forever", dual CTAs
- [x] Build passes clean, pushed to polish/monday-deadline, Vercel preview deploying

**Bonus:** Also built score breakdown card (Section 3) and full 3-tier pricing (Section 6) ahead of schedule.

---

## What Shipped (2026-04-04, Afternoon)

### Landing Page Polish (Before Pivot)
- [x] Testimonials redesign — 2-col grid, 6 personas, stars, role badges
- [x] Header overhaul — backdrop blur, SVG icon mark, mobile hamburger menu
- [x] Vercel preview branch setup — env vars configured for preview deployments

### Strategic Pivot (The Big Shift)
- [x] **PRODUCT-PIVOT.md** — Garage sale aggregator → local deal discovery platform
- [x] **PRICING-MODEL.md** — 3 tiers (Free/Pro $9/Power $29) + founding member program (14 days)
- [x] **UNIT-ECONOMICS.md** — Full pipeline cost analysis, 87-96% margins, breakeven at ~20 subscribers
- [x] **COMPETITIVE-LANDSCAPE.md** — No competitor does multi-source + AI scoring (whitespace confirmed)
- [x] **SOURCE-STRATEGY.md** — Tier 1-3 source priority, FB pointer/directory model, legal framework
- [x] **FEATURE-ROADMAP.md** — 4-phase plan (Phase 0: polish → Phase 4: growth)
- [x] **DESIGN-SYSTEM.md** — Visual bible (typography, colors, components, banned patterns)
- [x] **PLATFORM-ARCHITECTURE.md** — Full sitemap, 3 user journeys, dashboard wireframe
- [x] **LANDING-PAGE-SPEC.md** — 8-section build blueprint, zero fabrication, build order
- [x] **OPEN-QUESTIONS.md** — 10 tracked questions, FB Group API lead noted

### CLAUDE.md Overhaul
- [x] Updated for pivot positioning, planning doc references, design philosophy, creative direction

---

## 2-Week Sprint Overview (April 5–18)

| Day | Date | Focus | Status |
|-----|------|-------|--------|
| 1 | Apr 5 (Sat) | Landing page skeleton + design tokens + hero + proof bar | DONE |
| 2 | Apr 6 (Sun) | Score card + search simplification + deals cleanup | Pending |
| 3 | Apr 7 (Mon) | Pricing section + CTA + footer — full landing page complete | Pending |
| 4 | Apr 8 (Tue) | Stripe setup + DB schema changes | Pending |
| 5 | Apr 9 (Wed) | AI score breakdown (prompt restructure + storage) | Pending |
| 6 | Apr 10 (Thu) | Score breakdown UI + tier gating | Pending |
| 7 | Apr 11 (Fri) | EstateSales.net integration + daily digest | Pending |
| 8 | Apr 12 (Sat) | GarageSaleFinder + ShopGoodwill integrations | Pending |
| 9 | Apr 13 (Sun) | Saved searches + upgrade prompts | Pending |
| 10 | Apr 14 (Mon) | Founding member program + dashboard polish | Pending |
| 11 | Apr 15 (Tue) | FB group directory + content/SEO updates | Pending |
| 12 | Apr 16 (Wed) | Full QA + bug fixes | Pending |
| 13 | Apr 17 (Thu) | Production deploy prep + merge to master | Pending |
| 14 | Apr 18 (Fri) | LAUNCH — founding member program goes live | Pending |

**Full daily breakdown:** `docs/ORCHESTRATOR.md`

---

## Key Architecture Decisions (This Session)

1. **Pivot from garage-sale-only to local deal discovery** — engine stays, positioning changes
2. **3-tier pricing** — Free ($0) / Pro ($9, founding $5) / Power ($29, founding $19)
3. **Founding member program** — 14 days, locked for life, DB flag + badge
4. **FB Marketplace = pointer model, not scraping** — curate group directories, don't touch their data
5. **FB Group API** — promising lead for legitimate FB data access (Phase 3-4)
6. **Design philosophy** — product sells itself, show don't tell, Stripe-level polish, zero fabrication
7. **No testimonials section** — social proof lives in the product (real data, real scores)
8. **15 searches/day free tier** — generous enough to form habit, other gates drive conversion
9. **AI score breakdown** — number visible to all, breakdown for Pro, trends for Power
10. **Market gating** — 1 free / 3 Pro (metro cluster) / unlimited Power
