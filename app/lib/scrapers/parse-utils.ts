/**
 * Extract price info from listing text.
 */
export function extractPrice(text: string): {
  price_text: string
  price_low_cents: number | null
  price_high_cents: number | null
} {
  const priceMatch = text.match(/\$(\d+(?:,\d{3})*(?:\.\d{2})?)/g)
  if (!priceMatch) {
    if (/free/i.test(text)) return { price_text: 'FREE', price_low_cents: 0, price_high_cents: 0 }
    return { price_text: 'Not listed', price_low_cents: null, price_high_cents: null }
  }

  const prices = priceMatch.map((p) => Math.round(parseFloat(p.replace(/[$,]/g, '')) * 100))
  const low = Math.min(...prices)
  const high = Math.max(...prices)

  return {
    price_text: priceMatch.join(' - '),
    price_low_cents: low,
    price_high_cents: high,
  }
}

/**
 * Extract a 5-digit US zip code from text.
 */
export function extractZipCode(text: string): string | null {
  const match = text.match(/\b(\d{5})\b/)
  return match ? match[1] : null
}

/**
 * Extract city from text by matching against known cities.
 */
export function extractCity(text: string, knownCities: string[]): string | null {
  const lower = text.toLowerCase()
  for (const city of knownCities) {
    if (lower.includes(city.toLowerCase())) return city
  }
  return null
}

/**
 * Get the next upcoming Saturday date.
 */
export function getNextSaturday(): Date {
  const now = new Date()
  const day = now.getDay()
  const daysUntilSat = (6 - day + 7) % 7 || 7
  const sat = new Date(now)
  sat.setDate(now.getDate() + daysUntilSat)
  return sat
}

/**
 * Format a date as YYYY-MM-DD.
 */
export function formatDate(d: Date): string {
  return d.toISOString().split('T')[0]
}

/**
 * Generate a deterministic external ID from a URL or string.
 */
export function generateExternalId(input: string): string {
  // Extract numeric ID from Craigslist URLs like /gms/d/title/12345678.html
  const clMatch = input.match(/\/(\d{8,12})\.html/)
  if (clMatch) return `cl-${clMatch[1]}`

  // Fallback: hash the input
  let hash = 0
  for (let i = 0; i < input.length; i++) {
    const chr = input.charCodeAt(i)
    hash = ((hash << 5) - hash) + chr
    hash |= 0
  }
  return `hash-${Math.abs(hash)}`
}
