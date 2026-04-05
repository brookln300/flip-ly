# Asset 1: Hero Product Shot

## Purpose
Replace the code-generated hero placeholder with a polished browser-framed dashboard screenshot that instantly communicates "this is a real product."

## Dimensions
- **Output**: 1200 x 900px, 2x retina (2400x1800 source)
- **Format**: WebP (primary), PNG (fallback)
- **File size target**: < 200KB

## What to capture
Screenshot the Flip-ly dashboard (`/dashboard`) showing:
1. **3-4 deal rows visible** — each with a ScoreBadge (colored rounded square), title, price, source tag
2. **At least one 9+ score** (green) and one 7-8 score (amber) visible for color contrast
3. **Score breakdown panel open** on one deal — showing the 5 factor bars (Price, Brand, Seller, Quality, Freshness) with colored progress bars
4. **Market dropdown** visible showing "DFW" selected
5. **Search bar** at top with a query like "tools" or "vintage"

## Framing
Use **shots.so** or equivalent browser-frame tool:
- **Frame style**: macOS-style window chrome (3 dots: red/yellow/green)
- **Background**: Transparent or solid #000000 (matches site bg)
- **Border radius**: 12px on the outer frame
- **Shadow**: Subtle 0 4px 24px rgba(0,0,0,0.4)
- **Angle**: Straight-on, no perspective tilt — clean and flat
- **Padding**: 24px inside the frame around the dashboard content

## Data in the screenshot
Use real or realistic data. These exact deals work well:
| Score | Title | Price | Source |
|-------|-------|-------|--------|
| 9.2 | Milwaukee M18 Drill Set | $35 | Craigslist |
| 8.7 | Vintage KitchenAid Artisan Mixer | $45 | EstateSales |
| 7.4 | Herman Miller Aeron Chair | $120 | OfferUp |
| 8.1 | Dyson V11 Cordless Vacuum | $75 | Facebook |

## Color reference
- Background: #000000
- Surface: #111111
- Score excellent (9-10): #22C55E
- Score good (7-8): #F59E0B
- Text primary: #FFFFFF
- Text muted: #888888
- Border: #1a1a1a / #222222

## Placement
`app/page.tsx` Section 1 (Hero), right column — replaces the current code-generated mini dashboard preview. Should be wrapped in a `<img>` tag with lazy loading.

## Do NOT include
- Any user email or personal data
- Blurred/redacted elements
- Watermarks
- Perspective angles or 3D effects
