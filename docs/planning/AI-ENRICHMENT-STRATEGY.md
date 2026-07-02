# AI Enrichment Strategy — Right-Sizing for Personal/Family Use

**Status:** Enrichment PAUSED (kill switch active). This doc is the plan to re-enable it safely.
**Date:** 2026-07-02
**Trigger:** Daily AI enrichment limit was hit. Flip-ly now serves just the owner + family, so the commercial-scale pipeline is the wrong shape.

---

## 1. What actually happened

The enrichment pipeline was built for a multi-tenant commercial product (413 markets, 825+ pre-seeded sources, thousands of listings/day). Its scale defaults:

- **Cron cadence:** `/api/cron/enrich` ran every 15 min → **96 runs/day**.
- **Per-run ceiling:** up to **750 listings** sent to Haiku per run.
- **Daily cap:** `ENRICH_DAILY_AI_CAP` defaulted to **3000 AI-scored listings/day**.

For one household shopping maybe 1–3 markets, this is 10–100× more enrichment than the actual need. The "limit reached" was the system doing exactly what it was sized to do — scoring the entire firehose. **The fix is not "raise the cap." It's "stop enriching the firehose."**

### Immediate action taken (this branch)
1. **Kill switch** in `enrichAllPending()` (`app/lib/ai/enrich-listing.ts`): returns immediately unless `ENRICH_ENABLED=true`. No AI calls, no fast-classify, no DB writes while paused.
2. **Cron removed** from `vercel.json` so the paused pipeline doesn't fire every 15 min (it also stopped the per-run backlog query + hot-deal alert sweep).

Scraping, comps, dedup, and the rest of the pipeline are untouched — listings still flow into `fliply_listings`, they just aren't AI-scored until re-enabled.

---

## 2. Reframe: what a personal tool actually needs

Cost was never the binding constraint — at Haiku 4.5 pricing ($1/M input, $5/M output) a full 3000-listing day is only ~$3. The binding constraint is the **daily usage/rate limit on the Anthropic account**, and the fix that respects it best is to **cut the number of listings that ever reach the model**, not to squeeze each call.

A household needs good scores on the *handful of listings it might actually buy* — not on every couch and baby-clothes lot in 400 metros. That single reframe unlocks the highest-leverage methods below.

---

## 3. Methods, ranked by leverage (fresh, unbiased pass)

Ordered by how much they reduce load *per unit of effort*. The top three attack volume at the root; the rest are efficiency multipliers.

### Tier 1 — Attack volume at the source (biggest wins)

**A. Right-size ingestion (highest leverage).**
Restrict scraping to the 1–3 markets the family actually shops and only the high-signal sources. Fewer listings in → proportionally fewer AI calls out. Cutting from 400 markets to 2 is a ~99% volume reduction before a single model call. This is the single most effective lever.
*Effort: low (deactivate sources / markets in `fliply_sources`). Impact: massive.*

**B. Lazy / on-demand enrichment (the unbiased insight).**
Proactive full-corpus enrichment is a *commercial-product* pattern — it exists so paying users get instant scored feeds. A personal tool doesn't need it. **Enrich a listing only when someone actually views or searches it.** For a household running a few searches a day, this drops AI volume by ~95–99% versus scoring everything on ingest. Implementation: move the Haiku call behind the search/detail read path, cache the result on the row (`enriched_at`), and only score the top N unscored results a query surfaces.
*Effort: medium (re-plumb enrich trigger from cron → read path). Impact: massive.*

**C. Aggressive heuristic pre-filter (expand what already exists).**
`fastClassifyCLItems()` already scores obvious junk for free (regex + brand keyword table). Lean into it: make the free heuristic the **default**, and escalate to Haiku **only** for listings that pass a "could actually be a flip" gate — brand/model signal present AND a real (non-placeholder) price. This can keep 80–95% of listings off the model with zero API cost.
*Effort: low–medium (widen the gate logic). Impact: large.*

### Tier 2 — Efficiency multipliers (do these too)

