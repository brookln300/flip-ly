/**
 * Local message send worker — sends APPROVED seller inquiries via your Gmail ($0).
 *
 * Runs on Keith's PC. Sends only messages that are (1) status='approved' AND
 * (2) have a real to_addr (a seller email you pasted in /messages). Craigslist
 * relay-only listings have no email → they stay manual (open the listing + paste;
 * the /messages UI has the buttons). We do NOT auto-email CL relays — that risks
 * spam-flagging your Gmail + trips CL's anti-automation.
 *
 * SAFETY: dry-run by default — prints what WOULD send and changes nothing.
 * Set SEND_LIVE=true to actually send. First real test: paste your OWN email on
 * a draft, approve it, run with SEND_LIVE=true, confirm it arrives.
 *
 * Setup (one time):
 *   1. npm i nodemailer   (in flip-ly-app)
 *   2. Gmail → Manage account → Security → 2-Step Verification → App passwords →
 *      generate one for "Mail". Add to flip-ly-app/.env.local:
 *        GMAIL_USER=you@gmail.com
 *        GMAIL_APP_PASSWORD=the16charapppassword
 *   3. node scripts/local-messages.mjs            (dry-run)
 *      SEND_LIVE=true node scripts/local-messages.mjs   (send for real)
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

try {
  const env = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
  for (const line of env.split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim()
  }
} catch {}

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const GMAIL_USER = process.env.GMAIL_USER
const GMAIL_PASS = process.env.GMAIL_APP_PASSWORD
const LIVE = process.env.SEND_LIVE === 'true'

if (!SUPABASE_URL || !SUPABASE_KEY || SUPABASE_KEY.includes('PASTE_YOUR')) {
  console.error('Missing Supabase creds in .env.local.'); process.exit(1)
}
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } })

async function run() {
  const { data: msgs } = await supabase
    .from('fliply_messages')
    .select('id, subject, body, to_addr')
    .eq('status', 'approved')
    .not('to_addr', 'is', null)
    .is('sent_at', null)
    .limit(50)

  if (!msgs || msgs.length === 0) { console.log('No approved messages with an email to send.'); return }

  if (!LIVE) {
    console.log(`DRY RUN — ${msgs.length} message(s) would send (set SEND_LIVE=true to send):`)
    for (const m of msgs) console.log(`  → ${m.to_addr} | ${m.subject}`)
    console.log('Nothing sent.')
    return
  }

  if (!GMAIL_USER || !GMAIL_PASS) {
    console.error('SEND_LIVE=true but GMAIL_USER / GMAIL_APP_PASSWORD not set in .env.local.'); process.exit(1)
  }

  let nodemailer
  try { nodemailer = (await import('nodemailer')).default }
  catch { console.error('nodemailer not installed. Run: npm i nodemailer'); process.exit(1) }

  const tx = nodemailer.createTransport({ service: 'gmail', auth: { user: GMAIL_USER, pass: GMAIL_PASS } })

  let sent = 0
  for (const m of msgs) {
    try {
      const info = await tx.sendMail({ from: GMAIL_USER, replyTo: GMAIL_USER, to: m.to_addr, subject: m.subject || 'Interested in your listing', text: m.body })
      await supabase.from('fliply_messages').update({ status: 'sent', sent_at: new Date().toISOString(), thread_ref: info.messageId || null }).eq('id', m.id)
      console.log(`sent → ${m.to_addr}`)
      sent++
    } catch (e) {
      console.error(`failed → ${m.to_addr}: ${e.message}`)
    }
  }
  console.log(`Done: ${sent}/${msgs.length} sent via ${GMAIL_USER}.`)
}

run().catch(e => { console.error(e); process.exit(1) })
