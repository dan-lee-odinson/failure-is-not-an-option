# FNO-M00b (step 1) — Dialogue Sheet Generator: Handoff

**Task:** FNO-M00b step 1 · **From:** Claude (Claude Code, Fable 5.1) on artemis · **To:** Dan (director) and Codex · **Date:** 7 September 2026 · **Status:** DONE. `npm run dialogue-sheet` generates `docs/dialogue-sheet.md` and `docs/dialogue-sheet.csv` from the content and the app; a test proves the sheet cannot lie. No change to `core/`, `schema/`, `content/`, or `app/`.

## 1. Where it is

| Item | Value |
|---|---|
| Repository | `C:\Users\wolfe\projects\failure-is-not-an-option`, `main`, from `c6850fe` |
| Delivery commit | *(filled in the zip copy)* |
| Content | **0.4.0**, fingerprint `95f41b37ff67b2424db30544cb14106d7517f1ae110bc1a7b74bae76b96ce85f` (unchanged) |
| Generator | `scripts/dialogue-sheet.ts` (CLI) over `scripts/lib/dialogue-sheet.ts` (library); `npm run dialogue-sheet` |
| Outputs | `docs/dialogue-sheet.md` (one section per phase, one table per node: `#`, `kind`, `speaker`, `branch`, `id`, `text`) and `docs/dialogue-sheet.csv` (UTF-8 with BOM, RFC 4180 quoting, columns `order, phase, node, kind, speaker, branch, id, text, notes` with `notes` empty). Both begin with a header line carrying the content version and fingerprint. |
| Test | `tests/core/dialogue-sheet.test.ts` (3 tests) |

## 2. The numbers

| Count | Value |
|---|---|
| Player-visible strings on the sheet | **538** |
| of which branch-only (shown on some routes) | 190 |
| by source | content 234 · core 69 (log lines, badges) · app 235 (buttons, headings, hints, badges, tooltips, compositions, messages) |
| Complete routes walked | 56 (7 preparation sets × 2 orders × 2 lessons × 2 stances), every question asked, both enabled Gemini IX-A plans committed on each |
| Content strings no reachable state displays | 7 — listed at the end of the `.md` (§5 below) |

## 3. How the sheet is derived

The sheet is generated, never edited:

1. A generic explorer (no content ids hard-coded) plays every route the engine allows: every preparation subset, every decision option, every free question, and afterwards every enabled plan on the Gemini IX-A screen.
2. At every stop it takes the structured strings from the view-models (`core/views.ts`) — that is where kind, speaker and owning id come from — and then runs the real renderer (`app/render.ts`) over the same state, twice (default view, and every evidence item opened with the newest pinned) plus the binder overlay. Anything the renderer shows that is not a view-model string is an app-authored UI string and goes on the sheet with a `ui.*` kind and id `app`, exactly as displayed — including compositions such as `Trust 0 → 1 · Confidence strengthened`, `Received: RETURN PLANNING`, the "Logged at this event" lines, and the order receipt.
3. The start screen (both text sizes), the debrief, the planning screen (unselected, highlighted, committed), and the history / about / save-load overlays are rendered too. Status and error messages that exist only as string literals in code (`app/main.ts`, `app/storage.ts`, `core/save.ts`) are extracted from those files as `ui.message`, with `${…}` shown as `…`.
4. Strings are deduplicated on their text with digit runs collapsed, so a counter such as `EVIDENCE · 12` or `Opportunities remaining: 2 of 2` is one row showing its first value. Each string is attributed to the first node, in play order, where any route can show it.
5. The **branch** is computed, not authored: each route has a final signature (every option chosen, the execution grade, whether any / two rehearsals were performed, the committed plan). A string seen on every route at its node has no branch; otherwise the shortest conjunction of up to three route predicates that picks out exactly the routes that show it is used (`earlier q0`, `contact rehearsal`, `crew-blame`, `lesson: provenance`, `plan committed`), falling back to a two-way disjunction (`q2 | ground-accountability` for the "Working confidence" label, which is what Mara or Elias reads at grade 2 and what Cunningham and Stafford read on the ground route). No row needed the "varies" fallback.

