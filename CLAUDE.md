# flip-ly.net

AI-powered garage sale discovery platform. Professional SaaS aesthetic, serious deal-finding engine underneath.

## Session Protocol
**START of every session:** Read `docs/SESSION-PLAYBOOK.md` and `docs/PROJECT-STATUS.md` before doing anything.
**DURING session:** Update PROJECT-STATUS.md as tasks complete. Log decisions in SESSION-PLAYBOOK.md.
**END of every session:** Update both docs with what shipped, what's pending, and any decisions made. Leave "PICK UP HERE" notes for anything half-done.

## Stack
- **Framework:** Next.js 14 (App Router) + TypeScript
- **Styling:** Tailwind CSS
- **Database:** Supabase (project: krjbjdaeoluzfsgkheen)
- **Hosting:** Vercel (auto-deploys on push to master)
- **Email:** Resend
- **AI:** Anthropic Claude Haiku 4.5 (listing enrichment)
- **Auth:** NextAuth v4 (X/Twitter + Google OAuth)
- **Payments:** Stripe
- **Alerts:** Telegram @fliplyalert_bot

## Commands
- `npm run dev` — local dev server
- `npm run build` — production build
- `git push origin master` — triggers Vercel deploy

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
scripts/        — Content pipeline (buffer-analytics.js, content-pipeline.js, generate-ideas.js)
```

## Key Patterns
- All API cron routes MUST have `export const dynamic = 'force-dynamic'` (Next.js 14 caches GET routes as static by default)
- Supabase client: `app/lib/supabase.ts`
- Auth: `app/lib/auth.ts` + `app/lib/next-auth.ts`
- AI enrichment: `app/lib/ai/enrich-listing.ts` (scores deals 1-10, generates descriptions, tags)

## Database Tables
- `users` — signups with lifecycle (trial/active/lapsed/churned)
- `fliply_markets` — geographic markets
- `fliply_sources` — data sources per market
- `fliply_listings` — scraped listings + AI enrichment columns (deal_score, ai_tags, ai_description)
- `fliply_zip_data` — zip → lat/lng + CL region mapping
- `fliply_feedback` — user feedback widget submissions
- `digest_log` — email delivery tracking

## Rules
- Never expose API keys in code or commits
- Never delete user data without explicit approval
- Test endpoints after deploy (curl the route, check 200)
- Craigslist uses sapi.craigslist.org JSON API, NOT RSS (RSS returns 403 from serverless)
- Eventbrite uses LD+JSON scraping from search pages (API deprecated 2020)
- Keep the lobster. Always keep the lobster.
