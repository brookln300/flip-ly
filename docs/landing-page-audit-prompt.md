# Landing Page Audit Prompt — flip-ly.net

Copy everything below the line and paste into a third-party AI.

---

## CONTEXT: What flip-ly.net Is

flip-ly.net is a garage sale / estate sale aggregator. We scan Craigslist, EstateSales.net, Eventbrite, and AI-discovered local sources across US markets, then email users a curated weekly digest every Thursday at noon CDT.

**Business model:**
- Free tier: weekly digest email, 10 searches/day on the website
- Pro tier ($5/mo): digest 6 hours early ("First Dibs"), unlimited searches, full AI deal scores, direct source links

**Current state:** 10 users, 2 active markets (Dallas-Fort Worth, South Florida), 20 sources (9 approved, 11 pending review), 283 listings in database. Pre-revenue. Live at https://flip-ly.net

**Tech stack:** Next.js 14 on Vercel, Supabase (Postgres), Stripe for payments, Telegram bot for admin, Claude AI for source discovery and deal scoring.

---

## THE PRODUCT ARCHITECTURE (How Data Flows)

1. **Source Discovery:** When the first user signs up in a market, our system auto-creates Craigslist RSS + Eventbrite API sources, then runs Claude AI research to find local garage sale websites, Facebook groups, community boards, etc. Admin (me) approves/rejects AI-discovered sources via Telegram.

2. **Scraping:** Cron job runs Wednesday 8AM UTC. Pulls listings from all active approved sources per market. Stores in `fliply_listings` table with title, description, price, location, sale date, source attribution.

3. **AI Scoring:** Claude Haiku scores each listing 1-10 on "deal quality" based on description, price signals, and item categories. Free users see scores redacted (██/10 🔒). Pro users see full scores.

4. **Weekly Digest:** Cron fires Thursday 11AM UTC (free) and Thursday 5AM UTC (pro — 6hr early). Pulls top listings per market, generates email via Resend API.

5. **Search:** Real-time search against `fliply_listings` with market filtering. Free: 10/day limit (BSOD-style error when exhausted). Pro: unlimited. Results show title, price, location, AI score, source, tags.

6. **Signup flow:** Email + password + State dropdown + Market dropdown → creates account → auto-redirects to dashboard → triggers source discovery if first user in that market.

---

## THE CURRENT LANDING PAGE (Detailed Description)

The website is intentionally designed to look like a 1996 Geocities/Craigslist fever dream. This is a deliberate aesthetic choice, not incompetence. The chaos IS the brand.

### Visual Elements Present (top to bottom):

1. **Construction banner** — scrolling "🚧 UNDER CONSTRUCTION 🚧 (everything works tho)" across the top
2. **Netscape banner** — "Best viewed in Netscape 4.0 at 800x600 | Visitor #69,420 | Kazaa: 4,269 deals shared"
3. **Header** — Lobster emoji + "FLIP-LY.NET" in Comic Sans with glitch effect. Mute toggle, blinking "● LIVE" badge, Sign In button (Win98 style)
4. **Y2K Countdown** — fake countdown timer that triggers a "meltdown sequence" animation
5. **Craigslist-style nav bar** — Hot pink bar with FOR SALE, HOUSING, JOBS, etc. tabs (non-functional, decorative)
6. **Rainbow divider** — animated rainbow gradient line
7. **Hero section** — Win98 window frame containing:
   - "FIND HIDDEN GEMS." (hot pink, Comic Sans, glitch effect)
   - "SKIP THE BS." (lime green)
   - "We aggregated all the garage sales your city is having." (Papyrus font, mustard)
   - "Yeah, we scraped Craigslist. Yeah, that's legal. Yeah, we made it weird on purpose."
   - Big CTA button: "GET STARTED — IT'S FREE"
   - Faint robot mascot images at ~15% opacity in background
8. **"Ask flip-ly" search engine** — styled as AskJeeves meets Internet Explorer 4.0:
   - Spinning top hat emoji, "Ask flip-ly" header
   - Fake IE address bar showing "http://www.ask-flip-ly.com/search?powered_by=chaos"
   - Real functional search input with market dropdown
   - Quick search tags: tools, vintage, furniture, free, electronics, estate sale, kids, collectibles
   - Results display in Craigslist-meets-Geocities style with real data
   - Butler character ("Jeeves") delivers quips with results
   - Search counter for free users, BSOD when limit hit
