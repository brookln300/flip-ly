# Flip-ly — Full Audit, Redesign & Strategy

**Date:** 2026-06-20 · **Prepared from:** live DB (Supabase `krjbjdaeoluzfsgkheen`), live site (flip-ly.net), Vercel project, and full repo + code audit. All numbers below are queried from production, not estimated.

---

## 0. The one-paragraph truth

Flip-ly is a **working** product with a **dormant** business. The pipeline runs (8,039 listings, 4,278 added in the last 48h, enrichment live this morning), but the core promise — "AI scores every deal" — is broken: of 2,050 scored listings, **1,878 (92%) are a flat "2"**, only ~17 score ≥7, and **none have ever scored 9–10**. The business has **18 users, 1 paying (~$9 MRR), zero logins in 30 days, zero new signups in 30 days, and half the list has unsubscribed.** Meanwhile it runs on Vercel Pro (~$20/mo) — so it loses money every month. The good news: the real, demonstrable strength (underpriced **retro games & collectibles** in **Dallas**) is genuinely good and is being hidden under a generic "national garage-sale" pitch.

---

## 1. Reality vs. the docs (everything in `docs/` is ~10 weeks stale)

| Claim (docs/site) | Reality (production today) |
|---|---|
| Domain `fliply.net` | **Dead** — `ECONNREFUSED`. Live site is `flip-ly.net`. `fliply.net/.com/.app` are all **registered to others / unavailable**. |
| "$3–6/mo, Vercel Hobby $0" | Vercel **Team plan (Pro, ~$20/mo)** — required by 13 sub-daily crons. Running **at a loss**. |
| "20+ sources, OfferUp, EstateSales.net" | **2 source types only**: `craigslist_rss` (6,038) + `eventbrite_api` (2,001). |
| "413 markets" | 413 configured, **11 active** with data; good data really only in **Dallas**. |
| "AI scores every listing" | 2,050/8,039 scored (**25%**); **92% of those = "2"**; 0 nines/tens. |
| Founding program "14-day window" | Deadline `2026-04-26` — **closed 8 weeks ago**; site still shows founding copy in places. |
| Users / lifecycle funnel | **18 users, 1 paying, 0 active in 30d, 9 unsubscribed, 0 saved deals/searches ever.** |

---

## 2. Bugs & issues that were overlooked

### CRITICAL
1. **Cron auth fails open.** All 13 `/api/cron/*` check `Bearer ${process.env.CRON_SECRET}`. If that env var is ever unset/empty, the header becomes `"Bearer undefined"` and **anyone** can trigger scrapes, Anthropic spend, mass emails, and bulk deletes. → Fail closed: throw at module load if `CRON_SECRET` missing; constant-time compare.
2. **Destructive deletes on transient failures.** `cron/cleanup` and `cron/link-check` hard-`DELETE` listings; link-check deletes after just 2 failed HEADs / a 404. A Craigslist **403/429 block (common) deletes real rows** and can empty the catalog your one paying user sees. → Soft-delete (`is_active=false`); treat 403/429 as "suspect," never "dead"; require more consecutive fails.
3. **Auth empty-hash risk** (`lib/next-auth.ts`). OAuth users are stored with `password_hash:''`; the Credentials provider calls `bcrypt.compare(pw, '')` with **no `$2`-prefix guard** (the custom `login` route has one). Fails safe today, but any malformed hash row becomes a login oracle. → Add the same guard.

### HIGH
4. **Degenerate scoring (the core-value killer).** `lib/ai/enrich-listing.ts` `fastClassifyBulkEvents()` hard-assigns `deal_score:2` to every Eventbrite listing without a resale keyword (skips AI entirely); `fastClassifyCLItems()` hard-assigns 2–3 to brandless CL items. Eventbrite is concerts/classes/networking — so the score column is dominated by "2"s that are not deals at all. → Stop persisting non-deals as scored listings; filter Eventbrite non-resale events out at **scrape** time; track "skipped_ai" separately so `deal_score` reflects only real evaluations.
5. **The landing page sells a product that doesn't exist yet.** The hero's "Here's what a score looks like" card hardcodes a **9** (DeWalt $60 → resells $180–220, 3× margin), but the DB has **zero 9s and one 8**. `FeaturedDeals` filters `is_hot=true` (= score ≥ 8) → at most **1** listing qualifies, usually **0** after date filters, so the homepage "Featured Deals" is effectively empty. This violates the project's own **"zero fabrication"** rule and creates a promise-vs-delivery gap that kills trust on first search.
6. **Free-tier limit is unenforceable + skippable.** Rate-limit counters run only `if (redisUp)`; the Supabase fallback counts `fliply_search_log`, but those inserts are **fire-and-forget with swallowed errors** (the table has **0 rows**). Also the gate only triggers on a non-empty `query` — **filtered browsing returns full results for free**.
7. **Stripe edge cases.** (a) Cancellation downgrade can be missed if neither `metadata.fliply_user_id` nor `stripe_customer_id` matches; `subscription.updated` doesn't handle `canceled`. (b) **No idempotency** on DB writes → Stripe retries can send duplicate "You're on Pro" emails. (c) `checkout.session.completed` update isn't error-checked and still returns 200 → a **paid-but-not-upgraded** user with no retry.
8. **Redis is likely a silent no-op in prod.** `lib/redis.ts` (ioredis) defaults to `localhost:6379` with `lazyConnect`. If `REDIS_URL` isn't set in Vercel, every health check fails silently → the app runs the Supabase fallback on every request, and `price-bands`/`resale-radar` crons hard-503. Verify `REDIS_URL`; log the fallback once.

