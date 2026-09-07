# FNO-M00 — Build Handoff

**Task:** FNO-M00 · **From:** Claude (Claude Code, Fable 5.1) on artemis · **To:** Dan (director) and Codex (independent review) · **Date:** 7 September 2026 · **Status:** BUILT. All sixteen acceptance cases pass; the validator has been shown to fail; the replay test passes; the handoff zip is in the shared subfolder.

## 1. Where it is

| Item | Value |
|---|---|
| Repository (local) | `C:\Users\wolfe\projects\failure-is-not-an-option` |
| Repository (remote) | https://github.com/dan-lee-odinson/failure-is-not-an-option — **private**, branch `main` |
| Build commit | `a4cbe050f956500d363ee25c12ef3dd1b523b42b` (the complete build); the focus-return fix, this handoff and the screenshot-directory change follow it on `main`. The exact delivery commit is written in the zip's `00_HANDOFF.md` §1 line below. |
| Delivery commit | *(filled in the zip copy)* |
| Content version | **0.4.0** (Codex packet revision 2, `FILES.sha256` verified OK against the CRLF originals before copying) |
| Content fingerprint | `95f41b37ff67b2424db30544cb14106d7517f1ae110bc1a7b74bae76b96ce85f` — SHA-256 of the canonical JSON of the assembled content bundle (`npm run fingerprint`) |
| Simulation version | `0.1.0` |
| Node | v24.15.0 (LTS), npm 11.12.1 |

**One deviation from the handoff's fixed decisions, on Dan's direct instruction.** `00_HANDOFF.md` §4 says "Do not create a remote or push." Dan's kickoff message said "Please access my GitHub and create a new repository for the game." I created the repository **private**, because both license files are marked *proposed, Dan confirms before publication*; nothing is published until Dan flips visibility. To publish: `gh repo edit dan-lee-odinson/failure-is-not-an-option --visibility public --accept-visibility-change-consequences`. No tag was created; commit signing is not enabled in the global git config (only tag signing is), so the commits are unsigned, matching the other repositories.

## 2. Commands

```bash
npm install
npm run dev          # http://localhost:5173
npm test             # Vitest: replay test, AC-01..AC-11, AC-13..AC-16, save verification, validator fail-on-purpose
npm run validate     # schema, ids, references, outcome exclusivity, exhaustive route sweep, manifest vs PNGs; prints fingerprint
npm run validate:fail  # plants eight faults in temp copies and proves each is detected
npm run test:e2e     # Playwright: AC-12 plus the screenshot set (needs `npx playwright install chromium` once)
npm run placeholders # regenerate labeled placeholder PNGs from assets/manifest.json
npm run build        # typecheck + Vite build to dist/
```

## 3. What was built

