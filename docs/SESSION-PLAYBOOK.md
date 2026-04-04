# Flip-ly Session Playbook

**Purpose:** Every Claude Code session on flip-ly must operate with the same intensity, specificity, and scope discipline that defined the PingMyCustomers planning sessions. This document is the enforcement mechanism.

**Last Updated:** 2026-04-04

---

## SESSION RULES — NON-NEGOTIABLE

### 1. Start Every Session
- Read `docs/PROJECT-STATUS.md` — know where things stand
- Read this file — internalize the operating principles
- Check `git log --oneline -10` — know what just shipped
- Ask: "What's the ONE thing we're shipping this session?" — don't drift

### 2. During Every Session
- **Update PROJECT-STATUS.md** as you complete tasks (check boxes, add notes)
- **Log decisions** in the Decision Log below with date + rationale
- **Scope ruthlessly** — if a task grows beyond the original ask, stop and confirm before expanding
- **No speculative abstractions** — build what's needed now, not what might be needed later
- **Verify before declaring done** — build passes, deploy succeeds, live site confirms

### 3. End Every Session
- Update `docs/PROJECT-STATUS.md` with what shipped, what's pending
- Update the Decision Log below if any decisions were made
- Update the Session History below with a 2-3 line summary
- If anything is half-done, leave a clear "PICK UP HERE" note in PROJECT-STATUS.md

---

## OPERATING PRINCIPLES

These are extracted from the PingMyCustomers planning approach. They apply to every flip-ly decision.

### Specificity Over Vagueness
- Bad: "Improve the landing page"
- Good: "Rewrite testimonials section — 4 cards, real-sounding names, specific deal types mentioned, dates within last 30 days"
- Every task should be concrete enough to verify completion with a yes/no

