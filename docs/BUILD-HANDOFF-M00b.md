# FNO-M00b — Presentation pass: Build handoff

**Task:** FNO-M00b · **From:** Claude (Claude Code, Fable 5.1) on artemis · **To:** Dan (director) and Codex · **Date:** 7 September 2026 · **Status:** DONE. Content 0.5.1 integrated; the opening screens, the Apollo kit as a theme, the decision-card states, the mode lamps, the pin hint, the music and the soundscape are built; every check the handoff asked for runs and passes. Parts 1–7 were done in order.

## 1. Where it is

| Item | Value |
|---|---|
| Repository | `C:\Users\wolfe\projects\failure-is-not-an-option`, `main`, from `2524c16` |
| Delivery commit | *(filled in the zip copy)* |
| Content | **0.5.1**, fingerprint `9056d94a25e9691c2245c89647aabcc6e3ae994d2af482f62232560d472c98f6` |
| Validate | 56 complete routes, 6 outcomes, 112 plan commits, 0 draws |
| Unit tests | `npm test`: **98 tests across 11 files, all passing** |
| Fail-on-purpose | `npm run validate:fail`: 9 planted faults, 9 detected (the eight from M00 plus an audio-duration mismatch) |
| Browser tests | `npm run test:e2e`: **18 tests, all passing (Chromium, 1920×1080 and 1366×768, default and enlarged text)** |
| Screenshots | 80 PNGs under `artifacts/screenshots/<viewport>-<text>/` (in the zip) |
| Dialogue sheet | regenerated after all presentation changes: **641 strings (209 branch-only) from 56 routes; content 257 · core 73 · app 311; the 7 unreachable content strings are unchanged** |

Commands Dan runs: `npm install` · `npm run dev` → http://localhost:5173 · `npm test` · `npm run validate` · `npm run placeholders` · (`npm run test:e2e` after `npx playwright install chromium` once; `npm run dialogue-sheet`; `npm run gen-quindar`).

## 2. Part 1 — Content 0.5.1 integration

**Baseline hashes.** `content-0.5.0/integration/baseline-sha256.json` matched HEAD `2524c16` byte for byte on all ten existing files (the eleventh, `content-050-presentation.test.ts`, was correctly absent). `content-0.5.1/integration/baseline-sha256.json` matched the post-0.5.0 tree on all ten files once CRLF was normalized (Codex hashed CRLF copies of the same LF content; `git apply --check` confirmed the identical content). **No hand merge was needed on any file.** Both patches carried CRLF line terminators and applied cleanly after the carriage returns were stripped. The six `content/*.json` and `assets/manifest.json` were copied LF-normalized; every image byte was verified unchanged against the packet; the two schema files equal the packet copies.

**History marker semantics (0.5.1, binding)** are Codex's adapter, kept as delivered: `alternateHistoryActive(run)` derives the sticky marker from the log at input boundaries; HISTORICAL CHOICE shows on a decision that carries `historical_option` when the alternate marker is off; ALTERNATE HISTORY activates at entry to `g8-return-execution` after Execute Return on the earlier route only, persists through the debrief and IX-A planning, and is not reset by a later historically aligned stance; the order receipt shows no lamp. The e2e suite asserts each of these points on both routes.

