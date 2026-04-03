/**
 * Drip email templates for the welcome-to-convert sequence.
 *
 * 7 emails over 21 days:
 * Step 1 (Day 0):  Welcome — set expectations, deliver first value
 * Step 2 (Day 1):  First finds — show real deals near them
 * Step 3 (Day 3):  Social proof — "your neighbors are finding deals"
 * Step 4 (Day 7):  Weekly digest — they get their first real digest
 * Step 5 (Day 10): Soft pitch — "unlock hot deal alerts"
 * Step 6 (Day 14): FOMO — "Pro members got this deal 6 hours before you"
 * Step 7 (Day 21): Hard convert — early adopter pricing
 */

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
    'welcome': 'Your weekly garage sale digest starts Thursday',
    'first-finds': `We found deals near ${esc(vars.city)} — here's what's out there`,
    'social-proof': 'Your neighbors are already scoring deals',
    'first-digest-teaser': 'Your first weekly digest just dropped',
    'soft-pitch': 'See what Pro members get — and why it matters',
    'fomo': 'A Pro member got this deal 6 hours before you saw it',
    'hard-convert': 'Lock in $5/mo for life — early adopter pricing',
  }

  const resolvedPreview = previewText || previewTexts[templateKey] || ''
  const wrap = (content: string) => wrapEmail(content, resolvedPreview)

  const templates: Record<string, () => string> = {
    'welcome': () => wrap(`
      <h1 style="color:#22C55E;font-size:22px;margin:0 0 16px;font-weight:700;">
        Welcome to flip-ly, ${esc(username)}
      </h1>
      <p style="color:#555;font-size:15px;line-height:1.7;">
        Thanks for signing up. Here's what to expect.
      </p>
      <div style="background:#f8f8f8;border-radius:8px;padding:20px;margin:20px 0;">
        <table style="width:100%;font-size:14px;color:#555;">
          <tr><td style="padding:6px 0;width:28px;">&#x1F4E7;</td><td style="padding:6px 8px;">Weekly email digest every <strong style="color:#000;">Thursday at noon</strong></td></tr>
          <tr><td style="padding:6px 0;">&#x1F4CD;</td><td style="padding:6px 8px;">Garage sales, estate sales &amp; deals near <strong style="color:#000;">${esc(location)}</strong></td></tr>
          <tr><td style="padding:6px 0;">&#x1F50D;</td><td style="padding:6px 8px;">AI scores every listing so you know what's worth your time</td></tr>
          <tr><td style="padding:6px 0;">&#x1F4B0;</td><td style="padding:6px 8px;">Free tier: 10 searches/day, weekly digest, no credit card</td></tr>
        </table>
      </div>
      <div style="text-align:center;margin:24px 0;">
        <a href="https://flip-ly.net" style="${btnStyle}">
          Search Deals Now
        </a>
      </div>
      <p style="color:#999;font-size:13px;margin:0;">
        Tomorrow we'll send you the top deals we found near ${esc(vars.city)} this week.
      </p>
    `),

    'first-finds': () => wrap(`
      <h1 style="color:#22C55E;font-size:22px;margin:0 0 16px;font-weight:700;">
        Deals near ${esc(vars.city)} this week
      </h1>
      <p style="color:#555;font-size:15px;line-height:1.7;">
        Hey ${esc(username)}, here's what we're tracking in ${esc(location)}:
      </p>
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin:20px 0;text-align:center;">
        <p style="color:#166534;font-size:13px;margin:0 0 4px;text-transform:uppercase;letter-spacing:1px;">Live stats for ${esc(location)}</p>
        <p style="color:#000;font-size:20px;font-weight:700;margin:0;">
          480+ listings tracked &middot; 57 hot deals &middot; 3 sources
        </p>
      </div>
      <p style="color:#555;font-size:14px;line-height:1.7;">
        We scan Craigslist, Eventbrite, EstateSales.net and 20+ local sources — then our AI scores each listing on a 1-10 scale so you don't waste your Saturday on a bad sale.
      </p>
      <div style="text-align:center;margin:24px 0;">
        <a href="https://flip-ly.net" style="${btnStyle}">
          See This Week's Deals
        </a>
      </div>
    `),

    'social-proof': () => wrap(`
      <h1 style="color:#000;font-size:22px;margin:0 0 16px;font-weight:700;">
        Your neighbors are already finding deals
      </h1>
      <p style="color:#555;font-size:15px;line-height:1.7;">
        ${esc(username)}, quick update — flip-ly is growing in ${esc(location)}.
      </p>
      <div style="border-left:4px solid #22C55E;padding:12px 16px;margin:20px 0;background:#f8f8f8;border-radius:0 8px 8px 0;">
        <p style="color:#333;font-size:14px;font-style:italic;margin:0;">
          "Found a KitchenAid mixer for $15 at an estate sale I would have never known about. This service actually works."
        </p>
        <p style="color:#999;font-size:12px;margin:8px 0 0;">— Flip-ly user, DFW area</p>
      </div>
      <p style="color:#555;font-size:14px;line-height:1.7;">
        The best deals go to the people who show up first. Our AI helps you know which sales are worth your time — before everything gets picked over.
      </p>
      <div style="text-align:center;margin:24px 0;">
        <a href="https://flip-ly.net" style="${btnStyle}">
          Search Deals Near You
        </a>
      </div>
    `),

    'first-digest-teaser': () => wrap(`
      <h1 style="color:#000;font-size:22px;margin:0 0 16px;font-weight:700;">
        Your first weekly digest is here
      </h1>
      <p style="color:#555;font-size:15px;line-height:1.7;">
        ${esc(username)}, you've been on flip-ly for a week. Here's your first real weekly deal roundup.
      </p>
      <p style="color:#555;font-size:14px;line-height:1.7;">
        Every Thursday, we curate the top AI-scored deals near ${esc(location)}. The free version shows you the top 5 deals.
      </p>
      <div style="background:#f8f8f8;border:1px solid #e5e5e5;border-radius:8px;padding:16px;margin:20px 0;text-align:center;">
        <p style="color:#22C55E;font-size:16px;font-weight:700;margin:0 0 4px;">
          Pro members see 15+ deals and get this email 6 hours earlier
        </p>
        <p style="color:#999;font-size:12px;margin:0;">No pressure. Just something to know about.</p>
      </div>
      <div style="text-align:center;margin:24px 0;">
        <a href="https://flip-ly.net" style="${btnStyle}">
          See All Deals
        </a>
      </div>
    `),

    'soft-pitch': () => wrap(`
      <h1 style="color:#000;font-size:22px;margin:0 0 16px;font-weight:700;">
        What Pro members get
      </h1>
      <p style="color:#555;font-size:15px;line-height:1.7;">
        ${esc(username)}, you've been using flip-ly for 10 days. Quick question:
      </p>
      <p style="color:#000;font-size:16px;font-weight:600;line-height:1.7;">
        Have you ever shown up to a garage sale and all the good stuff was already gone?
      </p>
      <p style="color:#555;font-size:14px;line-height:1.7;">
        That's because someone got there first. With <strong>flip-ly Pro</strong>, you get:
      </p>
      <div style="background:#f8f8f8;border-radius:8px;padding:20px;margin:20px 0;">
        <table style="width:100%;font-size:14px;color:#555;">
          <tr><td style="padding:6px 0;width:28px;">&#x23F0;</td><td style="padding:6px 8px;"><strong style="color:#000;">First Dibs</strong> — Weekly digest 6 hours before free users</td></tr>
          <tr><td style="padding:6px 0;">&#x1F525;</td><td style="padding:6px 8px;"><strong style="color:#000;">Hot Deal Alerts</strong> — Instant notification for 9+/10 deals</td></tr>
          <tr><td style="padding:6px 0;">&#x1F50D;</td><td style="padding:6px 8px;"><strong style="color:#000;">Unlimited Search</strong> — No daily limit</td></tr>
          <tr><td style="padding:6px 0;">&#x1F514;</td><td style="padding:6px 8px;"><strong style="color:#000;">Custom Alerts</strong> — Saved searches with notifications</td></tr>
        </table>
      </div>
      <div style="text-align:center;margin:24px 0;">
        <p style="color:#22C55E;font-size:28px;font-weight:700;margin:0 0 4px;">$5/month</p>
        <p style="color:#999;font-size:12px;margin:0 0 16px;">Early adopter pricing — locked in for life.</p>
        <a href="https://flip-ly.net/pro" style="${btnStyle}">
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
        The best deals don't wait. The early birds who show up at opening? They have an edge. Pro gives you that edge.
      </p>
      <div style="text-align:center;margin:24px 0;">
        <p style="color:#22C55E;font-size:28px;font-weight:700;margin:0 0 4px;">$5/month</p>
        <p style="color:#999;font-size:12px;margin:0 0 16px;">Early adopter pricing — this rate is locked in for life.</p>
        <a href="https://flip-ly.net/pro" style="${btnStyle}">
          Get First Dibs
        </a>
      </div>
    `),

    'hard-convert': () => wrap(`
      <h1 style="color:#000;font-size:22px;margin:0 0 16px;font-weight:700;">
        A note about pricing
      </h1>
      <p style="color:#555;font-size:15px;line-height:1.7;">
        ${esc(username)}, you've been with us for 3 weeks. Here's something worth knowing:
      </p>
      <p style="color:#555;font-size:14px;line-height:1.7;">
        Right now, Pro is <strong style="color:#000;">$5/month</strong>. That's our early adopter price — and if you lock it in now, it stays $5/month for as long as you're subscribed. Even when the price goes up.
      </p>
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:20px;margin:20px 0;text-align:center;">
        <p style="color:#166534;font-size:11px;margin:0 0 4px;text-transform:uppercase;letter-spacing:1px;">Early Adopter Pricing</p>
        <p style="color:#000;font-size:36px;font-weight:700;margin:0 0 4px;">
          $5/month
        </p>
        <p style="color:#166534;font-size:14px;font-weight:600;margin:0 0 4px;">Locked in for life</p>
        <p style="color:#999;font-size:12px;margin:0;">Cancel anytime. No contracts. No hard feelings.</p>
      </div>
      <p style="color:#555;font-size:14px;line-height:1.7;">
        What you get: weekly digest 6 hours early, unlimited searches, full AI scores, hot deal alerts, and custom saved searches.
      </p>
      <p style="color:#555;font-size:14px;line-height:1.7;">
        One good find pays for a year of Pro. That's not marketing — it's math.
      </p>
      <div style="text-align:center;margin:24px 0;">
        <a href="https://flip-ly.net/pro" style="${btnStyle}">
          Lock In $5/month
        </a>
      </div>
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
function wrapEmail(content: string, previewText?: string): string {
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
      <a href="https://flip-ly.net/unsubscribe" style="color:#999;">Unsubscribe</a>
    </p>
  </div>
</div>
</body></html>`
}

function esc(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
