/**
 * Seed the FB "free stuff" pipeline with sample posts — WITHOUT touching Facebook.
 *
 * Lets you exercise the whole pipeline end to end (ingest → classify → Telegram)
 * against local dev or a preview deploy.
 *
 *   BASE_URL=http://localhost:3000 FB_INGEST_TOKEN=dev-token npx tsx scripts/seed-fb-post.ts
 *
 * Then trigger the digest cron manually:
 *   curl -H "Authorization: Bearer $CRON_SECRET" $BASE_URL/api/cron/fb-free-digest
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'
const TOKEN = process.env.FB_INGEST_TOKEN || 'dev-token'

const samples = [
  {
    group_id: '1000001',
    group_name: 'Buy Nothing Oak Cliff',
    post_url: 'https://www.facebook.com/groups/1000001/posts/2001/',
    author_name: 'A Neighbor',
    raw_text:
      'Free gray 3-seat sofa, good condition, from a pet-free and smoke-free home. Porch pickup off Bishop Ave, would like it gone by Sunday.',
    image_urls: ['https://example.com/sofa.jpg'],
  },
  {
    group_id: '1000001',
    group_name: 'Buy Nothing Oak Cliff',
    post_url: 'https://www.facebook.com/groups/1000001/posts/2002/',
    author_name: 'Someone Else',
    raw_text: 'ISO a toddler bike for my 3 year old if anyone is giving one away, thanks!',
  },
  {
    group_id: '1000002',
    group_name: 'Dallas Free & For Sale',
    post_url: 'https://www.facebook.com/groups/1000002/posts/3003/',
    author_name: 'Reseller Rick',
    raw_text: 'IKEA bookshelf, great shape, $15 firm. Pickup in Lakewood.',
  },
  {
    group_id: '1000002',
    group_name: 'Dallas Free & For Sale',
    post_url: 'https://www.facebook.com/groups/1000002/posts/3004/',
    author_name: 'Generous Gina',
    raw_text: 'Free moving boxes, about 20 of them, various sizes. Curb pickup today only, 5th and Elm.',
  },
]

async function main() {
  const res = await fetch(`${BASE_URL}/api/ingest/fb-post`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Ingest-Token': TOKEN },
    body: JSON.stringify(samples),
  })
  const json = await res.json().catch(() => ({}))
  console.log(`POST /api/ingest/fb-post → ${res.status}`, json)
  if (!res.ok) process.exit(1)
  console.log(
    `\nNow run the digest:\n  curl -H "Authorization: Bearer $CRON_SECRET" ${BASE_URL}/api/cron/fb-free-digest`,
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
