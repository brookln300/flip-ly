# Flip-ly Project Status

**Last Updated:** 2026-04-04
**Status:** Mid-Pivot — Planning COMPLETE, Build Phase NEXT
**Current Branch:** `polish/monday-deadline` (Vercel preview active)

---

## PICK UP HERE

**The planning phase is done.** 10 documents locked in `docs/planning/`. All strategic decisions made. No more debating.

**Next action: Build the landing page rework.**
- Build spec: `docs/planning/LANDING-PAGE-SPEC.md`
- Design system: `docs/planning/DESIGN-SYSTEM.md`
- Branch: `polish/monday-deadline` (pushes auto-deploy to Vercel preview)
- Build order: Hero → Proof bar → Score card → Search → Deals → Pricing → CTA → Footer

**Keith may need to provide:**
- Dashboard screenshot for hero (scored deal with breakdown visible)
- Decision on hero headline wording
- Stripe Price ID creation for new tiers

---

## What Shipped This Session (2026-04-04, Afternoon)

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

## What's Next (Tonight's Build Session)

### Priority 1 — Landing Page Rework
- [ ] Set up CSS custom properties from DESIGN-SYSTEM.md
- [ ] Section 1: Hero (headline, subhead, one CTA, product screenshot)
- [ ] Section 2: Social proof bar (real DB numbers + source logos)
- [ ] Section 3: Score breakdown card (real deal, full AI breakdown)
- [ ] Section 4: Live search (simplified, 3 anonymous results)
- [ ] Section 5: Featured deals (clean, no badges)
- [ ] Section 6: Pricing (3-tier cards, founding counter)
- [ ] Section 7: Final CTA (one line, one button)
- [ ] Section 8: Footer (updated tagline, category links)
- [ ] Mobile test (375px, 768px, 1024px)
- [ ] Push to preview, verify on Vercel

### Priority 2 — Pricing Page (if time)
- [ ] Dedicated /pricing route with full feature matrix
- [ ] Founding countdown
- [ ] FAQ section

### Priority 3 — Stripe Setup
- [ ] Create new Price IDs (pro_founding, pro_regular, power_founding, power_regular)
- [ ] Update checkout flow for 3-tier model

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
