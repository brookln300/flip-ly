# Open Questions

**Created:** 2026-04-04
**Rule:** Every question gets a decision date. No question lives here more than 7 days without resolution or explicit deferral.

---

## Unresolved

| # | Question | Raised | Depends On | Notes |
|---|----------|--------|------------|-------|
| 1 | FB Marketplace scraping — legal approach? Server-side vs browser extension? | 2026-04-04 | SOURCE-STRATEGY.md | Largest potential source. Technical and legal research needed. **PROMISING LEAD:** Facebook Graph API allows reading posts from FB Groups that your Page/App is a member of. If Flip-ly's FB Page joins public buy/sell groups with permission, we could read posts via API — legitimately. This is NOT Marketplace scraping — it's Group API access, which FB explicitly supports. Research: Graph API `/{group-id}/feed` endpoint, App Review requirements, rate limits. Could turn the directory model into a live feed — legally. Come back to this Phase 3-4. |
| 2 | Annual pricing — offer it? What discount (15%? 20%?)? | 2026-04-04 | PRICING-MODEL.md | Pro: better LTV, lower churn. Con: slower initial revenue. |
| 3 | Should free tier see AI scores (number only, no breakdown)? | 2026-04-04 | PRICING-MODEL.md | Showing the score hooks them. Hiding the "why" drives upgrades. |
| 4 | Referral program mechanics — what does the referrer get? | 2026-04-04 | FEATURE-ROADMAP.md | Free month of Pro? Credit toward Power? |
| 5 | Mobile strategy — PWA vs native vs email-only for now? | 2026-04-04 | FEATURE-ROADMAP.md | Push notifications require PWA or native. |
| 6 | "Flip-ly" name — keep or rebrand? | 2026-04-04 | PRODUCT-PIVOT.md | Name actually fits better post-pivot. Likely keep. |
| 7 | How to handle $5/mo early adopter promise? | 2026-04-04 | PRICING-MODEL.md | Options: grandfather at $5 Pro forever, offer discounted Power, or convert to annual deal. |
| 8 | OfferUp — API access or scrape? | 2026-04-04 | SOURCE-STRATEGY.md | Need to research API availability. |
| 9 | Category taxonomy — predefined categories or AI-generated tags? | 2026-04-04 | FEATURE-ROADMAP.md | Affects saved searches, filtering, price intelligence. |
| 10 | Multi-market gating — how do users pick their markets? | 2026-04-04 | PRICING-MODEL.md | Dropdown? Zip code radius? Named metros? |

---

## Resolved

| # | Question | Decision | Date | Rationale |
|---|----------|----------|------|-----------|
| — | Pivot or stay garage-sale-only? | Pivot to local deal discovery | 2026-04-04 | Garage sales = seasonal, low WTP, capped. Engine already supports broader sources. |
| — | Remove garage sale feature entirely? | No — keep as differentiator | 2026-04-04 | Unique source nobody else bundles. Wedge that gets users in the door. |