**D. Token-and-dollar cap instead of a listing-count cap.**
The current guardrail counts *listings*, not tokens or dollars. Switch `fliply_ai_usage` to accumulate real `input_tokens`/`output_tokens` (the API returns them on every call) and cap on a **daily $ ceiling** (e.g. $0.50/day). This is a tighter, more honest ceiling that a repost storm can't blow past on a technicality.
*Effort: low. Impact: medium (safety, not volume).*

**E. Bigger batches + a trimmed system prompt.**
Output tokens scale with listing count regardless of batching, but bigger batches amortize the ~1500-token system prompt across more listings and cut request count (fewer chances to trip a rate limit). Trim the prompt itself — it's verbose. Fewer, denser calls.
*Effort: low. Impact: small–medium.*

**F. Prompt caching — but note the catch.**
Anthropic prompt caching would cut the repeated system-prompt input cost ~90%. **However:** Haiku 4.5's minimum cacheable prefix is **4096 tokens**, and the current system prompt is only ~1500 tokens — *below the threshold, so caching silently won't fire.* To use caching you'd first have to grow the stable prefix past 4096 tokens (e.g. fold few-shot examples into it), which only makes sense at higher volume. **At personal scale, caching is not worth it** — Tier 1 makes the call count too low to matter. Documented here so it isn't mistaken for a free win.
*Effort: medium. Impact: negligible at this scale — skip it.*

**G. Dedup before enrich (ordering).**
Ensure the `dedup` cron runs *before* enrichment so cross-source duplicates aren't scored twice. Already have the dedup job — just guarantee ordering.
*Effort: trivial. Impact: small.*

**H. Reduce cadence.**
If any proactive enrichment is kept, run it 2–4×/day, not 96×. Fewer runs, each small — less rate-limit pressure and no repost-storm blowout.
*Effort: trivial (cron schedule). Impact: medium.*

### Tier 3 — Considered and rejected

- **Raise the daily cap / request higher tier limits.** Treats the symptom, scales cost and rate-limit exposure the wrong way for a personal tool. Rejected.
- **Switch to a cheaper model.** Haiku 4.5 is already the cost floor for this quality; a smaller model would degrade scores. Keep Haiku.
- **Fully deterministic (no-AI) scoring.** The comps/price-band system already exists and could carry most of the load; but Haiku's judgment on ambiguous brand/condition cases is the product's edge. Keep AI for the *escalated* cases only (see C), not as a wholesale replacement.

---

## 4. Recommended approach

For a household tool, combine the three Tier-1 levers plus the dollar cap:

1. **Right-size ingestion (A)** — cut to the markets/sources you actually shop.
2. **Lazy enrichment (B)** — score on read, not on a firehose cron.
3. **Heuristic-first gate (C)** — only ambiguous, plausibly-valuable listings reach Haiku.
4. **Dollar-based daily cap (D)** — a real ceiling as a backstop (e.g. $0.50/day).

Expected result: AI volume drops from ~3000 listings/day to **tens per day**, comfortably under any account limit, with scores appearing exactly where a human is looking. Prompt caching and big-batch tuning become irrelevant at that volume — don't invest in them until/unless scale returns.

---

## 5. How to re-enable safely

The kill switch is intentionally **fail-safe (paused by default)**:

- Enrichment stays off until `ENRICH_ENABLED=true` is set in the Vercel project env.
- **Do not** just flip `ENRICH_ENABLED=true` and re-add the old 15-min cron — that restores the exact firehose that hit the limit.
- Re-enable *after* implementing at least levers A + C (and ideally B). When you do re-add a cron, use a low cadence (H) and keep `ENRICH_DAILY_AI_CAP` low (or replace it with the dollar cap, D).

Files involved:
- `app/lib/ai/enrich-listing.ts` — kill switch + `enrichAllPending()` logic.
- `app/api/cron/enrich/route.ts` — cron entry point (still exists; unscheduled).
- `vercel.json` — enrich cron removed.
- `app/lib/ai/claude.ts` — `callHaiku()` (Haiku 4.5, $1/$5 per MTok).
