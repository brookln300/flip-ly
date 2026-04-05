# Orchestrator — 2-Week Sprint to Ship

**Created:** 2026-04-04
**Deadline:** 2026-04-18 (Saturday)
**Goal:** Flip-ly relaunches as a local deal discovery platform with working landing page, 3-tier pricing, AI score breakdowns, and at least 2 new source integrations live.
**Rule:** This doc is the single source of truth for daily priorities. Claude Code reads this at session start.

---

## Reality Check

- Planning: DONE (10 docs locked April 4)
- Build work started: NONE — page.tsx is still pre-pivot
- Branch: `polish/monday-deadline` → Vercel preview
- The landing page spec calls for 8 sections. The current page has ~1600 lines of old code that needs replacing, not patching.
- Stripe needs new Price IDs. DB needs new columns. These are blockers for pricing to work.

---

## Week 1: Foundation (April 5-11)

### Day 1 — Saturday April 5: Landing Page Skeleton + Design Tokens
**Claude Code directive:** Set up the new page structure. Don't polish — get the bones in place.

- [x] Add CSS custom properties from DESIGN-SYSTEM.md (colors, typography, spacing tokens) to `globals.css` or a new `design-tokens.css`
- [x] Scaffold new landing page structure: 8 empty sections with proper IDs, backgrounds, spacing
- [x] Build Section 1 (Hero): headline, subhead, single CTA, placeholder for screenshot
- [x] Build Section 2 (Social Proof Bar): real DB query for listing count, 413 markets, source count
- [x] Remove old testimonials section, old "How It Works" cards
- [x] Push to preview branch, verify deploy

**Definition of done:** Preview URL shows new hero + proof bar. Old sections removed. Dark, clean, matches design system.

### Day 2 — Sunday April 6: Score Card + Search Simplification
**Claude Code directive:** Build the two sections that demonstrate the product.

- [ ] Build Section 3 (Score Breakdown Card): hardcoded with real data from DB, styled per spec
- [ ] Simplify Section 4 (Live Search): remove title/disclaimer, limit anonymous to 3 results, add upgrade CTA below
- [ ] Simplify Section 5 (Featured Deals): remove HOT badges, use score colors only, clean title
- [ ] Mobile test (375px, 768px)
- [ ] Push to preview

**Definition of done:** Score card looks like the Pro experience. Search works anonymously with 3 results. Deals section is clean. Mobile doesn't break.

### Day 3 — Monday April 7: Pricing + CTA + Footer
**Claude Code directive:** Complete the landing page. Every section built.

- [ ] Build Section 6 (Pricing): 3-tier cards, founding counter, feature matrix per spec
- [ ] Build Section 7 (Final CTA): minimal, one headline, one button
- [ ] Build Section 8 (Footer): 4-column grid, updated tagline, lobster pixel
- [ ] Full mobile responsiveness pass
- [ ] Push to preview — this is the "Monday deadline" landing page

**Definition of done:** Full 8-section landing page live on preview. Pricing cards show all 3 tiers. Mobile works. Zero old garage-sale-only elements remain.

### Day 4 — Tuesday April 8: Stripe + DB Schema
**Claude Code directive:** Wire up the backend for the new pricing model.

- [ ] Create Stripe Price IDs: `pro_founding`, `pro_regular`, `power_founding`, `power_regular`
- [ ] Add `is_founding_member`, `founding_member_at`, `additional_markets` columns to `users` table
- [ ] Add `ai_score_breakdown` JSONB column to `fliply_listings` table
- [ ] Update checkout flow to support 3-tier model
- [ ] Update search limit from 10 → 15/day for free tier
- [ ] Test checkout end-to-end on preview

**Definition of done:** A user can sign up, choose a tier, and pay via Stripe. DB schema supports founding members and score breakdowns.

### Day 5 — Wednesday April 9: AI Score Breakdown (Part 1)
**Claude Code directive:** This is the core value prop. Restructure the AI pipeline.

- [ ] Restructure Claude Haiku prompt in `enrich-listing.ts` to output factor-by-factor scoring
- [ ] Output format: { price_anomaly: {score, reason}, motivation: {score, reason}, brand: {score, reason}, quality: {score, reason}, freshness: {score, reason} }
- [ ] Store breakdown as JSONB in `fliply_listings.ai_score_breakdown`
- [ ] Run enrichment on a batch of test listings, verify output quality
- [ ] Unit tests for new enrichment format

**Definition of done:** AI returns structured breakdown. At least 50 listings enriched with new format. Data stored correctly.

### Day 6 — Thursday April 10: AI Score Breakdown (Part 2) + Tier Gating
**Claude Code directive:** Wire the breakdown into the frontend. Implement tier-based visibility.

- [ ] Build score breakdown component (matches Section 3 design)
- [ ] Implement tier-based score display: Free = number only, Pro = full breakdown, Power = breakdown + context
- [ ] Implement market gating: 1 market (Free), 3 markets (Pro), unlimited (Power)
- [ ] Add "Add nearby markets" UI for Pro users
- [ ] Test gating across all three tiers

**Definition of done:** Score breakdown visible for Pro/Power. Free users see number + teaser. Market limits enforced.

### Day 7 — Friday April 11: Source Integration #1 + Daily Digest
**Claude Code directive:** Add first new source. Get daily digest running.

