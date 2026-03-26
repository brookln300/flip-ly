import { NextRequest, NextResponse } from 'next/server'

// Chaotic random listing generator — NOT real data
const TITLES = [
  'Entire garage cleanout — tools, furniture, a cursed lamp',
  'Estate sale — antique furniture, possibly haunted mirror',
  'Moving sale — EVERYTHING MUST GO (including the dog, jk)',
  'Vintage vinyl, turntables, one broken lava lamp',
  'Kids toys, bikes, baby gear — the kid outgrew everything in 2 weeks',
  'Power tools from a guy who "definitely finished all his projects"',
  'Grandma\'s attic: 47 years of hoarding, now YOUR problem',
  'Divorce sale — his stuff. priced to annoy.',
  'FREE: couch that smells like possibility (and cats)',
  'Mid-century modern table (or at least that\'s what Craigslist said)',
  'Box of mystery cables — one of them definitely works',
  'Wedding decorations (marriage lasted longer than expected)',
  'Tupperware collection — lids sold separately (missing)',
  '97 VHS tapes and a player that probably works',
  'IKEA furniture: only assembled twice, some screws may be extra',
  'Genuine fake plants — very realistic, very dusty',
  'Exercise equipment (used as a clothing rack since January)',
  'Complete set of encyclopedias (Google killed these)',
  'Beanie Babies — this is their year, I can feel it',
  'Lawn mower that starts on the 7th pull (guaranteed)',
]

const CITIES = [
  'McKinney, TX', 'Plano, TX', 'Dallas, TX', 'Frisco, TX',
  'Denton, TX', 'Arlington, TX', 'Fort Worth, TX', 'Allen, TX',
  'Richardson, TX', 'Garland, TX', 'Mesquite, TX', 'Irving, TX',
]

const PRICES = [
  'FREE (just take it)', '$1–$50', '$5–$200', 'Make offer',
  '$10–$100', 'Multi-family', '$2–$80', '$FREE–$???',
  'Name your price', '$5 or best offer (no lowballs, I know what I have)',
]

const DATES = [
  'Sat 3/29', 'Sat–Sun', 'Fri–Sun', 'This weekend',
  'Sat 7AM SHARP', 'Sun only', 'Sat 3/29 (rain date: never)',
]

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const query = searchParams.get('q') || ''
  const count = Math.min(parseInt(searchParams.get('limit') || '8'), 20)

  // Generate random chaotic listings
  const listings = shuffle(TITLES).slice(0, count).map((title, i) => ({
    id: `fake-${Date.now()}-${i}`,
    title: query ? title.replace(/—/, `— "${query}" vibes —`) : title,
    price: PRICES[Math.floor(Math.random() * PRICES.length)],
    city: CITIES[Math.floor(Math.random() * CITIES.length)],
    date: DATES[Math.floor(Math.random() * DATES.length)],
    hot: Math.random() > 0.5,
    roi_estimate: Math.random() > 0.7 ? `${Math.floor(Math.random() * 400 + 50)}%` : null,
    source: Math.random() > 0.5 ? 'craigslist' : 'estatesales.net',
    posted_ago: `${Math.floor(Math.random() * 48 + 1)}h ago`,
  }))

  return NextResponse.json({
    results: listings,
    total: listings.length,
    query: query || null,
    disclaimer: 'These results are 100% fake. Like our CSS choices.',
    _meta: {
      chaos_level: 'maximum',
      source: 'imagination.dll',
      scraped_at: new Date().toISOString(),
    },
  })
}