### Scope Discipline — The Restraint IS the Product
- Define what you're NOT doing before you start
- Three tiers for any feature work:
  - **NOW**: Ships this session
  - **NEXT**: Ships next session (write it down, don't build it)
  - **LATER**: Acknowledge and forget until relevant
- If you catch yourself building something not in NOW, stop

### Real Economics, Not Vibes
- Don't say "lots of users" — say "12 active markets, ~1,039 listings in Dallas"
- Don't say "good conversion" — check actual Stripe dashboard, GA4 events
- Every growth claim must have a number attached or get flagged as unverified

### Decisions Need Receipts
- Every non-trivial choice gets logged with: What, Why, Alternatives considered
- "We just went with X" is not acceptable — future sessions need to know WHY
- If you're reversing a previous decision, note what changed

### Pessimistic Planning, Optimistic Execution
- Assume the worst case when estimating scope (it always takes longer)
- Cut 80% of what you think you need for MVP (PingMyCustomers cut aggressively)
- But once you commit to building something, build it properly — no half-measures

---

## LANDING PAGE AUDIT FRAMEWORK

Use this checklist when reviewing any page on flip-ly.net:

### Visual & Layout
- [ ] Consistent dark theme (#060606 or #080808 background)
- [ ] Green accent (#22C55E) used for primary CTAs only
- [ ] Inter font family throughout
- [ ] Proper spacing hierarchy (sections clearly delineated)
- [ ] Mobile responsive (test at 375px, 768px, 1024px)
- [ ] No orphaned text (single words on their own line)
- [ ] Images/videos load quickly (WebM preferred, PNG fallback)

### Copy & Messaging
- [ ] Headline answers "What is this?" in under 5 seconds
- [ ] Subheadline answers "Why should I care?"
- [ ] CTA text is action-oriented ("Get Started Free" not "Submit")
- [ ] No jargon — a non-technical person understands every word
- [ ] Early adopter pricing ($5/mo locked for life) mentioned where relevant
- [ ] Trust signals present (source count, market count, user count)

### Conversion Path
- [ ] Primary CTA above the fold
- [ ] Secondary CTA after value explanation
- [ ] Pricing section has clear free vs pro comparison
- [ ] Sign-up flow completes in under 60 seconds
- [ ] No dead ends — every section has a next action

### Technical
- [ ] `next build` passes clean (no warnings)
- [ ] No console errors on page load
- [ ] All links resolve (no 404s)
- [ ] Meta tags present (title, description, OG image)
- [ ] Favicon loads

---

## DECISION LOG

| # | Date | Decision | Why | Alternatives |
|---|------|----------|-----|-------------|
| 1 | 2026-04-02 | Remove chaos mode entirely | User feedback: unprofessional for SaaS. Kills conversion trust. | Keep as toggle (rejected: split maintenance burden) |
| 2 | 2026-04-02 | Early adopter $5/mo messaging everywhere | Lock in first users at low price, raise later. Creates urgency. | $9/mo (rejected: too high for unproven product), Free only (rejected: need revenue signal) |
| 3 | 2026-04-03 | Add /garage-sales landing page | Google Ads pointed to 404, wasting $8.74. Need conversion-optimized page for paid traffic. | Redirect to / (rejected: generic page doesn't match ad intent) |
| 4 | 2026-04-04 | Dashboard redesign with glassmorphic aesthetic | Old dashboard looked dated, needed professional screenshot for hero image via shots.so. | Minimal cleanup (rejected: wouldn't produce compelling hero), Figma mockup (rejected: can't use real data) |
| 5 | 2026-04-04 | Reorder landing: Search before How It Works | Users should interact immediately, not read explanation first. Search is the hook. | Keep original order (rejected: too much reading before engagement) |
| 6 | 2026-04-04 | Inline SVG trust bar replacing PNG logos | Old grayscale PNGs were dark, invisible on dark background. SVGs scale, load faster, pop with color. | Better PNGs (rejected: still need color), Remove trust bar (rejected: social proof matters) |

---

## UNIT ECONOMICS SNAPSHOT

**Revenue Model:**
- Free tier: 10 searches/day, weekly digest, partial scores
- Pro tier: $5/mo — unlimited search, full scores, 6hr early digest, hot deal alerts

**Cost Structure (Monthly):**
- Supabase: Free tier (currently sufficient)
- Vercel: Pro plan (~$20/mo)
- Resend: Free tier (currently sufficient)
- Claude Haiku: ~$2-5/mo at current volume
- Domain: ~$1/mo amortized
- **Total fixed: ~$25-30/mo**

**Breakeven:** 6 Pro subscribers ($30/mo revenue)

**Current State:**
- Active Pro subscribers: CHECK STRIPE DASHBOARD
- Total signups: CHECK SUPABASE `users` TABLE
- Active markets with data: CHECK SUPABASE `fliply_markets` TABLE
- Weekly digest recipients: CHECK RESEND DASHBOARD

> **ACTION**: Every session should verify these numbers are current. Don't quote stale data.

---

## COMPETITIVE LANDSCAPE

| Competitor | What They Do | Our Edge |
|-----------|-------------|----------|
| Craigslist alerts | Email when keyword matches | We score quality, aggregate 20+ sources, not just CL |
| EstateSales.net | Estate sale listings | We include garage sales, CL, FB, Eventbrite too |
| Yard Sale Treasure Map | Map of garage sales | We add AI scoring — know WHAT'S worth going to |
| Manual browsing | Check each source individually | We automate across all sources in one digest |

**Moat:** Multi-source aggregation + AI scoring. No one else combines both.

---

## RISK REGISTER

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Craigslist blocks scraping | Medium | High | Use sapi.craigslist.org JSON API (more stable than RSS), rotate headers, respect rate limits |
| Zero paid conversions | Medium | High | Early adopter pricing, Google Ads, content marketing, referral program |
| Scraper data quality degrades | Medium | Medium | Auto-deactivate after 5 failures + TG alert, AI confidence scoring |
| Vercel costs spike | Low | Medium | Monitor function invocations, optimize scrape frequency |
| Legal (data scraping) | Low | High | Only scrape public data, respect robots.txt, no PII storage beyond user accounts |

---

## SESSION HISTORY

| Date | Summary |
|------|---------|
| 2026-04-04 | Dashboard v2 redesign (glassmorphic, SVG icons, grid layout). Landing page reorder + trust bar SVG. Hero video swapped to shots.so dashboard mockup. All pushed to master/production. |

---

## NEXT SESSION PRIORITIES

**Immediate (Monday 4/6 deadline):**
1. Landing page testimonials — rewrite to professional tone, real-sounding, specific
2. Header polish — clean up while keeping sticky behavior
3. Pricing section — ensure clarity, maybe add feature comparison table
4. Overall polish pass — spacing, mobile, typography consistency
5. Stats bar — verify numbers against actual DB, update if stale

**After 4/6:**
- Google Ads optimization (review /garage-sales conversion data)
- Social content pipeline activation
- Docker/n8n setup on secondary PC (blocked on Windows Update to 22H2)
- Strategic deep dive: retention metrics, churn analysis, growth channels
