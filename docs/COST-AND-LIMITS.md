# flip-ly.net — Cost & Platform Limits Analysis

## Current Monthly Costs (at current scale)

| Service | Plan | Monthly Cost | What You Get |
|---------|------|-------------|-------------|
| Vercel | Hobby (Free) | $0 | 100GB bandwidth, 100hrs serverless |
| Supabase | Free | $0 | 500MB database, 50k monthly active users |
| Resend | Free | $0 | 3,000 emails/month, 100/day |
| Stripe | Pay-per-use | 2.9% + $0.30/transaction | No monthly fee |
| Anthropic API | Pay-per-use | ~$2-5/month | Listing enrichment |
| Eventbrite API | Free | $0 | Rate limited |
| Telegram Bot | Free | $0 | Unlimited messages |
| GA4 | Free | $0 | Unlimited events |
| Domain (flip-ly.net) | Annual | ~$1/month ($12/yr) | Domain registration |
| **TOTAL** | | **~$3-6/month** | |

## When Free Tiers Break

### Vercel (Hosting)
- **Free limit:** 100GB bandwidth/month, 100 hours serverless execution
- **Breaks at:** ~50,000-100,000 monthly visitors
- **Upgrade cost:** $20/month (Pro plan)
- **What triggers it:** Viral TikTok or Reddit post could spike bandwidth

### Supabase (Database)
- **Free limit:** 500MB storage, 2GB bandwidth, 50k MAU
- **Current usage:** ~50MB (480 listings + users + logs)
- **Breaks at:** ~5,000-10,000 users OR 1 year of listing accumulation
- **Upgrade cost:** $25/month (Pro plan)
- **What triggers it:** Search log table grows fast (every search = 1 row)

### Resend (Email)
- **Free limit:** 3,000 emails/month, 100/day
- **Current usage:** Low (handful of users)
- **Breaks at:** ~400 users (7 drip emails + 4 digests/month = ~11 emails/user)
- **Upgrade cost:** $20/month (5,000 emails), scales from there
- **What triggers it:** First — this is the FIRST limit you'll hit

### Stripe (Payments)
- **No free tier limit** — just takes 2.9% + $0.30 per transaction
- **On a $5/mo subscription:** You keep $4.56, Stripe takes $0.44
- **At 100 Pro users:** $456/month revenue after Stripe fees

### Anthropic API (AI Scoring)
- **Pay per token** — ~$0.003 per listing enrichment
- **At 100 listings/week:** ~$1.20/month
- **Breaks at:** Never really — it's cheap at this scale

## Revenue vs Cost Projections

| Pro Users | Monthly Revenue | After Stripe Fees | Monthly Costs | Profit |
|-----------|----------------|-------------------|---------------|--------|
| 0 | $0 | $0 | ~$3 | -$3 |
| 10 | $50 | $45.60 | ~$3 | +$42 |
| 50 | $250 | $228 | ~$25 (Resend upgrade) | +$203 |
| 100 | $500 | $456 | ~$45 (Resend + Supabase) | +$411 |
| 250 | $1,250 | $1,140 | ~$65 (add Vercel Pro) | +$1,075 |
| 500 | $2,500 | $2,280 | ~$100 | +$2,180 |
| 1,000 | $5,000 | $4,560 | ~$150 | +$4,410 |

## Critical Thresholds

1. **~400 users** → Resend free tier maxed → upgrade to $20/mo
2. **~5,000 users** → Supabase free tier maxed → upgrade to $25/mo
3. **~50,000 visitors/mo** → Vercel free tier maxed → upgrade to $20/mo
4. **~$40k/yr profit** → Consider S-Corp election for tax savings

## Cost Per User

At current scale: ~$0.00/user (everything is free tier)
At 500 users: ~$0.20/user/month
At 1,000 users: ~$0.15/user/month

Costs scale logarithmically — they go up slower than revenue.
The business is profitable from user #1.

## What To Monitor

- Supabase dashboard → Storage tab (watch the 500MB limit)
- Resend dashboard → Usage tab (watch the 3,000 emails/month limit)
- Vercel dashboard → Usage tab (watch bandwidth + serverless hours)
- Stripe dashboard → Balance (your actual revenue)

## Search Log Table — The Silent Growth Monster

Every search by every user creates a row in `fliply_search_log`.
At 100 users doing 5 searches/day = 500 rows/day = 15,000 rows/month.
After 6 months = 90,000 rows. Each row is tiny (~100 bytes) but
consider adding a cleanup cron that deletes rows older than 30 days
to keep the table lean. The rate limiting only needs today's data.
