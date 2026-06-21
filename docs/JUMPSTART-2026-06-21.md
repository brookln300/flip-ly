# Flip-ly — Jumpstart Session Reference (2026-06-21, Sunday)

> **Purpose:** single source of truth for the re-activation work done tonight and the runbook to pick it back up tomorrow. Start any new session by reading this file. All numbers are queried from live production (Supabase `krjbjdaeoluzfsgkheen`, flip-ly.net, Vercel), not estimated. Builds on `docs/AUDIT-AND-REDESIGN-2026-06-20.md`.

---

## 0. TL;DR

- Flip-ly was **stale ~6 weeks**. Prod stayed live the whole time; the **AI core was dead**.
- **Root cause:** the `ANTHROPIC_API_KEY` in Vercel is invalid (401). Last real AI score was **2026-05-21**. New listings got no score/price/description; a fallback stamped flat "2"s → 91% of the score column was junk.
- **Tonight we cleaned it up and shipped onboarding fixes to prod** (PR #8, merged, verified). Homepage now leads with real retro/collectible deals (JetPong 8, Halo Reach 7, Pokémon 7).
- **The one thing still blocking full recovery is the API key — only Keith can rotate it** (see §3). Everything else is done or queued behind it.

---

## 1. State as of tonight (live snapshot)

| Metric | Value | Note |
|---|---|---|
| Listings (total) | **6,752** | was 8,749 before Eventbrite purge |
| Scored (`deal_score` not null) | 192 | real evaluations only now |
| Unscored backlog (`enriched_at` null) | **6,560** | waits on key rotation → backfill |
| Score ≥ 7 | 17 | the retro/collectible high-scorers |
| Score ≥ 5 | 100 | what the homepage grid draws from |
| Score = 2 (junk) | 20 | was 1,863 before EB purge |
| With price | 2,889 (43%) | price extraction still partial |
| Active sources | 40 of 927 | Craigslist (39) + ai_extract (1); EB off |
| Eventbrite listings | **0** | deleted tonight |
| Users | 18 | 1 paying (~$9 MRR), 0 signups/logins 30d |
| Active markets | 11 of 413 | real data strength = Dallas |
| Last real AI enrich | **2026-05-21** | confirms key dead ~4–5 weeks |
| Prod | `d8db537` live | homepage ~0.66s, API ~0.9s |

---

## 2. What we did today

### Analysis (fresh, no-bias; cross-checked vs the June 20 audit)
- Located the codebase (it lives on GitHub `brookln300/flip-ly`; nothing was checked out locally).
- Verified live prod, DB, git history, security/perf advisors, score distribution.
- Diagnosed the dead-key root cause and confirmed it independently (last real score 2026-05-21).

### Shipped to prod — PR #8 (`d8db537`), build green, `tsc` clean
| Change | Detail |
|---|---|
| **Deleted Eventbrite** | 29 active sources deactivated + 1,997 listings deleted. Catalog 8,749→6,752; junk "2"s 1,863→20; `event`-type rows ~1,997→0. Removed from scrape pipeline, enrichment fast-classifier, landing copy, and API `_meta`. |
| **Never-empty deals grid** | `getFeaturedDeals` threshold 7→5 (only 17 ≥7 exist), 14-day window. High scores still order first; grid stays full of genuine scores. |
| **Fixed login refetch** | `FeaturedDeals` used `hot=true` (score ≥8) → emptied grid in most markets. Now top-scored browse. |
| **Retro/Dallas framing** | Hero + how-it-works lead with the proven wedge; added retro-game/collectible signals (N64, SNES, Sega, graded cards, sealed LEGO…) to the scoring pre-filter so they route to AI instead of being junk-classified. |
| **Docs** | `VISION.md`, this file. |

### Verified live after deploy
- Homepage 200 @ 0.66s; "Top deals" + "Dallas–Fort Worth" present; "Eventbrite" gone.
- `/api/listings` → `sources: ['craigslist']`, 6,525 browseable, top results: JetPong (8) $3000, Halo Reach 360 (7) $150, Pokémon Sun sealed (7) $40.

### Housekeeping
- Fixed an accidental nested-git mishap: the real clone is isolated at `workspace/flip-ly-app`; Keith's `workspace/` operational files were left untouched (see §8).

---

## 3. ⚠️ THE UNBLOCK — rotate the Anthropic key (Keith only, ~5 min)

Nothing new gets scored until this is done.

1. Vercel → project **flip-ly** (team `aether-core-ai`) → **Settings → Environment Variables**
2. Edit **`ANTHROPIC_API_KEY`** → paste a fresh valid key → scope **Production** → Save
3. **Redeploy** (Deployments → latest → Redeploy) — or just tell the next session; the enrich cron picks it up on its next run.

The code self-heals and alerts once the key is valid (June 20 hardening: fails fast + logs loudly on 401/403). Sanity check after rotating: a fresh value of `last_real_ai_enrich` in the DB, or new `deal_score`s on recent listings.

---

## 4. Backfill runbook (run after the key is valid)

6,560 unscored Craigslist listings are waiting.

- **Trigger manually:** `GET https://flip-ly.net/api/cron/enrich` with header `Authorization: Bearer $CRON_SECRET`.
- **Or let it ride:** the enrich cron runs every 15 min (`vercel.json`), ~750 listings/run. Backlog clears in a few hours.
- **Verify:** re-run the §1 snapshot query — expect `score_7plus` and a real 8–10 tail to grow, `unscored_backlog` to shrink. Homepage grid + search fill with genuine high-score deals.
- **Watch cost:** enrichment has no hard daily Anthropic cap yet (audit HIGH item) — add one before a big uncapped run if budget matters.

Snapshot query (paste into Supabase SQL or ask the next session to run it):
```sql
select json_build_object(
  'listings_total',(select count(*) from fliply_listings),
  'scored',(select count(*) from fliply_listings where deal_score is not null),
  'unscored_backlog',(select count(*) from fliply_listings where enriched_at is null),
  'score_7plus',(select count(*) from fliply_listings where deal_score>=7),
  'last_real_ai_enrich',(select max(enriched_at) from fliply_listings where deal_score not in (2,3))
);
```

---

## 5. Architecture & access map

- **Repo:** `github.com/brookln300/flip-ly`, prod branch **`master`**. `gh` authed as `brookln300` (SSH).
- **Local clone:** `C:\Users\knati\.openclaw\workspace\flip-ly-app` (its own `.git`).
- **Hosting:** Vercel, team **`aether-core-ai`**, project **flip-ly**, region iad1, Pro plan (~$20/mo).
- **DB:** Supabase project **`krjbjdaeoluzfsgkheen`** (accessible via Supabase MCP).
- **Stack:** Next.js 14 App Router · TypeScript · Tailwind · Supabase · Stripe · Resend · Claude Haiku (enrichment/scoring).
- **Pricing:** Free + Pro ($5 founding / $9 regular). Power hidden via `NEXT_PUBLIC_POWER_VISIBILITY`. Founding variant via the founding snapshot helper.
- **Crons (`vercel.json`):** scrape (6×/day), enrich (every 15 min), weekly-digest (Thu), cleanup, link-check, discover-sources, drip, daily-summary, morning-briefing, price-bands, resale-radar, daily-deals.
- **Key files:** `app/page.tsx` (landing), `app/dashboard/page.tsx`, `app/pro/page.tsx`, `app/api/listings/route.ts` (search/feed), `app/lib/ai/enrich-listing.ts` (scoring), `app/api/cron/*`, `app/lib/scrapers/*`.
- **Social:** `@ctrl_alt_flip` (X / Instagram / TikTok).

---

## 6. Remaining backlog (sequenced)

| # | Item | Owner | Autonomy | Notes |
|---|---|---|---|---|
| 1 | Rotate API key | Keith | — | §3. Unblocks everything. |
| 2 | Run backfill + verify | Claude | GREEN | §4. After #1. |
| 3 | Onboarding polish | Claude | YELLOW | Default new users → Dallas; first-run "evaluate a deal in 60s"; mobile-first audit vs VISION. |
| 4 | Analytics funnel capture | Claude | GREEN/YELLOW | `fliply_search_log` empty (writes swallowed). Wire search→view→signup→save; watch 7-day retention + saved-deal rate. VISION focus area. |
| 5 | Email cadence cut | Keith decides | **RED** | ~50% unsubscribed from over-sending. Cut to weekly + transactional, re-permission. **No sends to real users without explicit ok.** |
| 6 | Cost / cron consolidation | Keith decides | — | Runs at a loss ($20 vs $9). Optional: trim crons, add Anthropic spend cap. |
| 7 | SEO substance | Claude | GREEN | Point at the 11 real markets + retro-flip intent; the 413 thin city pages risk a quality penalty. |
| 8 | Price extraction | Claude | GREEN | Only 43% have price; improve CL/AI price parsing. |

---

## 7. Landmines / gotchas (read before touching anything)

- **Dead-key signature:** AI batches "run" but everything scores 2/low and `last_real_ai_enrich` is stale → suspect `ANTHROPIC_API_KEY` (401), not the code.
- **Nested-repo trap:** `C:\Users\knati\.openclaw\workspace\` is *itself* a git repo (unborn master). The empty `workspace\flip-ly` subdir has **no `.git`**, so git commands there walk up to the workspace repo and pollute it. **Always work in `workspace\flip-ly-app`** (it has its own `.git`).
- **Eventbrite is retired** — do not re-enable EB sources or re-add the scraper case; it floods the feed with non-resale "2"s.
- **Crons fail closed** on missing `CRON_SECRET` (by design, June 20). Manual cron triggers need the `Bearer` header.
- **Destructive crons** (`cleanup`, `link-check`) were hardened to soft-delete; don't revert to hard `DELETE` — a transient Craigslist 403/429 must not wipe the catalog.
- **Postgres CTE deletes** return the *pre-delete* snapshot in the same statement — always re-query to confirm counts (bit us tonight; deletion was fine).
- **DB security advisors** are mostly expected: `service_role USING(true)` policies are normal for the server service key. Real items to watch: anon-`INSERT` spam surface on `fliply_feedback` / `fliply_search_analytics` / `fliply_shell_attempts`, and `http`/`pg_trgm` extensions in `public`.
- **Redis** may be a silent no-op if `REDIS_URL` is unset in Vercel → rate-limit + price-band paths degrade to Supabase fallback. Verify it's set.
- **Founding copy** window closed 2026-04-26 — make sure no stale "14-day founding" claims resurface.

---

## 8. VISION recap (the bar we build against)

Targets: page load **<2s** (currently ~0.66s ✓) · **mobile-first** responsive · deal accuracy **>85%** · user finds + evaluates a deal in **<60s**.
Non-goals (for now): social features · native mobile app · international expansion.
Full text: `VISION.md`.

---

## 9. Tomorrow — copy-paste kick-start prompts

Each is self-contained; every one tells the session to read this doc first.

**▶ Fastest path (if you rotated the key tonight/this morning):**
```
Resume flip-ly. Read docs/JUMPSTART-2026-06-21.md first. I rotated the ANTHROPIC_API_KEY
in Vercel. Trigger the enrichment backfill (GET /api/cron/enrich with Bearer $CRON_SECRET),
then verify real 7–10 deal scores populate the homepage grid and /api/listings. Report the
new score distribution before/after.
```

**▶ If the key is NOT rotated yet:**
```
Resume flip-ly. Read docs/JUMPSTART-2026-06-21.md. I have NOT rotated the Anthropic key.
Walk me through exactly where in Vercel to do it, confirm it took effect, then run the
backfill and verify.
```

**▶ Morning health check (always safe to run first):**
```
Flip-ly morning health check. Read docs/JUMPSTART-2026-06-21.md. Verify: prod homepage <2s,
API healthy, enrichment running (last_real_ai_enrich recent), scrape sources not mass-failing,
no cron errors in Vercel logs. Report red flags only.
```

**▶ Onboarding (product):**
```
Flip-ly onboarding pass. Read docs/JUMPSTART-2026-06-21.md. Implement: default new/anon users
to the Dallas–Fort Worth market, add a first-run "evaluate your first deal in 60s" path, and do
a mobile-first responsive audit of the homepage + dashboard against VISION.md. Preview before prod.
```

**▶ Analytics (VISION focus):**
```
Flip-ly analytics setup. Read docs/JUMPSTART-2026-06-21.md. fliply_search_log is empty because
writes are fire-and-forget/swallowed. Wire reliable funnel capture (search → result view →
signup → save) and give me a simple query/dashboard for 7-day retention and saved-deal rate.
```

**▶ Email cleanup (decide first — touches real users):**
```
Flip-ly email cleanup. Read docs/JUMPSTART-2026-06-21.md. ~50% of the list unsubscribed from
over-sending. Propose a cut to weekly digest + transactional only, plus a re-permission plan.
Do NOT send anything to real users until I approve.
```

**▶ Growth / the wedge:**
```
Flip-ly growth. Read docs/JUMPSTART-2026-06-21.md. Build the retro-games/collectibles + Dallas
wedge: a shareable "found for $X, flips for $Y, scored N" artifact and an SEO pass targeting the
11 real markets + retro-flip intent. Plan first, no spend.
```

---

## 10. Decisions pending from Keith

- **Email cadence cut** (RED — real users): approve weekly+transactional + re-permission?
- **Cost:** accept the ~$20/mo loss while proving the wedge, or trim crons / add Anthropic spend cap now?
- **Wedge scope:** how far to commit to retro/Dallas in SEO + marketing vs keeping broad national framing?
- **Founding/pricing:** confirm the live pricing variant is what you want now that the founding window has closed.

---
*Session: 2026-06-21. Author: Claude (Opus 4.8) with Keith. Prior context: `docs/AUDIT-AND-REDESIGN-2026-06-20.md`.*