- [ ] Integrate EstateSales.net (Official API — highest priority Tier 1 source)
- [ ] Build daily digest cron job (same template as weekly, runs Mon-Fri for Pro/Power)
- [ ] Test digest delivery with test accounts
- [ ] Week 1 QA: full walkthrough of landing page + signup + search + digest flow

**Definition of done:** EstateSales.net listings appearing in search results. Daily digest sending to Pro/Power test accounts. No critical bugs in core flow.

---

## Week 2: Polish + Features + Ship (April 12-18)

### Day 8 — Saturday April 12: Source Integration #2 + #3
- [ ] Integrate GarageSaleFinder/GSALR (CSV/KML import)
- [ ] Integrate ShopGoodwill (AI Extract)
- [ ] Verify all sources appearing correctly in search and deals sections
- [ ] Landing page social proof bar now reflects real multi-source numbers

### Day 9 — Sunday April 13: Saved Searches + Upgrade Prompts
- [ ] Build saved searches (Pro: 3, Power: unlimited)
- [ ] Build contextual upgrade prompts (when hitting search limit, locked score, market limit)
- [ ] These should feel like doors, not walls — per FEATURE-ROADMAP spec

### Day 10 — Monday April 14: Founding Member Program + Dashboard Polish
- [ ] Founding member badge on dashboard
- [ ] Founding countdown on pricing section (live date math, not hardcoded)
- [ ] Dashboard updates: show source diversity, score breakdowns where applicable
- [ ] Update About page, meta tags, OG images for new positioning

### Day 11 — Tuesday April 15: FB Group Directory + Content Updates
- [ ] Build `fb_group_directory` table, seed with curated groups for top markets
- [ ] "Also check these FB groups" cards in search results
- [ ] Update /about, /privacy, /terms for post-pivot language
- [ ] SEO: meta descriptions, structured data for new positioning

### Day 12 — Wednesday April 16: Full QA + Bug Fixes
- [ ] End-to-end test: new visitor → landing page → search → signup → tier selection → checkout → dashboard → digest
- [ ] Mobile QA across all sections (375px, 768px, 1024px)
- [ ] Performance check (Lighthouse score, load time)
- [ ] Fix all bugs found
- [ ] Accessibility pass (contrast, focus states, screen reader basics)

### Day 13 — Thursday April 17: Production Deploy Prep
- [ ] Merge `polish/monday-deadline` → `master`
- [ ] Verify production deploy on Vercel
- [ ] Smoke test production: signup, search, checkout, digest
- [ ] DNS/redirects if any needed
- [ ] Google Ads: update ad copy for new positioning (if campaign is running)
- [ ] Social accounts: update bios/descriptions

### Day 14 — Friday April 18: LAUNCH DAY
- [ ] Final smoke test on production
- [ ] Founding member program goes live (14-day countdown starts)
- [ ] Announcement post (X/Twitter, any other channels)
- [ ] Monitor: signups, errors, Stripe webhooks, digest delivery
- [ ] Celebrate — then start planning Phase 3

---

## Daily Session Protocol for Claude Code

Every Claude Code session MUST follow this sequence:

1. **Read this file** (`docs/ORCHESTRATOR.md`) — know today's tasks
2. **Read PROJECT-STATUS.md** — know what shipped yesterday
3. **`git log --oneline -5`** — know the last commits
4. **Check today's tasks above** — work through them in order
5. **After each task:** mark it done in this file with `[x]`
6. **End of session:** Update PROJECT-STATUS.md with what shipped and any blockers
7. **If blocked:** Note the blocker clearly. Don't context-switch to unrelated work. Flag it for Keith.

---

## Non-Negotiable Quality Gates

Before merging to master:
- [ ] All 8 landing page sections match LANDING-PAGE-SPEC.md
- [ ] Design system tokens used consistently (no hardcoded colors/fonts)
- [ ] Mobile responsive at 375px, 768px, 1024px
- [ ] Stripe checkout works for all tiers
- [ ] AI score breakdown displays correctly by tier
- [ ] At least 2 new sources live and returning results
- [ ] Daily digest sending correctly
- [ ] No console errors in production
- [ ] Lighthouse performance > 80
- [ ] Zero fake data on landing page

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| EstateSales.net API access delayed | Medium | High | Fall back to AI Extract method. Don't block on API approval. |
| Stripe Price ID creation needs Keith's dashboard access | High | Medium | Keith creates IDs manually, shares them. Claude Code wires them in. |
| Dashboard screenshot needed for hero | High | Medium | Use current dashboard as placeholder. Replace when Keith provides final shot. |
| AI prompt restructuring breaks existing enrichment | Medium | High | Keep old prompt as fallback. Run new prompt on test batch first. |
| Scope creep | High | High | This doc IS the scope. If it's not on today's list, it doesn't exist today. |

---

## What's Explicitly Deferred (Post April 18)

These are real features but they ship AFTER launch:
- OfferUp integration (Phase 3)
- Instant deal alerts for Power tier (Phase 3)
- Category price intelligence (Phase 3)
- Annual billing (Phase 4)
- Referral program (Phase 4)
- Browser extension (Phase 4)
- Nextdoor integration (needs API approval wait)
