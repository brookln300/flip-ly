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
 * Step 7 (Day 21): Hard convert — $1 first month offer
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
  vars: TemplateVars
): Promise<string> {
  const username = vars.email.split('@')[0]
  const location = `${vars.city}, ${vars.state}`

  const templates: Record<string, () => string> = {
    'welcome': () => wrapEmail(`
      <h1 style="font-family:'Comic Sans MS',cursive;color:#0FFF50;font-size:26px;margin:0 0 16px;">
        &#x1F3A9; Welcome to flip-ly.net, ${esc(username)}
      </h1>
      <p style="color:#ccc;font-size:14px;line-height:1.8;">
        You actually signed up. For a website with Comic Sans. On purpose. We respect that energy.
      </p>
      <p style="color:#FFB81C;font-size:14px;line-height:1.8;font-weight:bold;">
        Here's what happens next:
      </p>
      <ul style="color:#ccc;font-size:13px;line-height:2.2;">
        <li>&#x1F4E7; Every Thursday, you get a weekly email with the best deals near <strong style="color:#0FFF50;">${esc(location)}</strong></li>
        <li>&#x1F916; Our AI scores every listing on a 1-10 deal scale</li>
        <li>&#x1F50D; Search 480+ real listings right now at <a href="https://flip-ly.net" style="color:#9D4EDD;">flip-ly.net</a></li>
        <li>&#x1F525; Hot deals (score 8+) get flagged so you don't miss them</li>
      </ul>
      <div style="text-align:center;margin:24px 0;">
        <a href="https://flip-ly.net" style="${btnStyle}">
          &#x1F50D; Search Deals Now
        </a>
      </div>
      <p style="color:#666;font-size:11px;font-style:italic;">
        P.S. — Tomorrow we'll send you the hottest deals we found near ${esc(vars.city)} this week. The butler is already working on it.
      </p>
    `),

    'first-finds': () => wrapEmail(`
      <h1 style="font-family:'Comic Sans MS',cursive;color:#0FFF50;font-size:24px;margin:0 0 16px;">
        &#x1F3A9; The butler found deals near ${esc(vars.city)}
      </h1>
      <p style="color:#ccc;font-size:14px;line-height:1.8;">
        Hey ${esc(username)}, your AI butler has been busy. Here's a taste of what we're tracking in ${esc(location)}:
      </p>
      <div style="border:2px solid #0FFF50;padding:16px;margin:16px 0;">
        <p style="color:#0FFF50;font-size:12px;margin:0 0 8px;font-family:monospace;">LIVE STATS FOR ${esc(location.toUpperCase())}</p>
        <p style="color:#fff;font-size:24px;font-weight:bold;margin:0;font-family:'Comic Sans MS',cursive;">
          480+ listings tracked &#x2022; 57 hot deals &#x2022; 3 sources
        </p>
      </div>
      <p style="color:#ccc;font-size:14px;line-height:1.8;">
        We scrape Craigslist, Eventbrite, and EstateSales.net every week — then our AI scores each listing on a 1-10 scale so you don't waste your Saturday driving to a sale with "3 boxes of VHS tapes and a broken lamp."
      </p>
      <div style="text-align:center;margin:24px 0;">
        <a href="https://flip-ly.net" style="${btnStyle}">
          &#x1F525; See This Week's Hot Deals
        </a>
      </div>
    `),

    'social-proof': () => wrapEmail(`
      <h1 style="font-family:'Comic Sans MS',cursive;color:#FF10F0;font-size:24px;margin:0 0 16px;">
        &#x1F4AC; Your neighbors are already finding deals
      </h1>
      <p style="color:#ccc;font-size:14px;line-height:1.8;">
        ${esc(username)}, quick update — flip-ly.net is growing in ${esc(location)}.
      </p>
      <div style="border-left:4px solid #FF10F0;padding:12px 16px;margin:16px 0;background:rgba(255,16,240,0.05);">
        <p style="color:#FF10F0;font-size:13px;font-style:italic;margin:0;">
          "I found a KitchenAid mixer for $15 at an estate sale I would have never known about. This site is unhinged but it works."
        </p>
        <p style="color:#888;font-size:11px;margin:8px 0 0;">— A real human in DFW (probably)</p>
      </div>
      <p style="color:#ccc;font-size:14px;line-height:1.8;">
        The best deals go to the people who show up first. Our AI gives you the intel to know which sales are worth your time — before the 5:30 AM dealers pick everything clean.
      </p>
      <div style="text-align:center;margin:24px 0;">
        <a href="https://flip-ly.net" style="${btnStyle}">
          &#x1F3A9; Ask the Butler for Deals
        </a>
      </div>
    `),

    'first-digest-teaser': () => wrapEmail(`
      <h1 style="font-family:'Comic Sans MS',cursive;color:#FFB81C;font-size:24px;margin:0 0 16px;">
        &#x1F4E8; Your first weekly digest is here
      </h1>
      <p style="color:#ccc;font-size:14px;line-height:1.8;">
        ${esc(username)}, you've been on flip-ly for a week now. Here's your first real weekly deal roundup.
      </p>
      <p style="color:#ccc;font-size:14px;line-height:1.8;">
        Every Thursday, the butler curates the top AI-scored deals near ${esc(location)}. This is the free version — you see the top 5 deals.
      </p>
      <div style="border:2px dashed #FFB81C;padding:16px;margin:16px 0;text-align:center;">
        <p style="color:#FFB81C;font-size:18px;font-weight:bold;margin:0;font-family:'Comic Sans MS',cursive;">
          &#x1F451; Pro members see 15+ deals<br/>and get this email 6 hours earlier
        </p>
        <p style="color:#888;font-size:12px;margin:8px 0 0;">Just saying. No pressure. The butler doesn't do pressure.</p>
      </div>
      <div style="text-align:center;margin:24px 0;">
        <a href="https://flip-ly.net" style="${btnStyle}">
          &#x1F50D; See All Deals on flip-ly.net
        </a>
      </div>
    `),

    'soft-pitch': () => wrapEmail(`
      <h1 style="font-family:'Comic Sans MS',cursive;color:#0FFF50;font-size:24px;margin:0 0 16px;">
        &#x1F514; Unlock hot deal alerts
      </h1>
      <p style="color:#ccc;font-size:14px;line-height:1.8;">
        ${esc(username)}, you've been using flip-ly for 10 days. Quick question:
      </p>
      <p style="color:#fff;font-size:16px;font-weight:bold;line-height:1.8;">
        Have you ever shown up to a garage sale and all the good stuff was already gone?
      </p>
      <p style="color:#ccc;font-size:14px;line-height:1.8;">
        That's because someone got there first. With <strong style="color:#0FFF50;">flip-ly Pro</strong>, you get:
      </p>
      <ul style="color:#ccc;font-size:13px;line-height:2.2;">
        <li>&#x23F0; <strong style="color:#0FFF50;">First Dibs</strong> — Weekly digest 6 hours before free users</li>
        <li>&#x1F525; <strong style="color:#FF10F0;">Hot Deal Alerts</strong> — Instant notification when a 9+/10 deal drops</li>
        <li>&#x1F50D; <strong style="color:#FFB81C;">Unlimited Search</strong> — No daily search limit</li>
        <li>&#x1F3A9; <strong style="color:#9D4EDD;">Personal Butler</strong> — Saved searches with custom alerts</li>
      </ul>
      <div style="text-align:center;margin:24px 0;">
        <p style="color:#0FFF50;font-size:28px;font-weight:bold;font-family:'Comic Sans MS',cursive;">$5/month</p>
        <p style="color:#888;font-size:12px;">Less than one garage sale find pays for a whole year.</p>
        <a href="https://flip-ly.net" style="${btnStyle}">
          &#x1F3A9; Try Pro — The Butler Recommends It
        </a>
      </div>
    `),

    'fomo': () => wrapEmail(`
      <h1 style="font-family:'Comic Sans MS',cursive;color:#FF10F0;font-size:24px;margin:0 0 16px;">
        &#x23F1; Pro members got this deal 6 hours before you
      </h1>
      <p style="color:#ccc;font-size:14px;line-height:1.8;">
        ${esc(username)}, real talk from the butler:
      </p>
      <div style="border:2px solid #FF10F0;padding:16px;margin:16px 0;background:rgba(255,16,240,0.05);">
        <p style="color:#FF10F0;font-size:11px;margin:0 0 4px;font-family:monospace;">DEAL ALERT — SENT TO PRO MEMBERS AT 6:00 AM</p>
        <p style="color:#fff;font-size:16px;font-weight:bold;margin:0;">
          &#x2B50; Estate Sale — Everything Must Go! (9/10 AI Score)
        </p>
        <p style="color:#ccc;font-size:12px;margin:4px 0 0;">
          Furniture, tools, vintage collectibles — multiple families liquidating. This is the kind of sale where $20 turns into $200 on Marketplace.
        </p>
        <p style="color:#FF10F0;font-size:11px;margin:8px 0 0;font-weight:bold;">
          &#x1F6A8; You received this at noon. Pro members got it at 6 AM.
        </p>
      </div>
      <p style="color:#ccc;font-size:14px;line-height:1.8;">
        The best deals don't wait. The dealers who show up at 5:30 AM? They're using tools like this.
      </p>
      <div style="text-align:center;margin:24px 0;">
        <p style="color:#0FFF50;font-size:28px;font-weight:bold;font-family:'Comic Sans MS',cursive;">$5/month</p>
        <a href="https://flip-ly.net" style="${btnStyle}">
          &#x1F525; Get First Dibs — Upgrade to Pro
        </a>
      </div>
    `),

    'hard-convert': () => wrapEmail(`
      <h1 style="font-family:'Comic Sans MS',cursive;color:#FFB81C;font-size:24px;margin:0 0 16px;">
        &#x1F381; Special offer from the butler
      </h1>
      <p style="color:#ccc;font-size:14px;line-height:1.8;">
        ${esc(username)}, you've been with us for 3 weeks. The butler has a confession:
      </p>
      <p style="color:#fff;font-size:16px;font-weight:bold;line-height:1.8;font-style:italic;">
        "I've been holding back the really good deals. The 9s and 10s. The estate sales where someone's selling a $2,000 tool collection for $50. I send those to Pro members first. I'm sorry. I'm British — we're polite but strategic."
      </p>
      <div style="border:3px solid #FFB81C;padding:20px;margin:20px 0;text-align:center;background:rgba(255,184,28,0.05);">
        <p style="color:#FFB81C;font-size:14px;margin:0 0 8px;font-family:monospace;">LIMITED TIME OFFER</p>
        <p style="color:#fff;font-size:36px;font-weight:bold;margin:0;font-family:'Comic Sans MS',cursive;">
          First month: $1
        </p>
        <p style="color:#888;font-size:12px;margin:8px 0;">Then $5/month. Cancel anytime. The butler will understand. (He won't.)</p>
        <a href="https://flip-ly.net" style="${btnStyle}">
          &#x1F3A9; Claim Your $1 First Month
        </a>
      </div>
      <p style="color:#666;font-size:11px;font-style:italic;">
        One good find pays for a year of Pro. The butler has done the math. Repeatedly.
      </p>
    `),
  }

  const renderer = templates[templateKey]
  if (!renderer) {
    return wrapEmail(`<p style="color:#ccc;">Email template "${esc(templateKey)}" not found.</p>`)
  }

  return renderer()
}

