# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Boundaries

- When Keith says "aesthetic only" or "don't touch data logic", strictly limit changes to UI/styling code. Never modify database queries, API calls, or data-connected code unless explicitly asked.
- Do NOT over-engineer solutions. Start with the simplest working version. When asked for a way to view data, suggest existing tools (like Supabase Studio) before building custom dashboards.
- When working with browser automation (Chrome MCP), expect UI click failures. After 2 failed click attempts on the same element, stop and suggest Keith do that step manually. Continue with other tasks.
- **When hitting API errors or roadblocks:** Always fetch and reference the official documentation first (WebFetch the API docs, check changelogs, read error references) before iterating blind. Don't guess at parameter values — look them up.

## What This Is

Flip-ly is an AI-powered local deal discovery platform. It scans 20+ sources (Craigslist, EstateSales.net, Eventbrite, and custom sites), uses Claude Haiku to score every listing, and delivers scored deals via search, digests, and alerts. Built for flippers, resellers, and bargain hunters.

The product pivoted in April 2026 from a garage-sale-only aggregator to a source-agnostic deal discovery platform. Garage sales are one source among many. All strategic decisions are documented in `docs/planning/`.

## Commands

```bash
npm run dev          # Local dev server (localhost:3000)
npm run build        # Production build (nextjs)
git push origin master                  # Deploy to production (Vercel auto-deploys)
git push origin polish/monday-deadline  # Deploy to Vercel preview branch
```

No test runner or linter is configured.

## Architecture

### Stack
- **Next.js 14** (App Router) + TypeScript + Tailwind CSS
- **Supabase** PostgreSQL (project: krjbjdaeoluzfsgkheen)
- **Stripe** for payments (3-tier: Free/Pro/Power)
- **Resend** for transactional email and digests
- **Claude Haiku 4.5** for listing enrichment and scoring
- **Claude Sonnet 4.5** for vision tasks (source discovery)
- **NextAuth v4** for auth (Google OAuth + email/password)
- **Vercel** for hosting with 11 cron jobs

Always use TypeScript (not JavaScript) for new files. Deploy target is always Vercel unless stated otherwise.

### Three-Layer Model

```
Marketing Layer    → app/page.tsx, /about, /pro, /blog, /why
Product Layer      → /dashboard, search results, deal feed, signup/login modals
Engine Layer       → app/lib/scrapers/, app/lib/ai/, app/api/cron/
```

### Data Pipeline (The Engine)

```
Sources (CL, Eventbrite, custom sites)
    ↓ Scrapers fetch every 4 hours (6x/day)
    ↓ app/lib/scrapers/craigslist.ts    — SAPI JSON API, free
    ↓ app/lib/scrapers/eventbrite.ts    — LD+JSON from HTML, free
    ↓ app/lib/scrapers/ai-extract.ts    — Haiku parses raw HTML, ~$0.015/page
    ↓
fliply_listings table (Supabase)
    ↓ enrichAllPending() in app/lib/ai/enrich-listing.ts
    ↓ Haiku scores batches of 5 listings (~$0.004/batch)
    ↓ Stores: deal_score, deal_score_reason, ai_tags, ai_description
    ↓
Delivered via:
    → Search API (app/api/listings/route.ts)
    → Weekly digest (app/api/cron/weekly-digest/)
    → Daily deals (app/api/cron/daily-deals/)
    → Instant alerts (app/api/cron/alerts/)
```

### AI Integration (app/lib/ai/)

`claude.ts` exports two functions:
- `callHaiku()` — text-only, cost-optimized (~$0.001/call). Model: `claude-haiku-4-5-20251001`
- `callVision()` — image + text, uses Sonnet (~$0.01-0.03/call). Model: `claude-sonnet-4-5-20250514`

`enrich-listing.ts` batches 5 listings per Haiku call with a system prompt that outputs structured JSON: description, deal_score (1-10), deal_score_reason, tags, resale_flag. Scoring factors: price anomaly (30%), motivation signals (20%), brand detection (20%), listing quality (15%), freshness (15%).

### Authentication

Dual auth system:
- **NextAuth** (`app/lib/next-auth.ts`) — handles Google OAuth sessions
- **Custom JWT** (`app/lib/auth.ts`) — handles email/password signup/login, creates JWT stored as httpOnly cookie `fliply_token`
- Both coexist: `api/auth/me` checks JWT first, falls back to NextAuth session

