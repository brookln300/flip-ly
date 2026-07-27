# FB Free-Stuff → Telegram — Setup & Go-Live Runbook

Step-by-step to get the pipeline working end to end. Do the phases in order —
each one is testable before you move on, so a failure is easy to localize.

Architecture: `FB-GROUPS-TO-TELEGRAM.md`. Branch: `claude/facebook-telegram-analyzer-arch-y8oc28`.

---

## Phase 0 — Local checkout (5 min)

```bash
git checkout claude/facebook-telegram-analyzer-arch-y8oc28
git pull
npm install
```

---

## Phase 1 — Secrets & Telegram bot (15 min)

1. Copy the env template and open it:
   ```bash
   cp .env.local.example .env.local
   ```
2. Fill the values the pipeline needs (the rest of the file can stay as-is for this feature):
   - `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` — from the Supabase project.
   - `ANTHROPIC_API_KEY` — for Haiku classification.
   - `CRON_SECRET` — any secret; used to auth the digest cron.
   - `FB_INGEST_TOKEN` — generate one: `openssl rand -base64 32`. You'll paste this into the extension too.
3. **Create the Telegram bot:**
   - In Telegram, message **@BotFather** → `/newbot` → follow prompts → copy the token into `TELEGRAM_BOT_TOKEN`.
   - Create a Telegram **group** (this is where free finds land). Add your new bot to it.
   - Get the group's chat id: add **@RawDataBot** to the group briefly (or call
     `https://api.telegram.org/bot<TOKEN>/getUpdates` after sending a message in the group),
     read the negative `chat.id`, put it in `TELEGRAM_FREE_CHAT_ID`, then remove @RawDataBot.

---

## Phase 2 — Database (5 min)

Apply both migrations to Supabase (SQL editor, or the Supabase MCP `apply_migration`):

- `migrations/011_fb_free_posts.sql` — the table
- `migrations/012_fb_free_geo.sql` — distance columns

Verify: `select count(*) from fb_free_posts;` returns 0 rows (table exists).

---

## Phase 3 — Server pipeline test, NO Facebook (10 min)

This proves ingest → Haiku → Telegram works before any FB involvement.

```bash
npm run dev
# in a second terminal:
BASE_URL=http://localhost:3000 FB_INGEST_TOKEN=<yours> npx tsx scripts/seed-fb-post.ts
curl -H "Authorization: Bearer <CRON_SECRET>" http://localhost:3000/api/cron/fb-free-digest
```

✅ **Pass criteria:**
- The digest response JSON shows `classified: 4, free: 2, rejected: 2, sent: 2`.
- Two messages land in your Telegram group: the **gray sofa** and the **moving boxes**.
- In Supabase, the **ISO request** and the **$15 shelf** are `status='rejected'` with a sensible `ai_reason`.

If nothing arrives in Telegram: re-check `TELEGRAM_BOT_TOKEN` / `TELEGRAM_FREE_CHAT_ID`
and that the bot is a member of the group.

### Optional — distance filter check
Add a seed post whose text contains a real ZIP far from your home ZIP, include
`home_zip` + a small `radius_mi` in the payload, re-run the digest → it should be
`rejected` with `out of radius (…)`. Posts with no ZIP always pass (soft filter).

---

## Phase 4 — Deploy to Vercel (10 min)

1. In the Vercel project settings → Environment Variables, add the same values from
   `.env.local` (`FB_INGEST_TOKEN`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_FREE_CHAT_ID`;
   `CRON_SECRET`, Supabase, and `ANTHROPIC_API_KEY` already exist for the app).
2. Merge PR #11 (or keep testing on the preview deploy).
3. The `fb-free-digest` cron (every 10 min) is already declared in `vercel.json` — it
   activates once deployed to production.
4. Smoke-test the deployed route:
   ```bash
   curl -H "Authorization: Bearer <CRON_SECRET>" https://<your-app>.vercel.app/api/cron/fb-free-digest
   ```

---

## Phase 5 — Capture extension, the real FB half (20 min)

1. `chrome://extensions` → enable **Developer mode** → **Load unpacked** → select `extension/`.
2. Click the extension icon → **Open settings**:
   - **Endpoint:** `https://<your-app>.vercel.app/api/ingest/fb-post` (or `http://localhost:3000/...` while dev-testing).
   - **Token:** the `FB_INGEST_TOKEN` value.
   - **Home ZIP + radius**, and any include/exclude keywords or the "looks like a giveaway" toggle.
   - Save.
3. Open a Facebook **Buy Nothing / free-stuff group you belong to**, scroll so the posts render.
4. Click the green **Send free finds** button (bottom-right).

✅ **Pass criteria:**
- The button reports `Sent N (M dup)`.
- New rows appear in `fb_free_posts`; within ~10 min (or a manual cron curl) the free ones reach Telegram.
- The group auto-appears in extension Settings. Toggle it off → the button refuses. Toggle on → works again.
- Click **Send** twice on the same posts → second click reports duplicates / `0 to send`.

### The one thing likely to need tuning
Facebook's DOM is obfuscated. If captured `raw_text`, `post_url`, or `author_name`
come through wrong/empty, adjust the selectors in `extension/content.js`
(`extractPost` / `getGroupContext`). This is expected and is the maintenance surface.

---

## Phase 6 — Tune (ongoing)

- Watch the first day's Telegram output; if Haiku mislabels edge cases, tweak the
  system prompt in `app/lib/fb-free/classify.ts`.
- Adjust keyword filters in the extension to cut noise.
- If you want a human-review gate before delivery, run the digest with delivery off
  first (inspect `status='ready'` rows in Supabase), then enable.

---

## Quick reference — files

| Concern | File |
|---|---|
| Table / columns | `migrations/011_*.sql`, `migrations/012_*.sql` |
| Ingest endpoint | `app/api/ingest/fb-post/route.ts` |
| Classify + deliver cron | `app/api/cron/fb-free-digest/route.ts` |
| Classifier prompt | `app/lib/fb-free/classify.ts` |
| Distance math | `app/lib/fb-free/geo.ts` |
| Extension | `extension/` (settings in `options.html`, capture in `content.js`) |
| Local test seed | `scripts/seed-fb-post.ts` |
