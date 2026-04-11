# The Lobster Protocol -- Alternate Terminal Concepts

**Created:** 2026-04-10
**Status:** CREATIVE BRIEF -- Ideas for future iterations / A/B testing
**Goal:** Make the easter egg experience so shareable it drives organic signups through social virality.

---

## Current State (v1: "The Lobster Hunt")

What exists today: A hidden pixel on the retro page triggers a PowerShell-style green-on-black terminal. Users enter agent names and crack 7 password tiers encoded in hex, Base64, Morse, NATO phonetic, and ASCII decimal scattered throughout the site's source code. Decoy passwords unlock gag prize screens. The real password requires combining fragments from multiple clues. A draggable Post-It sticky note with a lobster mascot provides hints. A BSOD easter egg lives in the corner. Sketchy Win98 popups spawn randomly.

It works. It's weird. It's got character. But it's a solo experience -- nothing about it makes someone pull out their phone and record a TikTok. The following five concepts are designed to change that.

---

## Concept 1: "OPERATION RED CLAW" -- The Classified Document Room

### Visual Theme

A fake government classified document interface. Think: Manila folders on a desk, coffee-stained papers, redacted text with black bars, rubber stamps reading "TOP SECRET" and "EYES ONLY -- LOBSTER COUNCIL." The aesthetic is CIA meets X-Files meets a middle school teacher's filing cabinet. Warm tungsten lighting. Paper textures. The cursor is a magnifying glass.

Everything is rendered as physical documents -- no terminal, no code. The user is sitting at a desk in some unnamed government building, and they've just been handed a file that wasn't meant for them.

### Entry Mechanic

On the main flip-ly.net landing page, the footer copyright reads "(c) 2026 Flip-ly" but the year is actually a hyperlink (styled identically to surrounding text -- no underline, no color change, nothing). Clicking it opens a "Secure Document Portal" login screen styled like a 1990s government intranet -- grey background, Times New Roman, a logo that says "F.L.I.P. -- Federal Listings Intelligence Program." The login credentials are hidden in the page's `<meta>` tags as a comment: `<!-- clearance: redclaw / badge: 7-alpha -->`.

### Gameplay Loop

The user arrives at a desk covered in folders. There are six manila folders, each labeled with a codename (CRIMSON TIDE, BUTTER CLAW, DEEP SHELL, etc.). Opening a folder reveals a classified document about "the Lobster" -- a supposed intelligence asset. The documents are 80% redacted (black bars over text). But the redactions are CSS `::after` pseudo-elements -- inspecting the DOM reveals the hidden text beneath. Some redacted sections contain the actual password fragments; others contain decoy intelligence ("The asset prefers drawn butter. This is not relevant to the operation but felt important to document.").