9. **"REAL SIMPLE" value props** — 3 tilted cards (Find Deals, Know the ROI, Daily Emails) that reveal "THE TRUTH" when clicked
10. **"HOW IT ACTUALLY WORKS"** — 5 steps with humorous front text and "embarrassingly honest" versions on click
11. **BBS-style Testimonials** — styled as a BBS/Telnet door with ASCII box drawing:
    - Fake users with RPG stats (LVL 42 GARAGE WARRIOR, HP: 847/847, Gold: 2,847)
    - Funny testimonial text about finding deals
    - All testimonials are fabricated/humorous
12. **Craigslist-style fake listings section** — 8 fake funny listings (e.g., "Divorce sale — his stuff. priced to annoy.")
13. **Easter Egg / Contest section** — Hidden "Admin Panel" that's actually a puzzle/contest:
    - Users enter an "agent name" and "passphrase"
    - System runs proof-of-work challenge + theatrical authentication sequence
    - 7 decoy tiers with prizes/roasts, 1 real winner
    - Results can be shared to Twitter/Reddit
    - Has its own "Hall of Almost" leaderboard page
    - Clues are hidden throughout the site (Morse code in BBS, hex in HTML comments, base64 in image alt tags)
14. **Signup modal** — Win98 window frame, clean form: email, password, state, market dropdowns
15. **Background chaos layers:** WinampPlayer (fake music player), RetroPopups (random 90s-style popups), BSOD (random blue screen), SketchyPopups ("Your PC has 69 viruses" etc.), StickyNote (draggable lobster), MeltdownSequence (screen melt animation)
16. **Win98 Error popup** — appears 3 seconds after page load, auto-dismisses at 18s. Shows fake "FLIP-LY.NET HAS PERFORMED AN ILLEGAL OPERATION" with signup CTA.

### Fonts used:
- Comic Sans MS (primary headings, CTAs, body in some sections)
- Papyrus (subheadings)
- Courier New (BBS/testimonial sections)
- Tahoma (UI elements mimicking Win98)
- Monospace (technical displays)

### Color palette:
- Background: #0D0D0D (near-black)
- Lime green: #0FFF50 (primary accent)
- Hot pink: #FF10F0 (secondary accent)
- Mustard: #FFB81C
- Electric blue: #00D4FF
- Neon orange: #FF6600
- Win98 gray: #c0c0c0

### Interactive chaos elements:
- Glitch text effects on headings
- Blinking elements (`.blink` class)
- Jitter animations on emojis
- Cards tilted at random angles (`rotate(-3deg)` etc.)
- "Fall-in" entrance animations
- Screen shake on search
- Progressive page tilt as search limit approaches
- Random popup windows
- Fake BSOD screens
- Draggable sticky note lobster

---

## TARGET AUDIENCES (Data-Backed)

Based on market research:

### Audience A: Casual Bargain Hunters (Largest segment)
- **Age:** 35-55, skews 65% female
- **Profile:** Parents/homeowners looking for deals on furniture, kids stuff, household items
- **Tech:** Mobile-first (98% of FB Marketplace users on mobile), moderate tech literacy
- **Entry point:** Google search ("garage sales near me"), word of mouth, NextDoor
- **What they need:** Trust, clarity, easy signup, understanding value in <5 seconds
- **Current platforms:** Facebook Marketplace, Craigslist, NextDoor, yard sale apps

### Audience B: Resellers/Flippers (Highest-value segment — will pay for Pro)
- **Age:** 25-34, more gender-balanced
- **Profile:** Side-hustle or full-time resellers who flip items on eBay, Poshmark, Mercari, FB Marketplace
- **Tech:** Highly tech-savvy, mobile-first, use cross-listing tools, value automation
- **Entry point:** Reddit r/flipping, r/thriftstorehauls, reseller YouTube/TikTok, word of mouth
- **What they need:** Speed, early access to deals, data/scores, coverage breadth
- **Pain point:** Spending hours manually checking multiple sites every morning

### Audience C: Viral/Entertainment Visitors
- **Age:** 18-35
- **Profile:** Saw a post about "the weirdest website on the internet" or the easter egg contest
- **Entry point:** Twitter/X, Reddit (front page, r/InternetIsBeautiful), TikTok
- **What they need:** The experience. They're here for the chaos.
- **Conversion path:** Experience chaos → realize it actually works → sign up because why not

### Audience D: Older Casual Shoppers
- **Age:** 55-70
- **Profile:** Retirees, hobbyists, weekend garage sale regulars
- **Tech:** Desktop or tablet, lower tech comfort, need large text and clear navigation
- **Entry point:** Shared by family member, local community group
- **What they need:** Simplicity, trust signals, large readable text, obvious value prop

