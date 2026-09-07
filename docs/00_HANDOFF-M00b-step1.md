# FNO-M00b (step 1) — Dialogue Sheet Generator

**Task:** FNO-M00b step 1 · **From:** Dan (director), assembled by Claude in Cowork, 7 September 2026 · **To:** Claude Code on artemis · **Repository:** `C:\Users\wolfe\projects\failure-is-not-an-option`, `main` from `c6850fe` · **Status:** READY. Small task, one script, two output files.

Dan played M00a and wants to review the game's text outside the game, cheaply, before Codex rewrites it. Read `16-Playtest-1-Findings.md` (§1 for his words, §5 for this tool). Build only the generator. **No change to `core/`, `schema/`, `content/`, or `app/`.**

## What to build

`scripts/dialogue-sheet.ts`, run as `npm run dialogue-sheet`. It loads the content the same way the validator does (same loaders, same index), walks the mission's phases and nodes in order and then the follow-on, and emits **every player-visible string** once, in the order a player meets it. For each string: a running order number, the phase id and display title, the node id, the **kind** (one of: `briefing`, `director-note`, `line`, `question`, `answer`, `option.intent`, `option.attraction`, `option.cost`, `option.uncertainty`, `option.requirement-reason`, `event.text`, `event.status`, `consequence`, `reaction`, `evidence.title`, `evidence.body`, `evidence.provenance`, `procedure.title`, `procedure.text`, `debrief`, `followon.paragraph`, `plan.label`, `plan.disabled-reason`, `ui.prompt`, `ui.button`, `outcome.title`, `label` — add kinds if the content has strings these do not cover; never drop a string), the **speaker** where there is one (character display name and role), the **branch** if the string appears only on some routes (e.g. `earlier`, `later q0`, `crew-blame`, `ground-accountability`, `recovery-drill-required`), the stable **id** of the owning object, and the **text** exactly as displayed (after any composition the app does — the order receipt, the "Logged at this event" lines, the trust labels).

Also include the UI strings the app authors itself (button labels, prompts, panel headings, hints, the fiction labels on event cards, the "ON THE RECORD" element once it exists). Dan is reviewing what he reads on screen, not what is in JSON, so if a string only exists in `app/`, it still goes on the sheet with `kind: ui.*` and a source of `app`.

Two outputs from one pass, written to `docs/`:

- `docs/dialogue-sheet.md` — one section per phase, one table per node, columns: `#`, `kind`, `speaker`, `branch`, `id`, `text`. Readable by Codex and Claude; commits with the repo.
- `docs/dialogue-sheet.csv` — one row per string, columns: `order`, `phase`, `node`, `kind`, `speaker`, `branch`, `id`, `text`, `notes` (empty). UTF-8 with BOM so Excel opens it cleanly; RFC 4180 quoting. This is Dan's markup copy.

Both files carry a header line with the content version and fingerprint they were generated from.

## Proofs

1. The generator's string count equals the number of distinct player-visible strings the validator's sweep can reach — add a test that walks all 56 routes through the engine, collects every string the view-models expose, and asserts every one appears on the sheet (and nothing on the sheet is unreachable). That is the check that the sheet cannot lie.
2. Run it on 0.4.0 and read the sheet yourself: order should follow play, branch labels should be right, no string duplicated for no reason (a line that appears on both routes appears once with no branch; a line that differs by branch appears once per branch).
3. `npm run validate` and `npm test` unchanged and passing.

## Deliver

Commit on `main` (`FNO-M00b step 1: dialogue sheet generator`), push to the private remote. Return `FNO-M00b-SHEET.zip` to the shared subfolder `C:\Users\wolfe\Documents\Claude_GPT_Shared_Workflow\Failure-is-Not-an-Option\` containing `00_HANDOFF.md` (commit hash, string count, how the reachability test works, anything on the sheet that surprised you), `dialogue-sheet.md`, `dialogue-sheet.csv`, and `FILES.sha256`. Same standing rules as before: one zip, LF, no temp files in synced trees, nothing in the shared folder root, no subagent double-checks.

Dan will mark up the CSV and return it for Codex; the M00b content and presentation work in `16` §3 starts after that.
