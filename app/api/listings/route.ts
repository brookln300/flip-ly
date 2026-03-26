import { NextRequest, NextResponse } from 'next/server'
import { trackEvent } from '../../lib/analytics'

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
  'Haunted dollhouse — priced to move (it moves on its own)',
  '14 half-used candles and one fully used excuse',
  'Treadmill (dust collector edition, mint condition)',
  'ENTIRE kitchen — pots, pans, regrets',
  'Records my dad says are worth $10,000 (narrator: they were not)',
  'Baby clothes worn once — baby grew 3 inches overnight',
  'Decorative swords — very decorative, very not sharp',
  'Vintage computer — runs Windows 98 (feature, not bug)',
  'Lamp that looks expensive but cost $4 at Target in 2019',
  'Books: 200+ paperbacks, mostly Danielle Steel and dust',
  'Board games with "most" of the pieces',
  'Pool table — you move it. seriously. it weighs 800 lbs.',
  'Grandpa\'s tools — he\'d want you to have them (at a markup)',
  'Christmas decorations (it\'s March but deals are deals)',
  'Aquarium with everything except fish (and water)',
  'Collection of hotel shampoo bottles — 15 years strong',
  'One (1) very confident cat tree, slightly used',
  'Fondue set still in original box from 1974 wedding gift',
  'Printer that works — yes, really — no, I\'m serious — $5',
  'Refrigerator — works great, just doesn\'t close all the way',
  '3 bicycles, 2 wheels each (mostly)',
  'Taxidermy collection — the eyes follow you. they follow everyone.',
  'Sewing machine from the 1960s — makes clothes AND existential dread',
  'HOA violation sale — the sign was too big, the deals are bigger',
  'Karaoke machine — tested at 2 AM, neighbors confirmed it works',
  'Rollerblades (the aggressive inline kind, not the fun kind)',
  'Piano — free if you can carry it upstairs. wait, downstairs.',
  'LEGO collection — 10,000 pieces, 0 instructions, 47 barefoot injuries',
  'Waterbed — yes they still exist. no you can\'t test it.',
  'Elliptical machine — bought Jan 2, used Jan 3, collecting dust since',
  'VCR with 40 Disney tapes — the vault is OPEN',
  'Vintage typewriter — for your screenplay that\'s "almost done"',
  'Surfboard in Texas — I don\'t have answers, only deals',
  'Slow cooker used exactly once for a chili that ruined Thanksgiving',
  'Guitar with 5 strings and unlimited potential',
  'Tent that sleeps 6 (or 2 people who don\'t like each other)',
  'Antique clock — still works, tells time passive-aggressively',
  'Bread maker — used during quarantine, never again',
  'Entire shed contents — I don\'t know what\'s in there either',
  'Massage chair — it vibrates. that\'s its whole personality.',
  'Telescope — great for stargazing or watching your neighbor\'s garage sale',
  // === BATCH 3: 90s Internet + Piracy + Winamp ===
  'Winamp skin collection on 14 floppy disks — it really whips the llama\'s a**',
  'Napster t-shirt (original, not the comeback) — still smells like dial-up',
  'AOL installation CDs — 947 free hours across 38 discs',
  'Working 56k modem — screech included, neighbors not included',
  'GeoCities backup on ZIP drive — includes animated flames GIF',
  'LimeWire laptop — 40,000 "songs" (50% are actually viruses)',
  'ICQ flower — the physical one they sold at ThinkGeek in 2001',
  'Keyboard with no W key — previous owner was not a gamer',
  'CRT monitor — 19 inches of raw, unfiltered 1024x768',
  'Bondi Blue iMac — it still boots. nobody knows why.',
  'Stack of burned CDs labeled "MIX TAPE VOL 47 — DO NOT SHARE"',
  'Mouse with a BALL in it — gen z will think this is a toy',
  'Ethernet cable — 100 feet of pure, unencrypted potential',
  'Palm Pilot with stylus — the original iPhone (don\'t @ me)',
  // === BATCH 4: Pirate / Treasure Hunt ===
  'Treasure chest (it\'s a cooler painted gold, but still)',
  'Pirate flag — flew over this garage sale since 2019',
  'Map to buried treasure (it\'s just IKEA directions)',
  'Wooden leg — decorative. or is it?',
  'Actual metal detector — find your own deals in the ground',
  'Gold coins (chocolate, expired, still delicious probably)',
  'Ship in a bottle — bottle is cracked, ship is vibes',
  // === BATCH 5: Suburban Chaos ===
  'Entire HOA board worth of lawn signs — make your own rules',
  'Ring doorbell — comes with 400 hours of footage of a cat',
  'Roomba that only goes in circles — existential crisis model',
  'Smart fridge — it knows what you ate at 2 AM. it judges.',
  'Alexa — she\'s been listening. she has opinions.',
  'Nest thermostat — set to 68 by dad, password-protected forever',
  'Outdoor projector — watched every Marvel movie on a bedsheet',
  'Inflatable hot tub — summer vibes, winter regret',
  'Solar panels (3 of 4 work) — DIY energy independence-ish',
  'Home security sign (no actual system) — vibes-based protection',
  // === BATCH 6: Absolutely Unhinged ===
  'One very large jar of buttons — WHY did grandma save these',
  'Mannequin — no questions. $15 firm.',
  'Fog machine from a DJ phase that lasted 2 weekends',
  'Disco ball — still works, marriage did not',
  'Full-size cardboard cutout of Guy Fieri — flavor town awaits',
  'Chia Pet (fully grown, sentient, answers to "Gerald")',
  'Box of 200 googly eyes — arts & crafts or psychological warfare',
  'Lava lamp that hasn\'t been turned off since 2003',
  'Bobblehead collection — 34 presidents, 0 dignity',
  'Magic 8-Ball — asked if this sale would be good. "Outlook not so good."',
  'Velvet painting of Elvis — he\'s looking right at you',
  'Snow globe collection from every airport gift shop since 1998',
  'Broken drone — ironic given our other website',
  'Life-size inflatable T-Rex costume — worn to one (1) party',
  'Jazzercise VHS tapes — the workout your mom doesn\'t talk about',
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

  // GA4: listing_search
  trackEvent('listing_search', {
    query: query || 'browse',
    result_count: listings.length,
  })

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