**Two known defects fixed.** The History panel's provenance lines print only the fields present (`provenanceLine()` in `app/render.ts`; the sheet library uses the same formatter, so the `Sources: . Fiction register: .` rows are gone). The debrief's "Notes:" lines render the registry labels (Codex's `personRow` change, kept), and the e2e test asserts no raw `g8-`/`g9-` id appears in any note.

**One addition to `core/`** (a view-model, not the engine): `describeCommittedDecision(run)` in `core/views.ts` returns the decision the player just committed in this phase, with its options as the player saw them, so the receipt screen can keep the cards on screen stamped and greyed (§4). It reads the run; it does not touch it. Nothing in `core/engine.ts`, `core/save.ts` or the save format changed.

README records that 0.4.0 and 0.5.0 saves do not import into 0.5.1 (no migration).

## 3. Part 2 — Opening screens

Sequence on first launch: **Start** (quiet dark screen, BEGIN key, SKIP TO MENU, the sound control) → **Dedication** (the two paragraphs, Barlow Regular, `clamp(20px … 24px)`, ~62 characters per line, line-height 1.8, moving upward against darkness) → **Notices** (project notice, AI disclosure, dramatization statement as three ordinary paragraphs in one column) → **Montage slot** (a named stage, `montage`, that is a 0-duration pass-through; `nextStage()` skips it and the renderer emits an empty `data-stage="montage"` main) → **Hero title** → **Main menu**.

- The prose is a real scroll box driven at reading pace (about 2.2 words a second plus 8 s) by a `requestAnimationFrame` loop in `app/main.ts`; PAUSE/RESUME stops it; the player can wheel or keyboard-scroll it by hand at any time (the box is focusable); when the text has cleared, a 1.2 s hold and the next chapter follows. Controls (Pause/Resume, Continue, Skip to menu, Sound) live outside the moving text. Under reduced motion the chapters are static, the Pause key is absent, and every transition is a cut. No text is ever animated while it has focus (the moving column contains no focusable element).
- **Hero title, Study A.** The approved room via the manifest under a separate dark overlay (`rgba(4,21,26,.64)`; the bitmap is untouched); the title is live SVG text (`<text>` elements at `title-layout.json` study `a` coordinates: FAILURE 320.792 px baseline 335, IS NOT AN 269.4 px baseline 576, OPTION 360.81 px baseline 890, x 475) in Chakra Petch Bold 700, positioned on the plate's cover-fit rectangle with CSS (`width: max(100vw, 177.78vh)`), so it scales with the room at every viewport; Glen's head clear zone is asserted at the hero and every console shot. CONTINUE → is a keyboard-reachable button at `max(18px, 1.3vw)` (measured ≥ 18 px at 1366×768). No hold, no countdown, no tie to music. Bracket corners omitted.
- **Main menu.** On Continue the lockup shrinks to the menu-continuation proportions (`translate(11.3%, −2%) scale(.826)`, a 0.6 s transition; a cut under reduced motion) and four Apollo title-scale keys appear beneath: NEW CAMPAIGN (`start-new`), CONTINUE (`start-load`, disabled with a visible reason when no valid save exists — validity is checked by verifying the browser slot, so an old-version save shows its rejection reason rather than a dead key), LOAD (`open:saveload`), ABOUT (`open:about`). Text size, Settings and the sound control sit under the keys with the scenario subtitle.
- Later launches (opening viewed or skipped once, `fno.openingSeen` beside the text-size preference) open on the menu. About / Credits carries REPLAY OPENING, the dedication, all notices, the sources H1–H8, the OST list, the soundscape credits, the font licences and the project/content licences ("pending confirmation" wording unchanged).
- Fonts: Barlow Regular/SemiBold, Barlow Condensed Bold and Chakra Petch Bold ship unmodified under `public/fonts/` with their OFL.txt; `@font-face` with `font-display: swap` and real fallback stacks in `index.html`. Chakra Petch is used by the hero/menu title only.

## 4. Part 3 — The Apollo kit as a theme

1. **Mechanism.** `<html data-ui-mode="apollo">`; the kit's colours are custom properties under `[data-ui-mode="apollo"]` in `app/styles.css`; the label-free faces are manifest SVGs (`apollo-<family>-<state>-v002.svg`, 4 families × 5 states, plus the two lamp faces) whose URLs `app/theme.ts` resolves through the manifest loader and publishes as `--face-<family>-<state>` / `--lamp-<mode>` on the root. Geometry (sizes, padding, focus ring, layout) is shared. `MODERN_UI_AVAILABLE = false` in `app/theme.ts` is the one constant; the Settings control for the mode renders only when it is true. No engine, content, eligibility or app decision logic reads the mode (the unit test asserts every face resolves and the switch is hidden).
2. **Controls.** Every control is a native `<button>` (or `<input>`/`<summary>`) with live text over a face: dark key (Begin, Continue, primary actions), ivory selector (status-bar destinations, secondary keys, questions), ivory action (title keys, Choose, Commit), square arrow (the pin glyph). Six states: default / hover / pressed / selected (`aria-pressed`) / disabled (native `disabled`, with the reason beside it) / focus (a separate outline). The reflow templates stretch to enlarged text; the two lamp faces were given the same `preserveAspectRatio="none"` derivation the kit applies to its control templates (recorded in the manifest as derived). Enlarged text at 1366×768 is in the screenshot set; the status bar keeps four keys plus the lamps by shrinking key widths, and text size moved into Settings and the menu.
3. **Decision cards (paper).** Rest: intent and risk/cost visible, a **Details +** disclosure holding attraction, uncertainty and the rehearsal readout (`supported_by`), open by default only at the return fork (the one decision with a rehearsal readout; a player's toggle is remembered per card for the session). Chosen: an **ORDERED** stamp for an in-flight order (an option whose effects set facts about the flight), **CHOSEN** for a lesson (adopts a procedure), a statement (the stance), a rehearsal or a plan; the Choose key is removed. Unavailable: greyed paper with the readable reason. **On commitment** at a decision the engine advances the node, so the stamped state is shown on the receipt that follows in the same phase (`describeCommittedDecision`): the chosen card stamped, the others greyed and keyless, and focus on the next valid continuation (asserted in e2e for the order receipt and the prep screen). Same on prep, return, stance and plan screens; the lesson decision has no receipt in this content, so its stamp is never seen.
4. **Mode lamps.** HISTORICAL CHOICE (slate on sage) and ALTERNATE HISTORY (slate on blue-white) as steady lamps in the status bar, distinct from the amber operational lamps; rendered as buttons that open History, with the visible focus outline; driven by §2's semantics. The History panel gains one app sentence explaining the two lamps and that neither is a recommendation.
5. **Pinning.** Evidence panel only: every pin chip on option cards and dialogue lines is gone (the unit test counts pin actions and finds them all inside the panel). Each report has a pin glyph (arrow face, `aria-pressed`, tooltip "Pin to keep this report in view. Pinning changes nothing in the mission."). The first hover or focus on any glyph opens the once-only hint with the same sentence and a GOT IT key; pinning or dismissing persists `fno.pinHintSeen` per player. Pin state is presentation only.
6. **Panels.** Conversation and Evidence use the kit's translucent panel (`rgba(16,39,37,.90)`, border, corner ticks); the conversation panel is sized to its content (`max-height` instead of a stretched box) so quiet screens show the room. The M00 event-record display is behind `?debug` in the URL (no debug flag existed before).
7. **Contrast.** Every kit control on every screenshot is measured (its legend's own text box against the face rasterised at the control's rendered size) and every text sample against its real backdrop; the face × ink table is in §7.

## 5. Part 4 — Playtest-1 items

| Item (16 §3 / 17 §5) | Resolved |
|---|---|
| Evidence chips removed from cards | §4.5 (Part 3) |
| Stamped / greyed decision state | §4.3 |
| Intent + cost first, Details expander | §4.3 |
| "ON THE RECORD" element | superseded by Dan's ruling; the lamps (§4.4) and the debrief's "Departures from the record" (`section: "departures"` under `registry.labels.departures_heading`, Codex's adapter) replace it |
| Conversation panel sized to content | §4.6 |
| Pinning explained | §4.5 |
| Markers after the choice | §2 (0.5.1 semantics) and §4.4 |
| Debrief "Notes:" raw ids | §2 |

## 6. Parts 5 and 6 — Music and soundscape

**Director** (`app/audio.ts`). One `AudioContext`, created inside a player interaction (Begin, Skip, or the sound control); gain buses master → music / effects / beds; every sound is a manifest asset fetched and decoded through `app/assets.ts`; a missing or undecodable file plays silence. Music cues have sample-accurate start/end/fade automation on gain nodes; a loop is two overlapping buffer sources scheduled a second ahead with a crossfade at the seam. The opening cue's "extend to the seam if still reading" is decided a second before the planned end from the current stage. Beds loop the same way with a 0.3 s crossfade. One-shots play a region of their file. **Off by default**: silent until the master is turned on (Start screen, menu, Settings); the master and three volumes persist per player beside text size. Reduced motion has no bearing on audio. The director never sees the run; no audio event enters the log; the unit test replays a full route with every director signal firing and proves the log and state are byte-identical to a silent run.

**Music map** (`app/music-map.json`, Dan's rulings): `opening` Orbit of Hope 0:00→0:42 under the dedication, notices and title, 2.5 s fade crossfading into `menu-loop`, extended to the 2:04 seam if the player is still reading; `menu-loop` Orbit of Hope (refrain) from 0:00, loop 60.5→111.7 s, 0.2 s crossfade, 2 s fade on New Campaign / Continue; `crisis` Mission in Danger from 0:00 on `g8-crisis-report`, once, 2 s fade on the return Choose, provisional; `postflight` Per Aspera from 90.0 s, 1 s fade-in, on `g8-accountability-brief`, once, runs out; Disaster and Loss listed and reserved. Tests: every asset exists and is present, every point lies inside `duration_s`, every trigger and stop_on names a real screen/node/option/input id, and no loop cue triggers anywhere but the menu.

**Soundscape** (`app/soundscape-map.json`). All seven of Dan's files were in `SHARED\audio\soundscape-cc0\` and are committed under `public/audio/soundscape-cc0/` unchanged; `npm run placeholders` reports 14 of 14 sounds present. `room_bed_gain` 0.3 (Dan's ruling), `walla_gain` 0.2 under it on the preparation and post-flight phases only, `effects_gain` 0.6. Regions were chosen by onset analysis of the decoded files (Chromium's decoder; the table is in `evidence/audio-analysis-soundscape.json`), not by ear, and are provisional until Dan listens:

| Role | File | Region / loop | Why |
|---|---|---|---|
| Room bed | seventhsamurai 332417 | loop 7.5 → 42.25 s, 0.3 s crossfade | steady −25.3 dBFS ± 0.2 dB across the region |
| Walla | SduggySounds 725718 | loop 37.25 → 63.5 s | best waveform match at the seam (0.70) with a steady level |
| Button press | EricsSoundschmiede 457411 | 3.50 → 4.20 s | the cleanest isolated press (2.6 s of silence before, 2.0 s after) |
| Toggle click | TRP 713997 | 8.62 → 8.95 s | the loudest clean switch click in the light-switch part of the file |
| Rotary detent | TRP 713997 | 22.15 → 22.45 s, gain 1.6 | a short click from the dimmer-slide part; boosted because it is quiet |
| Paper | swidmark 171320 | 19.10 → 19.80 s | a single page flip with quiet before it |
| Headset | ReadeOnly 47646 | whole file (0.37 s), gain 0.5 | |
| Alert | JonNicholas 266156 | 0.10 → 0.40 s, gain 0.7 | one beep (the file's beat is 0.288 s); never the loop |
| Quindar open / close | generated | whole files (0.25 s), gain 0.5 | |

One-shots are bound to interface events only: Choose / Commit / Continue / Begin → button; menu key selection → toggle; text size, sound toggle and volume → detent; pin, unpin, binder open and close → paper; History open and close → headset; the arrival of a crisis-class report card (`crisis_cards: ["g8-ev-crisis"]`, on card render) → one beep; a CAPCOM line (speaker role CAPCOM) → the open tone when the line first renders and the close tone when it leaves the screen. **Quindar tones**: `npm run gen-quindar` writes `public/audio/generated/quindar-open.wav` (2525 Hz) and `quindar-close.wav` (2475 Hz), 250 ms sine, 10 ms linear ramps, 44.1 kHz 16-bit mono, −12 dBFS peak, deterministic (the unit test regenerates them and compares hashes); committed.

**Credits and rights.** About / Credits lists the OST from the map ("Music: Dan Lee-Odinson, produced with Suno Pro, instrumental") and a Soundscape block with every file as title — uploader — freesound.org — licence, including the exact line **"Beep 8 count (loopable) by JonNicholas, freesound.org, CC BY 3.0"**; the same block is in README; the CC BY 3.0 legal code ships as `LICENSES/CC-BY-3.0.txt`. Manifest entries `kind: audio` carry title, credit, rights, licence, source URL and duration (the manifest schema gained the audio entry type; the validator checks WAV durations against the files and warns, never fails, on a missing sound). `.gitignore` guards `public/audio/soundscape/` and `**/soundscape/*.mp3`; no Epidemic Sound file is in the repository.

## 7. Part 7 — Layout, access, tests, docs

**Screenshots** (`artifacts/screenshots/<viewport>-<text>/`, 1920×1080 and 1366×768, default and enlarged): `00-opening-start`, `01-opening-dedication`, `02-opening-notices`, `03-hero-title`, `04-menu-continue-disabled`, `05-about-credits`, `06-menu-continue-enabled`, `10-prep-rest`, `11-prep-chosen`, `12-prep-unavailable`, `13-loss-of-contact`, `14-crisis-report`, `15-return-decision` (Details open, HISTORICAL CHOICE), `16-order-receipt` (ORDERED, the other card greyed), `17-execution-alternate` (ALTERNATE HISTORY, earlier route), `18-return-beat-1`, `19-postflight-decision` (ALTERNATE HISTORY over the historical stance), `20-debrief-departures`, `21-gemini-9a-planning`; and at default text `17b-execution-historical-timing` and `19b-postflight-historical-choice` on the later route. Every room shot re-asserts the emblem placement, Glen's head clear zone, text contrast ≥ 4.5:1 against the composited backdrop, kit contrast, and manifest-only images and faces.

**Keyboard** (e2e): Tab reaches BEGIN → Enter → Continue is focused on each chapter → the hero CONTINUE → NEW CAMPAIGN; the menu's Tab order skips the disabled key; in play, a card's Choose key from the keyboard removes itself and focus lands on the next continuation; Details, the pin glyph and the lamps are reachable; Shift+Tab onto a lamp shows the focus outline; Escape closes overlays and returns focus.

**e2e cases**: opening flow including Skip and reduced motion; the scroll runs, pauses, resumes and advances when the text has cleared; return-to-menu on a second launch and Replay opening; marker precedence on both routes; CONTINUE disabled and enabled; audio off by default, a context only after Begin, no `<audio>`/`<video>`, no audio in the log, the setting persisted; no timers or animations in play; the save round trip; and the face × ink table below.

**Contrast table** (face × ink, every family and state, both lamps; `evidence/contrast-kit-faces.json`; the per-screenshot measurements are in `evidence/contrast.json`):

| Face | Ink | Worst ratio |
|---|---|---|
| `--face-key-default` | `--key-ink` | 8.88:1 |
| `--face-key-hover` | `--key-ink` | 6.12:1 |
| `--face-key-pressed` | `--key-ink` | 8.61:1 |
| `--face-key-selected` | `--selected-ink` | 9.19:1 |
| `--face-key-disabled` | `--disabled-ink-dark` | 5.75:1 |
| `--face-action-default` | `--action-ink` | 6.64:1 |
| `--face-action-hover` | `--action-ink` | 9.01:1 |
| `--face-action-pressed` | `--action-ink` | 6.86:1 |
| `--face-action-selected` | `--selected-ink` | 9.19:1 |
| `--face-action-disabled` | `--disabled-ink` | 5.38:1 |
| `--face-selector-default` | `--action-ink` | 6.64:1 |
| `--face-selector-hover` | `--action-ink` | 9.01:1 |
| `--face-selector-pressed` | `--action-ink` | 6.86:1 |
| `--face-selector-selected` | `--selected-ink` | 9.19:1 |
| `--face-selector-disabled` | `--disabled-ink` | 5.38:1 |
| `--face-arrow-default` | `--key-ink` | 8.88:1 |
| `--face-arrow-hover` | `--key-ink` | 6.12:1 |
| `--face-arrow-pressed` | `--key-ink` | 8.61:1 |
| `--face-arrow-selected` | `--selected-ink` | 9.19:1 |
| `--face-arrow-disabled` | `--disabled-ink-dark` | 5.75:1 |
| `--lamp-historical` | `--mode-ink` | 10.24:1 |
| `--lamp-alternate` | `--mode-ink` | 9.77:1 |

Every ratio is at or above 5.38:1 (the ivory faces' disabled state). Live measurements at the 80 screenshot points: 609 text samples against their composited backdrops (worst 5.29:1, `.menu-subtitle` on `1366x768-large/04-menu-continue-disabled`) and 840 rendered controls against their faces (worst 5.58:1, `select-g9-plan-systems-contact [disabled]` on `1366x768-large/21-gemini-9a-planning`); the threshold is 4.5:1 everywhere, at both text sizes.

**Dialogue sheet** regenerated after all presentation changes and committed (`npm run dialogue-sheet`); the sheet now includes the opening (every stage, both text sizes, the menu both ways), the Settings overlay, and the pin hint, with the notices captured as content (`kind: notice`). The three proofs (committed equals fresh; every reachable string on the sheet and every row reachable; order and branches) pass.

## 8. Decisions in this pass that Dan may reverse (none change content, mechanics or saves)

1. The decision-card label over the `cost` text reads **Risk** (prep cards keep **Cost**), following Dan's "what are the risks" ruling; one word in `app/render.ts`.
2. Stamp vocabulary: ORDERED for in-flight orders, CHOSEN for lessons, statements, rehearsals and plans (§4.3).
3. The committed decision's cards are shown on the receipt screen that follows it (there is no other moment to show them, since Choose advances the node).
4. The status bar carries BINDER · HISTORY · SAVE / LOAD · SETTINGS; text size and About / Credits are in Settings (and on the menu).
5. The "Logged at this event" lines (59 rows on the 0.4.0 sheet) are unchanged; Dan did not rule on them.
6. Soundscape regions and one-shot gains are analysis picks (§6); the crisis-class card is `g8-ev-crisis`; the Quindar close tone plays when the CAPCOM line leaves the screen (a render has no duration). All are numbers in `app/soundscape-map.json`.
7. Debug event record behind `?debug`.

## 9. Open questions

- Playtest 2 will decide the crisis cue's start offset and the soundscape regions by ear; the maps are the only thing to edit.
- The walla layer runs on the preparation and post-flight phases (`phases` in the soundscape map) — the handoff named the screens; if "post-flight" should include the debrief and IX-A planning, add those screens to the bed's list.
- Dan's row-8 note (the menu subtitle sentence) was left as delivered, under the title on the menu.
