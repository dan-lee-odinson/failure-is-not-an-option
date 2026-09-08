# FNO-M02 — Content 0.5.3 (Lovell), the stacked layout for enlarged text, the tier meaning, small items: Build handoff

**Task:** FNO-M02 · **From:** Claude (Claude Code, Fable 5.1) on artemis · **To:** Dan (director) and Codex · **Date:** 8 September 2026 · **Status:** DONE. Content 0.5.3 is integrated (the patch applied cleanly; nothing merged by hand); the stacked play layout, the evidence overlay, the tier meaning and the four small items are built; every check the handoff asked for runs and passes. No engine, save-format or replay change; the replay is proven byte-identical with the new questions asked and the layout toggled mid-run.

## 1. Where it is

| Item | Value |
|---|---|
| Repository | `C:\Users\wolfe\projects\failure-is-not-an-option`, `main`, from `d679b2b` (M01 delivery) |
| Delivery commit | *(filled in the zip copy)* |
| Content | **0.5.3**, fingerprint `63fa5eacd8b7433e9e08b6c03f366d621eac5bc7fa72d24c994f427897ccf36d` (as Codex declared) |
| Validate | 56 complete routes, 6 outcomes, 112 plan commits, 0 draws (unchanged) |
| Unit tests | `npm test`: **143 tests across 16 files, all passing** |
| Fail-on-purpose | 9 planted faults, 9 detected |
| Browser tests | `npm run test:e2e`: **44 tests, all passing (Chromium; 158 screenshots at 1920×1080 and 1366×768, default and enlarged text)** |
| Dialogue sheet | regenerated against the M02 renderer: **737 strings (225 branch-only) from 56 routes; content 380 · core 73 · app 284; 9 unreachable content strings (the M01 seven plus the FAILURE and LOSS tier meanings)** |

Commands Dan runs: `npm install` · `npm run dev` → http://localhost:5173 · `npm test` · `npm run validate` · `npm run placeholders` · (`npm run test:e2e`, `npm run dialogue-sheet`).

## 2. Part 1 — Content 0.5.3 integration

