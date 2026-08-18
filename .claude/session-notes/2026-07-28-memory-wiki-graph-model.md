# Session — 2026-07-28 — Memory Wiki: Graph-Engineering Ingest Model

## What was done

Analyzed the @Sprytixl graph-engineering X post (2026-07-19), separated signal (relationship-first memory, entity normalization, local/global search, contradiction-flagging maintenance) from hype (non-portable benchmark numbers, vendor case studies, graph-database sales pitch), and adapted the signal into a file-based memory model for this repo.

Shipped:
- `docs/MEMORY-WIKI.md` — the ingest pipeline (extract → normalize → classify → write-to-home → link), node/edge model, Entity Registry (15 seed entities), Contradiction Ledger (5 real defects found by auditing the existing wiki), and an explicit not-building list (no Neo4j, no embeddings, no dashboards).
- `CLAUDE.md` — Session Management section now requires the ingest protocol before writing session notes.
- This note — first one written in the extracted-facts format.

## Facts extracted (per the new protocol)

```
Memory Wiki model → adapted from → GraphRAG/DSPy/STORM concepts   [evidence: docs/MEMORY-WIKI.md §1]
Memory Wiki → home doc is → docs/MEMORY-WIKI.md                    [new entity]
SESSION-PLAYBOOK.md theme checklist → contradicts → globals.css light theme  [Ledger C1]
SESSION-PLAYBOOK.md pricing snapshot → contradicts → CLAUDE.md locked 3-tier model  [Ledger C2]
CLAUDE.md three-layer model → contradicted by → Hearth owning "/"  [Ledger C3, commit 1094f94]
PROJECT-STATUS.md → stale since → 2026-04-04                       [Ledger C4]
FAMILY-HUB.md → dangling reference to → REDESIGN-MISSION-CONTROL.md  [Ledger C5]
```

Classification: all five contradictions flagged in the ledger, none resolved — resolution is Keith's call.

## What's left

- Keith to rule on Ledger C1-C5 (each resolution = fix the losing doc + log a Decision # in SESSION-PLAYBOOK.md).
- Regenerate the State Rollup at the top of `PROJECT-STATUS.md` from current reality (July state: Hearth pivot, ops at `/ops`, family bot) — blocked on C3/C4 rulings since the rollup must state what the product currently *is*.
- Backfill `Status` / `Last verified` headers onto existing `docs/` files as they get touched (don't do a big-bang pass).

## Prompt for next session

"Read docs/MEMORY-WIKI.md. Keith has ruled on contradictions C1-C5 (ask if not). Apply the resolutions: update the losing docs, log Decision entries in SESSION-PLAYBOOK.md, then regenerate the State Rollup section of PROJECT-STATUS.md from git history and the FAMILY-HUB build log. Follow the ingest protocol at session end."