### MEDIUM / LOW
- **Over-emailing:** 391 sends to 18 users (~21 each); **9 unsubscribed (50%)**, 8 clicks total. Cadence is burning the list and risking Resend domain reputation.
- **`cron/enrich`** has no daily Anthropic spend cap and its `maxListings/batchSize/concurrency` are query-param-overridable — add a hard ceiling and clamp overrides server-side.
- **`discover-sources`** auto-approves AI-suggested URLs (confidence ≥7 after 24h) then server-fetches them → SSRF-ish; keep human approval or use a host allowlist.
- **`claude.ts`** has no timeout/AbortController and no retry/backoff on 429/529 → hung calls stall the batch; failed calls silently leave listings unenriched.
- **Source overclaim** in hero + "How it works" (OfferUp, Facebook Marketplace, Nextdoor, "20+") — none are integrated. Same zero-fabrication problem as the fake 9.
- **Stale founding copy** (deadline passed). **Docs drift** (cookie is `flip-session`, not `fliply_token`; drip "every 5 min" vs `0 */3 * * *`; batch size 5 vs 15). **Dead `cron/alerts`** route still reachable. **`HOT`/emoji in emails** violate the stated design philosophy. **`ADMIN_EMAILS` default** (incl. `knation@gmail.com`) ships in source.
- **DB security advisors:** many `service_role USING(true)` policies (fine for server-side service key) but `anon INSERT WITH CHECK(true)` on `fliply_feedback`, `fliply_search_analytics`, `fliply_shell_attempts` = anon spam surface; `http` + `pg_trgm` extensions in `public` schema.

**Good news from the audit:** Stripe signature verification is present; Anthropic model IDs are current (`claude-haiku-4-5-20251001`, `claude-sonnet-4-5-20250514`); no secrets hardcoded or exposed to the client bundle; all crons have `force-dynamic`.

---

## 3. Drive usage — sequenced, cheap-first

**Hard truth:** with 0 active users, the funnel is moot until the core delivers. Fix the product, then market. Order matters:

1. **Fix scoring first (Week 1).** Drop Eventbrite ingestion; restrict enrichment to Craigslist resale items + estate sales; recalibrate so good finds actually reach 7–10. A feed of real 7–9s is the entire pitch.
2. **Pick the winnable wedge.** The data says the product is a **retro-game & collectibles flip scanner, strongest in Dallas**. Own that narrow, real niche before re-claiming "national garage sales." It's also inherently shareable (r/flipping, r/gamecollecting, retro-gaming TikTok).
3. **Make the site honest (done — see §4).** Honesty *raises* conversion here because the real deals are good.
4. **SEO with substance, not volume.** You already shipped 413 city pages — but thin, data-less city pages won't rank and can attract a Google quality penalty. Point SEO at the **11 markets with real data** + retro-game intent ("underpriced N64 lots Dallas", "where to buy retro games to flip"). Keep the blog (5 posts already indexed).
5. **Distribution where resellers already are.** Reddit (r/flipping, r/Flipping, r/gamecollecting), Facebook reseller groups, a TikTok/Shorts "I found this for $X, it flips for $Y — my app scored it an 8" loop. Zero ad spend; the score reveal is the hook.
6. **Cut email hard.** From ~21/user to a single weekly digest + transactional only. Re-permission the list. Stop the unsubscribe bleed.
7. **One lead magnet:** a public, no-login "What's this worth to flip?" lookup → email capture → digest. 

KPI to watch isn't signups — it's **7-day retention** and **saved deals/searches** (currently both literally zero).

---

## 4. The redesign (delivered)

**File:** `docs/redesign/index.html` (also `landing-v3.html`) — a standalone, fully-branded landing page. Verified rendering on desktop (1280) and mobile (375). Reuses your existing tokens (Inter + JetBrains Mono, green `#16a34a`, Apple-light theme) so it ports cleanly into `app/page.tsx`.