Each folder also contains "evidence photos" -- AI-generated images of lobsters in spy situations (a lobster in a trench coat, a lobster photographed through a car window with a telephoto lens, a lobster's blurry face on a security camera). These are shareable. Each photo has a classified document number watermarked on it.

As users un-redact more text, a "CLEARANCE LEVEL" meter fills up in the corner. Reaching certain thresholds unlocks new folders. The final document is a one-page memo from "The Director" that contains the real password -- but it's split across three different paragraphs, each redacted differently (one in Base64 in a footnote, one as coordinates that map to letters, one as a barcode).

**Bonus mechanic:** Right-clicking anywhere on the desk surface triggers a stamp animation -- a red "CLASSIFIED" stamp slams down on whatever you right-clicked, with a satisfying thwack sound. Purely cosmetic. Entirely addictive. People will stamp everything.

### Social Hook

"I just got clearance level 5 in a lobster spy agency and I genuinely cannot tell if this website is a deal-finding app or an ARG" -- this is the tweet that writes itself. The classified documents are screenshot gold. The "evidence photos" of lobsters in spy gear are inherently meme-worthy and watermarked with the site URL. The stamp mechanic creates short satisfying clips for TikTok (people will record themselves stamping every surface). The redaction mechanic creates a natural "reveal" format that works perfectly for short-form video ("What's under the redaction? Let me show you...").

### Signup Integration

The "CLEARANCE LEVEL" meter is the conversion funnel. At Level 2, a document mentions "civilian operatives who monitor local deal intelligence for the Program" -- this is where the user first learns what Flip-ly actually does. At Level 4, a classified briefing shows a real scored deal from the database with the note "ASSET CONFIRMED: This listing scored 9.2. Subject purchased KitchenAid for $45. Resale value: $280. The Program works." Level 5 clearance requires entering an email to "register as a field operative" -- this creates the Flip-ly account.

### Estimated Virality

**HIGH.** Three overlapping viral loops: (1) The "what is this website" mystery post -- people sharing screenshots of classified lobster documents asking if it's real. (2) The evidence photos as standalone memes -- lobster in trench coat has legs. (3) The satisfaction loop of the stamp mechanic and redaction reveals, which are both inherently short-video-friendly. The government document aesthetic also travels well across demographics -- conspiracy communities, ARG hunters, and the "weird internet" crowd on Reddit all engage with it differently.

---

## Concept 2: "THE FLIP TRAIL" -- An Oregon Trail Parody for Resellers

### Visual Theme

A pixel-perfect recreation of the Oregon Trail DOS interface -- green phosphor CRT text, 8-bit graphics, the classic Sierra-era dialogue boxes. But instead of traveling from Missouri to Oregon, you're driving a van from garage sale to garage sale across Texas, trying to flip enough items to pay off your storage unit before the month ends.

The screen is framed by a CRT monitor bezel (slight barrel distortion, scanlines, a power LED that flickers). The bottom of the screen shows the classic Oregon Trail status bar: "Miles Traveled," "Cash," "Storage Space," and "Reputation."

### Entry Mechanic

Hidden in the source code of any page, an HTML comment reads: `<!-- FLIPTRAIL.EXE -- insert disk 2 of 3 and press ENTER -->`. Visiting `/fliptrail` or `/retro/game` loads a fake DOS boot sequence:

```
C:\FLIPTRAIL> LOADING...
Checking storage unit... OK
Loading deals database... OK
Calibrating haggle module... OK

PRESS ANY KEY TO BEGIN YOUR FLIPPING CAREER
```

### Gameplay Loop

The player is a reseller with $50 and an empty van. Each "day" presents a choice:

**Morning:** A map shows 3-4 locations (yard sale, estate sale, thrift store, "mysterious listing on Craigslist"). Each has a risk/reward profile shown in the Oregon Trail dialogue style:

```
MARTHA'S ESTATE SALE -- Oak Lawn, TX
Condition: "Everything must go. Moving to Florida."
Risk: LOW   |   Potential: HIGH
Distance: 12 miles (uses gas)

> [1] Go to Martha's
> [2] Check the Craigslist listing instead
> [3] Rest (recover reputation)
> [4] Check your scores
```

**At the sale:** Items appear one at a time with pixel art. Each item shows a price and a hidden "flip score" the player has to estimate. Buy decisions are permanent. Some items are gold (a vintage Pyrex set for $3), some are traps (a "working" VCR that "just needs a new belt" -- it doesn't).

**Random events** fire Oregon-Trail-style:

```
YOUR VAN HAS A FLAT TIRE.
You lose 1 day.
A guy at the gas station offers to trade
a tire for your fondue set.

> [1] Accept trade
> [2] Decline (wait for AAA)
> [3] Attempt to fix it with duct tape
```

Other events: "Your partner listed the wrong price on eBay and sold a $200 lamp for $12," "A raccoon got into your storage unit," "Facebook Marketplace flagged your listing for 'suspicious activity' because you used the word 'vintage' too many times."

The game runs for 30 "days." At the end, the player's total profit is calculated and ranked. The passwords are woven into the game world: item descriptions contain encoded fragments, the map coordinates spell things out, NPC dialogue hides clues.

### Social Hook

Oregon Trail nostalgia is a bottomless well. The random event text is optimized for screenshots -- every death/failure message is funny enough to share ("You tried to haggle at Goodwill. The cashier looked at you with disappointment. You lose 2 reputation."). The game naturally creates stories ("I found a $3,000 Eames chair at a pixel yard sale and then a raccoon ate it") which are the backbone of TikTok/Twitter virality.

Speed runs become a thing. "I made $10,000 in 30 days on The Flip Trail" posts. Leaderboards create competition. The pixel art items are collectible screenshots.

### Signup Integration

Option [4] ("Check your scores") prompts: "The Flip-ly Score Engine can analyze deals in real life, too. Enter your email to get real scored deals in your area." At game over, the profit screen shows: "Your game score: $2,847 profit. Want to see real deals scoring 9+ in your market? Flip-ly finds them automatically." The signup CTA is a DOS-style prompt: `C:\FLIPLY> ENTER EMAIL TO SUBSCRIBE: _`

### Estimated Virality

**VERY HIGH.** Oregon Trail is universally recognized by 25-45 year olds -- the exact demographic that buys and resells. The random event screenshots will flood Twitter. TikTok creators will record "Let's Play" videos. The speed-run angle creates competitive sharing. Reddit's r/flipping community (~300k members) would lose their minds over this. The game format also creates extremely long session times (5-15 minutes) which improves conversion rates.

---

## Concept 3: "DEEP WEB DEALS" -- The Dark Marketplace Parody

### Visual Theme

A pitch-perfect parody of a dark web marketplace -- the Silk Road visual language but for completely legal, mundane garage sale items. Black background, monospace green text, a Tor-style onion routing animation on load, a PGP key displayed in the sidebar, vendor ratings with skulls instead of stars, and every item listed with absurdly ominous descriptions.

The header reads: "THE CLAW -- Authorized Vendors Only" with a crude ASCII art lobster. The navigation includes "Marketplace," "Dead Drops," "Vendor Escrow," and "The Lobster's Lair." There's a fake Bitcoin price ticker in the corner and a "Connection Status: 7 RELAYS -- ENCRYPTED" badge.

### Entry Mechanic

In the site's robots.txt file (which real users sometimes check), add a commented line: `# The Claw sees all. The Claw remembers. /theclaw`. Visiting `/theclaw` shows a fake "establishing secure connection" animation -- progress bars labeled "Routing through 7 proxies," "Encrypting session," "Verifying lobster clearance," "Connection established. Welcome to The Claw."

Alternatively, pressing Ctrl+Shift+L (for Lobster) anywhere on the site triggers a screen flicker and redirects to the dark marketplace.

### Gameplay Loop

The marketplace displays real listings from the Flip-ly database -- but re-styled with maximum dramatic tension:

```
ITEM #4,271 -- CLASSIFIED
================================
"KitchenAid Artisan Stand Mixer"
Status: HOT -- DO NOT DISCUSS IN PUBLIC
Vendor: ghost_flipper_99 (4.8 skulls, 247 verified drops)
Dead Drop Location: [REDACTED] -- Oak Lawn, TX
Price: $45 (street value: $380)
Flip Score: ████████░░ 8.7

VENDOR NOTE: "No questions. Cash only. Meet behind
the Whataburger on Mockingbird. Flash your headlights
twice. I'll be in the blue Corolla. The mixer works.
Don't test it in front of me."

[ADD TO CART]  [REPORT TO LOBSTER COUNCIL]  [SEND TIP]
```

Every mundane item gets this treatment. A $5 box of books becomes "LITERARY CONTRABAND -- Origins unknown. Possible first editions. Handle with care." A free couch becomes "ZERO-COST ASSET -- Extreme risk. Vendor claims 'no bed bugs.' The Claw cannot verify this claim. Proceed at your own risk."

The password fragments are hidden in vendor PGP keys (which are actually encoded text), in the "Terms of Service" for the marketplace (a hilariously long legal document written in the style of an actual dark web marketplace ToS), and in the dead drop coordinates.

The "Lobster's Lair" section is a forum -- threads posted by AI-generated vendors arguing about flipping strategies. The thread titles are the clues: "Why Base64 encoding is superior to hex for labeling storage units," "My NATO phonetic system for organizing yard sales," etc.

### Social Hook

The comedy of the mundane-made-criminal is inherently shareable. Screenshots of a $3 lamp described as contraband with a "danger level" rating will make the rounds. The vendor notes read like copypasta. The forum threads are indistinguishable from real Reddit posts but set in this absurd dark-market context. "I found a dark web marketplace that only sells garage sale items and I'm genuinely concerned" is a post that gets engagement.

The PGP key mechanic creates puzzle-sharing -- people will post decoded vendor keys asking for help with the next step. This is how ARGs spread.

### Signup Integration

"Adding to cart" requires an account. The signup flow is themed: "CREATE VENDOR ACCOUNT -- All vendors are vetted by the Lobster Council. Processing time: 0.3 seconds." After signing up, the user's "vendor profile" is actually their Flip-ly account, and the "marketplace" transitions to showing them real deal scores in their area. The reveal is seamless -- the dark market aesthetic fades into the real product, and the user realizes they've been looking at actual deals the whole time.

### Estimated Virality

**EXTREME.** This concept has the widest social media reach because it sits at the intersection of multiple viral categories: (1) comedy parody (always shares well), (2) "weird websites" (a perennial TikTok format), (3) actual useful content (the deals are real, which creates a "wait this actually works?" double-take moment), and (4) puzzle/ARG content for the code-breaking crowd. The vendor notes alone could become a meme format. The visual contrast of dark-web aesthetics applied to a KitchenAid mixer is the kind of absurdist humor that prints engagement on Twitter/X.

---

## Concept 4: "LOBSTER NOIR" -- A Text Adventure Detective Story

### Visual Theme

A noir detective game rendered entirely in text, styled like a 1940s pulp novel. Amber text on a dark background (think old monochrome monitors, but warm). The font is a typewriter face (Courier or Special Elite). Every response appears with a typewriter animation and sound effect -- each character clacking into existence.

The screen is framed by a private detective's desk: a whiskey glass (animated, ice melting slowly over the session), a rotary phone, an ashtray with a burning cigarette (smoke particles drifting upward in CSS), and a case file folder labeled "THE LOBSTER." A jazz piano loop plays softly in the background (toggleable).

### Entry Mechanic

In the HTML source of any page, a comment reads:

```html
<!-- She walked into my office on a Tuesday.
     Red dress. Smelled like Old Bay seasoning.
     Said she had a case for me.
     Something about a lobster.
     /noir -->
```

Visiting `/noir` or finding the comment triggers the game.

### Gameplay Loop

The user plays a private detective hired to find "The Lobster" -- a mysterious figure who's been cornering the market on underpriced estate sale items across the Dallas-Fort Worth metroplex. The game is a branching text adventure with ~40 nodes, written in full hardboiled noir prose:

```
CHAPTER 1: THE CLIENT

The dame didn't give a name. Just slid a photo
across my desk -- a lobster, red as a sunset over
the Trinity River, wearing what I can only describe
as a tiny fedora.

"Find it," she said. "Before it flips every deal
in this town."

I looked at the photo. Then at her. Then at my
empty bank account.

"My rate's $200 a day plus expenses," I said.

She laughed. "Your rate is whatever the lobster
decides it is."

> [1] Take the case
> [2] Ask about the fedora
> [3] Pour another whiskey
> [4] Check the filing cabinet
```

Each chapter sends the player to a different location in DFW -- a pawn shop in Deep Ellum, a storage auction in Garland, a suspicious estate sale in Highland Park where every item is priced at exactly $4.12 (which is a clue). The locations are real. The deals referenced are pulled from the actual database.

NPCs include: a pawn shop owner who speaks only in riddles, a rival detective who's also after the lobster (and keeps beating you to leads by 5 minutes), a suspicious old woman who runs estate sales and may or may not be the lobster in disguise, and a cat named "Clawsworth" who appears at every crime scene.

The password fragments are woven into the story's dialogue, location addresses, item prices, and chapter titles. The player takes notes (a built-in notepad appears on the desk, styled as a detective's pocket notebook). The final chapter requires combining notes from different chapters to crack the case.

**Key mechanic:** The whiskey glass. Every time the player makes a wrong choice, the detective "takes a drink." The glass slowly empties. If it empties completely, the game resets to the last chapter. The player can "refill" by finding hidden clues (a tiny icon of a bottle hidden somewhere in the text of each chapter).

### Social Hook

The writing carries this one. Noir prose applied to garage sale culture is inherently funny and quotable. "She said the KitchenAid was worth $300. I said the only thing worth $300 in this town was my dignity, and I'd sold that at a yard sale in 2019." Lines like that become Twitter posts. The typewriter animation creates satisfying video content. The whiskey glass creates a "will he make it?" tension that works in recordings.

The branching paths mean every player has a different story. "Wait, you went to the pawn shop first? I went to the estate sale and met a woman who I'm 90% sure was the lobster" -- this kind of comparison sharing is exactly what drives social engagement.

### Signup Integration

Chapter 3 introduces the detective's "informant" -- a service that scores deals across the city. "My buddy at the bureau ran the numbers. Said the listing scored an 8.7. That's high enough to make a grown man weep into his brisket." The informant is Flip-ly. To unlock the informant's full reports (which contain clues needed to finish the game), the player registers as a "consulting detective" -- which creates their account.

### Estimated Virality

**HIGH.** Text-based games are having a renaissance on social media thanks to AI chatbot culture -- people are primed for this format. The noir writing style is uniquely quotable (every line is a potential tweet). The branching paths create organic "compare your experience" conversations. Gaming content creators who cover indie/weird games would pick this up. The production value (typewriter sounds, whiskey glass, jazz music) creates an atmospheric experience that people want to show others.

---

## Concept 5: "THE LOBSTER BROADCAST" -- A Pirate Radio / Numbers Station

### Visual Theme

A retro radio receiver interface. A detailed SVG/CSS rendering of a vintage shortwave radio -- brushed metal faceplate, an analog frequency dial with a glowing orange needle, volume and tone knobs that actually rotate (drag interaction), and a speaker grille with visible fabric texture. The background is a dark workbench with scattered radio components, a cup of cold coffee, and a logbook.

When "tuned in," the screen shows an audio visualizer -- a vintage oscilloscope-style waveform in green phosphor, pulsing with the audio. Text transmissions appear below the visualizer, decoded from the "broadcast" in real-time, character by character.

### Entry Mechanic

On the landing page, the source code contains a comment formatted as a radio transmission log:

```html
<!-- INTERCEPT LOG -- 2026-04-10 03:47 UTC
     FREQ: 4.625 MHz (USB)
     ORIGIN: Unknown. Possibly marine.
     CONTENT: "The lobster broadcasts at midnight.
     Tune to the frequency. /radio"
     STATUS: Unverified. Monitoring continues. -->
```

Alternatively, in the site's `<head>`, a meta tag: `<meta name="frequency" content="4.625MHz" />`. Tech-savvy users who inspect the head will find the breadcrumb.

Visiting `/radio` loads the radio interface with static.

### Gameplay Loop

The player sits in front of the radio. Turning the frequency dial (a physically satisfying drag interaction with detents and analog audio feedback) tunes through a range of "stations." Most frequencies produce static, but seven specific frequencies lock onto broadcasts:

**Frequency 1 (3.840 MHz) -- "The Weather Report":**
A synthesized voice reads what sounds like a weather forecast but is actually a coded message: "Winds from the north at twelve. Pressure rising to 64. Expect scattered deals in the Oak Lawn sector. High of 101 with a 15% chance of vintage Pyrex." The numbers are ASCII codes. The voice has that eerie, robotic quality of real numbers stations.

**Frequency 2 (4.625 MHz) -- "The Lobster Broadcast":**
The main station. A voice reads a sequence of numbers separated by musical tones -- actual numbers station format (groups of five digits). Between number groups, there are musical interludes: a music box playing a slowed-down, slightly off-key version of "Rock Lobster" by the B-52s. The number groups decode to password fragments.

**Frequency 3 (6.210 MHz) -- "The Auctioneer":**
A fast-talking auctioneer rattling off item descriptions at increasing speed. The items are real listings from the database with their scores. "I got a solid 8.7 right here, vintage Pyrex set, do I hear forty-five, forty-five dollars, looking at forty-five, SOLD to the ghost in the fedora..."

**Frequency 4 (7.777 MHz) -- "The Confession Booth":**
A whispered voice confessing to various "crimes" of flipping: "I bought all six KitchenAids at the estate sale. I know there were other people who wanted them. I'm not sorry. My deal score was 9.1." Each confession contains a clue.

**Frequency 5 (9.340 MHz) -- Morse Code:**
Pure morse code transmission. Decoding it reveals coordinates, which when mapped, spell out a word.

**Frequency 6 (11.175 MHz) -- "The Jammer":**
Aggressive static that, when filtered through an audio visualizer (provided on the page), reveals text hidden in the waveform pattern -- the audio's visual representation literally spells words.

**Frequency 7 (13.000 MHz) -- "The Sign-Off":**
A calm voice: "This is the final broadcast of The Claw. If you've found all six stations, you have what you need. The password is not a number. It is not a word. It is what the numbers become when you stop listening and start reading. Good night. And good luck."

The logbook (interactive notepad on the workbench) lets players record what they hear at each frequency. A pen sits next to it that the user "picks up" by clicking, then writes by typing -- the text appears in a handwritten font.

### Social Hook

Numbers stations are one of the internet's most enduring fascinations -- they sit at the perfect intersection of creepy, mysterious, and real. A website that recreates this experience will instantly activate the "weird internet" community. The audio is the star here: recording yourself tuning the dial and hearing eerie broadcasts creates compelling ASMR-adjacent content for TikTok. The physical radio interaction (turning knobs, hearing static, locking onto signals) is inherently satisfying and filmable.

The "Lobster Broadcast" frequency with its music-box "Rock Lobster" is unsettling enough to go viral on its own -- people will clip that audio. The auctioneer station is comedy gold as a standalone piece. The waveform-hidden-message mechanic will blow minds when someone figures it out and posts the reveal.

Reddit's r/numberstations, r/ARG, r/InternetMysteries, and r/UnresolvedMysteries communities would organically discover and amplify this. ARG YouTube channels (Night Mind, Nexpo, etc.) would cover it as a curiosity. The production value of the radio interface itself makes people want to show it off.

### Signup Integration

The "Auctioneer" station (Frequency 3) is the conversion bridge. After listening to several item descriptions with scores, a voice says: "You're hearing deals scored in real time from the Flip-ly Intelligence Network. To receive your own daily briefing, transmit your callsign to the following address." The "callsign" is an email address. Entering it in the logbook and "transmitting" (pressing a red button on the radio) creates the Flip-ly account.

The radio interface then permanently adds an 8th frequency -- the user's personal "deal feed" station, which reads out new high-scoring deals in their market with the same synthesized voice. This is genuinely useful and genuinely creepy, which is exactly the brand.

### Estimated Virality

**EXTREME.** This is the concept most likely to transcend the Flip-ly audience and reach mainstream social media. Numbers stations content consistently performs well across platforms. The audio/visual quality required for this concept creates a production value barrier that signals "this is real" -- people won't believe a deal-finding app made this, which drives the "what is this website?" sharing loop. The ASMR/ambient qualities create a category of user who returns to the radio just to listen, increasing session time and familiarity with the brand.

The risk is that this concept is the most expensive to produce (audio recording, synthesized voices, audio visualizer engineering). But the upside ceiling is the highest of all five concepts.

---

## Implementation Priority Matrix

| Concept | Dev Effort | Content Effort | Viral Ceiling | Conversion Clarity | Recommended Phase |
|---------|-----------|---------------|--------------|-------------------|-------------------|
| OPERATION RED CLAW | Medium | Medium | High | Clear | Phase 1 -- Build next |
| THE FLIP TRAIL | High | High | Very High | Strong | Phase 2 -- Flagship build |
| DEEP WEB DEALS | Medium | Low (uses real DB) | Extreme | Seamless | Phase 1 -- Build next |
| LOBSTER NOIR | Low | Very High (writing) | High | Natural | Phase 2 -- When we have a writer |
| THE LOBSTER BROADCAST | Very High | Very High | Extreme | Clever | Phase 3 -- Tentpole moment |

---

## A/B Testing Strategy

Don't replace the current terminal. Layer these alongside it. Each concept targets a different audience segment:

- **Current terminal (The Lobster Hunt):** Technical users, source-code inspectors, CTF enthusiasts
- **OPERATION RED CLAW:** Conspiracy/mystery fans, casual puzzle solvers, the "what is this" crowd
- **THE FLIP TRAIL:** Nostalgic millennials, gaming audiences, the flipping community specifically
- **DEEP WEB DEALS:** Meme-oriented users, Reddit/Twitter power users, comedy audiences
- **LOBSTER NOIR:** Literary/narrative audiences, indie game fans, the "I need to tell you about this website" crowd
- **THE LOBSTER BROADCAST:** ARG community, ambient/ASMR audiences, YouTube mystery channels

The entry point determines which experience loads. Different hidden triggers across the site route to different concepts. This lets multiple viral loops operate simultaneously without cannibalizing each other.

---

## Universal Design Rules (Apply to All Concepts)

1. **The lobster is always watching.** Every concept must include at least one moment where the user realizes the lobster has been present the entire time -- hidden in a background, referenced in dialogue, visible in a reflection. This is the brand's through-line.

2. **Real data, always.** Every concept must surface actual deals from the database at some point. The moment the user realizes the deals are real is the conversion inflection point.

3. **No dead ends.** Every path through every concept must eventually lead to account creation or back to the main site. No user should finish an experience and have nowhere to go.

4. **Screenshot-first design.** Before building any screen, ask: "Would someone screenshot this and post it?" If no, redesign until the answer is yes.

5. **Keep the tone.** The Lobster Protocol is absurdist but never mean, weird but never confusing, challenging but never frustrating. It respects the user's intelligence. It rewards curiosity. It never wastes their time.

6. **The password must remain hard.** None of these concepts should make the real password easier to crack. The fun is in the journey, not the destination. The gag prizes at each decoy tier are the emotional reward. The real prize is a bonus for the truly dedicated.

---

## Measurement

For each concept, track:

- **Discovery rate:** % of site visitors who find the entry point
- **Engagement depth:** How far users get before dropping off
- **Social share rate:** Screenshots, link shares, referral traffic from social platforms
- **Conversion rate:** % of easter egg participants who create a Flip-ly account
- **Return rate:** % of users who come back to try again or explore further
- **External mentions:** Reddit posts, tweets, TikToks, YouTube videos referencing the experience

The north star metric is **social share rate.** Everything else follows from people telling other people about it.

---

*"The best marketing doesn't look like marketing. It looks like the most interesting thing someone found on the internet today."*

-- The Lobster Council, probably