- **`core/`** — engine-free simulation. Ledger (facts with provenance, quantities at zero, people with trust and notes, procedures as authoritative membership, patches empty); evidence acquisition separate from eligibility and from pinning; phases and nodes as ordered indices with display labels; attention (`null` unlimited, `0` exhausted); one-shot preparation with an explicit finish; atomic effect application in defined order on a working copy, committed only on success; exactly-once finalization with the exactly-one-outcome rule enforced at runtime; an immutable event log with `player_visible`; canonical serialization and a pure SHA-256 for run identity and the content fingerprint; the Gemini IX-A follow-on initialized from the committed ledger and completion record alone.
- **`schema/`** — JSON Schema 2020-12 for every content type, reconciled with SC-01…SC-11 (stable ids everywhere, `null`/`0` attention, evidence provenance separate from current contact, the formal condition union, the effect list, deterministic resolutions with sub-effects, six exclusive outcomes, debrief rules as conjunctions, a follow-on with its own option registry, availability predicates, disabled-reason strings and one recorded commit input).
- **`scripts/validate.ts`** — schema; id uniqueness within scope (and across the shared input namespace); every reference resolves; outcomes provably mutually exclusive (static, from inferred exclusivity classes: distinct resolutions of one event, distinct options of one decision); an exhaustive generic route sweep that plays every preparation subset × every available decision option × every enabled plan through the real engine (56 complete routes, 6 distinct outcomes, 112 plan commits, 0 draws) and fails if any event has ≠1 matching resolution or finalization has ≠1 matching outcome; manifest filenames, dimensions and alpha against the PNG headers on disk.
- **`content/`** — package 0.4.0 transcribed as data: every option's intent, evidence, attraction, cost, uncertainty, requirements and effects; every execution row with its sub-conditions; every exact reaction and consequence text; every debrief rule; the follow-on plans and disabled reasons; the sources H1–H5, fiction register F1–F10, labels and notices. Nothing historical was removed, softened or reworded.
- **`assets/`** — the manifest and five generated placeholders (asset id, dimensions, PLACEHOLDER; portraits carry a real alpha channel). No NASA marks anywhere.
- **`app/`** — layout per 05 §5 as amended by SC-11: status bar (mission · phase · stage label · CONTACT · attention dots · ALTERNATE HISTORY badge from return planning on, which opens the history panel); room plate; conversation panel with portrait slot and citation chips that pin evidence; evidence panel with REFERENCE / CURRENT CONTACT / PREVIOUS CONTACT badges, "Simulated report" labels, receipt stage and observation time; console strip with option cards (INTENT / EVIDENCE / ATTRACTION / COST / UNCERTAINTY, unavailable cards greyed with the specification's reason text, the "Supported by" readout on the return orders); the preparation readout at the return decision; the status panel during the return beats; overlays for the binder, the history panel (F7–F10 explanation, sources, fiction register, people, anchors), save/load and about; the debrief with the expandable event record and the post-flight relationship panel; the Gemini IX-A planning screen. Bounded panel scrolling; every control is a real button reachable by Tab; focus-visible outline; Escape closes overlays and returns focus; reduced-motion respected; nothing animates or flashes. Pinning and text size are UI-only and never touch the run.
- **Saving** — one browser slot plus JSON export/import. Import verifies structure, content version and fingerprint, simulation version, every referenced id, and replay equivalence (state and log hash) before replacing anything; a failed import leaves the session and the stored save untouched and says why. Saves from 0.1.0–0.3.0 are rejected with an unsupported-content-version message.
- **`docs/`** — every document from `FNO-M00-INPUTS.zip`, LF-normalized, plus this handoff.

## 4. Verification

### 4.1 Validator, and the validator failing on purpose

`npm run validate` (transcript in the zip, `evidence/validate.txt`):

```
validate: OK (C:\Users\wolfe\projects\failure-is-not-an-option)
  content_version:     0.4.0
  content_fingerprint: 95f41b37ff67b2424db30544cb14106d7517f1ae110bc1a7b74bae76b96ce85f
  sweep:               56 complete routes, 6 distinct outcomes, 112 plan commits, 0 draws
```

`npm run validate:fail` plants one fault per temp copy (OS temp directory, deleted afterwards) and requires the specific error (transcript in `evidence/validate-fail-on-purpose.txt`):

```
DETECTED  duplicate id (evidence g8-ev-rule declared twice)
          -> index: duplicate evidence id: g8-ev-rule
DETECTED  dangling reference (briefing acquires evidence that does not exist)
          -> node g8-brief: document references unknown evidence g8-ev-does-not-exist
DETECTED  dangling reference (outcome requires a fact no effect sets)
          -> outcome g8-out-earlier-0: condition references fact g8-never-set, which no effect sets
DETECTED  wrong-size PNG (room plate written at 1280x720)
          -> asset room-gemini-console: fno_gemini_room_console_placeholder_v001.png is 1280×720, manifest declares 1920×1080
DETECTED  two matching outcomes (g8-out-earlier-0 duplicated under a new id)
          -> outcomes g8-out-earlier-0 and g8-out-earlier-0-again are not provably mutually exclusive (exactly-one rule, SC-09)
DETECTED  event with two matching resolutions (sweep)
          -> sweep: route ... > g8-execute-return rejected: event g8-ground-execution: 2 resolutions match; exactly one is required
DETECTED  schema violation (a timer property on a node)
          -> content/mission: schema /phases/0/nodes/0 must NOT have additional properties {"additionalProperty":"timer"}
DETECTED  missing PNG (manifest points at a file that is not on disk)
          -> asset portrait-capcom: fno_gemini_portrait_missing_placeholder_v001.png is missing from assets/ (run npm run placeholders)

validate:fail OK — all 8 planted faults detected
```

The same eight cases plus content-version mismatch, unknown speaker and portrait-not-in-manifest run under Vitest (`tests/core/validator.test.ts`).

### 4.2 Unit tests (Vitest)

`npm test` — **70 tests, 6 files, all passing** (transcript `evidence/vitest.txt`). Mapping:

| File | Cases |
|---|---|
| `replay.test.ts` | **The replay test, written first.** Two fresh runs byte-identical in log and ledger; replay of an identity reproduces the original; every one of the 56 complete routes (7 prep sets × 2 orders × 2 lessons × 2 stances) replays to itself with 0 draws; different deliberate choices do not replay to the same ledger; seed stored and logged; no timestamps in the log. |
| `ac-01-04.test.ts` | AC-01 earlier prepared return; AC-02 later prepared return and "prep creates no reserve or asset"; AC-03 unprepared capability and cost; AC-04 duplicate/third/early-finish, all 7×2 grades against the authored matrix, the four q1 sub-cases plus the two irrelevant-rehearsal cases, reading never changes grade. |
| `ac-05-09.test.ts` | AC-05 information boundary in the gap for every prep set and at return planning; AC-06 questions mutate nothing, unacquired bodies hidden, only a confirmed plan mutates; AC-07 through the follow-on; AC-08 save/import at eleven boundaries with exactly-once counts, save-before-event and save-after-event; AC-09 malformed saves, 0.1.0/0.2.0/0.3.0 rejected with the clear message, unknown/deleted ids, wrong-node order, second order, impossible prep, forged resolution/trust/grade/constraint, log-hash tamper, plausible facts never bypass replay, active run untouched. |
| `ac-10-14.test.ts` | AC-10 every debrief rule traced across all 56 routes, quoted consequence/reaction from recorded resolutions, no odds/diagnosis/incompetence text, plans not labeled completed; AC-11 follow-on from ledger + completion alone for 2×2×2 branches, procedure changes reference only, each legal plan confirmed once and disabled plans rejected; AC-13 all seven prep sets × both lessons paired earlier/later with identical prefix and different outcome, trust vector, drill and plan set, both orders always available; AC-14 save before/after execution and relationships on all six resolutions through the follow-on, ten forged chains rejected, premature recovered evidence, early finish, unavailable confirm, completion immutable after the plan commit. |
| `ac-15-16.test.ts` | AC-15 six outcomes × two lessons paired blame/ground with identical prefix, same flight state, (−2,−2,+1,+1)/(+1,+1,0,0), facts, task, H5 context retained, social state into the follow-on; AC-16 save at context/stance/response/finish/plan, pending response has stance only, duplicate/opposing/replayed/early inputs rejected, impossible astronaut state and unsupported 0.3.0 rejected, no H5 leak during flight, exactly one baseline lesson with the ground task valid, plan commit never repairs the rift. |
| `validator.test.ts` | Real content passes including the on-disk manifest check; eleven planted faults each produce the expected error. |

### 4.3 Browser tests and screenshots (Playwright)

`npm run test:e2e` — **11 tests passing** (transcript `evidence/playwright.txt`): eight full play-throughs (1920×1080 and 1366×768 × default and enlarged text × earlier and later route) that assert, along the way, exhausted-attention greying with the reason text, the MET label, CONTACT: NONE in the gap, the PREVIOUS CONTACT badge, the ALTERNATE HISTORY badge absent in the gap and present from return planning, the readout, the "Simulated report" label, both orders' attraction and cost visible and within the viewport, no horizontal page scroll, pinning leaves the node unchanged, the status panel and consequence text, trust logged in the aftermath, the post-flight header label and H5 card, "Response pending.", the debrief with the event record, the planning screen with the disabled tile's reason wired through `aria-describedby`, the Commit button disabled until an enabled tile is selected and disabled again after commit; plus keyboard reach and focus-visible outline, overlay Escape with focus return, evidence links and options by keyboard; no `<audio>`/`<video>`, no node change after waiting, zero running animations under reduced motion, only manifest images loaded; and the save/export/import round trip through the UI with a bad 0.3.0 import rejected while the session survives.

Screenshots (88 PNGs, in the zip under `screenshots/<viewport>-<text>/<route>-<nn>-<scene>.png`): preparation, contact gap, crisis report, return decision with the readout, beat 1 and beat 2 on each route, aftermath reactions, post-flight stance and response, debrief, and Gemini IX-A planning on both routes with one tile disabled and its reason shown — at 1920×1080 and 1366×768, default and enlarged text.

## 5. Contract decisions and schema gaps (for Codex)

Where the specification's prose and the draft contract disagreed, the specification won unless it violated SC-01…SC-11; nothing was silently resolved. Every item below is a decision I made and want reviewed.

1. **`contact` union extended** with `not-in-flight` (pre-flight and post-flight phases). The specification does not give contact states per phase; I chose: preparation `not-in-flight`, docking `tracking-ship`, gap `none`, report `tracking-ship`, return planning / execution / recovery `houston` (the room is planning; not a claim about ground-station coverage), post-flight `not-in-flight`. Stage labels I chose: PRE-FLIGHT, MET approximately 06:33 (the only exact one), LOSS OF SIGNAL, TRACKING SHIP CONTACT, RETURN PLANNING, RETURN EXECUTION, RECOVERY, WEEKS LATER — POST-FLIGHT DISCUSSION.
2. **Resolution `finally` effects** added to the contract so "execute exactly one row and its subconditions atomically, then set `g8-ground-execution-complete`" is expressible in that order. **Resolution `sub_effects`** (conditional sub-effects) carry the two q1 rows' "If R… / If C…" clauses. Neither existed in 05 §3.6.
3. **`g8-return-brief` is one decision node** holding the documents, the three lines, Glen's prompt, the two free questions, the readout and the two orders. The specification does not name a separate decision node; I read "return acknowledgement" in the standard route as `g8-order-return`.
4. **Continue ids**: every ordinary node's Continue is `<node-id>-continue`; the named ones (`g8-prep-finish`, `g8-execute-return`, `g8-resolve-accountability`, `g8-finish`) keep their ids. The validator requires `g8-finish` to be the last node's Continue.
5. **Free questions are recorded domain inputs with no effects** (05 §3.9 lists `question` as an input; `reveals` is empty in 0.4.0). They shift log sequence numbers but change nothing the ledger says; AC-04/AC-06 verify. If Codex prefers questions to be UI-only, that is a one-line change in the engine and the tests.
6. **Merged "Cost / uncertainty" and "Cost and uncertainty" columns** were split: the first sentences went to `cost`, the last to `uncertainty`. For the two orders, `uncertainty` therefore reads "Supported by recovery + contact rehearsals." and the same relationship is also structured as `supported_by` (rendered READY / NOT REHEARSED on the card). Say if the split is wrong.
7. **UI wording I authored** (not Codex text), all short and all reviewable: the prep node's explanatory sentence ("Each rehearsal is a performed ground exercise…"); the rule-decision prompt reuses the rule's title; the lesson prompt "Adopt one standing procedure."; the accountability prompt reuses the section title "Who carries the blame?"; Continue button labels; the order receipt composed verbatim from the chosen option's intent and cost under ORDER — / ACCEPTED COST —; the accountability receipt showing Glen's statement then "Response pending."; the hint under the readout ("Unrehearsed does not mean untrained or incapable. Both orders remain available." — from the specification's prose); the planning screen's "Initialized from the committed Gemini VIII record: <title>." and its plan prompt; event-node headings ("The room executes the order", "Return — first beat", …) and the fiction labels on event cards ("Consequence report — authored fiction (F7)", "Relationship reactions — fictional controllers (F8)", "Fictional relationship consequences (F10) — alternate history"); the "Logged at this event" list.
8. **Citation chips**: the specification does not say which lines cite which evidence. I attached `cites` where the line plainly refers to a report (docking line → docked report; gap line → docked + primer; stabilization line → stabilized + rule; FD → return report; Mara → reserve; Elias → air; the two answers → air / reserve). Chips render only for acquired evidence, so nothing leaks.
9. **`g8-q-gap`'s answer is spoken by CAPCOM** (unspecified in the packet).
10. **`g8-ev-recovered` is marked `simulated: true`** (its branch details are F7) and therefore shows the "Simulated report" label; `g8-ev-postflight-context` is `kind: reference` with no observation time. Confirm both.
11. **Zero-delta adjustments are recorded** for the q2 rows (Elias +0 on earlier-q2, Mara +0 on later-q2) so "record both adjustments" holds; they appear in the log and the debrief as "trust 0 → 0 (+0)".
12. **The grade facts** (`g8-earlier-q0` … `g8-later-q2`) are ordinary set facts with labels "Earlier return — execution grade N" and appear in the player-visible "Logged at this event" list. The specification calls q explanatory shorthand; if it should not be shown, mark the fact hidden (a `player_visible` flag on `set_fact` is a one-field addition).
13. **Freshness badge is derived, not stored** (SC-03): REFERENCE for references; CURRENT CONTACT when acquired in the current phase, otherwise PREVIOUS CONTACT; the receipt stage and known/unknown observation time are shown alongside.
14. **Outcome exclusivity** is proven statically from inferred exclusivity classes and enforced dynamically by the sweep and at runtime. The `exactly-one` rule also applies to every event's resolutions.
15. **Every node boundary is a save point**, a superset of the boundaries the specification lists.
16. **`goto`** is in the schema and engine (SC-05 says M00 needs none) and unused by the content.
17. **`event_seen`** matches event node ids and resolution ids.
18. **Fonts**: no web fonts are bundled (no download during the build); the CSS names IBM Plex Sans/Mono with system fallbacks. Recording licensed font files in the manifest is deferred to M01.

## 6. Known limitations

- Placeholder art only; the room plate is a flat generated PNG with painted light pools, portraits are labeled rectangles.
- Inline evidence links are citation chips beneath lines and on cards, not links inside sentences; Codex's dialogue text is untouched.
- The event record in the debrief is the raw player-visible log as JSON lines (accurate, not pretty).
- No auto-save: saving is explicit (one slot plus export). Closing the tab without saving loses the session, by design.
- At 1366×768 with enlarged text the console strip scrolls internally and the page may scroll vertically; nothing scrolls horizontally (asserted).
- `docs/` copies are LF-normalized, so `FILES.sha256` (which hashes the CRLF originals) will not match the copies byte for byte; the originals were verified OK before normalization and the unmodified packet remains in the shared folder.
- Hosting is not set up; local build only. Commits are unsigned (see §1).

## 7. Open questions for Codex

1. Approve or replace the phase contact states and stage labels (§5.1).
2. Approve or replace the authored UI wording (§5.7) and the citation mapping (§5.8).
3. Should free questions be recorded inputs (current) or UI-only (§5.5)?
4. Should the grade facts and the zero-delta adjustments be hidden from the player-visible log (§5.11–12)?
5. Confirm `g8-ev-recovered` as a simulated report and `g8-ev-postflight-context` as a reference (§5.10).
6. The split of the merged cost/uncertainty columns (§5.6).

## 8. For Dan's playtest

`npm install`, `npm run dev`, open http://localhost:5173. New campaign → play through to the Gemini IX-A commit; save from Save / Load at any point; export, re-import. The three playtest questions from Codex's handoff: did both orders tempt; did the aftermath make the chosen cost felt; did the next required rehearsal follow intelligibly from the experienced cost. Structural tests passing does not establish that the game is engaging.
