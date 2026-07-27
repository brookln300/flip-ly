# Flip-ly Free Finds — Capture Extension

The one piece of the FB → Telegram pipeline that touches Facebook. By design it
runs **in your own logged-in browser session** and is **human-triggered** — it
forwards the posts already rendered on a group page you scrolled through. It does
not auto-scroll, run in the background, or attempt to evade bot detection. It's
you, reading your own groups, with a button that ships the free finds onward.

See `docs/planning/FB-GROUPS-TO-TELEGRAM.md` for the full architecture.

## Install (Chrome / Edge, unpacked)

1. Go to `chrome://extensions`, enable **Developer mode**.
2. **Load unpacked** → select this `extension/` folder.
3. Click the extension icon → set:
   - **Ingest endpoint URL** — e.g. `https://your-app.vercel.app/api/ingest/fb-post`
     (or `http://localhost:3000/api/ingest/fb-post` for dev)
   - **Ingest token** — the same value as the server's `FB_INGEST_TOKEN` env var
4. Save.

## Use

1. Open a Facebook group you belong to (`facebook.com/groups/...`).
2. Scroll through the posts you care about so they render.
3. Click the green **Send free finds** button (bottom-right of the page).
4. It POSTs the currently-visible posts to your ingest endpoint. The server
   dedupes, classifies with Haiku, and delivers the genuine giveaways to Telegram.

## Maintenance note

Facebook's DOM is obfuscated and changes periodically. The selectors in
`content.js` (`[role="article"]`, permalink anchors, author links, images) are
best-effort and are the part you tune when a layout change breaks capture. This is
expected and intentional — it's a thin reader over what you're already viewing, not
a resilient scraper.
