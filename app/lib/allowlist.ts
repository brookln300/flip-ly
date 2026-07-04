/**
 * Family access allowlist. Set ALLOWED_EMAILS in Vercel env (comma-separated)
 * to lock signup/login to family only. If unset, access stays open (so nobody
 * gets accidentally locked out before the list is configured).
 */
export function isEmailAllowed(email?: string | null): boolean {
  const raw = process.env.ALLOWED_EMAILS
  if (!raw || !raw.trim()) return true // no allowlist configured → open
  if (!email) return false
  const allowed = raw.split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
  return allowed.includes(email.toLowerCase())
}