**Nothing was merged by hand.** `integration/baseline-hashes.json` matched HEAD `d679b2b` on all 22 listed files (LF), and `content-0.5.3.patch` passed `git apply --check` and applied as one change: the six content files, the manifest, `schema/defs.schema.json` and `schema/registry.schema.json` (line provenance, `capcom_history_note`, `credits`, `opening_den`), `core/types.ts`, the History note in `app/render.ts` (kept as Codex wrote it), the validator (historical CAPCOM lines need provenance; relays need H7 PDF pages; the printed-page mapping), the presentation contract (the den's geometry), the sheet generator (the credits captured as authored content), the tests (`content-053-relay.test.ts` new; version bumps; the script asks the two new questions), and Codex's regenerated sheet. The six content files and the manifest were then proven byte-identical to the packet copies (five of the six content files carry CRLF in the packet, as before; the patch is LF).

The five PNGs (Lovell neutral and concerned, the den plate in its lamp-off revision `cb7c83a8…`, the smoke and beam layers) were copied with their hashes checked against the packet's `FILES.sha256`; the composite CAPCOM portrait `fno_gemini_portrait_capcom_neutral_v001.png` was deleted from `assets/` (it is not in the manifest; the packet keeps it in `art/history/`). 69 manifest assets. The packet's docs, validation, audit, image QA, patch, hashes, CAPCOM provenance list and art records are under `docs/codex-content-0.5.3/`; the M02 handoff and docs 14, 31–33 under `docs/00_HANDOFF-M02.md` and `docs/m02-inputs/`.

After integration: validate 56 / 6 / 112 / 0 at the declared fingerprint; Codex's six relay tests pass; older saves (≤ 0.5.2) are rejected with the existing reason; the README's saves note says so.

**Presentation.** `g8-capcom` renders as **JIM LOVELL — CAPCOM** with his neutral portrait from `characters[]` exactly as every speaker does (nothing hard-coded; the M02 unit test walks a route and finds all seven of his lines with his label and portrait, and no provenance word in the visible text). The two optional questions render like the others and log as ordinary question inputs. History shows the Lovell note. `registry.credits` and `registry.opening_den` are validated, on the sheet (Codex's capture), and rendered nowhere; About keeps its credits rendering.

## 3. Part 2 — The stacked layout

**Rule.** After a console screen is painted in the column layout, the app asks whether the conversation panel's dialogue area *would* be shorter than four lines of body text on the heaviest screen the content can produce at this viewport and text size (`STACK_MIN_LINES × line-height`). It measures that with a hidden probe panel in the real stylesheet: the card strip at its CSS maximum, the panel's head with the longest scene title and header label, the active portrait where the stylesheet stacks it above the lines (enlarged text at ≤ 1500 px), and the largest set of Glen's questions pinned in the footer; what is left for the lines is compared with four lines. If it starves, `ui.stacked` is set and the screen paints again stacked. Measuring the worst case rather than the current node keeps the decision a function of viewport and text size only, so the layout never flips from screen to screen within a session; a resize or a text-size change re-evaluates it from the column layout. It is a UI flag: never persisted (no preference key), never in a save, never in the log; reduced motion is unaffected. At 1366×768 every conversation screen stacks at both text sizes (at default text the return decision's three question keys leave about 30 px for the dialogue in the column layout); at 1920×1080 default none does; 1600×900 default keeps the columns (all asserted in e2e, at every node of a route).

**Stacked mode** (`.console-shell.stacked`): one column; the room dims by a further 22 %; the conversation panel becomes a block spanning the content width — from Glen's clear-zone edge (`max(27vw, 1rem)`) to the right edge, the evidence column's width included — up to 55 % of the viewport, its body scrolling above the pinned question keys; the decision cards sit below as before (Details open) and the page scrolls to them (the strip's height cap is lifted). The evidence column collapses to an **EVIDENCE · n** key in the status bar (aria-label "Evidence: n items — open the evidence list") that opens the list as an overlay in the same translucent panel style with the corner ticks; the items, pins and the once-only pin hint are the same markup (`evidenceItems()`), pinning works there and keeps the overlay open with focus on the pin; Escape closes it and returns focus to the key. The status bar is two groups (`.status-left` wraps within itself; `.status-keys` never wraps): stacked, the keys read BINDER · HISTORY · SAVE · SET (aria-labels keep the long names) and stay on one row; the mission line wraps inside its group only when it must (at 1366×768 enlarged the lamp drops to a second line under the mission text; the keys stay up).

**Scrolling.** Each new node is read from the top of the page, and the automatic focus on the continuation key (which sits below the fold in this layout) no longer drags the page down to it; Tab and Enter work as before.

**Glen's clear zone** holds in stacked mode: the panel starts at the same 27 vw as the column layout (the e2e case measures the panel's left edge against the plate's 25 % mark). The handoff's "full content width" was read as the content width beside Glen, not the plate's full width, which would have covered his head.

## 4. Part 3 — Small items

1. **Tier meaning.** On the result card the tier word carries `title="<meaning>"` and an ⓘ key (arrow face, an "i" glyph, `aria-expanded`, "What SUCCESS means") toggles a paper strip with `resolution_presentation.tiers[tier].meaning` between the tier and the outcome title; keyboard-reachable; Escape closes it and returns focus; leaving the card resets it. `describeResolution()` exposes `meaning`. Only the tiers an outcome uses are reachable; FAILURE's and LOSS's meanings are now listed among the sheet's unreachable content strings (9, up from 7), which is the honest place for them.
2. **1920×1080 panel room.** The measurement behind the note: at the return decision a speaker tile was 118–131 px tall (a 72×96 thumbnail plus padding), so about two and a half tiles showed; worse, an asked question's answer was rendered *inside the pinned footer*, so with three questions asked the footer grew to nearly 900 px and the body collapsed to nothing. Answers are dialogue: they now join the scrolling body in the order asked (`.conv-lines .answer`, testid `answer-<question>`), and the footer holds the question keys alone. At viewports ≥ 1500 px the tiles are denser (48×64 thumbnails, tighter padding), the panel head is one line and the question keys sit in a row. Measured at 1920×1080 default on the return decision with all three questions asked: the dialogue area is 360 px (15 text lines), and three of the six speaker tiles are whole above the keys (the rest scroll). Six whole tiles would need about 180 px more: either the cards below the fold (the page scrolling) or the card strip shrunk so the cards scroll inside it — the handoff's "not the cards" rules the second out and the first undoes the M00c fold rule, so neither was done. The e2e case asserts at least six lines of text and three whole tiles; the number is in §8 for Dan to move.
3. **Sound after Begin.** The M01 screenshots read OFF because the harness opens on the menu (`fno.openingSeen`) and never presses Begin — which is also what a returning player sees: M00c's "on after Begin" never fired for them. The menu's play keys (NEW CAMPAIGN, CONTINUE, LOAD FROM THIS BROWSER, an import, and the panel's new campaign) now count as the first play gesture, so the master goes on then unless a setting is persisted. The e2e case asserts SOUND: ON on the prologue and on the resolution card after New Campaign from the menu, after Begin, and OFF on both when turned off first; the M01 prologue and resolution screenshots are re-shot with the real default (`30-prologue-program`, `40-resolution-success-result`: SOUND: ON).
4. **Save / Load.** START A NEW CAMPAIGN keeps running the prologue and carries "(plays the mission briefing)" beneath it, referenced by `aria-describedby`.

## 5. Part 4 — Checks, sheet, docs

- `npm test`: 143 tests across 16 files — new `tests/core/presentation-m02.test.ts` (Lovell resolves from the content; the seven lines with label and portrait and no provenance in play; the two questions; the History note; credits and den rendered nowhere; the composite portrait gone; the stacked flag never persisted; stacked and column markup; the evidence overlay with pins and the hint; the tier meaning and its reserved tiers; the Save / Load hint) beside Codex's `content-053-relay.test.ts`; the M01 tier assertions updated for the title attribute; the sheet test renders the stacked variants, the evidence overlay and the meaning strip.
- `npm run test:e2e`: 44 tests — the AC-12 and M01 sets carried through (the evidence checks run in the column or, stacked, in the overlay via `withEvidence`; an asked answer is asserted in the body, never in the footer), and `tests/e2e/m02.spec.ts`: Lovell at each of his seven lines with the crisis line and the History note shot; the stacked layout at 1366×768 enlarged at every node (panel edges, height, four-line room, keys in view, status keys on one row, the overlay by keyboard with pinning and focus return, the cards below); the column layout at 1920×1080 default at every node with the six-line / three-tile measurement and the answers-in-body order; the tier tooltip by mouse and keyboard with the log unchanged; the sound default on three paths; the Save / Load hint; the replay byte-identical with the new questions asked and the layout toggled by a resize and a text-size change mid-run, the overlay and the tooltip used.
- **Contrast**: at the 158 screenshot points, 889 text samples (worst 5.38:1, `.menu-subtitle`, unchanged from M00c) and 1110 rendered controls (worst 5.58:1, the disabled plan key, unchanged); the new and changed screens:

| Screens | Shots | Text samples | Worst text | Controls | Worst control |
|---|---|---|---|---|---|
| Return decision, stacked (1366×768, both sizes) | 2 | 21 | 6.39:1 (a card's Details summary, as before) | 16 | 6.93:1 (BINDER) |
| Crisis report, stacked (1366×768) | 2 | 12 | 7.55:1 (a speaker label) | 12 | 6.93:1 (BINDER) |
| Post-flight brief with participants, stacked (1366×768) | 2 | 14 | 5.99:1 (the panel's header label) | 14 | 6.93:1 (BINDER) |
| Return decision, columns (1920×1080, with every answer asked) | 3 | 55 | 6.39:1 (a card's Details summary) | 55 | 6.49:1 (a pin) |
| Crisis report and Lovell's line, columns (1920×1080) | 3 | 38 | 7.00:1 (an evidence badge) | 32 | 6.70:1 (CONTINUE) |
| Evidence overlay (1366×768 enlarged) | 1 | 18 | 6.51:1 (a card field label beneath) | 19 | 6.93:1 (CLOSE) |
| Tier meaning open (1920×1080) | 1 | 5 | 11.88:1 (the meaning strip) | 5 | 7.01:1 (SKIP TO DEBRIEF) |
| History with the Lovell note (1920×1080) | 1 | 16 | 7.00:1 (an evidence badge) | 11 | 6.94:1 (BINDER) |
| Save / Load hint (1366×768) | 1 | 3 | 6.81:1 (the menu subtitle) | 13 | 5.60:1 (the disabled EXPORT key) |

The new text itself: an asked answer in the body 12.46:1 at worst, an asked question key 13.4:1, the Lovell note 13.32:1, the tier meaning 11.88:1, the overlay's report titles and bodies 11.88:1, the Save / Load hint 10.74:1; the new and shortened keys (EVIDENCE · n, SAVE, SET, ⓘ) 6.93:1 at worst.
- **Screenshots** (in the zip): the return decision, the crisis report and the post-flight brief at 1366×768 enlarged (stacked) and 1920×1080 default (`15`, `14`, `19a`), the return decision with every answer asked at 1920×1080 (`15b`), the evidence overlay (`24`), the tier meaning open (`44`), Lovell's crisis line with the crew's report (`14b`), the History panel with the Lovell note (`07c`), the Save / Load hint (`25`), and the re-shot prologue and resolution screens with the sound on (`30`, `40`).
- `npm run dialogue-sheet` regenerated and committed: 737 strings (225 branch-only); content 380 · core 73 · app 284 — the new rows are the seven Lovell lines and answers (content), the stacked labels SAVE / SET / EVIDENCE · n and the overlay's aria text (app), the tier meanings (`tier.meaning`, three reachable), the Save / Load hint, and Codex's credits (`credits.heading`, `credits.line`, marked as awaiting the montage).
- README: 0.5.3 and Lovell on the relay model, the stacked layout, answers in the body, the tier meaning, the sound gesture, the saves note.

## 6. Decisions in this pass that Dan may reverse

- **Answers in the body.** An asked question's answer now scrolls with the dialogue instead of sitting under its key in the pinned footer. The key shows as asked (selected paper). This is what made the M00c panel collapse; it also changes what the footer looks like once questions are asked.
- **"Content width" in stacked mode** is the width beside Glen (27 vw to the right edge), not the whole plate width, to keep his head clear. One CSS margin.
- **Denser tiles at wide viewports** (48×64 thumbnails, the question keys in a row); the active speaker's large portrait carries the face. Two CSS values.
- **Six whole tiles at 1920×1080** were not reached (three are, plus fifteen lines of text); see §4.2 for the two ways to get there and what each costs.
- **The sound comes on at the menu's play keys** for a returning player, not only at Begin. One function call per key.
- The status bar's short labels are BINDER · HISTORY · SAVE · SET exactly as asked; EVIDENCE · n takes the first slot.

## 7. Open questions

- Dan's sheet pass on the seven Lovell lines (rows in `docs/dialogue-sheet.md`; Codex's clearance list in `docs/codex-content-0.5.3/research/CAPCOM-PROVENANCE.md`).
- Whether the tier meaning should also appear somewhere permanent (About), now that it is content the player can open.
- Playtest 3: the stacked threshold (four lines) and the 55 % cap are one constant and one CSS value each.
