# Design System — Visual Bible

**Created:** 2026-04-04
**Status:** LOCKED
**Core Principle:** We don't sell the landing page. The product sells itself.

---

## Philosophy

The landing page is a window into the product, not a billboard in front of it. Every section should feel like you're already using Flip-ly — seeing real scores, real deals, real breakdowns. The visitor's reaction should be "I want access to THIS" not "I wonder if this is any good."

**We show. We don't tell.**

- Don't say "AI-powered deal scoring." Show a deal scored 8.7 with the breakdown visible.
- Don't say "20+ sources." Show the source badges next to real listings.
- Don't say "Save hours." Show 15 scored deals that would have taken an hour to find manually.
- Don't say "Trusted by deal hunters." Show real results that make the visitor feel like they're already late.

The confidence comes from letting the product breathe on the page. No hype. No urgency tricks. No desperation. Just: here's what we built. It works. You want in.

---

## Voice & Tone

| Do | Don't |
|----|-------|
| State facts calmly | Shout or hype |
| Let numbers speak | Add exclamation marks |
| Be specific ("62% below market") | Be vague ("amazing deals!") |
| Assume the user is smart | Over-explain |
| Use confidence ("We scan. We score. You decide.") | Use desperation ("Don't miss out!!!") |
| Be brief | Pad with filler |

**Brand voice in one line:** A smart friend who found something good and is quietly telling you about it.

**Examples:**

| Bad | Good |
|-----|------|
| "INCREDIBLE AI-POWERED DEAL FINDING!" | "Every deal near you, scored before you see it." |
| "Don't miss out on HOT deals!" | "A KitchenAid Artisan, $45. Score: 8.7." |
| "Sign up NOW and save!" | "Start finding deals — free." |
| "Our revolutionary algorithm..." | "The AI checks price vs. market, seller motivation, brand value, and condition." |
| "Join thousands of happy users!" | "412 deals scored in DFW this week." |

---

## Typography

### Font Stack
```css
--font-primary: 'Inter', system-ui, -apple-system, sans-serif;
--font-mono: 'JetBrains Mono', 'SF Mono', monospace; /* scores + data only */
```

### Scale

| Level | Size | Weight | Use | Letter Spacing |
|-------|------|--------|-----|---------------|
| Display | `clamp(36px, 6vw, 56px)` | 700 | Hero headline only | `-0.03em` |
| H1 | `34px` | 700 | Section titles | `-0.02em` |
| H2 | `24px` | 600 | Card titles, subsection heads | `-0.02em` |
| H3 | `18px` | 600 | Feature labels, card headers | `-0.01em` |
| Body | `15px` | 400 | Descriptions, explanations | `0` |
| Small | `13px` | 400-500 | Metadata, labels, nav links | `0` |
| Caption | `11px` | 400 | Timestamps, fine print, badges | `0.02em` |
| Data | `14-18px` | 700 | Scores, prices, stats — use `--font-mono` | `0` |

### Rules
- Headlines: Inter Bold, tight letter-spacing, white (`#fff`)
- Body: Inter Regular, relaxed line-height (1.7), secondary color (`#ccc`)
- Scores and numbers: JetBrains Mono Bold — the ONLY place monospace appears
- Never use more than 3 weights on one page (400, 600, 700)
- Line height: 1.1 for headlines, 1.7 for body, 1.4 for UI elements

---

## Color System

### Backgrounds

| Token | Hex | Usage |
|-------|-----|-------|
| `--bg-primary` | `#000000` | Hero, header, pricing, primary sections |
| `--bg-elevated` | `#0a0a0a` | Alternating sections, secondary backgrounds |
| `--bg-surface` | `#111111` | Cards, inputs, modals, containers |
| `--bg-surface-hover` | `#1a1a1a` | Hover states on cards/buttons |

### Borders

