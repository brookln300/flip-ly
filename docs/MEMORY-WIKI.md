# Memory Wiki — Ingest & Organizational Model

**Created:** 2026-07-28
**Status:** Active — this is the operating manual for project memory
**Source:** Graph-engineering analysis (X post by @Sprytixl, 2026-07-19, citing Microsoft GraphRAG, Stanford DSPy/STORM, KEPLER, Anthropic/LaunchNotes case study), adapted to a file-based wiki
**Companion:** `SESSION-PLAYBOOK.md` (session rules), `.claude/session-notes/` (per-session nodes)

---

## 1. What we took from the post (and what we didn't)

The post's core claim survives scrutiny; its numbers need caveats.

**Signal (adopted):**
- Text search finds fragments; relationship structure finds chains of causation. Our memory failure mode is exactly this: facts exist across 20+ docs but the *links* between them (what superseded what, what contradicts what) are implicit or missing.
- GraphRAG's local vs global distinction: "what happened with X" (local) vs "what are the patterns across everything" (global). Our session notes answer local questions; nothing currently answers global ones.
- Entity normalization: "Microsoft Corp" and "MSFT" are the same node. Our equivalent: "The Hearth," "family hub," and "`/`" are the same thing, and no doc says so.
- Maintenance classification on ingest: every new fact is new / duplicate / update / contradiction / uncertain. Contradictions get flagged, never silently overwritten.
- "The right graph beats the bigger model": structure quality matters more than context volume. A lean, correct CLAUDE.md beats a long, stale one.

**Hype (discounted):**
- The 18% accuracy / 85% cost numbers come from one domain-specific paper (GraphRAG on industrial P&ID diagrams), not a general benchmark. Directionally credible, not portable.
- LaunchNotes "5x faster / 50% fewer meetings" is a vendor case study.
- The post sells graph databases. We are not building one. This repo's markdown files are the nodes; links and typed references are the edges. Per project boundaries: simplest working version, no custom dashboards, no Neo4j, no embeddings.

---

## 2. The organizational model

Memory is a graph of four node types connected by typed edges.

### Node types

| Node | Lives in | Role |
|------|----------|------|
| **Entity** | Registry below (§4) | Canonical name + aliases for every thing we talk about |
| **Decision** | `SESSION-PLAYBOOK.md` Decision Log | What/why/alternatives, numbered, dated |
| **Session** | `.claude/session-notes/YYYY-MM-DD-*.md` | What happened, facts extracted (§3) |
| **Doc** | `docs/`, `CLAUDE.md` | Specs, plans, status — each carries a Status header |

### Edge types

All edges are written inline in markdown — a typed reference, not prose that implies one.

| Edge | Written as | Example |
|------|-----------|---------|
| `supersedes` | "Supersedes: Decision #N" / "Superseded-by: `doc.md` (date)" | Hearth-owns-`/` supersedes marketing-landing-at-`/` |
| `decided-in` | "Decided: Decision #N (date)" | Pricing tiers → Decision Log entry |
| `implemented-by` | file path + commit hash | CL URL fix → `app/lib/scrapers/craigslist.ts`, commit ref |
| `contradicts` | Contradiction Ledger entry (§5) | SESSION-PLAYBOOK dark theme vs globals.css light theme |
| `depends-on` | "Blocked-on:" / "Requires:" | Location layer → magic-link auth migration |

### Doc status header (required on every doc in `docs/`)

```
**Status:** Active | Locked | Draft | Stale | Superseded-by: <doc> (<date>)
**Last verified:** YYYY-MM-DD
```

A doc without a current `Last verified` date is treated as *claims, not facts*. This single rule prevents the failure found today: `PROJECT-STATUS.md` presenting April state as current in July.

### Local vs global memory