Kinds added beyond the requested list, because the content had strings they did not cover: `option.statement`, `option.subtitle`, `plan.benefit`, `event.logged` (the trust and fact lines logged at an event), and the app kinds `ui.text`, `ui.heading`, `ui.label`, `ui.hint`, `ui.badge`, `ui.tooltip`, `ui.alt`, `ui.aria`, `ui.message`.

Because the renderer uses Vite asset imports, the CLI runs under `vite-node` (already a dependency of Vitest); no new package.

## 4. Proofs

`tests/core/dialogue-sheet.test.ts`:

1. **The committed sheet equals a fresh generation.** Both files are regenerated in memory and compared byte for byte, so the sheet in the repo can never be stale.
2. **Every reachable string is on the sheet, and every sheet row is reachable.** An *independent* walk — the acceptance tests' route script, not the generator's explorer — plays all 56 routes with every question asked and both plans, and at every stop collects (a) every string the view-models expose, through a second, separately written collector, and (b) every text run the renderer emits (default, all-evidence-open, binder, debrief, planning, overlays). It asserts that every collected string is on the sheet, and that every sheet row is in the collected set (content rows via the view-models or the renderer, `ui.*` rows via the renderer, `ui.message` rows as literals in their source files). Anything the app shows that the sheet omits, or anything on the sheet nothing shows, fails the build.
3. **Order, branches, duplicates.** Every mission node appears, in content order; the start screen is first, the debrief follows the last node, planning follows the debrief; no two rows share a text; a dozen spot-checked branch labels are exact (`earlier`, `later`, `earlier q0`, `earlier q2`, `crew-blame`, `contact rehearsal`, `lesson: provenance`, the disabled-plan reason on `later`); and no row carries the `varies` fallback.

`npm run validate` and `npm test` are unchanged and passing (the full suite is now 73 tests).

## 5. What surprised me on the sheet — for Dan and Codex

- **Seven content strings can never be seen.** All are `unavailable_reason` texts on options that are always available when their node is reached (`g8-order-return`, both return orders, both lessons, both stances). They are listed at the end of the `.md` under "Content strings no reachable state displays". They are not wrong, only dead; 0.5.0 can drop or keep them.
- **The app authors more of what Dan reads than the content does** — 235 of 538 rows. Most are structural (buttons, headings, badges, "Received: …", "Observation time: known", trust compositions), but some are sentences Dan may want to weigh alongside Codex's text: the prep node's explanatory paragraph, "Unrehearsed does not mean untrained or incapable. Both orders remain available.", "Reading, pinning, and questions cost nothing.", "Critical information is always available regardless of confidence.", "Procedure membership does not determine which plan is legal.", "Selecting a tile highlights it; only Commit records the plan.", the fiction labels on event cards ("Consequence report — authored fiction (F7)", "Relationship reactions — fictional controllers (F8)", "Fictional relationship consequences (F10) — alternate history"), and the history-panel explanation of the ALTERNATE HISTORY badge. They are on the sheet with id `app` so they can be marked up like everything else; the M00b presentation pass should move the ones worth keeping into a single strings module.
- **The "Logged at this event" lines are 59 rows**, one per distinct fact label or trust line — the largest single kind. That is the mechanics showing through; if Dan finds them noisy in play, that is a presentation question for M00b, not a content one.
- **Two evidence titles Dan named as awkward** ("A report is not continuous coverage.", "A silent loop is not a diagnosis.") appear as `evidence.title` (row 35) and as the node title of `g8-gap-note` — the second is a node `title` in the mission file, so Codex should know it lives in `mission-gemini-8.json`, not `evidence.json`.
- **The disabled-plan reasons carry the route as their branch** (`earlier` / `later`), which reads oddly until you remember the reason text names the drill the *other* route requires — the label is correct.

## 6. Using it

- Dan: open `dialogue-sheet.csv` in a spreadsheet (it opens cleanly with the BOM), filter by `kind` or `branch`, write in `notes`, return the file to the shared subfolder.
- Codex: author 0.5.0 as JSON against `npm run validate`, run `npm run dialogue-sheet`, and ship the regenerated sheet in the packet so Dan reviews the new text before the M00b build starts. If the content adds a kind of string the sheet does not classify, the reachability test will fail and say which string; add the kind in `scripts/lib/dialogue-sheet.ts`.
- The generator is deterministic: same content and app, same sheet, byte for byte.
