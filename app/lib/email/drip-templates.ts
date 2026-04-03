/**
 * Drip email templates for the welcome-to-convert sequence.
 *
 * 7 emails over 21 days:
 * Step 1 (Day 0):  Welcome — set expectations, deliver immediate value
 * Step 2 (Day 1):  First finds — show real deals near them
 * Step 3 (Day 3):  Social proof — real user story, thrill of the find
 * Step 4 (Day 7):  Feature education + gentle Pro teaser
 * Step 5 (Day 10): Pro pitch — loss aversion framing
 * Step 6 (Day 14): FOMO — early access proof point
 * Step 7 (Day 21): Founder check-in — personal, plain-text feel
 */

import { getUnsubscribeUrl } from '../unsubscribe'

interface TemplateVars {
  email: string
  city: string
  state: string
  step_order: number
  variant: string
}

export async function getDripEmailHtml(
  templateKey: string,
  vars: TemplateVars,
  previewText?: string
): Promise<string> {
  const username = vars.email.split('@')[0]
  const location = `${vars.city}, ${vars.state}`

  const previewTexts: Record<string, string> = {
    'welcome': `Your weekly garage sale digest starts Thursday`,
    'first-finds': `We found deals near ${esc(vars.city)} — here's what's out there`,
    'social-proof': 'She found a $400 KitchenAid for $15 at an estate sale',
    'first-digest-teaser': 'Your first weekly digest just dropped',
    'soft-pitch': 'The best sales sell out before Saturday morning',
    'fomo': 'Pro members got this deal 6 hours before you saw it',
    'hard-convert': 'Quick question from the founder',
  }

  const resolvedPreview = previewText || previewTexts[templateKey] || ''
  const wrap = (content: string) => wrapEmail(content, resolvedPreview, vars.email)

  const templates: Record<string, () => string> = {
    'welcome': () => wrap(`
      <h1 style="color:#000;font-size:22px;margin:0 0 16px;font-weight:700;">
        Welcome to flip-ly
      </h1>
      <p style="color:#555;font-size:15px;line-height:1.7;">
        Hey ${esc(username)}, thanks for signing up. You're now tracking deals near <strong style="color:#000;">${esc(location)}</strong>.
      </p>
      <div style="background:#f8f8f8;border-radius:8px;padding:20px;margin:20px 0;">
        <p style="font-size:14px;font-weight:600;color:#000;margin:0 0 12px;">Here's how it works:</p>
        <table style="width:100%;font-size:14px;color:#555;">
          <tr><td style="padding:6px 0;width:28px;vertical-align:top;">1.</td><td style="padding:6px 8px;">We scan Craigslist, EstateSales.net, Eventbrite, and 20+ local sources — every 4 hours.</td></tr>
          <tr><td style="padding:6px 0;vertical-align:top;">2.</td><td style="padding:6px 8px;">Our AI scores every listing on a 1-10 scale so you know what's worth your time.</td></tr>
          <tr><td style="padding:6px 0;vertical-align:top;">3.</td><td style="padding:6px 8px;">Every <strong style="color:#000;">Thursday at noon</strong>, you get a curated digest of the best deals near you.</td></tr>
        </table>
      </div>
      <div style="text-align:center;margin:24px 0;">
        <a href="https://flip-ly.net?utm_source=email&utm_medium=drip&utm_campaign=welcome&utm_content=cta" style="${btnStyle}">
          Search Deals Near ${esc(vars.city)}
        </a>
      </div>
      <p style="color:#999;font-size:13px;margin:0;">
        Tomorrow we'll send you the top deals we found near ${esc(vars.city)} this week.
      </p>
    `),

    'first-finds': () => wrap(`
      <h1 style="color:#000;font-size:22px;margin:0 0 16px;font-weight:700;">
        Deals near ${esc(vars.city)} this week
      </h1>
      <p style="color:#555;font-size:15px;line-height:1.7;">
        Hey ${esc(username)}, here's what we're tracking in ${esc(location)}:
      </p>
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin:20px 0;text-align:center;">
        <p style="color:#166534;font-size:12px;margin:0 0 4px;text-transform:uppercase;letter-spacing:1px;">Live Stats</p>
        <p style="color:#000;font-size:18px;font-weight:700;margin:0;">
          3+ sources scanned &middot; Updated every 4 hours &middot; AI scored
        </p>
      </div>
      <p style="color:#555;font-size:14px;line-height:1.7;">
        We aggregate listings from multiple sources so you don't have to check each one separately. Our AI scores each listing on quality, variety, and resale potential — saving you from wasting your Saturday on a dud.
      </p>
      <div style="text-align:center;margin:24px 0;">
        <a href="https://flip-ly.net?utm_source=email&utm_medium=drip&utm_campaign=first-finds&utm_content=cta" style="${btnStyle}">
          See This Week's Deals
        </a>
      </div>
      <p style="color:#999;font-size:13px;margin:0;">
        Your Thursday digest will have the full ranked list. This is just a preview.
      </p>
    `),

    'social-proof': () => wrap(`
      <h1 style="color:#000;font-size:22px;margin:0 0 16px;font-weight:700;">
        The thrill of the find
      </h1>
      <p style="color:#555;font-size:15px;line-height:1.7;">
        ${esc(username)}, quick story:
      </p>
      <div style="border-left:4px solid #22C55E;padding:12px 16px;margin:20px 0;background:#f8f8f8;border-radius:0 8px 8px 0;">
        <p style="color:#333;font-size:14px;font-style:italic;margin:0;">
          "Found a KitchenAid mixer for $15 at an estate sale I would have never known about. Sold it for $180 on Marketplace the same day. This service actually works."
        </p>
        <p style="color:#999;font-size:12px;margin:8px 0 0;">— flip-ly user, DFW area</p>
      </div>
      <p style="color:#555;font-size:14px;line-height:1.7;">
        That sale scored a 9/10 on our AI — multi-family, tools, furniture, vintage items. The people who showed up first got the best picks.
      </p>
      <p style="color:#555;font-size:14px;line-height:1.7;">
        That's what flip-ly does: we help you know which sales are worth the drive, <em>before</em> everything gets picked over.
      </p>
      <div style="text-align:center;margin:24px 0;">
        <a href="https://flip-ly.net?utm_source=email&utm_medium=drip&utm_campaign=social-proof&utm_content=cta" style="${btnStyle}">
          Find Your Next Score
        </a>
      </div>
    `),

    'first-digest-teaser': () => wrap(`
      <h1 style="color:#000;font-size:22px;margin:0 0 16px;font-weight:700;">
        Your first weekly digest just dropped
      </h1>
      <p style="color:#555;font-size:15px;line-height:1.7;">
        ${esc(username)}, you've been on flip-ly for a week. Your first real weekly digest is on its way (or already in your inbox).
      </p>
      <p style="color:#555;font-size:14px;line-height:1.7;">
        A few things you might not know flip-ly does:
      </p>
      <div style="background:#f8f8f8;border-radius:8px;padding:20px;margin:20px 0;">
        <table style="width:100%;font-size:14px;color:#555;">
          <tr><td style="padding:8px 0;width:28px;vertical-align:top;font-weight:700;color:#22C55E;">1</td><td style="padding:8px 8px;"><strong style="color:#000;">AI deal scores</strong> — Every listing rated 1-10 based on variety, pricing signals, and resale potential</td></tr>
          <tr><td style="padding:8px 0;vertical-align:top;font-weight:700;color:#22C55E;">2</td><td style="padding:8px 8px;"><strong style="color:#000;">Multi-source aggregation</strong> — We check Craigslist, EstateSales.net, Eventbrite, and local sources you'd never find</td></tr>
          <tr><td style="padding:8px 0;vertical-align:top;font-weight:700;color:#22C55E;">3</td><td style="padding:8px 8px;"><strong style="color:#000;">Pro members</strong> get this digest 6 hours earlier, plus unlimited searches and full AI analysis</td></tr>
        </table>
      </div>
      <div style="text-align:center;margin:24px 0;">
        <a href="https://flip-ly.net?utm_source=email&utm_medium=drip&utm_campaign=digest-teaser&utm_content=cta" style="${btnStyle}">
          See All Deals
        </a>
      </div>
    `),

    'soft-pitch': () => wrap(`
      <h1 style="color:#000;font-size:22px;margin:0 0 16px;font-weight:700;">
        The best sales sell out before Saturday
      </h1>
      <p style="color:#555;font-size:15px;line-height:1.7;">
        ${esc(username)}, quick question:
      </p>
      <p style="color:#000;font-size:16px;font-weight:600;line-height:1.7;">
        Have you ever shown up to a sale and all the good stuff was already gone?
      </p>
      <p style="color:#555;font-size:14px;line-height:1.7;">
        That's because someone got there first. With <strong>flip-ly Pro</strong>, you get:
      </p>
      <div style="background:#f8f8f8;border-radius:8px;padding:20px;margin:20px 0;">
        <table style="width:100%;font-size:14px;color:#555;">
          <tr><td style="padding:8px 0;width:28px;vertical-align:top;">1.</td><td style="padding:8px 8px;"><strong style="color:#000;">Early access</strong> — Weekly digest 6 hours before free users</td></tr>
          <tr><td style="padding:8px 0;vertical-align:top;">2.</td><td style="padding:8px 8px;"><strong style="color:#000;">Full AI scores</strong> — See exactly why a sale scored high</td></tr>
          <tr><td style="padding:8px 0;vertical-align:top;">3.</td><td style="padding:8px 8px;"><strong style="color:#000;">Unlimited searches</strong> — No daily limit, full descriptions, direct links</td></tr>
          <tr><td style="padding:8px 0;vertical-align:top;">4.</td><td style="padding:8px 8px;"><strong style="color:#000;">Premium sources</strong> — Estate sales and local sources free users don't see</td></tr>
        </table>
      </div>
      <div style="text-align:center;margin:24px 0;">
        <p style="color:#22C55E;font-size:28px;font-weight:700;margin:0 0 4px;">$5/month</p>
        <p style="color:#999;font-size:12px;margin:0 0 16px;">Early adopter pricing — locked in for life.</p>
        <a href="https://flip-ly.net/pro?utm_source=email&utm_medium=drip&utm_campaign=soft-pitch&utm_content=cta" style="${btnStyle}">
          Upgrade to Pro
        </a>
      </div>
    `),

    'fomo': () => wrap(`
      <h1 style="color:#000;font-size:22px;margin:0 0 16px;font-weight:700;">
        Pro members got this deal 6 hours before you
      </h1>
      <p style="color:#555;font-size:15px;line-height:1.7;">
        ${esc(username)}, here's what happened this week:
      </p>
      <div style="background:#f8f8f8;border:1px solid #e5e5e5;border-radius:8px;padding:16px;margin:20px 0;">
        <p style="color:#999;font-size:11px;margin:0 0 4px;text-transform:uppercase;letter-spacing:1px;">Sent to Pro members at 6:00 AM</p>
        <p style="color:#000;font-size:16px;font-weight:600;margin:0 0 4px;">
          Estate Sale — Everything Must Go (9/10 AI Score)
        </p>
        <p style="color:#555;font-size:13px;margin:0 0 8px;">
          Furniture, tools, vintage collectibles — multiple families liquidating. This is the kind of sale where $20 turns into $200 on Marketplace.
        </p>
        <p style="color:#dc2626;font-size:12px;margin:0;font-weight:600;">
          You received this at noon. Pro members had it at 6 AM.
        </p>
      </div>
      <p style="color:#555;font-size:14px;line-height:1.7;">
        The early birds who show up at opening get the best finds. Pro gives you that edge.
      </p>
      <div style="text-align:center;margin:24px 0;">
        <p style="color:#22C55E;font-size:28px;font-weight:700;margin:0 0 4px;">$5/month</p>
        <p style="color:#999;font-size:12px;margin:0 0 16px;">Early adopter pricing — locked in for life.</p>
        <a href="https://flip-ly.net/pro?utm_source=email&utm_medium=drip&utm_campaign=fomo&utm_content=cta" style="${btnStyle}">
          Get Early Access
        </a>
      </div>
    `),

    'hard-convert': () => wrap(`
      <p style="color:#555;font-size:15px;line-height:1.7;">
        Hey ${esc(username)},
      </p>
      <p style="color:#555;font-size:15px;line-height:1.7;">
        I'm Keith, the person behind flip-ly. I built this because I was tired of missing good sales — checking 5 different sites, showing up to duds, never knowing which estate sales were actually worth the drive.
      </p>
      <p style="color:#555;font-size:15px;line-height:1.7;">
        You've been signed up for about 3 weeks. I have two questions:
      </p>
      <p style="color:#000;font-size:15px;font-weight:600;line-height:1.7;">
        1. Is flip-ly useful to you?
      </p>
      <p style="color:#555;font-size:14px;line-height:1.7;">
        If not, hit reply and tell me what you're looking for. I read every response and it genuinely helps me build something better.
      </p>
      <p style="color:#000;font-size:15px;font-weight:600;line-height:1.7;">
        2. Want to get more out of it?
      </p>
      <p style="color:#555;font-size:14px;line-height:1.7;">
        Pro is $5/month — early adopter price, locked in for life. You get deals 6 hours early, unlimited searches, full AI scores, and premium sources. One good find pays for a year.
      </p>
      <div style="text-align:center;margin:24px 0;">
        <a href="https://flip-ly.net/pro?utm_source=email&utm_medium=drip&utm_campaign=hard-convert&utm_content=cta" style="${btnStyle}">
          Try Pro — $5/month
        </a>
      </div>
      <p style="color:#555;font-size:14px;line-height:1.7;">
        Either way, the free weekly digest keeps coming every Thursday. No pressure.
      </p>
      <p style="color:#555;font-size:14px;line-height:1.7;">
        — Keith
      </p>
    `),
  }

  const renderer = templates[templateKey]
  if (!renderer) {
    return wrap(`<p style="color:#555;">Email template "${esc(templateKey)}" not found.</p>`)
  }

  return renderer()
}

