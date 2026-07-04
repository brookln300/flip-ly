import { supabase } from './supabase'
import { callHaiku } from './ai/claude'

/**
 * Family chat bot — natural-language questions over the DFW deal DB, answered
 * with Haiku (~$0.001/msg) routing to SAFE, parameterized, READ-ONLY queries.
 * No raw SQL from the model (injection/destruction risk) — it only picks an
 * intent + params from a fixed menu. Plus two light actions (buy/draft) that
 * resolve a deal by its short ref.
 */
const DFW = '08170240-45d0-47cf-8b6d-7fdbc3443dbe'
const money = (c: number | null) => c == null ? '—' : `$${Math.round(c / 100).toLocaleString()}`
const ref = (id: string) => id.slice(0, 6)

const ROUTER_SYSTEM = `You route a message for a Dallas–Fort Worth deal-finder family chat bot to ONE intent. Return JSON only, no prose:
{"intent": one of "top_deals" | "category" | "search" | "inventory" | "stats" | "buy" | "draft" | "help",
 "category": one of tools|furniture|electronics|vintage|collectibles|musical|automotive|sports|kitchen|outdoor|home-decor|books|kids|clothing|free (only for intent=category),
 "query": "keywords" (only for intent=search),
 "max_price": number in dollars (optional, for top_deals/category/search),
 "ref": "6-char code" (only for intent=buy or draft),
 "limit": number 1-10 (optional)}
Rules: a specific product/keyword (dewalt, iphone, sports cards, pokemon, guitar, lego) -> intent=search with that as query. A broad category word from the list -> intent=category. "best/any/what X" where X is a category word -> category; where X is a specific thing -> search.
Examples:
"best deals" / "what's hot" -> {"intent":"top_deals"}
"best electronics deal in the area" -> {"intent":"category","category":"electronics"}
"electronics under 100" -> {"intent":"category","category":"electronics","max_price":100}
"any sports cards in our lists?" -> {"intent":"search","query":"sports cards"}
"any pokemon or trading cards" -> {"intent":"search","query":"cards"}
"any dewalt?" -> {"intent":"search","query":"dewalt"}
"cheap tools" -> {"intent":"category","category":"tools"}
"what's in inventory" / "our profit" -> {"intent":"inventory"}
"how many listings" / "stats" -> {"intent":"stats"}
"buy a1b2c3" -> {"intent":"buy","ref":"a1b2c3"}
"draft a1b2c3" -> {"intent":"draft","ref":"a1b2c3"}
anything unclear -> {"intent":"help"}.`

async function topDeals(maxPrice?: number, limit = 5) {
  const now = new Date().toISOString()
  const maxAge = new Date(Date.now() - 14 * 864e5).toISOString()
  let q = supabase.from('fliply_listings')
    .select('id, title, price_text, price_low_cents, deal_score, margin_pct, city, source_url, ai_tags')
    .eq('market_id', DFW).is('duplicate_of', null).not('deal_score', 'is', null)
    .or(`expires_at.is.null,expires_at.gte.${now}`).gte('scraped_at', maxAge)
    .order('deal_score', { ascending: false }).order('scraped_at', { ascending: false }).limit(limit)
  if (maxPrice) q = q.lte('price_low_cents', maxPrice * 100)
  const { data } = await q
  return data || []
}

function fmtDeals(rows: any[], header: string) {
  if (!rows.length) return `${header}\nNothing matching right now.`
  const lines = [header, '']
  for (const d of rows) {
    lines.push(`<code>${ref(d.id)}</code> · ${d.price_text || '—'} · ${d.deal_score ?? '?'}/10${d.margin_pct != null ? ` · ${d.margin_pct}% margin` : ''}`)
    lines.push(`${d.title}${d.city ? ` · ${d.city}` : ''}`)
    if (d.source_url) lines.push(d.source_url)
    lines.push('')
  }
  lines.push(`<i>Reply "buy &lt;code&gt;" to log a purchase or "draft &lt;code&gt;" to draft a seller message.</i>`)
  return lines.join('\n')
}

async function resolveRef(code: string): Promise<any> {
  const rows = await topDeals(undefined, 10)
  const wide = rows.length ? rows : (await supabase.from('fliply_listings').select('id, title, price_low_cents, ai_tags, comp_median_cents, source_url').eq('market_id', DFW).gte('deal_score', 4).order('scraped_at', { ascending: false }).limit(300)).data || []
  return wide.find((d: any) => d.id.startsWith(code.toLowerCase()))
}

