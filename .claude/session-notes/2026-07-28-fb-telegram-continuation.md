# Session Notes — FB Free-Stuff → Telegram (continuation)

**Date:** 2026-07-28
**Branch:** `claude/facebook-telegram-analyzer-arch-y8oc28` · **PR:** #11 (draft, CI green)
**Next session:** tomorrow afternoon

---

## ✅ Done so far (code + infra)

- **Pipeline built & green on Vercel:** ingest endpoint, Haiku classify + Telegram
  deliver cron, dedupe, distance soft-filter.
- **Extension with full settings:** group allow-list, home ZIP + radius, keyword
  include/exclude, "looks like a giveaway" toggle.
- **Docs:** architecture (`FB-GROUPS-TO-TELEGRAM.md`) + setup runbook (`FB-TELEGRAM-SETUP.md`).
- **Regression test committed:** `npm run test:fb` → 35/35 passing. Type-check clean.

## ✅ Done autonomously tonight (so you can skip these)

- **Database is already migrated** on Supabase project `krjbjdaeoluzfsgkheen`:
  `fb_free_posts` table + all 4 distance columns exist, RLS enabled. **You do NOT
  need to run the migrations tomorrow.**
- Added `npm run test:fb` regression test (+ `tsx` devDependency) and refactored the
  distance math into `geo-math.ts` so it's unit-testable.

---

## 📋 Keith's actions — tomorrow afternoon (easy steps)

Do these in order. Each is quick; paste me the result and I'll take it from there.

**1. Refresh the branch (1 min)**
```powershell
cd ~\flip-ly
git pull
npm install
```

**2. Finish `.env.local` (10 min)** — open it: `notepad .env.local`. Fill in:
   - `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`  (Supabase → Settings → API)
   - `ANTHROPIC_API_KEY`
   - `CRON_SECRET`  (any random string)
   - `FB_INGEST_TOKEN`  (run `openssl rand -base64 32`, paste the output)
   - `TELEGRAM_BOT_TOKEN`  (Telegram → **@BotFather** → `/newbot`)
   - `TELEGRAM_FREE_CHAT_ID`  (make a group, add the bot, send a message, then open
     `https://api.telegram.org/bot<TOKEN>/getUpdates` and copy the negative `chat.id`)

**3. Run the backend test — no Facebook needed (5 min)**
```powershell
npm run dev
# second terminal:
$env:FB_INGEST_TOKEN="<yours>"; $env:BASE_URL="http://localhost:3000"; npx tsx scripts/seed-fb-post.ts
curl -H "Authorization: Bearer <CRON_SECRET>" http://localhost:3000/api/cron/fb-free-digest
```
✅ Expect: `classified:4, free:2, rejected:2, sent:2`, and the **sofa + moving-boxes**
messages arrive in your Telegram group.
📋 **Paste me the digest JSON + whether Telegram got the messages.**

**4. Test the real Facebook capture (15 min)**
   - `chrome://extensions` → Developer mode → **Load unpacked** → pick the `extension` folder.
   - Extension icon → **Open settings** → set endpoint `http://localhost:3000/api/ingest/fb-post`,
     your `FB_INGEST_TOKEN`, home ZIP, keywords → Save.
   - Open a Buy Nothing / free-stuff group, scroll, click green **Send free finds**.
   - In Supabase SQL editor:
     `select raw_text, post_url, author_name, group_name from fb_free_posts order by captured_at desc limit 3;`
📋 **Paste me those rows.** ← this is the important one; it drives the next code.

---

## 🔜 Next code delivery (Claude — after step 4's paste)

1. **`content.js` selector hardening** — tuned to what your real capture shows
   (permalink, author, full "See more" text, images). *Top priority / only unknown.*
2. **Human-review gate** before Telegram delivery (optional flag) — so a
   misclassification can't spam the group during beta.
3. **Run logging + send-failure surfacing** for the digest cron.

Then flip PR #11 ready-for-review and merge; items 2–3 become follow-up PRs.

## Quick reference
| Concern | File |
|---|---|
| Ingest | `app/api/ingest/fb-post/route.ts` |
| Classify + deliver | `app/api/cron/fb-free-digest/route.ts` |
| Classifier prompt | `app/lib/fb-free/classify.ts` |
| Extension | `extension/` (settings `options.html`, capture `content.js`) |
| Local seed test | `scripts/seed-fb-post.ts` · Regression: `npm run test:fb` |
| Setup runbook | `docs/planning/FB-TELEGRAM-SETUP.md` |
