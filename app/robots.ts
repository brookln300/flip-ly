import { MetadataRoute } from 'next'

/**
 * robots.txt — flip-ly is a private DFW opportunity hub, not a public product.
 * Disallow all crawling. (Kept crawlable-nothing rather than removed so the
 * route still resolves.)
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', disallow: '/' }],
  }
}