| Token | Hex | Usage |
|-------|-----|-------|
| `--border-subtle` | `#1a1a1a` | Default card borders, dividers |
| `--border-default` | `#222222` | Section dividers, input borders |
| `--border-active` | `#333333` | Focus states, hover borders |

### Text

| Token | Hex | Usage |
|-------|-----|-------|
| `--text-primary` | `#FFFFFF` | Headlines, emphasis |
| `--text-secondary` | `#CCCCCC` | Body copy, descriptions |
| `--text-muted` | `#888888` | Labels, metadata, nav |
| `--text-dim` | `#555555` | Timestamps, fine print, disabled |

### Accent Colors

| Token | Hex | Usage | When |
|-------|-----|-------|------|
| `--accent-green` | `#22C55E` | Primary CTA buttons, positive signals | "Go" actions, success, primary conversion |
| `--accent-amber` | `#F59E0B` | Scores 7-8, price highlights | Data that needs attention, not alarm |
| `--accent-blue` | `#3B82F6` | Links, info badges, Pro tier accent | Informational, secondary actions |
| `--accent-purple` | `#A78BFA` | Power tier accent | Premium features, upsell elements |
| `--accent-red` | `#EF4444` | Errors, limits reached, warnings | Negative states only — never for marketing |

**Rule: Green is the ONLY color used for primary CTA buttons. No exceptions.**

### Score Colors (Data System)

| Score | Color | Token | Meaning |
|-------|-------|-------|---------|
| 9-10 | `#22C55E` | `--score-excellent` | Exceptional — act now |
| 7-8 | `#F59E0B` | `--score-good` | Strong deal — worth the trip |
| 5-6 | `#888888` | `--score-average` | Average — if convenient |
| 1-4 | `#555555` | `--score-low` | Below average — skip |

Scores are displayed in `--font-mono` at bold weight. The color IS the communication — no badges, no labels, no "HOT" tags needed. A green 9.2 says everything.

---

## Spacing System

### Base Unit: 4px

| Token | Value | Usage |
|-------|-------|-------|
| `--space-1` | `4px` | Tight gaps (icon-to-text, badge padding) |
| `--space-2` | `8px` | Default element spacing |
| `--space-3` | `12px` | Card internal padding (tight) |
| `--space-4` | `16px` | Between related elements |
| `--space-6` | `24px` | Card padding, section internal spacing |
| `--space-8` | `32px` | Between cards, between content blocks |
| `--space-12` | `48px` | Between subsections |
| `--space-16` | `64px` | Between major sections (mobile) |
| `--space-20` | `80px` | Between major sections (desktop) |

### Rules
- Sections: `py-20` (80px) on desktop, `py-16` (64px) on mobile
- Cards: `24px` internal padding
- Between cards: `16px` gap
- Max content width: `1120px` (70rem) for marketing, `1280px` for dashboard
- Let things breathe. When in doubt, add more space, not less.

---

## Components

### Cards

```
Background: var(--bg-surface)
Border: 1px solid var(--border-subtle)
Border-radius: 12px
Padding: 24px
Hover: border-color transitions to var(--border-active)
No box-shadow by default. Shadows only for modals and floating elements.
```

No colored left borders. No accent stripes. The content inside the card provides the visual interest, not the card frame.

### Buttons

**Primary (CTA):**
```
Background: var(--accent-green)
Color: #000
Font: 14px, weight 600
Padding: 12px 24px
Border-radius: 8px
Hover: opacity 0.9
```

**Secondary (Ghost):**
```
Background: transparent
Color: var(--text-muted)
Border: 1px solid var(--border-active)
Padding: 12px 24px
Border-radius: 8px
Hover: background rgba(255,255,255,0.05), color var(--text-primary)
```

**Tertiary (Text link):**
```
Color: var(--text-muted)
Hover: color var(--text-primary)
No underline. No border. Just color shift.
```

**Rule: Only ONE primary CTA per viewport. If the user can see two green buttons at once, one of them should be secondary.**

### Score Badge

