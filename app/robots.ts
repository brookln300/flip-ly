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
    ],
    sitemap: 'https://flip-ly.net/sitemap.xml',
  }
}