### Key data points:
- Users form website judgments in **50 milliseconds**
- **94%** of first impressions are design-based
- **75%** judge credibility on website design alone
- **72% of under-25s** say a website is essential for credibility
- Forms with **5 or fewer fields** convert 120% better
- **98%** of marketplace users browse on mobile
- Mobile accounts for **41-60%** of email opens
- Average landing page conversion: **6.6%** (median)
- **88% of consumers** won't return after a bad experience

---

## THE STRATEGIC QUESTION

We're considering adding a **"Clean Mode" toggle** to the landing page — a single button that strips the visual chaos while keeping the brand personality, voice, and functionality intact. The chaos mode stays as default for direct/social traffic. Clean mode activates via toggle or auto-detects from UTM parameters.

We are NOT considering removing the chaos entirely. The chaos IS the viral engine and brand differentiator. We need both modes serving both audiences from the same URL.

---

## WHAT I NEED FROM YOU

Provide a comprehensive landing page audit and redesign recommendation. Be specific, opinionated, and data-backed where possible.

### Output Format (IMPORTANT — follow this exactly):

```
## 1. FIRST IMPRESSIONS AUDIT
Rate the current landing page 1-10 for each audience (A, B, C, D) on:
- Trust / Credibility
- Value Clarity (do they understand the product in <5 seconds?)
- Conversion Likelihood
- Mobile Experience (based on described elements)
Brief reasoning for each score.

## 2. CLEAN MODE vs CHAOS MODE — VERDICT
- Is a toggle the right approach, or is there a better architecture?
- Should clean mode be the DEFAULT with chaos as opt-in, or vice versa?
- Should it auto-detect, or always let users choose?
- What are the risks of each approach?

## 3. CLEAN MODE SPEC
For each page section (listed in order), specify:
- KEEP AS-IS / MODIFY / REMOVE / REPLACE
- If MODIFY or REPLACE: exactly what it should look like in clean mode
- Keep the same section order or re-order? If re-order, specify new order.

Sections to evaluate:
1. Construction banner
2. Netscape/visitor counter banner
3. Header bar
4. Y2K Countdown
5. Craigslist nav bar
6. Rainbow divider
7. Hero section (Win98 window + headlines + CTA)
8. Ask flip-ly search engine
9. Value props ("REAL SIMPLE" cards)
10. How It Works steps
11. BBS Testimonials
12. Fake Craigslist listings
13. Easter egg / contest section
14. Signup modal
15. Background chaos layers (Winamp, popups, BSOD, etc.)
16. Win98 error popup (3-second auto-show)

## 4. CLEAN MODE HERO — EXACT COPY
Write the exact headline, subheadline, and CTA button text for clean mode.
Write 2-3 alternative versions ranked by preference.
Keep the brand voice (witty, self-aware) but prioritize clarity.

## 5. TRUST SIGNALS TO ADD
What specific trust elements should clean mode include that chaos mode doesn't need?
Be specific (e.g., "X users in Y markets" counter, testimonial format, etc.)

## 6. MOBILE-SPECIFIC RECOMMENDATIONS
What changes are needed specifically for mobile in both modes?
The current page is 2,321 lines of JSX with multiple overlay components.

## 7. CONVERSION FLOW OPTIMIZATION
Analyze the current signup flow (modal with email + password + state + market dropdowns).
Suggest specific improvements to reduce friction.
Should the flow differ between chaos and clean mode?

## 8. UTM AUTO-DETECTION MAP
For each traffic source, recommend which mode should auto-activate:
- Direct traffic (no referrer)
- Google organic
- Google Ads (if future)
- Reddit (r/flipping, r/thriftstorehauls)
- Reddit (r/InternetIsBeautiful, front page)
- Twitter/X
- TikTok
- Facebook
- Email (from digest share)
- NextDoor

## 9. EASTER EGG INTEGRATION
How should the easter egg / contest interact with clean mode?
Should clean mode users even know it exists? If so, how do they discover it?

## 10. PRIORITY RANKING
Rank all your recommendations by:
1. Impact on conversion (high/medium/low)
2. Implementation effort (hours estimate)
3. Priority order (what to build first)

Format as a table:
| # | Recommendation | Conversion Impact | Effort | Priority |
```

---

## CONSTRAINTS
- Same URL (flip-ly.net) must serve both modes
- Same codebase (React/Next.js) — toggle is a state variable, not separate pages
- Dark theme (#0D0D0D background) stays in both modes
- Lobster (🦞) branding stays in both modes
- Brand voice (self-aware, funny, honest) stays in both modes — just less visual chaos in clean mode
- Easter egg/contest must remain accessible in both modes (but can be hidden differently)
- The weekly email product doesn't change — this is landing page only
- No budget for custom illustrations or professional photography right now
- Signup requires: email, password, state, market (4 fields minimum due to architecture)

---

END OF PROMPT
