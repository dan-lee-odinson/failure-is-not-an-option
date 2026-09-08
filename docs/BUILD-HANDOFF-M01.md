# FNO-M01 — Prologue, resolution cards, historical participants, hints (content 0.5.2): Build handoff

**Task:** FNO-M01 · **From:** Claude (Claude Code, Fable 5.1) on artemis · **To:** Dan (director) and Codex · **Date:** 7 September 2026 · **Status:** DONE. Content 0.5.2 is integrated over M00c; the prologue player, the resolution cards, the historical participants and the hint text are built; every check the handoff asked for runs and passes. Parts 1–6 were done in order. No engine, save-format or replay change: the presentation stages never enter the ledger, the log, a save or the replay, and the replay is proven byte-identical with every stage viewed or skipped.

## 1. Where it is

| Item | Value |
|---|---|
| Repository | `C:\Users\wolfe\projects\failure-is-not-an-option`, `main`, from `ba5afeb` (M00c delivery) |
| Delivery commit | *(filled in the zip copy)* |
| Content | **0.5.2**, fingerprint `250a124448525bf4669935e6004c745d2a2a79c5920ea72e0635f99ca8b9d780` (as Codex declared) |
| Validate | 56 complete routes, 6 outcomes, 112 plan commits, 0 draws (unchanged) |
| Unit tests | `npm test`: **129 tests across 14 files, all passing** |
| Fail-on-purpose | 9 planted faults, 9 detected |
| Browser tests | `npm run test:e2e`: **37 tests, all passing (Chromium; 152 screenshots at 1920×1080 and 1366×768, default and enlarged text)** |
| Dialogue sheet | regenerated against the M01 renderer: **688 strings (219 branch-only) from 56 routes; content 335 · core 73 · app 280** |

Commands Dan runs: `npm install` · `npm run dev` → http://localhost:5173 · `npm test` · `npm run validate` · `npm run placeholders` · (`npm run test:e2e`, `npm run dialogue-sheet`).

## 2. Part 1 — Content 0.5.2 integration: what was merged by hand

Codex's patch is diffed against M00b `223a6cb`; the checkout was M00c `ba5afeb`. `integration/baseline-hashes.json` matched `223a6cb` on every listed file (LF; the six `content/*.json` in the packet carry CRLF, as before, and their `package_sha256` are the CRLF hashes). Twelve of the patch's twenty files were untouched by M00c and its hunks applied cleanly: the six content files, `schema/characters.schema.json`, `scripts/lib/presentation-contract.ts` (new), `scripts/lib/validator.ts`, `tests/core/presentation.test.ts` (new), and the version bumps in `tests/core/ac-05-09.test.ts`, `replay.test.ts`, `validator.test.ts`. The content files were then proven byte-identical to the LF-normalized packet copies. The rest was merged by hand:

| File | M00c had changed it | What was done |
|---|---|---|
| `schema/mission.schema.json` | yes (`hint` on decision nodes, with its description) | Codex's hunks applied cleanly (prologue, resolution_presentation, participants, outcome tier / result_line / plate, moving_element, prologue_plate, scenario_card) and added a second `hint` key; the duplicate was dropped, M00c's described one kept. |
| `assets/manifest.json` | yes (Drum Background entry; the note on Mission in Danger) | Codex's full manifest taken (22 new entries; `content_version` 0.5.2), with M00c's `audio-mission-in-danger-drum-background` entry re-inserted and M00c's note on `audio-mission-in-danger` kept; `task` FNO-M01, the notes extended. 65 assets. |
| `core/types.ts` | yes (`hint` comment) | The new types written into the existing structure with their comments: `Participant`, `participants` on briefing and decision nodes, `ResultTier`, `tier / result_line / plate` on `Outcome`, `MovingElement`, `ProloguePlate`, `ScenarioCard`, `Prologue`, `ResolutionPresentation`, `prologue` / `resolution_presentation` on `Mission`, `portraits` on `Character`. |
| `scripts/lib/dialogue-sheet.ts` | yes (history-hidden, fullscreen and idle captures) | Codex's additions rewritten against the real renderer rather than as "authored text awaiting implementation": `decision.hint` and `participant.label` rows from the node; `capturePrologue()` renders every plate and the scenario card (both text sizes, mid-crossfade, reduced motion); `captureResolution()` renders both cards for every route; `captureHistoryNote()` renders History with a run; the unreachable-content check covers every 0.5.2 presentation string. Codex's "Review status" paragraph was not added — after M01 the player displays these strings. |
| `tests/core/dialogue-sheet.test.ts` | yes | Version 0.5.2; the reachability walk now renders the prologue, the resolution cards and History with a run; Codex's authored-strings check kept and strengthened (every authored 0.5.2 string is on the sheet **and** the renderer shows every one of them). |
| `docs/dialogue-sheet.md`, `.csv` | yes | Regenerated (§6), not taken from the packet. |
| `tests/core/presentation-m00c.test.ts` | — | The M00c expectation "no content carries a hint yet" flipped: the return brief's hint renders when idle. |
| `tests/core/audio.test.ts` | — | The known screens include `prologue` and `resolution`; the new cue is checked (§3). |

Not taken from the packet: `integration/files/` (reference snapshots), Codex's regenerated sheet, and the art sources (`art/sources/`, the two review sheets; about 33 MB, left with the packet in the shared folder like the M00a sources). The packet's docs, validation, audit, patch, hashes and art records are under `docs/codex-content-0.5.2/`; the M01 handoff and docs 27–29 under `docs/00_HANDOFF-M01.md` and `docs/m01-inputs/`.

After integration: validate 56 / 6 / 112 / 0 and the declared fingerprint; Codex's five new contract tests pass (asset references, layer contracts, caption sources, participants, full outcome coverage, expression availability); saves from 0.4.0, 0.5.0 and 0.5.1 are rejected with the existing reason; no migration.

## 3. Part 2 — Prologue player

