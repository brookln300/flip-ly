import { createHash } from 'crypto'

/**
 * Stable dedupe key for a captured post.
 *
 * Normalizes whitespace and case so the same post seen twice (re-scrolled,
 * or cross-posted by two members) collapses to one row. Group + author are
 * included so identical text in different groups is not falsely merged.
 */
export function contentHash(groupId: string, author: string, text: string): string {
  const normalizedText = text.trim().toLowerCase().replace(/\s+/g, ' ')
  const key = `${groupId || ''}|${author || ''}|${normalizedText}`
  return createHash('sha256').update(key).digest('hex')
}
