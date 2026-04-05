# Asset 4: Source Logo Strip

## Purpose
Replace the current icon+text source indicators in the Social Proof Bar with recognizable brand logos, desaturated to match the dark UI. Shows credibility — "we pull from sources you already know."

## Dimensions
- **Each logo**: 120 x 40px canvas (logo scaled to fit)
- **Strip arrangement**: Horizontal row, 24px gap between logos
- **Format**: SVG preferred (scalable), PNG fallback at 2x

## Sources to include (in this order)
1. **Craigslist** — the purple "CL" peace sign or wordmark
2. **EstateSales.net** — wordmark or house icon
3. **OfferUp** — the teal "O" logomark
4. **Facebook Marketplace** — the marketplace storefront icon
5. **Eventbrite** — the "EB" logomark
6. **Goodwill / ShopGoodwill** — the smiling "G" or text

## Treatment
- **Desaturated**: Convert to grayscale, then tint to match `var(--text-muted)` (#888888)
- **Opacity**: 40-50% opacity on load, 70% on hover (CSS handles this)
- **Uniform height**: All logos should be the same visual height (~20px rendered)
- **No backgrounds**: Transparent, just the logo shape
- **Monochrome only**: Single color (#888888) for all logos — no brand colors

## Implementation
The strip sits in the `SocialProofBar` component, replacing the current icon+text entries. CSS:
```css
.source-logo {
  height: 20px;
  opacity: 0.4;
  filter: grayscale(1) brightness(0.8);
  transition: opacity 0.2s;
}
.source-logo:hover {
  opacity: 0.7;
}
```

Followed by `+ 20 more` text in `var(--text-dim)`.

## File naming
Save as individual SVGs in `public/assets/logos/`:
- `logo-craigslist.svg`
- `logo-estatesales.svg`
- `logo-offerup.svg`
- `logo-fb-marketplace.svg`
- `logo-eventbrite.svg`
- `logo-goodwill.svg`

## Legal note
These are brand logos used for factual representation ("we scan this source"). This is nominative fair use. Do not modify the logo shapes — only desaturate/recolor. If any logo has restrictive usage terms, use the brand wordmark in our system font (Inter, 600 weight) instead.

## Do NOT include
- Full-color brand logos
- Logos with colored backgrounds
- Any logo not in our active source list
- Animated versions