// Clean button style — matches site branding
const btnStyle = `display:inline-block;padding:14px 32px;background:#22C55E;color:#000;text-decoration:none;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-weight:700;font-size:15px;border-radius:8px;`

// Clean email wrapper — white background, professional
function wrapEmail(content: string, previewText?: string, userEmail?: string): string {
  const unsubUrl = userEmail
    ? getUnsubscribeUrl(userEmail)
    : 'https://flip-ly.net/unsubscribe'

  const previewHtml = previewText ? `
<div style="display:none;font-size:1px;color:#ffffff;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
  ${previewText}
  &zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;
</div>` : ''
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
${previewHtml}
<div style="max-width:520px;margin:0 auto;background:#ffffff;">
  <!-- Header -->
  <div style="background:#0a0a0a;padding:24px 32px;">
    <span style="font-size:20px;color:#22C55E;font-weight:700;letter-spacing:-0.01em;">flip-ly.net</span>
  </div>
  <!-- Body -->
  <div style="padding:32px;color:#333;line-height:1.7;">
    ${content}
  </div>
  <!-- Footer -->
  <div style="background:#f8f8f8;padding:20px 32px;border-top:1px solid #eee;">
    <p style="color:#999;font-size:12px;margin:0 0 4px;">flip-ly.net — Garage sale intelligence, delivered weekly.</p>
    <p style="color:#bbb;font-size:11px;margin:0;">
      <a href="https://flip-ly.net" style="color:#999;">Visit</a> &middot;
      <a href="https://flip-ly.net/privacy" style="color:#999;">Privacy</a> &middot;
      <a href="${unsubUrl}" style="color:#999;">Unsubscribe</a>
    </p>
  </div>
</div>
</body></html>`
}

function esc(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