### Key Database Tables

- `users` — signups with lifecycle (trial/active/lapsed/churned), market_id FK
- `fliply_markets` — 413 US metro markets
- `fliply_sources` — data sources per market (825 pre-seeded CL + Eventbrite)
- `fliply_listings` — scraped listings with AI enrichment columns (deal_score, ai_tags, ai_description, is_hot)
- `fliply_zip_data` — zip code to lat/lng + Craigslist region mapping
- `digest_log` — email delivery tracking

### Cron Schedule (vercel.json)

| Job | Schedule | Key Detail |
|-----|----------|-----------|
| Scrape | Every 4hrs (6x/day) | 300s timeout, scrapes all active+approved sources |
| Weekly digest (Pro) | Thu 5pm UTC | Tier-specific, Pro users get 6hrs early |
| Weekly digest (Free) | Thu 11pm UTC | Free tier |
| Drip emails | Every 5 min | 7-email welcome sequence over 21 days |
| Source discovery | Hourly | Uses Haiku to find new sources for markets |
| Cleanup | Daily 4am | Deactivates failing sources, archives old data |

### Email System (app/lib/email/)

- `send.ts` — Resend wrapper with List-Unsubscribe headers (RFC 8058 compliant)
- `drip-templates.ts` — 7-step welcome-to-convert sequence (Day 0-21)
- All emails include one-click unsubscribe via `app/lib/unsubscribe.ts`

## Critical Patterns

- **All API cron routes MUST have `export const dynamic = 'force-dynamic'`** — Next.js 14 caches GET routes as static by default. Without this, cron endpoints return stale/cached responses.
- **Craigslist uses sapi.craigslist.org JSON API**, NOT RSS. RSS returns 403 from serverless environments.
- **Eventbrite uses LD+JSON scraping** from search pages (their API was deprecated in 2020).
- **Supabase client** (`app/lib/supabase.ts`) uses a custom fetch to bypass Next.js caching.
- **Design tokens live in `app/globals.css`** as CSS custom properties (--bg-primary, --text-primary, --accent-green, etc.). Currently an Apple-inspired light theme.
- **Fonts loaded via `next/font/google`** in layout.tsx: Inter (--font-primary) and JetBrains Mono (--font-mono, for scores/data).

## Pricing Model (Locked)

| | Free | Pro | Power |
|---|---|---|---|
| Price | $0 | $9/mo (founding $5) | $29/mo (founding $19) |
| Searches | 15/day | Unlimited | Unlimited |
| Markets | 1 | 3 | Unlimited |
| AI Score | Number only | Full breakdown | Breakdown + trends |
| Digest | Weekly | Daily + Weekly | Daily + Instant alerts |

Founding member program: 14-day window, price locked for life, tracked via DB flag.

## Planning Docs (docs/planning/)

All strategic decisions are locked in 10 documents. Don't re-debate — execute:

- `PRODUCT-PIVOT.md` — garage sale → deal discovery platform
- `PRICING-MODEL.md` — 3-tier model, founding program, conversion triggers
- `UNIT-ECONOMICS.md` — costs, margins (87-96%), pipeline breakdown
- `COMPETITIVE-LANDSCAPE.md` — no competitor does multi-source + AI scoring
- `SOURCE-STRATEGY.md` — integration priority, FB pointer model, legal framework
- `FEATURE-ROADMAP.md` — 4-phase plan
- `DESIGN-SYSTEM.md` — visual bible (typography, colors, components, banned patterns)
- `PLATFORM-ARCHITECTURE.md` — sitemap, user journeys, dashboard vision
- `LANDING-PAGE-SPEC.md` — 8-section build blueprint
- `OPEN-QUESTIONS.md` — unresolved decisions

## Sprint Execution

Read `docs/ORCHESTRATOR.md` for the current sprint plan with day-by-day tasks.
Read `docs/PROJECT-STATUS.md` for what shipped and what's pending.

## Session Management

