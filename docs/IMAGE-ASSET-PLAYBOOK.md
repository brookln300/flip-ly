# Image Asset Playbook — flip-ly.net

Created: 2026-04-07
Status: Specs locked, awaiting assets (~8 hours)
Code prep: DONE — all placeholders, components, and layout slots wired up

---

## IMAGE 1: Hero Product Shot (HIGHEST PRIORITY)

| Detail | Spec |
|--------|------|
| **Dimensions** | 1200 x 800px |
| **Format** | WebP |
| **Max size** | 150KB |
| **File name** | `public/hero-product.webp` |
| **Placement** | Between hero stats and search bar |
| **Shows** | Dashboard with 6-8 deal cards visible, scores 6-9, mix of categories (tools, furniture, electronics), DFW market |

### Creation Steps
1. Log into `flip-ly.net/dashboard` with good data visible
2. Chrome DevTools → device toolbar → custom: **1200 x 800**
3. `Ctrl+Shift+P` → "Capture screenshot" (viewport only)
4. Upload to [shots.so](https://shots.so) → macOS frame, white bg, 48px padding, medium shadow
5. Compress: [squoosh.app](https://squoosh.app) → WebP, quality 80
6. Save as `public/hero-product.webp`

---

## IMAGE 2: Score Breakdown Annotation

| Detail | Spec |
|--------|------|
| **Dimensions** | 640 x 420px |
| **Format** | WebP |
| **Max size** | 80KB |
| **File name** | `public/assets/score-breakdown.webp` |
| **Placement** | New "How Scoring Works" section below trust strip |
| **Shows** | Single expanded deal card with annotation arrows: "Demand: 8/10", "Margin: 9/10", "Competition: Low", "Overall: 8.5" |

### Creation Steps
1. Find a deal scoring 8+ on dashboard, expand it
2. Right-click element in DevTools → "Capture node screenshot"
3. Open [Canva](https://canva.com) → custom 640x420 design
4. Paste card, add 3-4 callout lines:
   - Score number → "AI Flip Score — composite of 4 signals"
   - Price → "Listed at $45 — resale potential $120+"
   - Source → "Found on Craigslist DFW"
5. Font: Inter, colors: `#1d1d1f` text, `#16a34a` score callouts, `#f5f5f7` border
6. Export PNG → squoosh → WebP quality 80
7. Save as `public/assets/score-breakdown.webp`

---

## IMAGE 3: Before/After Split

| Detail | Spec |
|--------|------|
| **Dimensions** | 800 x 420px |
| **Format** | WebP |
| **Max size** | 100KB |
| **File name** | `public/assets/before-after.webp` |
| **Placement** | Trust strip section, replaces text-only layout |
| **Shows** | Left: 5 messy browser tabs (CL, OfferUp, FB, etc.) blurred. Right: flip-ly dashboard, sharp. |

### Creation Steps
1. Open 5 tabs: Craigslist, OfferUp, FB Marketplace, EstateSales.net, ShopGoodwill
2. Screenshot tab bar + Craigslist page visible
3. Apply Gaussian blur 2px + reduce brightness
4. Screenshot flip-ly dashboard (sharp, bright)
5. Canva 800x420:
   - Left half: blurred "before" + red overlay `rgba(255,0,0,0.05)` + "Without flip-ly" in `#86868b`
   - Right half: sharp dashboard + "With flip-ly" in `#16a34a`
   - Thin vertical divider, "5 tabs" vs "1 dashboard" labels
6. Export PNG → squoosh → WebP quality 80
7. Save as `public/assets/before-after.webp`

---

## IMAGE 4: Demo Video Loop (Optional, High Impact)

| Detail | Spec |
|--------|------|
| **Dimensions** | 800 x 500px viewport |
| **Format** | WebM (primary) + MP4 (fallback) |
| **Max size** | 500KB |
| **Duration** | 8 seconds, loops, silent |
| **File names** | `public/assets/demo-loop.webm` + `public/assets/demo-loop.mp4` |
| **Placement** | Below hero, autoplay muted loop |
| **Shows** | Type "tools" → results load → hover deal → score expands |

### Creation Steps
**Option A — Screen Studio** ($89, [screen.studio](https://screen.studio))
- Record at 1x, auto-smooth cursor, clean zoom

**Option B — OBS** (free)
1. Canvas 800x500, window capture Chrome
2. Record 8-second flow
3. Export MP4

**Compress:**
```bash
ffmpeg -i demo-raw.mp4 -vf "scale=800:-1" -c:v libvpx-vp9 -b:v 400k -t 8 -an public/assets/demo-loop.webm
ffmpeg -i demo-raw.mp4 -vf "scale=800:-1" -c:v libx264 -crf 28 -t 8 -an public/assets/demo-loop.mp4
```

---

## Priority Order

| # | Asset | Time | Impact |
|---|-------|------|--------|
| 1 | Hero product shot | 15 min | ★★★★★ |
| 2 | Score breakdown | 20 min | ★★★★ |
| 3 | Before/after split | 20 min | ★★★☆ |
| 4 | Demo video loop | 30 min | ★★★★ |

---

## Code Status

All layout slots, placeholder states, and responsive components are pre-built.
When images arrive, drop files in place — zero code changes needed.

- `public/hero-product.webp` → auto-renders in hero section
- `public/assets/score-breakdown.webp` → auto-renders in scoring section
- `public/assets/before-after.webp` → auto-renders in trust strip
- `public/assets/demo-loop.webm` + `.mp4` → auto-renders in hero video slot

---

## Cleanup After Deploy

| File | Action |
|------|--------|
| `public/og-image.png` (1.9MB) | Delete — replaced by `/api/og` edge route |
| `image_assets/*.png.png` | Delete double-extension duplicates |
| `image_assets/` retro assets | Archive to `image_assets/archive/` |
