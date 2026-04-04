# Flip-ly Project Status

**Last Updated:** 2026-04-04
**Status:** Production — Live at flip-ly.net
**Next Milestone:** Monday 4/6 — Polished SaaS landing page

---

## What Shipped This Session (2026-04-04)

### Dashboard Redesign v2
- Full aesthetic overhaul of `/dashboard`
- SVG icons with per-card accent colors (blue/green/purple/amber)
- CSS grid layout for stat cards, cubic-bezier animations
- Smarter display name formatting (cleans email prefix)
- Market label deduplication (no more "Bowling Green, Ky, KY")
- Glassmorphic header, hover micro-interactions, deeper black (#060606)
- ScoreBadge with lock icon for gated scores, box shadows on hot deals

### Landing Page Changes
- Reordered sections: Hero -> Search -> How It Works -> Featured Deals -> Testimonials -> Pricing
- Replaced dark grayscale source logos with colorful inline SVG trust bar (Craigslist, Eventbrite, FB Marketplace, EstateSales + "20 more")
- Swapped hero video to new dashboard shots.so mockup (`hero-dashboard.webm`)

### Hero Image
- Dashboard screenshot captured via shots.so
- WebM animation at `/public/assets/hero-dashboard.webm` (3.7MB)
- Replaces old `hero-scroll.webm`

---

## Page Inventory & Status

| Page | Route | Status | Notes |
|------|-------|--------|-------|
| Landing | `/` | Polished | Hero video, search, trust bar, testimonials, pricing, CTAs |
| Dashboard | `/dashboard` | Polished | Redesigned 4/4. Stat cards, deal feed, search, account |
| Pro Upgrade | `/pro` | Polished | Stripe checkout, early adopter $5/mo messaging |
| About | `/about` | Polished | Mission, features, team, social links |
| Why | `/why` | Polished | Problem/solution narrative, target audiences |
| Terms | `/terms` | Polished | 15 sections, AI disclaimer, Texas governing law |
| Privacy | `/privacy` | Polished | GDPR/CCPA compliant, transparent third-party disclosure |
| Garage Sales | `/garage-sales` | Polished | Google Ads landing page with UTM/gclid tracking |
| Lobster Hunt | `/lobster-hunt` | Polished | Easter egg ARG contest with leaderboard |
| Links | `/links` | Polished | Retro 90s linktree for social bios |
| Contest Rules | `/contest-rules` | Exists | Supporting page for lobster hunt |
| Data Deletion | `/data-deletion` | Exists | Privacy compliance |
| Donated | `/donated` | Exists | Needs review |

---

## Remaining Polish Tasks (Monday 4/6 Deadline)

### Priority 1 — Landing Page
- [ ] **Testimonials rewrite** — match professional tone, add more variety, rotate quotes
- [ ] **Header polish** — cleaner look while keeping sticky behavior
- [ ] **Pricing section** — evaluate structure, ensure CTA clarity
- [ ] **Stats bar verification** — confirm "480+ Listings" and "12 Active Markets" are accurate against DB
- [ ] **Overall polish pass** — spacing, typography, CTA consistency, mobile responsiveness

### Priority 2 — Functional
- [ ] **Filter market dropdown** — only show markets with active data in DB
- [ ] **Dashboard mobile test** — verify responsiveness on small screens
- [ ] **Review /contest-rules, /donated pages** — ensure completeness

### Priority 3 — Growth
- [ ] Strategic deep dive (PingMyCustomers-style rigor) — see SESSION-PLAYBOOK.md
- [ ] Google Ads campaign optimization (current: $8.74 spent, 0% engagement before /garage-sales fix)
- [ ] Social content pipeline (Buffer integration exists)

---

## Technical Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Framework | Next.js 14 (App Router) | TypeScript, deployed on Vercel |
| Database | Supabase | Project: krjbjdaeoluzfsgkheen |
| Auth | NextAuth v4 | X/Twitter + Google OAuth |
| Payments | Stripe | Pro tier $5/mo |
| Email | Resend | Weekly digest Thursdays 12 PM CDT |
| AI | Claude Haiku 4.5 | Deal scoring 1-10, enrichment |
| Alerts | Telegram | @fliplyalert_bot |
| Analytics | GA4 | + custom server-side events |
| Scraping | Custom | Craigslist (sapi JSON), Eventbrite (LD+JSON), AI universal |

---

## Deployment

- **Production**: `git push origin master` -> Vercel auto-deploy
- **Domain**: flip-ly.net
- **Env vars**: Configured in Vercel project settings (not in preview branches)
- **Preview branches**: Will fail without manually adding env vars (Supabase URL required)
- **Build**: `npx next build` — last verified clean 2026-04-04

---

## Key Architecture Decisions

1. **No chaos mode** — Fully removed as of 4/2. Clean professional design only.
2. **Inline styles over Tailwind for dashboard** — Dashboard uses inline React styles for precise control. Landing page uses mix of Tailwind + inline.
3. **Scrape frequency**: 6x/day (every 4 hours) with 300s Vercel Pro timeout
4. **Source discovery**: Hourly cron auto-discovers + auto-approves sources (ai_confidence >= 7 after 24h)
5. **Free tier**: 10 searches/day, weekly digest, partial scores. Pro: unlimited everything + 6hr early digest.
6. **Pre-seeded sources**: 825 sources across 414 markets (CL + Eventbrite), activate on user signup.
