# flip-ly.net

AI-powered local deal discovery platform. Scans 20+ sources, scores every listing, delivers what's worth your time.

## The Pivot (April 2026)
Flip-ly started as a garage sale aggregator. It is now a **local deal discovery platform** — source-agnostic, AI-scored, built for flippers, resellers, and bargain hunters. Garage sales are a feature, not the product. Read `docs/planning/PRODUCT-PIVOT.md` for full context.

## Session Protocol

**START of every session:**
1. Read `docs/planning/INDEX.md` — know the full strategic context
2. Read `docs/planning/LANDING-PAGE-SPEC.md` — the build blueprint
3. Read `docs/planning/DESIGN-SYSTEM.md` — the visual bible
4. Read `docs/PROJECT-STATUS.md` — know what's shipped and what's pending
5. Check `git log --oneline -10` — know what just happened

**If Keith says "let's start back up on flip-ly" or similar:**
- You are mid-pivot. The planning phase is DONE (10 docs locked in `docs/planning/`).
- The next task is BUILDING the landing page rework per `LANDING-PAGE-SPEC.md`.
- Preview branch: `polish/monday-deadline` — pushes auto-deploy to Vercel preview.
- All strategic decisions are locked. Don't re-debate them. Execute.

**DURING session:** Update PROJECT-STATUS.md as tasks complete. Log decisions in `docs/planning/INDEX.md` decision log.
**END of every session:** Update PROJECT-STATUS.md. Leave "PICK UP HERE" notes for anything half-done.

## Design Philosophy
- **The product sells itself.** Every element on the page is either the product working or a verifiable fact. Zero fabrication. No fake testimonials. No hype.
- **Show, don't tell.** Don't say "AI-powered scoring." Show a deal scored 8.7 with the breakdown visible.
- **Confident, not loud.** Stripe-level polish. No HOT badges, no urgency tricks, no emojis, no exclamation marks. The quality speaks.
- **One action per viewport.** Only one green CTA button visible at any time.
- **Full design system:** `docs/planning/DESIGN-SYSTEM.md` — typography, colors, components, motion, banned patterns. Follow it exactly.

## Creative Direction for Assets
When generating, sourcing, or evaluating visual assets (screenshots, icons, mockups):
- **Product screenshots are the #1 asset.** The hero image is a real dashboard showing a scored deal. Use shots.so for browser frame treatment.
- **Icons:** Inline SVG, single-weight stroke, 20-24px, Lucide style. Green (#22C55E) on dark backgrounds.
- **No stock photos. No illustrations. No gradients.** Flat, dark, data-driven.
- **Score colors tell the story:** Green (9-10), Amber (7-8), Gray (5-6), Dim (1-4). These are the visual vocabulary.
- **Typography IS the design.** Inter for everything, JetBrains Mono for scores/data only. Size hierarchy creates visual interest, not decoration.
- **When in doubt, remove.** If a section works without an asset, it doesn't need one.

## Planning Docs (ALL LOCKED — don't re-debate, execute)
```
docs/planning/
  INDEX.md                    — Decision log, document status
  PRODUCT-PIVOT.md            — What's changing, why, what stays
  PRICING-MODEL.md            — 3 tiers (Free $0 / Pro $9 / Power $29), founding program
  UNIT-ECONOMICS.md           — Costs, margins (87-96%), pipeline breakdown
  COMPETITIVE-LANDSCAPE.md    — No competitor does multi-source + AI scoring
  SOURCE-STRATEGY.md          — Integration priority, FB pointer model
  FEATURE-ROADMAP.md          — 4 phases, what ships when
  DESIGN-SYSTEM.md            — Visual bible — typography, colors, components
  PLATFORM-ARCHITECTURE.md    — Full sitemap, user journeys, dashboard vision
  LANDING-PAGE-SPEC.md        — 8-section build blueprint (BUILD THIS NEXT)
  OPEN-QUESTIONS.md           — Unresolved decisions (FB Group API lead noted)
```

## Stack
- **Framework:** Next.js 14 (App Router) + TypeScript
- **Styling:** Tailwind CSS + inline styles (dashboard)
- **Database:** Supabase (project: krjbjdaeoluzfsgkheen)
- **Hosting:** Vercel (auto-deploys on push to master, preview on branches)
- **Email:** Resend
- **AI:** Anthropic Claude Haiku 4.5 (listing enrichment + scoring)
- **Auth:** NextAuth v4 (X/Twitter + Google OAuth)
- **Payments:** Stripe (needs new Price IDs for 3-tier model)
- **Alerts:** Telegram @fliplyalert_bot

## Commands
- `npm run dev` — local dev server
- `npm run build` — production build
- `git push origin master` — triggers Vercel production deploy
- `git push origin polish/monday-deadline` — triggers Vercel preview deploy

## Project Structure
```
app/
  api/          — API routes (cron/, auth/, listings/, feedback/, stripe/, telegram/)
  components/   — React components
  lib/          — Core logic
    ai/         — Claude Haiku client + enrichment pipeline
    scrapers/   — Craigslist, Eventbrite, AI universal scraper
    discovery/  — Auto-discover sources for new zip codes
    email/      — Digest templates + Resend integration
  (pages)       — about/, pro/, lobster-hunt/, privacy/, terms/, etc.
docs/
  planning/     — Strategic planning docs (10 docs, all locked)
scripts/        — Content pipeline (buffer-analytics.js, content-pipeline.js, generate-ideas.js)
```

## Key Patterns
- All API cron routes MUST have `export const dynamic = 'force-dynamic'`
- Supabase client: `app/lib/supabase.ts`
- Auth: `app/lib/auth.ts` + `app/lib/next-auth.ts`
- AI enrichment: `app/lib/ai/enrich-listing.ts` (scores deals 1-10, generates descriptions, tags)
- AI scoring factors: price anomaly (30%), motivation signals (20%), brand detection (20%), listing quality (15%), freshness (15%)

## Database Tables
- `users` — signups with lifecycle (trial/active/lapsed/churned). PENDING: add `is_founding_member`, `founding_member_at`, `additional_markets`
- `fliply_markets` — geographic markets (413 US markets)
- `fliply_sources` — data sources per market (825 pre-seeded)
- `fliply_listings` — scraped listings + AI enrichment. PENDING: add `ai_score_breakdown` JSONB column
- `fliply_zip_data` — zip → lat/lng + CL region mapping
- `fliply_feedback` — user feedback widget submissions
- `digest_log` — email delivery tracking
- PENDING: `fb_group_directory` — curated FB groups by market + category

## Pricing Model (Locked)
| | Free | Pro | Power |
|---|---|---|---|
| Regular | $0 | $9/mo | $29/mo |
| Founding (14 days) | $0 | $5/mo for life | $19/mo for life |
| Searches | 15/day | Unlimited | Unlimited |
| Markets | 1 | 3 | Unlimited |
| AI Score | Number only | Full breakdown | Breakdown + trends |
| Digest | Weekly | Daily + Weekly | Daily + Instant alerts |

## Rules
- Never expose API keys in code or commits
- Never delete user data without explicit approval
- Test endpoints after deploy (curl the route, check 200)
- Craigslist uses sapi.craigslist.org JSON API, NOT RSS
- Eventbrite uses LD+JSON scraping from search pages
- No fake data on the landing page — real DB numbers or nothing
- Follow DESIGN-SYSTEM.md for every visual decision
- Keep the lobster. Always keep the lobster.
