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
3. Click the extension icon → **Open settings** and configure (below).

## Settings

Open the extension icon → **Open settings** (or right-click → Options):

- **Connection** — Ingest endpoint URL (e.g. `https://your-app.vercel.app/api/ingest/fb-post`,
  or `http://localhost:3000/api/ingest/fb-post` for dev) and the ingest token
  (must equal the server's `FB_INGEST_TOKEN`).
- **Groups** — every group you open is auto-added here. Toggle any group off to
  stop it forwarding even if you click the button; add/remove groups manually by
  ID or URL. This is the primary geographic control — a group is already local.
- **Location** — home ZIP + max distance (miles). A **soft** filter: a post is only
  dropped when it contains a real ZIP that resolves beyond your radius. Posts with
  no ZIP always pass.
- **Filters** — include-keywords (send only if mentioned), exclude-keywords (never
  send if mentioned, e.g. `sold, pending, ISO`), and a "looks like a giveaway"
  toggle. All run in your browser before anything is sent, cutting noise and AI cost.

## Use

1. Open a Facebook group you belong to (`facebook.com/groups/...`).
2. Scroll through the posts you care about so they render.
3. Click the green **Send free finds** button (bottom-right of the page).
4. It applies your filters, then POSTs the surviving posts to your ingest endpoint.
   The server dedupes, classifies with Haiku, applies the distance filter, and
   delivers the genuine giveaways to Telegram.

## Maintenance note

Facebook's DOM is obfuscated and changes periodically. The selectors in
`content.js` (`[role="article"]`, permalink anchors, author links, images) are
best-effort and are the part you tune when a layout change breaks capture. This is
expected and intentional — it's a thin reader over what you're already viewing, not
a resilient scraper.
