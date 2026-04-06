# FLIP-LY LAUNCH SPRINT — April 5-18, 2026

## The Rule

Ship > Perfect. Action > Analysis. Speed > Debate.

Every element passes: "Would an app do this, or would only a landing page do this?" If landing page → cut it.

---

## Daily Execution Blocks

### Block 1: Morning Ops (09:30-10:00, 30m)
- Check Telegram daily summary from last night
- Review any new signups, pro conversions, feedback
- Check scraper health — any sources failing?
- Pick today's shipping target from the sprint board below

### Block 2: Build (10:00-14:00, 4h)
- Ship the day's feature. One thing, done, deployed.
- No planning during build block. Plan was set in Block 1.
- If blocked >30min: log it, switch to next priority, come back later.

### Block 3: Content + Growth (14:00-15:30, 90m)
- Blog post OR social content batch (alternating days)
- Buffer pipeline: check schedule gaps, regenerate if needed
- Reply to any feedback or user messages

### Block 4: Polish + Ship (15:30-17:00, 90m)
- Test today's feature on mobile
- Fix any visual bugs found
- Commit, push, verify Vercel deploy
- Update this sprint board

---

## Decision Tree (When Blocked)

```
Is it blocking launch? → Fix now, max 60 min
Is it a trust issue? (fake data, broken payment) → Fix now
Is it cosmetic? → Log it, keep shipping
Is it a nice-to-have? → After April 18
```

---

## Sprint Board (April 5-18)

| Day | Date | Target | Status |
|-----|------|--------|--------|
| 1 | Apr 5 | Landing page skeleton + design tokens | SHIPPED |
| 2 | Apr 5 | Visual upgrades, hero video, score bars | SHIPPED |
| 3 | Apr 5 | Product-first rewrite, OG image, polish | SHIPPED |
| 4 | Apr 5 | Kill fake scores, compress pricing, color fix | SHIPPED |
| 5 | Apr 5 | Sprint process, morning briefing, blog infra | IN PROGRESS |
| 6 | Apr 6 | Stripe checkout wiring (real payments) | |
| 7 | Apr 7 | Stripe portal + subscription management | |
| 8 | Apr 8 | Blog: first 2 SEO articles live | |
| 9 | Apr 9 | Saved searches + alert preferences UI | |
| 10 | Apr 10 | Email alerts for saved searches | |
| 11 | Apr 11 | Source integrations (EstateSales API) | |
| 12 | Apr 12 | More markets + scraper hardening | |
| 13 | Apr 13 | Mobile QA, edge cases, load testing | |
| 14 | Apr 14-17 | Buffer zone — catch up, polish, fix | |
| 15 | Apr 18 | LAUNCH: founding member program live | |

---

## Daily Scorecard

Track these every evening in the Telegram daily summary:

| Metric | Target | Why |
|--------|--------|-----|
| Commits | 2+ | Shipping velocity |
| Features shipped | 1 | One thing done per day |
| Blog posts (cumulative) | 3 by launch | SEO pipeline |
| Pro subscribers | Track growth | Revenue signal |
| Scraper uptime | 100% | Data quality |
| Mobile tested? | Y/N | Half of traffic will be mobile |

---

## Evening Protocol (5 min)

1. `git log --oneline -5` — did you ship?
2. Check Vercel deployment — green?
3. Update sprint board above
4. Set tomorrow's Block 2 target
5. Done. Close laptop.

---

## Launch Day Checklist (April 18)

- [ ] Stripe checkout tested with real card
- [ ] Pro tier delivers all promised features
- [ ] Weekly digest sent to test users
- [ ] Blog has 3+ indexed articles
- [ ] Social accounts posting on schedule
- [ ] Mobile experience tested on iOS + Android
- [ ] OG image renders correctly when shared
- [ ] Rate limiting works (free tier capped)
- [ ] Unsubscribe flow works (CAN-SPAM)
- [ ] Error states handled gracefully (no blank screens)
