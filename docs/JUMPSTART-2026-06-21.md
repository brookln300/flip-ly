# Flip-ly — Jumpstart Sprint (2026-06-21, Sunday)

Re-activating the project after a ~6-week stall. All numbers below are queried from live production (Supabase `krjbjdaeoluzfsgkheen`, flip-ly.net), not estimated. Builds on the 2026-06-20 audit (`AUDIT-AND-REDESIGN-2026-06-20.md`).

## The stall, diagnosed
- Code: heavy dev Apr 11–24 (launch), then dead until a single recovery commit Jun 20.
- AI core: **last real AI score was 2026-05-21.** Zero real scores in the 30 days since.
- **Root cause: the `ANTHROPIC_API_KEY` in Vercel is invalid (401 in prod logs).** Enrichment can't call the model, so new listings get no score / price / description. The fast-classifier then stamped a flat "2" on the rest.

## The #1 blocker — needs Keith (5 min)
**Rotate `ANTHROPIC_API_KEY` in Vercel → redeploy.** Until then, no new real scores can be generated. The code self-heals and alerts once the key is valid (June 20 hardening). Everything else in this sprint is key-independent and already done.

## Done today (key-independent)
- **Deleted Eventbrite entirely** (decision: it was concerts/classes auto-scored "2"):
  - Deactivated 29 active EB sources (so the scraper won't re-add them).
  - Deleted 1,997 EB listings. Catalog 8,749 → **6,752**; junk "2"s 1,863 → **20**; `event`-type rows ~1,997 → **0**.
  - Removed EB from the scrape pipeline + the enrichment fast-classifier + landing copy + API `_meta`.
- **Homepage deals grid never-empty:** `getFeaturedDeals` now surfaces the best real deals at ≥5 (was ≥7, which returned a near-empty grid given only 17 ≥7 exist). High scores still float to the top; grid fills with genuine scores while the backlog catches up.
- **Fixed FeaturedDeals login refetch:** used `hot=true` (score ≥8) which emptied the grid for most markets → now top-scored browse.
- **Retro/collectibles + Dallas framing:** hero + how-it-works copy lead with the proven wedge; added retro-game/collectible signals (N64, SNES, Sega, graded cards, sealed LEGO, etc.) to the scoring pre-filter so those route to AI instead of being junk-classified.

## Next — the moment the key is valid
1. Run the enrichment backlog: `GET /api/cron/enrich` (auth: `Bearer $CRON_SECRET`). 6,560 unscored CL listings; ~750/run, every 15 min via cron. Real 7–9s will emerge and fill the homepage + search.
2. Verify score distribution shifts (expect real 7–10s within a few runs).
3. Merge this PR → prod, then curl homepage + `/api/listings` to confirm scored deals show.

## Remaining backlog (post-onboarding, sequenced)
- Analytics: `fliply_search_log` writes are fire-and-forget and the table is empty — wire reliable funnel capture (a VISION focus area).
- Email cadence: ~21 sends/user, ~50% unsubscribed — cut to weekly digest + transactional, re-permission.
- Cost: Vercel Pro ~$20/mo vs ~$9 MRR — runs at a loss; revisit after the wedge is proven.
- Mobile/perf pass against VISION targets (<2s load — currently ~0.7s; mobile-first audit).
