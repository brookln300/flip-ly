# Asset 6: OG Image (Social Share Card)

## Purpose
When someone shares flip-ly.net on Twitter/X, Facebook, LinkedIn, iMessage, or Slack — this image appears. It needs to communicate what the product does in a single glance.

## Dimensions
- **Size**: 1200 x 630px (OG standard)
- **Format**: PNG (required for OG compatibility)
- **File size**: < 300KB
- **File path**: `public/og-image-v2.png` (will replace current `og-image.png`)

## Layout (left-to-right split)

### Left side (60% width)
- **Logo**: FLIP-LY wordmark + arrow/flip icon, top-left, white on dark
- **Headline**: "Every deal near you. Scored before you see it."
  - Font: Inter Bold (or closest system equivalent)
  - Size: ~36px equivalent
  - Color: #FFFFFF
  - Max 2 lines
- **Subtext**: "AI scores Craigslist, estate sales, OfferUp & 20+ sources"
  - Font: Inter Regular
  - Size: ~16px
  - Color: #888888
- **CTA pill**: Small green rounded pill at bottom — "Try free at flip-ly.net"
  - Background: #22C55E
  - Text: #000000, 14px, 600 weight

### Right side (40% width)
- **Cropped dashboard screenshot** — show 2-3 deal rows with ScoreBadge squares visible
- **Slight overlap** with the left side (10-20px) creates depth
- **Subtle shadow** on the screenshot edge
- **Rounded corners**: 12px on the screenshot crop

### Background
- Solid #000000
- Optional: very subtle radial gradient from center (#0a0a0a) to edges (#000000)

## Color palette
| Token | Hex |
|-------|-----|
| Background | #000000 |
| Text primary | #FFFFFF |
| Text muted | #888888 |
| Accent green | #22C55E |
| Score good | #F59E0B |

## Typography
- Primary: Inter (Google Fonts) — Bold for headline, Regular for subtext
- If Inter unavailable in design tool: use -apple-system or SF Pro as substitute

## Implementation
After creating, update `app/layout.tsx` metadata:
```tsx
openGraph: {
  images: [{ url: '/og-image-v2.png', width: 1200, height: 630 }],
}
```

## Testing
After deployment, verify with:
- Twitter Card Validator
- Facebook Sharing Debugger
- LinkedIn Post Inspector

## Do NOT include
- Phone numbers or email addresses
- Pricing information (changes too often)
- User data or real email addresses
- QR codes
- More than 2 lines of headline text
- Busy screenshots — keep it clean, 2-3 rows max
