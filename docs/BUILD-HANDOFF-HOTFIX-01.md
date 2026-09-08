# FNO-HOTFIX-01 — build handoff

**Status:** DONE. A phone-width layout for the mission screens, presentation only: Codex's live-site findings FNO-LIVE-01 (clipped dialogue) and FNO-LIVE-02 (toolbar overflow) are fixed, every other screen was swept at 320 / 390 / 430 px in both text sizes and fixed where it overflowed or clipped, and a new browser suite keeps it so. One commit on `main`, pushed once with everything green.

| | |
|---|---|
| Task | FNO-HOTFIX-01 (`FNO-HOTFIX-01-INPUTS.zip`, sha256 `2f7ad51c…`; direction `docs/47-Claude-Review-Codex-Live-QA-and-Hotfix-01.md` §2, binding; Codex's `qa/REVIEW.md` and `followup-observations.json`) |
| Baseline | `544fc65` (FNO-LICENCE record; content 0.5.4, licences in force) |
| Delivery commit | *(filled in the zip copy)* |
| Changed | `app/styles.css` (the phone-width block at the end, the query container on the conversation panel, three card grids), `app/main.ts` (one line: the credits' pace may come from a CSS variable), `tests/e2e/phone.spec.ts` (new), this record. No content, no mechanics, no audio, no film, no home page. |
| Content | 0.5.4, fingerprint unchanged `972c425aa13fb98ce282c0a13f9ea0d1b23721e741fa48ad7dc0d6b493a130bf`; validate 56 / 6 / 112 / 0 |
| Unit tests | 154 in 18 files; typecheck clean |
| Browser tests | 64 Playwright cases pass (the 58 existing suites unchanged — 768 / 1024 / 1366 both text sizes / 1920 — plus the 6 phone runs); replay byte-identical (m01 and m02 replay cases) |
| Release check | OK on the built `dist/` |
| Deploy | Pages run: *(recorded in the zip copy)* · Live bundle: *(recorded in the zip copy)* |

## 1. Reproduction (before)

`tests/e2e/phone.spec.ts` was written first and run against `544fc65` (`evidence/playwright-phone-before.txt`, `screenshots/before/`). It reproduced both findings exactly as Codex measured them on the live site: at 390 px default text on Return Planning, 27 findings — the document 409 px wide, the answers' dialogue columns 40 px and 24 px wide with their text 54–99 px, the decision cards out to 409 px, the status text given 0 px of the row; at 430 px, 10 (default) and 32 (enlarged) findings on the same screen; at 320 px the line portraits sat at 334–342 px, past the viewport. Root cause as doc 47 §1 says: the M02 stacked layout kept the side portrait and the one-row toolbar at every width.

## 2. What changed (doc 47 §2)

**A. The conversation (FNO-LIVE-01).** The conversation panel is now a CSS query container (`container: conv / inline-size` on `.conversation`; a container cannot style itself, which is why the panel and not the body carries it). Below a 540 px panel — the body under about 500 px: a phone, or a squeezed column at any viewport — the body drops to one column, the active speaker becomes a compact header above the lines (a 96 px portrait with the name beside it, `position: static`), each line's portrait shrinks to 40 × 53 px beside full-width text, and `overflow-wrap: break-word` on the names, the lines, the narration and the answers means a word that cannot fit breaks rather than clips. The rules name the stacked and enlarged-text selectors explicitly so they win at every text size and in both layouts. Widths above 540 px (1366 × 768 enlarged, the 1100–1500 px column layout) are unchanged.

**B. The toolbar (FNO-LIVE-02).** Below 600 px the status bar wraps: the status text (mission, phase, time, contact, the attention dots and the mode lamp) takes a full-width row; the key row wraps onto as many rows as it needs, the keys filling each row at a 40 px minimum height; nothing extends past the viewport at 320 px in either text size. The stacked layout's `flex-wrap: nowrap` and inflexible key widths are overridden at this width only.

**C. The sweep.** Every screen at 320, 390 and 430 px × default and enlarged (41 screens per run, 246 clean cells after the fix; the table below is `artifacts/phone-sweep/*.json`). Found and fixed on the way:

- *Decision cards and plan tiles* — the card grid's 19 rem minimum track was wider than a 320 px strip (the cards ran to 409 px at 390): the tracks are now `minmax(min(19rem, 100%), 1fr)` (also the 17 rem plan tiles and the 14 rem people grid).
- *Prologue plates, the scenario card, the resolution cards* — the 16:9 design frame at a portrait phone put the copy in a 139 px box over the picture (its words broke and scrolled): below 600 px the frame sits at the top of the screen at full width, the copy sits below the picture across the width in its own scrolling box, the tier row wraps so the ⓘ key stays inside, the relationship figures go two to a row. The frame, its layers and the crossfade are untouched above 600 px.
- *The opening credits after Skip* — the wall's ink was 4.5 px tall on a phone: below 600 px the den picture stays 16:9 at the top, the beam and smoke (unreadable at that size) are hidden, and the credits scroll on a paper sheet below the picture at 1 rem (1.1 rem enlarged); the timed scroll keeps the wall's pace in lines per second through a CSS variable (`--credits-rate`, read by `driveProseScroll`, the one line changed in `app/main.ts`); Pause, manual scrolling, Continue and the run-out are the same code.
- *The menu* — the title lockup was cropped to its middle on a phone and the enlarged keys could push NEW CAMPAIGN above the viewport: the lockup now spans the width at the top of the screen and the key block owns the rest, sitting at the bottom when there is room and scrolling when there is not.
- *About* — the 64-character fingerprint overflowed the overlay: `code` in an overlay wraps anywhere.
- *Settings* — the volume sliders overflowed a 320 px overlay: the slider rows wrap.
- *Save / Load* — the native file input (346 px) overflowed a 320 px overlay: it fits its overlay.
- *Participants* — the four astronaut tiles use 72 × 96 px portraits below 600 px.

Not changed, noted for Dan: the film itself letterboxes to the width (2:18 at 390 px is a 219 px tall picture), which is the film; the den picture above the phone credits is the same size. Both read as intended on a phone in landscape.

| Screen | 320 default | 320 large | 390 default | 390 large | 430 default | 430 large |
|---|---|---|---|---|---|---|
| `opening-static-credits` | clean | clean | clean | clean | clean | clean |
| `settings` | clean | clean | clean | clean | clean | clean |
| `menu` | clean | clean | clean | clean | clean | clean |
| `about` | clean | clean | clean | clean | clean | clean |
| `save-load` | clean | clean | clean | clean | clean | clean |
| `prologue-1` | clean | clean | clean | clean | clean | clean |
| `prologue-2` | clean | clean | clean | clean | clean | clean |
| `prologue-3` | clean | clean | clean | clean | clean | clean |
| `prologue-4` | clean | clean | clean | clean | clean | clean |
| `prologue-5` | clean | clean | clean | clean | clean | clean |
| `scenario-card` | clean | clean | clean | clean | clean | clean |
| `g8-brief` | clean | clean | clean | clean | clean | clean |
| `binder` | clean | clean | clean | clean | clean | clean |
| `history` | clean | clean | clean | clean | clean | clean |
| `save-load-console` | clean | clean | clean | clean | clean | clean |
| `settings-console` | clean | clean | clean | clean | clean | clean |
| `evidence-overlay` | clean | clean | clean | clean | clean | clean |
| `g8-prep-select` | clean | clean | clean | clean | clean | clean |
| `g8-docking-report` | clean | clean | clean | clean | clean | clean |
| `g8-loss-of-contact` | clean | clean | clean | clean | clean | clean |
| `g8-gap-note` | clean | clean | clean | clean | clean | clean |
| `g8-crisis-report` | clean | clean | clean | clean | clean | clean |
| `g8-stabilization-report` | clean | clean | clean | clean | clean | clean |
| `g8-rule-decision` | clean | clean | clean | clean | clean | clean |
| `g8-return-brief` | clean | clean | clean | clean | clean | clean |
| `evidence-overlay-return` | clean | clean | clean | clean | clean | clean |
| `g8-order-receipt` | clean | clean | clean | clean | clean | clean |
| `g8-ground-execution` | clean | clean | clean | clean | clean | clean |
| `g8-return-beat-1` | clean | clean | clean | clean | clean | clean |
| `g8-return-beat-2` | clean | clean | clean | clean | clean | clean |
| `g8-pickup-report` | clean | clean | clean | clean | clean | clean |
| `g8-relationship-response` | clean | clean | clean | clean | clean | clean |
| `g8-lesson-decision` | clean | clean | clean | clean | clean | clean |
| `g8-accountability-brief` | clean | clean | clean | clean | clean | clean |
| `g8-accountability-decision` | clean | clean | clean | clean | clean | clean |
| `g8-accountability-receipt` | clean | clean | clean | clean | clean | clean |
| `g8-accountability-response` | clean | clean | clean | clean | clean | clean |
| `resolution-result` | clean | clean | clean | clean | clean | clean |
| `resolution-relationships` | clean | clean | clean | clean | clean | clean |
| `debrief` | clean | clean | clean | clean | clean | clean |
| `planning` | clean | clean | clean | clean | clean | clean |

**D. Tests.** `tests/e2e/phone.spec.ts`: for each of 320 / 390 / 430 × default / enlarged, one walk through the opening's static credits, the menu and its overlays, the five prologue plates and the scenario card, a full route with every question asked (the Binder, History, Save / Load, Settings and Evidence overlays from the toolbar on the way), the resolution cards, the debrief and the IX-A planning. On every screen: the document does not scroll horizontally; no element's right edge is past the viewport (the room plate, the design-frame scenes and the hero lockup excepted, as they are meant to bleed); every element with its own text fits its box (`scrollWidth ≤ clientWidth`) and is inside every overflow ancestor; the toolbar keys are inside the viewport and at least 40 px tall; the mode lamp is visible; the status text has at least half the width. The briefing, Return Planning, the criticism scene (the accountability brief with the four astronauts) and the result card are asserted by name (doc 47 §2 D) and then every screen; a screenshot per screen; the per-screen findings to `artifacts/phone-sweep/`. At 390 the contrast samplers run on every room screen and plate. The existing suites cover 768 / 1024 / 1366 (both text sizes) / 1920 unchanged.

**E. Rules.** CSS plus one line of `main.ts`; nothing enters the log (the m01 and m02 replay cases pass byte-identical); content 0.5.4 and its fingerprint unchanged; one commit, pushed once after validate / typecheck / test / test:e2e / build / release-check were all green; the Pages run and the live bundle confirmed (`evidence/gh-runs.txt`, `evidence/live-check.txt`).

## 3. For Codex's next QA drop

The finding ids stay FNO-LIVE-01 and FNO-LIVE-02 through this fix (doc 47 §3); `tests/e2e/phone.spec.ts` is the regression suite for both, and any further phone finding can be added as a screen or a check there.
