# flip-ly.net — Medium-Term Architecture Plan

**Created**: 2026-04-03
**Status**: Discussed & approved in principle. NOT built yet — for future sessions.
**Context**: After completing the email pipeline audit, market activation, and discovery pipeline fixes, these are the next architectural improvements to make the platform more resilient and scalable.

---

## 1. Pre-Seed CL + Eventbrite for All 414 Markets

**Problem**: Currently, CL and Eventbrite sources are "discovered" per-market on first signup via `discoverSourcesForMarket()`. This is fragile — it runs fire-and-forget, can fail silently, and creates a cold-start delay for new users.

**Solution**: Run a one-time SQL migration that pre-inserts CL + Eventbrite sources for all 414 markets in `fliply_markets`. These are known infrastructure — there's nothing to "discover."

**Implementation**:
```sql
-- For each market, insert CL source using cl_subdomain
INSERT INTO fliply_sources (market_id, name, source_type, url, is_active, is_approved, trust_level)
SELECT id, CONCAT(display_name, ' Craigslist'), 'craigslist_rss',
       CONCAT('https://', cl_subdomain, '.craigslist.org/search/gms?format=rss'),
       false, true, 'approved'
FROM fliply_markets
WHERE cl_subdomain IS NOT NULL
ON CONFLICT DO NOTHING;

-- Eventbrite for each market using city/state
INSERT INTO fliply_sources (market_id, name, source_type, url, is_active, is_approved, trust_level)
SELECT id, CONCAT(display_name, ' Eventbrite'), 'eventbrite_api',
       CONCAT('https://www.eventbriteapi.com/v3/events/search/?location.address=', display_name, '&q=garage+sale+estate+sale'),
       false, true, 'approved'
FROM fliply_markets
ON CONFLICT DO NOTHING;
```

**Key detail**: Sources are inserted with `is_active: false`. They only flip to `is_active: true` when a user signs up in that market (existing `increment_market_user_count` RPC handles this). This avoids scraping 414 empty markets.

**Impact**: Eliminates the fire-and-forget discovery race condition. New signups in any market instantly have working sources.

**Also set** `sources_discovered_at = NOW()` on all markets so the discovery pipeline doesn't re-run and create duplicates.

---

## 2. Move Claude Local Source Research to Hourly Cron

**Problem**: `discoverSourcesForMarket()` calls Claude Haiku to research local data sources (permit databases, local listing sites, etc.) in a fire-and-forget Promise during signup. If it fails, times out, or Vercel kills the function — there's no retry, no logging, no way to know it failed.

**Solution**: Decouple AI research from the signup flow. Create a lightweight cron that:
1. Queries markets where `sources_discovered_at IS NULL` or `local_sources_researched_at IS NULL`
2. Runs Claude research for 1-2 markets per invocation (to stay under timeout)
3. Stores results as pending sources with TG alerts
4. Marks the market as researched

**New cron**: `/api/cron/discover-sources` — runs hourly
**New column**: `fliply_markets.local_sources_researched_at` (nullable timestamp)

**Benefits**:
- Retry on failure (next hour picks it up again)
- Observable via scrape_sessions or a new discovery_log table
- Doesn't slow down signup response time
- Can be rate-limited to avoid Claude API cost spikes

**Signup change**: `discoverSourcesForMarket()` stops calling Claude inline. It only sets `sources_discovered_at` and activates pre-seeded CL/Eventbrite sources. The cron handles the rest.

---

## 3. Auto-Approve Sources with High AI Confidence

**Problem**: Claude-discovered sources sit in `is_approved: false` until Keith manually approves via Telegram. This creates a bottleneck — especially as markets scale beyond 5.

**Solution**: Add a 24-hour auto-approve rule:
- Sources with `ai_confidence >= 7` that have been pending for 24+ hours get auto-approved
- Sources with `ai_confidence < 7` still require manual TG approval
- Send a TG summary of auto-approved sources (informational, not blocking)

**Implementation**: Add to the hourly discover-sources cron or create a separate check:
```sql
UPDATE fliply_sources
SET is_approved = true, trust_level = 'auto_approved', approved_at = NOW()
WHERE is_approved = false
  AND ai_confidence >= 7
  AND created_at < NOW() - INTERVAL '24 hours'
  AND source_type != 'craigslist_rss'  -- CL/EB already pre-approved
RETURNING name, market_id, ai_confidence;
```

