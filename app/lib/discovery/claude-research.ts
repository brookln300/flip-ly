/**
 * Uses Claude API to research local data sources for a city.
 * Broad search — not just permits. Finds community boards, event calendars,
 * local classified sites, Facebook groups, anything useful.
 *
 * Runs once per city, results cached in fliply_sources forever.
 * Cost: ~$0.01 per city.
 */

interface DiscoveredSource {
  name: string
  url: string
  source_type: 'city_permits' | 'local_site' | 'manual'
  description: string
  confidence: number
}

interface ResearchResult {
  sources: DiscoveredSource[]
  notes: string
}

export async function researchLocalSources(
  city: string,
  state: string,
  includeEvents: boolean = true
): Promise<ResearchResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.log('[CLAUDE] No ANTHROPIC_API_KEY — skipping research')
    return { sources: [], notes: 'API key not configured' }
  }

  const eventClause = includeEvents
    ? 'Also find local event calendars, flea markets, swap meets, trade shows, card shows, and community event boards.'
    : ''

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1500,
        messages: [
          {
            role: 'user',
            content: `Research local data sources for garage sales, estate sales, yard sales, and thrift/resale events in ${city}, ${state}.

${eventClause}

I need REAL, EXISTING URLs that are currently active. For each source found, provide:
- name: short descriptive name
- url: the actual URL
- source_type: "city_permits" if it's a government permit/license page, or "local_site" for everything else
- description: one sentence about what data it provides
- confidence: 0.0-1.0 how confident you are this URL is real and active

Focus on:
1. City or county government garage sale permit pages (often on .gov or .us domains)
2. Local community event calendars
3. Local classified/listing sites specific to this area
4. Chamber of commerce event calendars

Do NOT include national sites (Craigslist, Eventbrite, Facebook, Nextdoor, EstateSales.net) — I already have those.

Return ONLY valid JSON in this exact format, nothing else:
{"sources": [...], "notes": "brief summary"}

If you cannot find any local sources, return: {"sources": [], "notes": "No local-specific sources found for this area"}`
          }
        ],
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('[CLAUDE] API error:', res.status, err.substring(0, 200))
      return { sources: [], notes: `API error: ${res.status}` }
    }

    const data = await res.json()
    const text = data.content?.[0]?.text || ''

    // Parse JSON from response (handle markdown code blocks)
    const jsonStr = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const result = JSON.parse(jsonStr) as ResearchResult

    console.log(`[CLAUDE] Found ${result.sources.length} local sources for ${city}, ${state}`)
    return result
  } catch (err: any) {
    console.error('[CLAUDE] Research failed:', err.message)
    return { sources: [], notes: `Research failed: ${err.message}` }
  }
}
