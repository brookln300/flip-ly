export interface ScraperResult {
  inserted: number
  skipped: number
  errors: string[]
}

export interface CraigslistConfig {
  rss_url: string       // kept for backwards compat, unused by new scraper
  hostname: string      // e.g. "dallas"
  area_id: number       // CL SAPI area ID (dallas = 21)
}

export interface EventbriteConfig {
  latitude: number
  longitude: number
  radius: string        // e.g. "50mi"
  keywords: string[]
  city_slug: string     // e.g. "tx--dallas" for eventbrite.com/d/tx--dallas/
}

export interface CityPermitConfig {
  city: string
  state: string
  url: string
}

export interface AiExtractConfig {
  url: string
  source_name: string
  source_hint?: string
  max_pages?: number
  pagination_hint?: string
}
