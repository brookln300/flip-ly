# The Hearth — Family Hub design & build bible

**Created 2026-07-02 (Fable 5). The reference for every future hub module. Read before building anything family-facing.**
Companion: `REDESIGN-MISSION-CONTROL.md` (the ops/deals side), Keith's master brief (turn 20, claude-memory `project_fliply_private_pivot.md`).

## 1. Signature concept — "The Hearth"
The home screen is night in the backyard. A warm **hearth** glows at center — the family itself, and (later) the AI you talk to. Around it drift **lanterns**, one per person, clustered by household, connected by faint constellation lines. Lanterns brighten with activity, pulse on events, **flare gold on birthdays**, rest as patient embers when away. Embers rise from the hearth carrying "On This Day" memories (P2). The nephew's lantern gains tiny orbiting lights per Build-Lab tool shipped (P3). Meaning: *everyone came from the same fire.*

Non-negotiables inherited from the brief: 5-second wow · grandma-effortless (plain nav always visible) · phone-first perf · reduced-motion support · warmth over corporate.

## 2. Immersive profiles — "Tend your lantern" (Keith feedback, amplified)
A profile here is not a form — it's **your lantern**. Each member customizes:
- **Flame hue** (0–360 wheel mapped to warm-safe gradient stops) — their color in the night sky, visible to everyone on the home hearth.
- **Flame style** — `steady | flicker | sparkle | aurora` — how their lantern animates.
- **Sigil** — an emoji that hangs on their lantern (⚾ 🎨 🎣 🎮…).
- **Status** — short text + emoji ("on my way", "at the tournament"), shown on hover/tap.
- **Story panel** — who they are, favorites (food/team/hobby), birthday, sizes + allergies (the gift-time data), links.
Their edits change the shared world instantly — the hub literally looks different because *they* touched it. That's the "unique touch" mechanic: identity expressed in the world, not in a settings page.
Future amplifiers (documented for later): profile trails (recent milestones orbit the lantern), voice-note intro on the story panel, seasonal lantern skins, kid-designed pixel sigils from the Build Lab.

## 3. Design tokens
**Palette** (dark warm night is the hub's home mode):
`--hub-night:#16213E` bg base · `--hub-night-deep:#12172B` · `--hub-plum:#2A2438` glow zone · `--hub-ember:#E76F51` · `--hub-hearth:#F4A259` · `--hub-honey:#FFD166` · `--hub-cream:#FFF6EC` text · `--hub-cream-dim:#C9BFB2` secondary · `--hub-moss:#84A98C` success/calm.
**Type:** Fraunces (display, variable — headings "settle" on load) + Inter (body, already loaded). Scale: 28/22/17/14/12.
**Motion (three verbs only):** *settle* (entrances 600ms spring, 2% overshoot) · *drift* (ambient slow sine — the world breathing) · *press* (150ms scale .97 + glow). `prefers-reduced-motion`: no drift, settles→fades, canvas renders a still.
**Surfaces:** soft glass on night — `rgba(255,246,236,0.06)` fills, `rgba(255,246,236,0.12)` hairlines, 14px radius, backdrop-blur where cheap.

## 4. Architecture decisions (made 2026-07-02)
- **Hub owns `/`; Mission Control moved to `/ops`.** Two design worlds, one Next.js app. Ops keeps its dense dark-terminal language; hub is warm.
- **Canvas 2D first, WebGL when earned.** The wow is composition+liveness, not geometry. R3F is a P2+ upgrade only if depth earns bundle weight on mid phones.
- **Auth:** existing allowlist+login for now; **Supabase Auth magic-links migration is the next structural step** (needed for real RLS on location/photos/kids). Documented, not yet executed.
- **Presence before location.** Lanterns glow from activity (`fliply_profiles.last_active`, touched on hub visits; Telegram/calendar signals later). GPS is a P2 opt-in layer w/ TTL shares + plain-language audience panel. Kids: coarse only, ever.
- **One bot brain:** Vercel webhook remains the Telegram bot's only entry; n8n (home server) = scheduler/notifier via the same tables. Site buttons mirror bot intents.
- **No-redeploy config:** `fliply_config` key/value (already holds `family_chat_id`).

## 5. Data model (hub tables)
- `fliply_allowlist(email, role family|admin, label)` — who may enter; managed at `/admin/access`.
- `fliply_profiles(email pk, display_name, sigil, lantern_hue int, flame_style, status_text, status_emoji, birthday date, story, favorites jsonb, sizes jsonb, allergies, household, last_active)` — the lantern + Who's-Who data.
- `fliply_events(id, title, emoji, starts_at, location, notes, created_by, rsvps jsonb {email:yes|no|maybe})` — calendar.
- Future (documented): `fliply_photos` (album/Storage), `fliply_milestones` (+ PWBA scraper feed via existing source pipeline), `fliply_locations` (TTL shares), `fliply_tools` (Build Lab), `fliply_points` (chores).

## 6. Module pattern (how every future module gets built)
1. Table + RLS-ready shape (owner email column) → 2. `/api/hub/<module>` route (session-aware; read open to family, writes gated) → 3. Warm page under hub nav using tokens §3 → 4. Telegram intent added to `telegram-chat.ts` router → 5. Lantern/world hook (does it light, flare, or orbit something on the hearth?) → 6. Entry documented here.

## 7. Build log
- **2026-07-02 P0+P1a:** tokens, Hearth home at `/` (live lanterns from profiles, birthday flares, presence glow), ops→`/ops`, HubNav, `/family` directory, `/family/me` lantern editor, `/calendar` (list+add+RSVP), bot `events` intent, Fraunces. Auth = existing; magic links queued.
- Next queued: Timeline-lite (album + On This Day embers), magic-link auth migration, polls, milestones+bowling scraper, location layer, Build Lab, arcade, hearth-AI on site.
