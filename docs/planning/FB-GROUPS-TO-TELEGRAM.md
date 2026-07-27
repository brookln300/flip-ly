# Architecture — Facebook "Free Stuff" Groups → Telegram Digest

**Created:** 2026-07-27
**Status:** PROPOSED
**Owner:** Keith
**Relates to:** `SOURCE-STRATEGY.md` (Decision #3 — Facebook is pointer model, not pipeline)

---

## Goal

Surface free-item posts from Facebook groups you already belong to (Buy Nothing,
"Free Stuff <Metro>", curb-alert groups) and deliver clean, deduped summaries into
a Telegram group — with Claude Haiku doing the classification and summarization
that the rest of Flip-ly already uses.

## The constraint we're designing around (read this first)

Two hard facts shape every decision below:

1. **There is no compliant server-side API for reading group feeds.** Facebook's
   Graph API group-feed read permissions (`/group/{id}/feed`) were deprecated and
   shut down years ago. There is no OAuth scope you can request in 2026 that lets a
   server read arbitrary group content. So "just call the API" is not on the table —
   not because we didn't look, but because the endpoint no longer exists.

2. **Our own strategy already ruled out scraping FB with a headless bot.**
   `SOURCE-STRATEGY.md` Decision #3 is LOCKED: Facebook = pointer model, not scraping.
   The Legal Risk Framework rates FB **High** ("active anti-scraping, account bans,
   litigation history"). A headless account that dodges bot-detection is exactly the
   fragile, bannable foundation that doc rejects — it works until a checkpoint kills
   the account, and then the Telegram feed silently dies with no warning.

**Design consequence:** we do **not** build an unattended scraper and we do **not**
build an anti-detection layer (proxy rotation, fingerprint spoofing, motion emulation,
account warming). Instead we put a **real human session — yours — in the loop for the
one step that must touch Facebook**, and automate everything downstream. This is more
robust, not just more compliant: your normal, human, logged-in browsing never trips
automation heuristics because it isn't automation.

---

## Architecture overview

```
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 1 — CAPTURE  (runs in YOUR real, logged-in browser session)     │
│                                                                       │
│  Browser extension / userscript                                       │
│   • Activates only on facebook.com/groups/* pages you open yourself   │
│   • Reads posts already rendered in the DOM you are looking at         │
│   • No auto-scroll harvesting, no background tabs, no headless run     │
│   • "Send free finds" button (or passive collect while you scroll)    │
│   • POSTs captured post payloads to Flip-ly ingest endpoint           │
└───────────────────────────────┬───────────────────────────────────────┘
                                 │  HTTPS + shared secret
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 2 — INGEST  (Next.js API route, Vercel)                         │
│   POST /api/ingest/fb-post                                            │
│   • Auth via X-Ingest-Token header                                    │
│   • Normalizes payload, computes content hash for dedupe              │
│   • Upserts into fb_free_posts (status='pending')                     │
└───────────────────────────────┬───────────────────────────────────────┘
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 3 — CLASSIFY + SUMMARIZE  (cron, every 10 min)                  │
│   /api/cron/fb-free-digest                                           │
│   • Pulls pending rows, batches 5/call (mirrors enrich-listing.ts)    │
│   • callHaiku(): is_free? item, condition, location, pickup, link     │
│   • Drops non-free / expired / duplicate-of-earlier posts             │
│   • Writes summary + status='ready'                                   │
└───────────────────────────────┬───────────────────────────────────────┘
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 4 — DELIVER  (same cron tail, or separate)                      │
│   • Telegram Bot API sendMessage to your group chat_id                │
│   • Markdown card: item · area · pickup window · [Open post →]        │
│   • Marks status='sent', records message_id                           │
└─────────────────────────────────────────────────────────────────────┘
```

The only component that touches Facebook is Step 1, and it runs inside the session
you're already using as a human. Steps 2–4 are ordinary Flip-ly infrastructure —
the same Next.js + Supabase + Haiku + cron shape you already run for Craigslist and
Eventbrite.

---

## Why the browser extension (not a headless scraper)

| | Headless bot + evasion (rejected) | Extension in your session (chosen) |
|---|---|---|
| Touches FB as | A fake automated client pretending to be human | You, actually browsing |
| Bot detection | Constant cat-and-mouse; bans are when, not if | N/A — it's a real human session |
| Data access | Only public/guessable; groups are semi-private | Exactly the groups you're a member of |
| Maintenance | Breaks on every anti-bot update | Breaks only on DOM changes (a selector fix) |
| Legal posture | Violates ToS + our locked Decision #3 | You reading your own groups; forwarding by hand-in-the-loop |
| Failure mode | Silent account death | A button stops working; you notice immediately |

The extension is deliberately **passive and human-paced**: it reads what your browser
has already loaded because *you* scrolled to it. It does not open background tabs,
does not auto-scroll to harvest, and does not run when you're not looking. That
boundary is the whole point — it assists a human, it does not replace one.

---

## Data model

```sql
CREATE TABLE fb_free_posts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_hash  TEXT UNIQUE NOT NULL,     -- sha256(group_id + author + text) for dedupe
  group_id      TEXT,                     -- FB group id (from URL)
  group_name    TEXT,
  post_url      TEXT,                     -- permalink the user was viewing
  author_name   TEXT,
  raw_text      TEXT NOT NULL,            -- post body as captured
  image_urls    TEXT[],                   -- CDN image urls present in the post
  captured_at   TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- filled by the classify step
  is_free       BOOLEAN,
  item_summary  TEXT,                     -- "Free 3-seat sofa, good condition"
  location_hint TEXT,                     -- "Oak Cliff, near Bishop Arts"
  pickup_note   TEXT,                     -- "porch pickup, gone by Sunday"
  ai_reason     TEXT,

  status        TEXT NOT NULL DEFAULT 'pending', -- pending → ready → sent | rejected
  tg_message_id BIGINT,
  processed_at  TIMESTAMPTZ,
  sent_at       TIMESTAMPTZ
);

CREATE INDEX idx_fb_free_status ON fb_free_posts (status, captured_at);
```

`content_hash` is the dedupe key: if you scroll past the same post twice, or two
group members cross-post the same couch, we classify and deliver it once.

---

## Ingest endpoint contract

`POST /api/ingest/fb-post` (`export const dynamic = 'force-dynamic'` — cron/API rule)

```jsonc
// Request body (one post; extension may also POST an array)
{
  "group_id": "1234567890",
  "group_name": "Buy Nothing Oak Cliff",
  "post_url": "https://www.facebook.com/groups/1234567890/posts/9988/",
  "author_name": "A Neighbor",
  "raw_text": "Free sofa, gray 3-seater, pet-free home. Porch pickup off Bishop Ave...",
  "image_urls": ["https://scontent.../sofa.jpg"],
  "captured_at": "2026-07-27T15:04:00Z"
}
```

- **Auth:** `X-Ingest-Token: <secret>` compared against `FB_INGEST_TOKEN` env var.
  Reject with 401 otherwise. The extension stores this token in its own settings.
- **Dedupe:** compute `content_hash`; `upsert ... on conflict (content_hash) do nothing`.
- **Response:** `{ accepted: n, duplicates: m }`.

## Classification prompt (reuses `callHaiku`)

Batch 5 posts per call, exactly like `enrich-listing.ts`. System prompt asks for
strict JSON:

```
For each post decide is_free (true only if the item is genuinely being given away
for $0 — not "cheap", not "ISO", not "sold"). If free, extract:
  item_summary   one line, no hype, no emoji  (matches Flip-ly voice: confident, not loud)
  location_hint  neighborhood/cross-street if present, else null
  pickup_note    pickup constraints / deadline if present, else null
Return {posts:[{index, is_free, item_summary, location_hint, pickup_note, reason}]}
```

Cost tracks the existing model: ~$0.0008 per post enriched, batched. At even a few
hundred posts/day this is well under a dollar/month.

## Telegram delivery

- Create a bot via **@BotFather**, store `TELEGRAM_BOT_TOKEN` + target
  `TELEGRAM_FREE_CHAT_ID` in env (Vercel + `.env.local`).
- `sendMessage` with `parse_mode: "MarkdownV2"`:

```
🆓 Free 3-seat gray sofa — good condition
Oak Cliff · porch pickup, gone by Sunday
Buy Nothing Oak Cliff
[Open post →](https://www.facebook.com/groups/.../posts/9988/)
```

- On success, store `tg_message_id`, set `status='sent'`, `sent_at=now()`.
- Respect Telegram's ~1 msg/sec per-chat limit — the cron drains the `ready` queue
  with a small delay between sends, so a backlog never trips flood limits.

(Note: the digest card intentionally keeps the FB permalink as the source of truth —
you tap through to FB to claim, which keeps this a **pointer** in spirit, consistent
with Decision #3.)

---

## Cron

Add to `vercel.json`:

| Job | Schedule | Detail |
|-----|----------|--------|
| `fb-free-digest` | every 10 min | classify `pending` → summarize → drain `ready` to Telegram |

Reuses the existing cron auth + `force-dynamic` conventions. No new infra.

---

## What is cleanly buildable right now vs. what needs you

**Buildable today with zero FB risk (I can implement these now):**
- `fb_free_posts` table + migration
- `POST /api/ingest/fb-post` ingest endpoint with token auth + dedupe
- `/api/cron/fb-free-digest` classify + summarize (Haiku) + Telegram delivery
- Telegram bot wiring + env config
- A local `scripts/seed-fb-post.ts` to POST sample payloads so the whole
  pipeline (ingest → classify → Telegram) can be tested end-to-end **without
  touching Facebook at all**

**Your side (the capture step):**
- The browser extension / userscript that runs in your session. This is the one
  piece that reads Facebook, and by design it's driven by you. I can scaffold a
  minimal Manifest V3 extension whose content script activates on
  `facebook.com/groups/*`, reads visible posts, and POSTs them to the ingest
  endpoint — operated by you, human-paced, no background harvesting and no
  detection-evasion tooling.

## Explicitly out of scope (and why)

- **Headless/unattended scraping of FB** — contradicts locked Decision #3, and
  breaks the moment an account is checkpointed.
- **Bot-detection evasion** (residential proxy rotation, fingerprint spoofing,
  human-motion emulation, account warming) — engineering to defeat anti-abuse
  controls; not something we'll build. It also doesn't buy reliability: it buys a
  slower ban.
- **Marketplace scraping** — same posture, already covered by the pointer model.

## Open questions

1. One Telegram group for all your FB groups, or route by category/market?
2. Passive collect-while-scrolling, or an explicit per-post "send this" button in
   the extension? (Explicit button is the most conservative; passive is smoother.)
3. Keep images inline in Telegram, or link-only to keep messages light?
```