**Safety**: The 24h delay gives Keith time to manually reject bad sources before auto-approval kicks in. The `trust_level = 'auto_approved'` tag makes them easy to audit later.

---

## 4. Re-Engagement Email Triggers

**Problem**: Users who sign up but never engage (don't open digests, don't search) will churn silently. The current drip sequence ends after 21 days with no further communication besides weekly digests.

**Three triggers to implement**:

### 4a. 14-Day Inactive Email
- **Trigger**: User hasn't opened any email (drip or digest) in 14 days
- **Content**: "Still finding deals near {city}? Here's what you missed" — show 3 top-scored listings from their market
- **Goal**: Re-engage or trigger unsubscribe (clean list health)

### 4b. Opened-But-Never-Clicked Format Change
- **Trigger**: User opens digests but never clicks any listing link (3+ digests)
- **Action**: Switch their digest format to "condensed" (just top 5 with bigger CTAs) instead of the full 10-15 listing format
- **Goal**: Reduce decision fatigue, increase click-through

### 4c. 45-Day Auto-Suppress
- **Trigger**: No opens AND no searches for 45 days
- **Action**: Mark `user_status = 'suppressed'`, stop sending digests (save Resend credits)
- **Recovery**: If they log in or search, auto-reactivate
- **Goal**: List hygiene, deliverability protection

**Data needed**: Track `last_email_opened_at`, `last_email_clicked_at`, `last_search_at` on `fliply_users`. Resend webhooks already feed `email_events` — just need a rollup.

---

## 5. EstateSales.NET Official API Integration

**Problem**: Current `ai_extract` scraper for EstateSales.NET is fragile — it uses Claude to parse HTML, which is expensive and breaks when layouts change. EstateSales.NET has an official API.

**Solution**: New `estatesales_api` source type in the scraper.

**API Details** (to research):
- Check if they have a public API or require partnership
- Expected data: sale dates, address, photos, categories, company name
- Structured data = no AI enrichment needed for basic fields (save Claude costs)

**Impact**: EstateSales.NET is the highest-value source (83-242 listings per market according to research docs). Moving from fragile AI scraping to structured API data would dramatically improve reliability and coverage.

**Priority**: This is Phase 1 of the data source expansion plan (see `docs/ACTION-2026-04-03-data-source-expansion.md`).

---

## 6. Scraper Architecture: `local_site` Handler

**Problem**: 10 sources with `source_type = 'local_site'` were discovered by Claude but have no scraper handler. The scrape cron hits the `default` case and logs errors. These were deactivated as a stopgap.

**Solution**: Build a generic `local_site` scraper that:
1. Fetches the URL
2. Passes HTML to Claude Haiku with a prompt: "Extract garage sale / estate sale listings from this page"
3. Structures results into the standard listing schema
4. Deduplicates against existing listings

**This is essentially what `ai_extract` already does** — so the fix may just be aliasing `local_site` to the `ai_extract` handler in the scraper switch statement. Review if they're truly different or if it was a naming inconsistency from the discovery pipeline.

---

## Implementation Priority Order

| # | Item | Effort | Impact | When |
|---|------|--------|--------|------|
| 1 | Pre-seed CL/EB (SQL migration) | Low | High | Next session |
| 2 | Cron-based discovery | Medium | High | Next session |
| 3 | Auto-approve high confidence | Low | Medium | Next session |
| 4 | `local_site` → `ai_extract` alias | Trivial | Low | Next session |
| 5 | EstateSales.NET API | Medium | Very High | After API research |
| 6 | Re-engagement triggers | Medium | High | After first week of ad data |

---

## Manual Action Item (Keith)

**BEFORE running ads**, update the Vercel environment variable:
```
RESEND_FROM_ADDRESS = "flip-ly.net <hello@flip-ly.net>"
```
Currently set to `"Jeeves at flip-ly.net <jeeves@flip-ly.net>"` — this is the old chaos-mode branding and will confuse ad-acquired users.

**Location**: Vercel Dashboard → flip-ly → Settings → Environment Variables → Edit RESEND_FROM_ADDRESS
