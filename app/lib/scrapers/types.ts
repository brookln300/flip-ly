export interface ScraperResult {
  inserted: number
  skipped: number
  errors: string[]
}

export interface CraigslistConfig {
  rss_url: string
  hostname: string
}

export interface EventbriteConfig {
  latitude: number
  longitude: number
  radius: string
  keywords: string[]
}

export interface CityPermitConfig {
  city: string
  state: string
  url: string
}