```
Font: var(--font-mono), 14px, weight 700
Color: score color (green/amber/gray/dim)
No background. No border. Just the number and its color.
Display: "8.7" — that's it. No "/10", no label.
The color tells the story.
```

For expanded breakdowns (Pro/Power):
```
Score at top: "8.7" in score color, 18px mono bold
Factors below: 13px, secondary text color, left-aligned list
Each factor: plain text, no icons, no progress bars
Clean. Clinical. Trustworthy.
```

### Input Fields

```
Background: var(--bg-surface)
Border: 1px solid var(--border-default)
Border-radius: 8px
Padding: 12px 16px
Font: 15px
Color: var(--text-primary)
Placeholder: var(--text-dim)
Focus: border-color var(--accent-green), subtle glow
```

---

## Motion

| Element | Animation | Duration | Easing |
|---------|-----------|----------|--------|
| Sections on scroll | Fade up (opacity + translateY 20px) | 0.5s | ease-out |
| Button hover | Opacity shift | 0.15s | linear |
| Card hover | Border color | 0.15s | linear |
| Score number (on load) | None — appears instantly | — | — |
| Modal open | Fade in + scale from 0.97 | 0.2s | ease-out |
| Mobile nav | Slide down | 0.2s | ease-out |

**Rules:**
- No bouncing. No pulsing. No attention-grabbing animations.
- Motion exists to smooth transitions, not to draw eyes.
- Scores appear instantly. Data doesn't need a reveal — it's confident enough to just be there.
- If you're debating whether something needs animation, it doesn't.

---

## Imagery & Assets

| Type | Direction |
|------|-----------|
| Product mockups | Real screenshots of the actual product, not Figma mockups. Browser frames optional. shots.so for polish. |
| Icons | Inline SVG, single-weight stroke, 20-24px. Lucide icon style. |
| Illustrations | None. We're data-driven, not illustrative. |
| Stock photos | Never. |
| Background textures | None. Flat color only. |
| Gradients | Extremely subtle if ever — e.g., `#000` to `#0a0a0a` on hero. Never colorful gradients. |
| Logo/icon mark | Green SVG, geometric, reads at 24px (already built) |

---

## Responsive Breakpoints

| Name | Width | Behavior |
|------|-------|----------|
| Mobile | < 640px | Single column, full-width cards, hamburger nav, touch-friendly spacing |
| Tablet | 640-1024px | Two-column where appropriate, sidebar collapses |
| Desktop | > 1024px | Full layout, sidebar visible, max-width containers |

**Mobile-first:** Start with mobile layout, enhance for desktop. Flippers search deals on their phone.

---

## What This System Kills

These patterns are explicitly banned:

| Pattern | Why |
|---------|-----|
| "HOT" badges in neon orange | Cheapens the brand. The score color says it. |
| Urgency countdowns with animation | Desperation. The founding counter is plain text. |
| Emojis in UI or copy | We're a tool, not a chat. |
| Exclamation marks in headlines | Confident copy doesn't shout. |
| Multiple CTAs in one viewport | Decision fatigue. One green button per screen. |
| Colored card borders/accents | Clutters. Let the content carry the card. |
| Stock photos of people shopping | Generic. We show the actual product. |
| "Trusted by X users" without real number | If the number is small, don't display it. Honesty > social proof tricks. |
| Loading spinners on scores | Scores are pre-computed. They're already there. |
| Tooltips explaining features | If it needs a tooltip, the design isn't clear enough. |

---

## The Litmus Test

Before shipping any page or component, ask:

1. **Does this show the product working, or does it describe the product?** Show > tell.
2. **Would Stripe's design team ship this?** If it feels like a template, it's not done.
3. **Is there only one obvious action?** If the user has to think about what to click, simplify.
4. **Can I remove anything?** If yes, remove it. Then ask again.
5. **Does this look like it costs $29/mo?** If the design feels like a $3 tool, the user will pay like it's a $3 tool.
