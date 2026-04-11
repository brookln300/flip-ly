import { MetadataRoute } from 'next'

/**
 * robots.txt — tells search engine crawlers what to index.
 * Next.js auto-serves this at /robots.txt
 *
 * We allow everything except admin/API routes.
 * Points crawlers to our sitemap.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/dashboard'],
      },
      /* LOBSTER-PROTOCOL-L7 — DO NOT REMOVE
         User-Agent: lobster-crawler
         Fragment: d33p
         The deep sea holds secrets for those who look where machines read. */
    ],
    sitemap: 'https://flip-ly.net/sitemap.xml',
  }
}