After completing work, always generate a session continuation document (summary of what was done, what's left, and a prompt for the next session). Save to `.claude/session-notes/` with date prefix.

## Design Philosophy

- **The product sells itself.** Show scored deals on the page, not marketing copy about scored deals.
- **Zero fabrication.** Every data point on the site must be queryable from the database or verifiable. No fake testimonials, no made-up stats.
- **Confident, not loud.** No HOT badges, no urgency tricks, no emojis, no exclamation marks.
- **One primary CTA per viewport.** Green button is the only CTA color.
- **Score colors tell the story:** Green (9-10), Amber (7-8), Gray (5-6), Dim (1-4). Displayed in JetBrains Mono.

## Lobster Protocol v2 — Easter Egg Breadcrumbs (DO NOT REMOVE)

The site has a 7-level easter egg terminal ("The Lobster Protocol"). Level 7's password is `d33pcl4w`, derived from breadcrumbs hidden across the site. Each breadcrumb is marked with `LOBSTER-PROTOCOL-L7` in a comment. To find them: `grep -r "LOBSTER-PROTOCOL-L7"`.

**Breadcrumb locations (DO NOT modify or remove):**
1. `app/layout.tsx` — Meta tag `<meta name="lobster-protocol-7" content="d33p">` (visible in View Source)
2. `app/globals.css` — CSS variable `--lobster-signal-7: "cl4w"` in `:root` (visible in DevTools)
3. `next.config.js` — HTTP header `X-Lobster-Protocol: cl4w` (visible in Network tab)
4. `app/robots.ts` — Comment with fragment `d33p` (visible in source code)
5. `app/page.tsx` — JSX comment with assembly instructions (visible in source code)
6. `app/components/FlipShell.tsx` — `classified.enc` file content (Level 5+ terminal hint)

**Password:** `d33pcl4w` ("deep claw") — SHA-256: `1e3df84f92691f6a7b74edf1d44d90dee695db183a9819d9036d3c6957d33f6b`
**Env var:** `SHELL_LEVEL7_HASH` must be set to the SHA-256 hash above.

If refactoring any of the files above, preserve the `LOBSTER-PROTOCOL-L7` marked lines.

## Installed Skills

### UI/UX Pro Max (`.claude/skills/ui-ux-pro-max/`)
Design intelligence skill with searchable databases: 67 UI styles, 161 color palettes, 57 font pairings, 161 reasoning rules, 99 UX guidelines, 25 chart types, 16 stack-specific guideline files.

**When to use:** Any UI structure, visual design, component creation, or UX review task.

```bash
# Generate full design system recommendation
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "deal discovery marketplace" --design-system -p "Flip-ly"

# Search specific domains
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "accessibility contrast" --domain ux
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "marketplace hero" --domain landing
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "glassmorphism" --domain style

# Stack-specific guidelines
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "performance" --stack nextjs
```

Requires Python 3. Trigger with `/ui-ux-pro-max` or invoke automatically on UI/UX tasks.

### Media Generation (`tools/gen.ts`)
Imagen 4 (images) + Veo 3.1 (video) via Google Gemini API. API key in `.env.local` as `GOOGLE_AI_API_KEY`.

```bash
# Images — Imagen 4
npx tsx tools/gen.ts image "<prompt>" --model fast|standard|ultra --aspect 16:9 --count 4
npx tsx tools/gen.ts image "<prompt>" --model ultra --size 2K --out assets/

# Video — Veo 3.1
npx tsx tools/gen.ts video "<prompt>" --model lite|fast|full --res 720p|1080p|4k --duration 8
npx tsx tools/gen.ts video "<prompt>" --from-image source.png --model fast

# Batch jobs
npx tsx tools/gen.ts batch tools/batch-example.json

# Pricing reference
npx tsx tools/gen.ts cost
```

**Pricing:** Images $0.02-0.06 each. Video $0.05-0.60/sec. Prepaid credits ($25 loaded, auto-reload on).

**Standalone entry points also available:**
- `npx tsx tools/generate-image.ts "<prompt>" [options]`
- `npx tsx tools/generate-video.ts "<prompt>" [options]`

Generated files save to `generated/` (gitignored). Functions are importable for use in scripts/workflows.

**Prompt quality matters.** Veo is "garbage in, garbage out" — always reference `docs/reference/veo-prompt-guide.md` before crafting video prompts and `docs/reference/imagen-prompt-guide.md` for image prompts. Include camera movement, lighting, atmosphere, and audio cues for video. Include subject, context, style, and quality modifiers for images.

## Rules

- Never expose API keys in code or commits
- Never delete user data without explicit approval
- Test endpoints after deploy (curl the route, check 200)
- No fake data on any page — real DB numbers or nothing
- Follow design tokens in globals.css for all visual decisions
- Keep the lobster. Always keep the lobster.
