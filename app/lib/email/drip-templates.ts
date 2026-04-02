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
    'soft-pitch': `Hot deal alerts are a Pro thing — here's why`,
    'fomo': 'A Pro member got this deal 6 hours before you saw it',
    'hard-convert': 'The butler has a special offer for you',
    'contest-welcome': 'You found the hidden entry point',
    'contest-depth': 'The clues go deeper than you think',
    'contest-reveal': 'OK but seriously — this site finds real deals',
    'contest-leaderboard': 'The Hall of Almost has been updated',
    'contest-final-hint': 'One last declassified clue',
  }

  const resolvedPreview = previewText || previewTexts[templateKey] || ''
  const wrap = (content: string) => wrapEmail(content, resolvedPreview)

  const templates: Record<string, () => string> = {
    'welcome': () => wrap(`
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

    'first-finds': () => wrap(`
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

    'social-proof': () => wrap(`
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

    'first-digest-teaser': () => wrap(`
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

    'soft-pitch': () => wrap(`
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

    'fomo': () => wrap(`
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

    'hard-convert': () => wrap(`
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

    // ═══ CONTEST SEQUENCE — for Lobster Hunt acquired users ═══

    'contest-welcome': () => wrap(`
      <h1 style="font-family:'Comic Sans MS',cursive;color:#FF10F0;font-size:24px;margin:0 0 16px;">
        &#x1F99E; You Found the Lobster Hunt.
      </h1>
      <p style="color:#ccc;font-size:14px;line-height:1.8;">
        ${esc(username)}, you found a hidden pixel on a website built in Comic Sans, opened a fake classified terminal, and entered a passphrase.
      </p>
      <p style="color:#ccc;font-size:14px;line-height:1.8;">
        That's more effort than most people put into their actual jobs. The Lobster Council is watching. &#x1F440;
      </p>
      <div style="border:2px solid #FF10F0;padding:16px;margin:16px 0;">
        <p style="color:#FF10F0;font-size:12px;margin:0 0 8px;font-family:monospace;">CONTEST STATUS</p>
        <p style="color:#fff;font-size:14px;margin:0;">7 decoy passwords. 1 real one. Nobody has cracked it yet.</p>
        <p style="color:#888;font-size:11px;margin:8px 0 0;">The clues are scattered across the source code in hex, base64, morse, NATO alphabet, and ASCII decimal.</p>
      </div>
      <p style="color:#FFB81C;font-size:14px;line-height:1.8;">
        Oh, and the website you found this on? It actually does something useful.
      </p>
      <p style="color:#ccc;font-size:13px;line-height:1.8;">
        flip-ly.net is an AI-powered garage sale finder. We scrape Craigslist and Eventbrite, score every deal with AI, and email the best ones weekly. The easter egg is the chaos. The deals are real.
      </p>
      <div style="text-align:center;margin:24px 0;">
        <a href="https://flip-ly.net/lobster-hunt" style="${btnStyle}">
          &#x1F99E; Check the Hall of Almost
        </a>
      </div>
    `),

    'contest-depth': () => wrap(`
      <h1 style="font-family:'Comic Sans MS',cursive;color:#0FFF50;font-size:24px;margin:0 0 16px;">
        &#x1F9E0; The Clues Go Deeper
      </h1>
      <p style="color:#ccc;font-size:14px;line-height:1.8;">
        ${esc(username)}, since you're clearly the type who reads source code for fun:
      </p>
      <div style="background:#0a0a0a;border:1px solid #333;padding:16px;margin:16px 0;font-family:monospace;font-size:12px;">
        <p style="color:#0f0;margin:0 0 8px;">&gt; CLUE TYPES CONFIRMED:</p>
        <p style="color:#888;margin:0 0 4px;">- Hex strings in HTML comments</p>
        <p style="color:#888;margin:0 0 4px;">- Base64 in image alt attributes</p>
        <p style="color:#888;margin:0 0 4px;">- Morse code in a BBS section</p>
        <p style="color:#888;margin:0 0 4px;">- NATO phonetic alphabet in data attributes</p>
        <p style="color:#888;margin:0 0 4px;">- ASCII decimal in CSS comments</p>
        <p style="color:#ff0;margin:8px 0 0;">&gt; HINT: Each one decodes to a word or phrase.</p>
        <p style="color:#ff0;margin:0;">&gt; HINT: None of them are the answer by themselves.</p>
        <p style="color:#f0f;margin:8px 0 0;">&gt; HINT: The real answer combines fragments.</p>
      </div>
      <p style="color:#ccc;font-size:14px;line-height:1.8;">
        The Hall of Almost shows who's found decoys. Some of them are <em>very</em> close. Tier 7 is impressive. But close isn't a lobster dinner.
      </p>
      <div style="text-align:center;margin:24px 0;">
        <a href="https://flip-ly.net" style="${btnStyle}">
          &#x1F50D; Back to the Source Code
        </a>
      </div>
    `),

    'contest-reveal': () => wrap(`
      <h1 style="font-family:'Comic Sans MS',cursive;color:#FFB81C;font-size:24px;margin:0 0 16px;">
        &#x1F3A9; OK But Seriously — This Website Finds Real Deals
      </h1>
      <p style="color:#ccc;font-size:14px;line-height:1.8;">
        ${esc(username)}, while you were decoding hex strings, some people were using flip-ly.net to actually find garage sales. Wild concept.
      </p>
      <p style="color:#ccc;font-size:14px;line-height:1.8;">
        Here's the deal (literally):
      </p>
      <ul style="color:#ccc;font-size:13px;line-height:2.2;">
        <li>We have <strong style="color:#0FFF50;">480+ real listings</strong> from Craigslist &amp; Eventbrite</li>
        <li>Our AI <strong style="color:#FFB81C;">scores every deal</strong> on a 1-10 scale</li>
        <li>Free users get a <strong style="color:#ccc;">weekly email</strong> every Thursday</li>
        <li>Pro users ($5/mo) get it <strong style="color:#FF10F0;">6 hours early</strong> + unlimited search</li>
      </ul>
      <p style="color:#888;font-size:13px;line-height:1.8;font-style:italic;">
        We know. A website with Comic Sans and a lobster cursor that actually provides value. The cognitive dissonance is the brand.
      </p>
      <div style="text-align:center;margin:24px 0;">
        <a href="https://flip-ly.net" style="${btnStyle}">
          &#x1F50D; Search Real Deals Near ${esc(vars.city)}
        </a>
      </div>
    `),

    'contest-leaderboard': () => wrap(`
      <h1 style="font-family:'Comic Sans MS',cursive;color:#FF10F0;font-size:24px;margin:0 0 16px;">
        &#x1F4CA; Hall of Almost — Leaderboard Update
      </h1>
      <p style="color:#ccc;font-size:14px;line-height:1.8;">
        ${esc(username)}, the Lobster Hunt is heating up.
      </p>
      <div style="border:2px solid #FF10F0;padding:16px;margin:16px 0;">
        <p style="color:#FF10F0;font-size:12px;margin:0 0 12px;font-family:monospace;">LOBSTER HUNT STATUS REPORT</p>
        <p style="color:#fff;font-size:14px;margin:0 0 4px;">&#x1F99E; Winner found: <strong style="color:#ff0;">NOT YET</strong></p>
        <p style="color:#fff;font-size:14px;margin:0 0 4px;">&#x1F3C6; Highest decoy cracked: <strong>Tier 7</strong> (NATO Phonetic)</p>
        <p style="color:#888;font-size:12px;margin:8px 0 0;">The real password has never been entered. Our boss doesn't know it. This is real.</p>
      </div>
      <p style="color:#ccc;font-size:14px;line-height:1.8;">
        Reminder: the prize for the real password is an actual lobster dinner delivered to your door. Not a metaphor. Real lobster. Real delivery.
      </p>
      <div style="text-align:center;margin:24px 0;">
        <a href="https://flip-ly.net/lobster-hunt" style="${btnStyle}">
          &#x1F99E; Check the Full Leaderboard
        </a>
      </div>
    `),

    'contest-final-hint': () => wrap(`
      <h1 style="font-family:'Comic Sans MS',cursive;color:#FFD700;font-size:24px;margin:0 0 16px;">
        &#x1F513; One Last Clue
      </h1>
      <p style="color:#ccc;font-size:14px;line-height:1.8;">
        ${esc(username)}, the Lobster Council has authorized one final hint.
      </p>
      <div style="background:#0a0a0a;border:2px solid #FFD700;padding:20px;margin:16px 0;font-family:monospace;font-size:13px;">
        <p style="color:#FFD700;margin:0 0 12px;font-weight:bold;">&gt; DECLASSIFIED INTEL:</p>
        <p style="color:#ccc;margin:0 0 8px;">The real password is NOT any single decoded string.</p>
        <p style="color:#ccc;margin:0 0 8px;">It combines fragments from <strong style="color:#0FFF50;">3 different encoding types</strong>.</p>
        <p style="color:#ccc;margin:0 0 8px;">The HTML comments contain meta-hints about which fragments to use.</p>
        <p style="color:#ff0;margin:12px 0 0;">The words "entry" and "split" are not decoration.</p>
      </div>
      <p style="color:#ccc;font-size:14px;line-height:1.8;">
        This is the last email from the Lobster Council. The rest is up to you.
      </p>
      <p style="color:#888;font-size:12px;line-height:1.8;font-style:italic;">
        P.S. — If you want to keep getting weekly deal alerts for ${esc(vars.city)} while you work on the puzzle, flip-ly.net does actually send those. For free. The chaos is the shell. The deals are real.
      </p>
      <div style="text-align:center;margin:24px 0;">
        <a href="https://flip-ly.net" style="${btnStyle}">
          &#x1F99E; Return to the Source
        </a>
      </div>
    `),
  }

  const renderer = templates[templateKey]
  if (!renderer) {
    return wrap(`<p style="color:#ccc;">Email template "${esc(templateKey)}" not found.</p>`)
  }

  return renderer()
}

// Shared button style
const btnStyle = `display:inline-block;padding:14px 32px;background:linear-gradient(180deg,#ff6633,#cc3300);color:#fff;text-decoration:none;font-family:'Comic Sans MS',cursive;font-weight:bold;font-size:16px;border:3px outset #ff9966;text-shadow:2px 2px 0 rgba(0,0,0,0.3);`

// Shared email wrapper
function wrapEmail(content: string, previewText?: string): string {
  const previewHtml = previewText ? `
<div style="display:none;font-size:1px;color:#0d0d0d;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
  ${previewText}
  <!-- Padding to prevent email client from pulling body text -->
  &zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;
</div>` : ''
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#000;font-family:Tahoma,sans-serif;">
${previewHtml}
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