- **Local** (what happened with X): session notes + doc for that entity. Already works.
- **Global** (what are the themes, what's the current state of everything): the **State Rollup** — a short section at the top of `PROJECT-STATUS.md`, regenerated (not appended) whenever it's touched. It is the GraphRAG "community report": a summary written *from* the nodes, safe to delete and rebuild, never the source of truth itself.

---

## 3. The ingest pipeline (session-end protocol)

Every session ends by running new information through five steps. These are the post's five pipeline prompts adapted to a wiki.

**Step 1 — Extract.** From the session, list facts as explicit statements with evidence:
```
<subject> → <relation> → <object>   [evidence: file/commit/URL]
```
Not narration ("worked on the scraper") — facts ("`craigslist.ts` → maps SAPI codes to → URL codes [commit 1094f94]").

**Step 2 — Normalize.** For each subject/object, check the Entity Registry (§4). Use the canonical name. New entity → add it with aliases. Never create a second name for an existing thing.

**Step 3 — Classify.** Each fact is exactly one of:
- **new** — append to the entity's home doc
- **duplicate** — discard
- **update** — edit the home doc in place, add `Supersedes` note if it reverses a decision
- **contradiction** — do NOT resolve unilaterally; add to Contradiction Ledger (§5) for Keith
- **uncertain** — log in session note under "Unverified," do not write to any canonical doc

**Step 4 — Write to the home doc, not a new doc.** Every entity has one home (registry column). Facts about it go there. New docs are created only for genuinely new entities.

**Step 5 — Link.** Any decision made → Decision Log with number. Any doc touched → bump its `Last verified`. Any doc made obsolete → mark `Superseded-by`, don't delete.

**Grounded answers rule (query side):** when a session answers a question from memory, cite the node (`doc.md` §section, or file:line, or commit). "I remember" without a pointer gets flagged as unverified — this is the existing zero-fabrication rule extended to project memory.

---

## 4. Entity Registry

Canonical name first. Aliases resolve here. Home doc is where facts about the entity live.

| Canonical name | Aliases | Home doc | Notes |
|---|---|---|---|
| Flip-ly | flip.ly, fliply | `CLAUDE.md` | The product/repo |
| The Hearth | family hub, hub, `/` (front door) | `docs/FAMILY-HUB.md` | Owns `/` since 2026-07-02 |
| Mission Control | ops, `/ops`, ops dashboard | *(missing — see Ledger C5)* | Deals/ops side |
| Deal Engine | the pipeline, scraper pipeline | `CLAUDE.md` §Data Pipeline | Scrapers + enrichment + delivery |
| Craigslist scraper | CL scraper, SAPI scraper | `app/lib/scrapers/craigslist.ts` | sapi.craigslist.org JSON, not RSS |
| Enrichment | AI scoring, Haiku scoring | `app/lib/ai/enrich-listing.ts` | Batches of 5, deal_score 1-10 |
| Lobster Protocol | easter egg, terminal | `CLAUDE.md` §Lobster Protocol v2 | 7 levels; breadcrumbs marked `LOBSTER-PROTOCOL-L7` |
| Pricing Model | tiers, founding program | `docs/planning/PRICING-MODEL.md` | Locked; see Ledger C2 |
| Design tokens | globals.css vars, theme | `app/globals.css` | See Ledger C1 |
| Telegram bot | family bot, claudecode webhook | `app/api/telegram/claudecode/route.ts` | One brain: Vercel webhook only |
| Hub tables | fliply_profiles, fliply_allowlist, fliply_events | `docs/FAMILY-HUB.md` §5 | |
| Engine tables | fliply_listings, fliply_sources, fliply_markets, fliply_zip_data | `CLAUDE.md` §Key Database Tables | |
| Drip sequence | welcome emails, 7-email sequence | `app/lib/email/drip-templates.ts` | Day 0-21 |
| Session notes | handoffs, continuation docs | `.claude/session-notes/` | One per session, date-prefixed |
| State Rollup | project status, current state | `docs/PROJECT-STATUS.md` | Regenerated summary; see Ledger C4 |

Add rows as entities appear. An entity mentioned in three or more docs must have a row.

---

## 5. Contradiction Ledger

Found by running the model against the existing wiki on 2026-07-28. Flagged, not resolved — resolution is Keith's call (`Decision Authority: Keith`). When resolved: fix the losing doc, mark the row Resolved with a Decision # or commit.

| # | Contradiction | Node A | Node B | Status |
|---|---|---|---|---|
| C1 | Site theme | `SESSION-PLAYBOOK.md` audit checklist: dark theme #060606, green #22C55E | `CLAUDE.md` + `app/globals.css`: Apple-inspired light theme, `--bg-primary: #ffffff` | Open — playbook checklist presumed stale |
| C2 | Pro pricing | `SESSION-PLAYBOOK.md` unit economics: Pro $5/mo, two tiers | `CLAUDE.md` locked model: Pro $9 (founding $5), Power $29 (founding $19), three tiers | Open — playbook presumed stale |
| C3 | What owns `/` | `CLAUDE.md` three-layer model: `app/page.tsx` = marketing landing | `docs/FAMILY-HUB.md` + commit 1094f94: The Hearth owns `/`, ops moved to `/ops` | Open — CLAUDE.md architecture section stale since 2026-07-02 |
| C4 | Current project state | `docs/PROJECT-STATUS.md`: "Last Updated 2026-04-04, sprint to April 18 launch" | Git history: active development through July 2026, private/family pivot | Open — PROJECT-STATUS needs a regenerated State Rollup |
| C5 | Dangling reference | `docs/FAMILY-HUB.md` cites companion `REDESIGN-MISSION-CONTROL.md` | File does not exist in repo | Open — doc missing or reference wrong |

---

## 6. What we are NOT building

- No graph database, no Neo4j, no Postgres graph extension for memory
- No embedding/vector layer over the docs
- No custom memory dashboard or viewer (the wiki is markdown; grep is the query engine)
- No automated extraction pipeline — the session-end protocol is a checklist a session runs, not software

If the wiki outgrows files (hundreds of entities, cross-project queries), revisit. Not before.
