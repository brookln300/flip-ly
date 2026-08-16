import { SignupProvider } from '../components/SignupContext'
import AuthModals from '../components/AuthModals'
import ZenShell from '../components/zen/ZenShell'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'help — flip-ly', robots: { index: false, follow: false } }

const FAQ: { q: string; a: string }[] = [
  { q: 'What is this?', a: "flip-ly is our family's deal radar for DFW. It watches Facebook groups and Craigslist all day, scores every find with AI, and pings the family Telegram when something is worth chasing. The home page shows everything at a glance." },
  { q: 'How do I read the feed?', a: 'Each row is one find: [score] price · title · where · source · age. Green score = worth a look (65+). [reply] copies a suggested message to the seller, [claim] calls dibs so two of us don\'t drive out for the same couch, [open] jumps to the original listing.' },
  { q: 'What does claiming do?', a: 'Hitting [claim] marks the find as yours — the row shows "claimed by <name>" for everyone. First tap wins; if someone beat you, the row tells you who.' },
  { q: 'How do I ask the family bot?', a: 'In our Telegram group: /today for the day\'s best finds, /free for free stuff, /check <link> to score any listing, /addgroup to put a new FB group on the radar. Reply /check to any alert to re-scan that post.' },
  { q: 'How do I tell the radar what to hunt?', a: 'Add it to the Wishlist. The scorer matches every new listing against the wishlist and pings the family when something fits.' },
  { q: 'What are the scores?', a: '0–100 for how good the find is. 75+ usually triggers an alert, 65–74 lands in "near misses" on the home page. Tap [good]/[bad] on the radar page — the scorer reads your verdicts and calibrates itself.' },
  { q: 'How do I get access / add family?', a: 'Access is invite-only. The family admin adds your email under Access, then you sign in at fliply.net with that email. Ask in the group if you need in.' },
  { q: 'Is this costing us money?', a: "No — it's a private family tool, not a paid product. The AI scoring runs on our own hardware." },
]

export default function HelpPage() {
  return (
    <SignupProvider>
      <ZenShell active="Help">
        <header className="mb-4 border-b border-zen-line pb-2">
          <h1 className="text-[15px] font-semibold lowercase">help</h1>
          <p className="mt-0.5 text-[12.5px] text-zen-muted">how the family deal radar works, in one minute.</p>
        </header>
        <div className="flex flex-col gap-2">
          {FAQ.map((f, i) => (
            <div key={i} className="border border-zen-line px-3 py-2.5">
              <div className="text-[13.5px] font-semibold text-zen-text">{f.q}</div>
              <div className="mt-1 text-[13px] leading-relaxed text-zen-muted">{f.a}</div>
            </div>
          ))}
        </div>
        <p className="mt-4 border-t border-zen-line pt-3 text-[12px] text-zen-muted">
          still stuck? ask in the family Telegram — the bot (or Keith) will help.
        </p>
        <AuthModals />
      </ZenShell>
    </SignupProvider>
  )
}
