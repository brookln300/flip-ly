import { callHaiku } from '../ai/claude'
import type { FbClassification } from './types'

/**
 * Classify a batch of Facebook group posts: is each one a genuine free giveaway,
 * and if so, what's the item / where / pickup constraints?
 *
 * Batches 5 posts per Haiku call — same pattern and economics as
 * app/lib/ai/enrich-listing.ts (~$0.0008/post).
 */

const SYSTEM = `You triage posts from Facebook "free stuff" and Buy Nothing groups.

For each post decide is_free: true ONLY if a physical item is genuinely being
given away for $0. Set is_free=false for: items for sale (any price, including
"cheap" or "$5"), ISO / "in search of" / requests, "claimed" or "gone" / "sold"
/ "pending" posts, polls, rants, rule announcements, and lost-and-found.

When is_free is true, extract:
- item_summary: one plain line naming the item and condition. Confident, not loud.
  No emoji, no exclamation marks, no hype words ("amazing", "must go").
  Example: "Gray 3-seat sofa, good condition, pet-free home".
- location_hint: neighborhood / cross-street / city if stated, else null.
- pickup_note: pickup method or deadline if stated (e.g. "porch pickup, gone by Sunday"), else null.
- location_zip: a 5-digit US ZIP code ONLY if one literally appears in the post text, else null. Never guess a ZIP from a city or neighborhood name.
- reason: a short phrase explaining the verdict.

When is_free is false, set item_summary / location_hint / pickup_note / location_zip
to null and give the reason (e.g. "for sale $20", "ISO request", "already claimed").

Return ONLY valid JSON, no prose:
{"posts":[{"index":0,"is_free":true,"item_summary":"...","location_hint":"...","pickup_note":"...","location_zip":null,"reason":"..."}]}
Use the exact index number given for each post. Include every post exactly once.`

export async function classifyBatch(posts: { raw_text: string }[]): Promise<FbClassification[]> {
  if (posts.length === 0) return []

  const userMessage = posts
    .map((p, i) => `--- POST ${i} ---\n${(p.raw_text || '').slice(0, 1500)}`)
    .join('\n\n')

  const { parsed } = await callHaiku<{ posts: FbClassification[] }>({
    system: SYSTEM,
    userMessage,
    maxTokens: 1500,
  })

  return parsed?.posts ?? []
}