- **Where it runs.** NEW CAMPAIGN (and the Save / Load panel's START A NEW CAMPAIGN) starts a run and shows the prologue; CONTINUE, LOAD FROM THIS BROWSER and a file import resume a run straight into the console. `screen: 'prologue'` is a UI state like the opening's stages; `ui.prologue = { index, prev, prevProgress }`.
- **Six stages** from `mission.prologue.plates[]` then `scenario_card`. A 1920×1080 design frame (`.pl-frame`, `min(100vw, 177.78vh)` × `min(100vh, 56.25vw)`, centred, `overflow: hidden`) letterboxes the plate; every layer coordinate is a percentage of the frame, so the surface scales together. The background is the manifest image; the one moving layer is placed at `placement + motion.from` in design pixels with its opacity, and the app (`driveLayer` in `app/main.ts`) moves it with the Web Animations API by `(to − from) × frame scale` pixels over `motion.seconds`, `linear`, `fill: forwards` — once, then held. A repaint of the same plate resumes the animation at the time it had reached (the idle repaint at 30 s does not restart it); a resize rescales the remaining motion; layers are `pointer-events: none`, `aria-hidden`, never focusable, clipped by the frame.
- **Crossfade ~450 ms:** the previous plate stays beneath (`.pl-prev`, its layer held at the fraction of its motion already played) while the new plate and its caption fade in (`.pl-fade-in`), then the previous plate is dropped. **Dissolve ~700 ms into the room:** the console paints at once with a non-interactive copy of the facility plate fading out over it (`.room-dissolve`); the room bed starts with the room.
- **Text:** the left text area (design x 96–780, y 170–780 → 5 % / 15.74 % / 35.6 % / 56.5 % of the frame) holds a copy box over a dark backdrop that feathers into the plate (`rgba(3,12,16,.84)` with a 56 px blurred shadow — measured, not a gradient the contrast check cannot see). The plate heading is the hero face (Chakra Petch Bold) at `clamp(1.5rem, 60 design px, 4rem)`; the caption is Barlow at 1.1 rem, so the text-size setting applies and at 1366×768 enlarged the copy reflows rather than shrinks. The scenario card: facility (Barlow Condensed, letter-spaced), date (mono, green), "Gemini VIII — The Weight of the Call" in the hero face from `mission` + `scenario`, and the `context` line beneath in italic.
- **Controls:** CONTINUE (key face, `data-focus-default`), SKIP PROLOGUE (selector face; absent on the card), the sound control; the bar sits under the frame like the opening's. **Once-only entry:** the card's Continue paints the room and starts a 700 ms input guard (`guardUntil`, `Date.now()`-based so fake clocks see it): any press on a control while it runs — a second or third click where Continue was, or Enter on the focused console key — reaches nothing; the e2e case proves three rapid clicks and an Enter leave the run with zero inputs. Under reduced motion: the static `from` composition, no animation, cuts between plates, a cut into the room with a 300 ms guard.
- **Audio.** A new `prologue` cue in `app/music-map.json`: Orbit of Hope from 0:00, once, `fade_in` 1 s, `stop_on` the console (1.5 s fade), the menu and the start screen. **Which case:** the prologue always follows the menu, so what is playing at NEW CAMPAIGN is always the menu loop (the opening cue has stopped at the menu); the loop fades over **1 s** on New Campaign via a new per-signal `stop_fade` on the cue (`{"start-new": 1.0}`; Dan's 2 s stands for Continue), while the prologue cue starts the track. One screen id (`screen:prologue`) for every plate, so Continue never restarts it; it runs out naturally if the player reads longer than the track. Nothing plays on the cards themselves; Per Aspera continues from the post-flight brief.
- **History note.** Once a run exists, History shows `prologue.history_note` (the 1973 renaming) followed by "Sources: H10." after the lamp sentence; H9 and H10 render in History's and About's source lists from the registry.

## 4. Part 3 — Resolution cards

- **Stage.** When an input completes the mission (`applyInput`), the screen goes to `resolution` (card `result`) instead of the debrief, if `describeResolution()` finds a tier, a result line and a plate for the recorded outcome and the content carries `resolution_presentation`; otherwise the debrief as before. `app/resolution.ts` is a read-only view-model: it reads `state.mission.completed`, the outcome's presentation fields, and the trust changes already in the log. Nothing is applied, replayed or re-derived; a loaded completed save lands on the debrief / planning as before; the debrief's **REVIEW THE RESULT** key shows the cards again.
- **Card 1:** the outcome's plate under `rgba(4,21,26,.7)`; `resolution_presentation.heading`; the tier in the hero face at the title scale (`240.594 design px` — FAILURE's size in the 0.75 study — scaled with the frame; the e2e case measures it); the outcome title; the result line. The alternate-history lamp renders at the top left with its run state (lit on the earlier route, not on the later).
- **Card 2:** the same plate under `rgba(4,21,26,.82)`; `relationships_heading`; one tile per person whose trust changed. **Delta** = trust at scenario completion (the last `adjust` before the `finalize` entry; the initial-ledger value, 0 when unseeded, if none) − the initial ledger's trust — so a later plan could never move the row even if one adjusted trust (none does). Positive → `portraits.neutral` + `trust_up`; negative → `portraits.concerned` + `trust_down`; zero → absent (the `by: 0` adjustments on the coordinated pickup and the prompt later response are not changes). Order: `debrief_layout.controllers` then `.astronauts` = Voss, Reed, Armstrong, Scott, Cunningham, Stafford. Tiles: portrait (3:4, contain, `clamp(120px, 22vh, 240px)`), the name, the change in words (green for up, cream for down; the words carry the meaning). Six in one row at 1920×1080 default text; two rows of three at ≤ 1500 px or enlarged text; a missing pair falls back to the name and the change. If nobody changed, card 2 is omitted (the unit test proves the path on a trimmed log; no route in 0.5.2 leaves everyone unchanged).
- **Keys:** CONTINUE (result → relationships → debrief), SKIP TO DEBRIEF on card 1 when card 2 exists, the sound control. Reduced motion: no animation is used on the cards, so cuts by construction.
- **Tiers:** only those an outcome uses render (SUCCESS / MIXED / COSTLY, 2 / 1 / 0 by grade); FAILURE and LOSS are in the enum and never rendered; `tiers[].meaning` is not rendered (§8).

## 5. Part 4 — Historical participants and expression pairs

At `g8-accountability-brief` and `g8-accountability-decision` the node's `participants[]` render inside the conversation panel after the narration as a row of figures: the character's console portrait (`characters[id].portrait`, which is the neutral one for the four astronauts) and the content's label as the caption (`NEIL ARMSTRONG — COMMAND PILOT`, …), in a `.participant` tile styled like the controllers' line tiles, with no `.what`, no quotation marks, no answer, and no large "active speaker" portrait (nobody speaks here). Their positions stay in the context card in the Evidence panel. 96×128 portraits at ≥ 1500 px, 84×112 below; the row wraps. The controllers keep their console portraits everywhere; the neutral / concerned pairs of Voss and Reed are used only on the resolution card. Every id resolves through the manifest; no filename is built.

## 6. Part 5 — Hints

No code: M00c's strip reads `node.hint` when idle on a decision, and 0.5.2 supplies the text on all four decisions (`g8-rule-decision`, `g8-return-brief`, `g8-lesson-decision`, `g8-accountability-decision`). The unit test checks each renders in the strip above the cards only when idle, hints on and motion allowed; the e2e case sees the rule decision's hint after 30 s under fake timers at both viewports and text sizes, cleared by a key, absent under HINTS: HIDE, and never in the log.

## 7. Part 6 — Checks, sheet, docs

- `npm test`: 129 tests across 14 files — new `tests/core/presentation-m01.test.ts` (the prologue's plates, layer placement and motion data, the scenario card, the crossfade markup, reduced motion; the resolution view on every route and stance, the completion snapshot, card 2 omitted, FAILURE / LOSS never rendered, the cards' markup, the fallback tile, read-only rendering; participants at both nodes and nowhere else, the controllers' portraits unchanged; the History note and About's H9 / H10; every hint) beside Codex's `presentation.test.ts`; updated M00c, audio and sheet tests.
- `npm run test:e2e`: 37 tests — the AC-12 set carried through the prologue (the keyboard walks it; reduced motion is static; the idle, audio and save cases pass through Skip Prologue; the console set adds the participants and skips the cards), and `tests/e2e/m01.spec.ts`: the prologue's five beats and scenario card at both viewports and text sizes (captions from the content, the layer's placement and opacity, its animation's duration / easing / fill, the measured move from → to and the hold, the crossfade gone before each shot, the dissolve, every room check after it, the History note); Skip Prologue → card → the room once under three rapid clicks and an Enter (fake clock), Continue and Load without the prologue, the panel's new campaign with it; the resolution cards on SUCCESS / MIXED / COSTLY of the earlier route with ground accountability at both viewports and sizes, and of the later route with crew blame (all six relationships changed, Armstrong and Scott concerned), every tile's face and label against the run's own ledger, zero-change people absent, the tier's size, the lamp, revisit from the debrief, the log and state unchanged; the hint strip under fake timers at both viewports and sizes; the replay byte-identical with every stage viewed and with every stage skipped.
- **Contrast** (the plate screens are measured against the composited background and moving layers at their opacity, then the overlay and the text backdrop; every kit control at its legend). At the 152 screenshot points: 949 text samples (worst 5.38:1, `.menu-subtitle`, unchanged from M00c) and 1234 rendered controls (worst 5.58:1, the disabled plan key, unchanged). The new screens:

| Screens | Shots | Text samples | Worst text | Controls | Worst control |
|---|---|---|---|---|---|
| Prologue plates (30–34) | 20 | 40 | 16.66:1 (`.pl-caption`, program plate, 1366×768) | 60 | 6.70:1 (CONTINUE, 1366×768 enlarged) |
| Scenario card (35) | 4 | 16 | 12.52:1 (`.pl-date`, 1366×768) | 8 | 6.93:1 (SOUND) |
| Result cards (40–43) | 15 | 60 | 12.78:1 (`.res-heading`) | 57 | 6.70:1 (CONTINUE) |
| Relationship cards (40–43) | 15 | 56 | 12.44:1 (`.res-change.up`, the green "Trust up") | 42 | 6.93:1 (SOUND) |
| Accountability brief with participants (19a) | 4 | 52 | 5.48:1 (the panel's header label, as before); the participant labels 9.41:1 at worst | 80 | 6.70:1 (TAKE A POSITION) |
| Post-flight decision with participants (19) | 4 | 67 | 5.48:1 (the header label, as before) | 84 | 6.93:1 (BINDER) |
| Hint strip (23) | 4 | 54 | 6.39:1 (a card's Details summary, as before); the strip itself 11.88:1 | 44 | 6.93:1 (BINDER) |
| History note (07b) | 1 | 9 | 7.70:1 (the scene title); the note 13.32:1 | 8 | 6.94:1 (BINDER) |

  The tightest layout is enlarged text at 1366×768 on the accountability brief: the four participant tiles narrow to 6.3 rem so all four faces stay on one row (the e2e case asserts it), and the relationship card wraps its tiles to rows of three.
- **Screenshots** (in the zip): each prologue stage and the scenario card (`30`–`35`), both resolution cards for the three tiers (`40`–`42`, plus the later route's `43` at 1920×1080), the accountability brief with the participants (`19a`) and the post-flight decision (`19`), the hint strip (`23`), the History note (`07b`), at 1920×1080 and 1366×768, default and enlarged text.
- `npm run dialogue-sheet` regenerated and committed: 688 strings (219 branch-only): prologue titles and captions (`prologue.title`, `prologue.caption`), the scenario card's fields (`scenario.*`; the mission and scenario names dedupe to the opening's rows), the History note (`history.note`), the tiers, result lines and relationship rows (`outcome.tier`, `outcome.result_line`, `relationship.name`, `relationship.change`, `resolution.heading`), the hints (`decision.hint`) and the participant labels (`participant.label`). The exact-text assertions were updated; the 7 unreachable content strings are the M00b ones.
- README: the prologue and scenario card, the resolution cards, the participants, the hints, H9–H10 and F11, the prologue cue, the saves note updated to 0.5.2.

## 8. Decisions in this pass that Dan may reverse

- The Save / Load panel's START A NEW CAMPAIGN runs the prologue too (it is a new campaign); only Continue, Load and Import skip it.
- The caption backdrop is a solid translucent box with a feathered edge rather than a pure gradient, so the contrast check can measure it; its alpha (0.84) is one CSS value.
- The tier word is exactly the hero title's FAILURE size (240.594 design px); the plate headings are 60 design px in the hero face (clamped to 1.5–4 rem), a size chosen to fit the text area, since "the ×0.75 scale" of a hero row would not.
- The room bed keeps running under the resolution cards (as it does under the debrief) rather than dipping out and back in.
- The debrief gained a REVIEW THE RESULT key so the cards can be revisited (read-only); `tiers[].meaning` is not shown anywhere — it reads as a reviewer's note; say if it should appear (a tooltip on the tier, or About).
- The idle highlight applies to the prologue's and the cards' Continue keys like every continuation (M00c's rule).

## 9. Open questions

- Playtest 3 decides the prologue's pace by eye: the layer motions (20–24 s), the 450 / 700 ms fades and the caption box are numbers in the content and the CSS.
- Per Aspera's start stays on the post-flight brief (28 §6); moving it to the result card is one trigger in the music map once Dan has heard it.
- Post-flight dress on the astronaut portraits (29 §4) is Codex's call if Dan wants a second pair; the renderer reads `portrait` per scene already.