What changed and why:
- **Honest hero:** "Underpriced local deals, scored before you scroll." Sources stated truthfully (Craigslist + events, expanding). Proof line uses **real DB numbers** (8,039 tracked · 69 feeds · 4,278 new/48h).
- **"This isn't a demo. These are live."** — a grid of the **actual top-scored listings** (JetPong $3,000, PSVR $220, Halo Reach 360, N64 lot, Sega 32X…) with their real scores and AI reasoning. Replaces the fabricated DeWalt 9.
- **Color-coded score chips** (green 7–10, amber 5–6, gray ≤4) so the score system reads instantly and matches what users will actually see.
- **Removed anti-proof** ("18 members") and stale founding copy. Pricing is the live reality: Free + Pro **$9** ("Most popular").
- **Kept the brand:** lobster, and a subtle "▸ enter 90s mode" footer link to the retro experience (the easter egg / Lobster Protocol stays).

**Next loop (needs your go-ahead — touches the live site):** port this into `app/page.tsx`, delete the hardcoded fake-9 card and the empty `FeaturedDeals` gating, and wire the live-deals grid to a real query (`deal_score >= 7 order by deal_score desc`). I did **not** modify the production page without approval.

---

## 5. Cost minimization (concrete)

Current realistic floor ≈ **$20–25/mo** (Vercel Pro $20 + domain ~$1 + Anthropic ~$3–5) against **~$9 MRR → monthly loss.**

- **Drop Eventbrite ingestion.** It scrapes 2,001 events to auto-junk ~94% as "2." Removing it cuts scrape function-time, Anthropic pre-filtering, and DB rows — and cleans the feed. Biggest single win.
- **Cap enrichment spend.** Add a hard daily Anthropic call ceiling; only enrich CL resale items. (No cap exists today.)
- **Consolidate crons.** 13 sub-daily crons force the Pro plan. Merge into a single dispatcher cron where possible. You won't fit Vercel Hobby (daily-only crons) with this product, so plan on **staying Pro $20** — but make sure you're getting $20 of value (you currently aren't, because of the loss).
- **Supabase** is comfortably inside free tier (DB is tiny). Add the cleanup of `fliply_search_log` only after you fix the swallowed writes (right now it's empty anyway).
- **Email:** cutting cadence also protects your Resend free tier and sender reputation.

---

## 6. Sale / packaging feasibility & price points

**Can you sell it? Yes — but be honest about *what* you're selling.** It is **not** a revenue-multiple SaaS sale: $9 MRR, 1 customer, 0 growth → a revenue buyer values the *business* at ~$0.

What actually has value:
- **The codebase/IP:** a real, working scrape → AI-score → deliver pipeline with Stripe, dual auth, Resend drip/digest, blog/SEO scaffold, ~140 files. This is a sellable "build."
- **The data:** 8k listings, 927 sources, 413 markets + 309 zips pre-mapped.
- **The brand & assets:** `flip-ly.net`, X/IG/TikTok `@ctrl_alt_flip`, the lobster/Lobster-Protocol gimmick.
- **The niche insight:** retro-game flipping is a real, underserved wedge.

**Price points (honest framing):**

| Path | What you sell | Realistic range | Where |
|---|---|---|---|
| **Sell now, as-is** | Code + domain + data, pre-revenue | **$2,000–5,000** | Flippa, Acquire.com, Tiny |
| **Code/template only** | "AI deal-scanner boilerplate" | $500–2,000 | Gumroad, Flippa |
| **Fix + prove, then sell** | Micro-SaaS w/ ~$300–500 MRR & real retention | **$10,000–20,000** (3–4× annual profit) | Acquire.com |
| **Keep & operate** | Cash-flow micro-SaaS | n/a — best ROI if the wedge works | — |

**Recommendation:** **Don't sell now** — you'd get scrap value. Spend **2–4 focused weeks**: (1) fix scoring, (2) ship the honest redesign, (3) prove the Dallas retro-game wedge to ~20–50 paying users / $300–500 MRR with measured 7-day retention. *Then* you either have a defensible **$10–20k** listing on Acquire, or a small business worth keeping. If you must exit this month, list **code + domain + data at $2,500–4,000** on Acquire/Flippa, described honestly as a pre-revenue build with a working pipeline.

---

## 7. Suggested 2-week execution order

**Week 1 — make it true and safe:** fix cron fail-open + soft-delete (criticals) · drop Eventbrite · recalibrate scoring · clear the score backlog · add Anthropic daily cap · verify `REDIS_URL`.
**Week 2 — make it convert:** port the honest redesign into `app/page.tsx` · wire live-deals grid to real ≥7 listings · cut email cadence + re-permission · point SEO at the 11 real markets + retro-game intent · post the first 3 "score reveal" clips to r/flipping + TikTok.

Then reassess: keep operating, or list for sale with real retention numbers behind it.