export async function handleFamilyChat(text: string): Promise<string> {
  const t = text.trim()
  if (/^(help|start|\/help|\/start)$/i.test(t)) return helpText()

  const { parsed } = await callHaiku<any>({ system: ROUTER_SYSTEM, userMessage: t, maxTokens: 150 })
  const intent = parsed?.intent || 'help'

  try {
    if (intent === 'top_deals') return fmtDeals(await topDeals(parsed.max_price, parsed.limit || 5), `🔥 <b>Top DFW deals${parsed.max_price ? ` under $${parsed.max_price}` : ''}</b>`)

    if (intent === 'category' && parsed.category) {
      const maxAge = new Date(Date.now() - 14 * 864e5).toISOString()
      let q = supabase.from('fliply_listings').select('id, title, price_text, price_low_cents, deal_score, margin_pct, city, source_url')
        .eq('market_id', DFW).is('duplicate_of', null).overlaps('ai_tags', [parsed.category]).not('deal_score', 'is', null)
        .gte('scraped_at', maxAge).order('deal_score', { ascending: false }).limit(5)
      if (parsed.max_price) q = q.lte('price_low_cents', parsed.max_price * 100)
      const { data } = await q
      return fmtDeals(data || [], `🔎 <b>${parsed.category}${parsed.max_price ? ` under $${parsed.max_price}` : ''}</b>`)
    }

    if (intent === 'search' && parsed.query) {
      const safe = String(parsed.query).replace(/[,%_().*]/g, ' ').trim()
      let q = supabase.from('fliply_listings').select('id, title, price_text, price_low_cents, deal_score, margin_pct, city, source_url')
        .eq('market_id', DFW).is('duplicate_of', null).or(`title.ilike.%${safe}%,ai_description.ilike.%${safe}%`)
        .order('deal_score', { ascending: false, nullsFirst: false }).limit(5)
      if (parsed.max_price) q = q.lte('price_low_cents', parsed.max_price * 100)
      const { data } = await q
      return fmtDeals(data || [], `🔎 <b>"${safe}"</b>`)
    }

    if (intent === 'inventory') {
      const { data } = await supabase.from('fliply_inventory').select('title, status, bought_cents, sold_cents, fees_cents').order('created_at', { ascending: false }).limit(20)
      const rows = data || []
      const active = rows.filter(r => r.status === 'bought' || r.status === 'listed')
      const sold = rows.filter(r => r.status === 'sold')
      const invested = active.reduce((s, r) => s + (r.bought_cents || 0), 0)
      const profit = sold.reduce((s, r) => s + ((r.sold_cents || 0) - (r.bought_cents || 0) - (r.fees_cents || 0)), 0)
      const lines = [`📦 <b>Inventory</b> — ${active.length} active, ${money(invested)} invested · ${sold.length} sold, ${money(profit)} profit`, '']
      active.slice(0, 10).forEach(r => lines.push(`• ${r.title} — paid ${money(r.bought_cents)} [${r.status}]`))
      return lines.join('\n')
    }

    if (intent === 'stats') {
      const day = new Date(Date.now() - 864e5).toISOString()
      const [tot, hot, nu] = await Promise.all([
        supabase.from('fliply_listings').select('id', { count: 'exact', head: true }).eq('market_id', DFW),
        supabase.from('fliply_listings').select('id', { count: 'exact', head: true }).eq('market_id', DFW).gte('deal_score', 8),
        supabase.from('fliply_listings').select('id', { count: 'exact', head: true }).eq('market_id', DFW).gte('scraped_at', day),
      ])
      return `📊 <b>DFW</b>\n${tot.count?.toLocaleString()} listings · ${hot.count} hot (≥8) · ${nu.count} new/24h`
    }

    if (intent === 'buy' && parsed.ref) {
      const d = await resolveRef(parsed.ref)
      if (!d) return `Couldn't find deal <code>${parsed.ref}</code>. Ask for deals first, then use the code shown.`
      await supabase.from('fliply_inventory').insert({ listing_id: d.id, title: d.title, bought_cents: d.price_low_cents || null, comp_cents: d.comp_median_cents || null, status: 'bought' })
      return `✅ Added to inventory: ${d.title} (paid ${money(d.price_low_cents)}). See it under /inventory.`
    }

    if (intent === 'draft' && parsed.ref) {
      const d = await resolveRef(parsed.ref)
      if (!d) return `Couldn't find deal <code>${parsed.ref}</code>.`
      const offer = d.price_low_cents && d.price_low_cents > 100 ? Math.round(d.price_low_cents / 100 * 0.85) * 100 : null
      const body = `Hi, is your "${d.title}" still available? ${offer ? `Would you take $${Math.round(offer / 100)} cash? ` : ''}I can pick up in DFW this week. Thanks!`
      await supabase.from('fliply_messages').insert({ listing_id: d.id, direction: 'outbound', status: 'draft', channel: 'craigslist', subject: `Interested — ${d.title}`.slice(0, 120), body, offer_cents: offer })
      return `✉️ Draft created for ${d.title}. Review + send it under /messages.`
    }
  } catch (e: any) {
    return `Hit an error running that. Try "help".`
  }

  return helpText()
}

function helpText() {
  return `👋 <b>flip-ly family bot</b> — just ask, e.g.:\n• "top deals" / "best deals under $100"\n• "electronics under 200" / "tools"\n• "any dewalt" (search)\n• "my inventory" · "stats"\n• "buy &lt;code&gt;" / "draft &lt;code&gt;" (codes shown next to each deal)`
}