// Shared button style
const btnStyle = `display:inline-block;padding:14px 32px;background:linear-gradient(180deg,#ff6633,#cc3300);color:#fff;text-decoration:none;font-family:'Comic Sans MS',cursive;font-weight:bold;font-size:16px;border:3px outset #ff9966;text-shadow:2px 2px 0 rgba(0,0,0,0.3);`

// Shared email wrapper
function wrapEmail(content: string): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#000;font-family:Tahoma,sans-serif;">
<div style="max-width:560px;margin:0 auto;">
  <!-- Header -->
  <div style="background:linear-gradient(135deg,#1a0a2e,#0a0a1a);padding:20px;text-align:center;border-bottom:3px solid #0FFF50;">
    <span style="font-size:32px;">&#x1F3A9;</span>
    <span style="font-family:'Comic Sans MS',cursive;font-size:22px;color:#0FFF50;vertical-align:middle;margin-left:8px;">
      flip-ly<span style="color:#FF10F0;">.net</span>
    </span>
  </div>
  <!-- Body -->
  <div style="background:#0D0D0D;padding:24px 20px;color:#fff;">
    ${content}
  </div>
  <!-- Footer -->
  <div style="background:#0a0a0a;padding:16px 20px;text-align:center;">
    <p style="color:#555;font-size:10px;margin:0;">
      <a href="https://flip-ly.net" style="color:#888;">flip-ly.net</a> — AI-powered garage sale intelligence
      <br/>
      <a href="https://flip-ly.net/unsubscribe" style="color:#666;">Unsubscribe</a> (the butler will be disappointed)
    </p>
  </div>
</div>
</body></html>`
}

function esc(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
