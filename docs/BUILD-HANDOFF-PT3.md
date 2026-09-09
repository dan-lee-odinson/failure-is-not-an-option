# FNO-PT3 — build handoff

**Status:** DONE. Content 0.5.5 integrated; the runtime half of ruling R2 (nothing in the Evidence list, the Binder or the History panel before the player has met it in play, every addition cued); ruling R1 (sound on by default); the playtest-3 presentation notes 2, 3, 4, 5 and 8. Two commits on `main` (the content packet, then the runtime), pushed once with everything green.

| | |
|---|---|
| Task | FNO-PT3 (doc 49 — Dan's notes, Claude's triage, rulings R1 and R2, binding; Codex's content 0.5.5 packet, sha256 `f3b963f6…`, and doc 50) |
| Baseline | `423e1ec` (HOTFIX-01, live) |
| Content commit | `4784f41` — "Content 0.5.5" (the packet against 423e1ec; baseline hashes checked against the git blobs; the regenerated sheet byte-identical to the packet's) |
| Delivery commit | *(filled in the zip copy)* |
| Content | **0.5.5**, fingerprint `4c22b8e7949ba84df3799d692dcec360391919b5b18936e9c141991883efff2d`; validate 56 routes / 6 outcomes / 112 plan commits / 0 draws; the sheet regenerated after the renderer changes |
| Unit tests | 306 in 20 files (Codex's 145 new 0.5.5 cases, the new `unlocks.test.ts`, the History and evidence cases moved to the gate); typecheck clean; fail-on-purpose 11 of 11 (two new plants: a record without `unlocked_by`, an unlock naming a line no line carries) |
| Browser tests | 72 Playwright cases pass (the 64 existing, updated for R1 / R2, plus `pt3.spec.ts`); replay byte-identical (m01 and m02 replay cases; the R2 walk compares the log before and after a save / reload) |
| Release check | OK on the built `dist/` |
| Deploy | Pages run: *(recorded in the zip copy)* · Live bundle: *(recorded in the zip copy)* |

## Part 1 — content 0.5.5

Applied once from the repository root at `423e1ec`; `integration/baseline-hashes.json` matched the git blobs of the 20 existing paths (7 new); validate, typecheck and Codex's 299 tests passed on the patch alone; `npm run dialogue-sheet` reproduced the packet's sheet byte for byte. The packet's handoff, validation, audit, patch metadata and test results are under `docs/codex-content-0.5.5/`, docs 49 and 50 under `docs/pt3-inputs/`.

Verified per Part 2 g: each preparation worksheet unlocks with its own option — `g8-ev-contact-worksheet` → `g8-prep-contact`, `g8-ev-recovery-worksheet` → `g8-prep-recovery`, `g8-ev-systems-worksheet` → `g8-prep-systems` (the packet's table only repeats the menu text in the presenting-line column; the JSON is right, and `unlocks.test.ts` proves each drill appears with its own rehearsal and never without it).

## Part 2 — R2: the engine and the presentation

**a. Encounters** (`core/unlocks.ts`, new). What the player has met is derived from the run's recorded inputs alone: the inputs are replayed through the engine on a scratch run and, at every input boundary, the presented node, the lines it actually displayed under their conditions (for an event, only the selected resolution's lines), the answers actually asked, the preparations actually chosen and the speakers who spoke are recorded; cached per run and input count. Nothing mutates the run or adds a log entry, so a live run and a replayed save agree; the unit case compares the canonical log and state before and after, and the visible lists of the live run and of `replay(identity)`. `core/views.ts` adds `describeVisibleEvidence(run)` (acquired AND unlock met AND eligible under any `visible_when`), `unlockedEvidenceIds`, `visibleProcedures` (adopted AND unlock met) and `describeHistory`. The original acquisition effects are untouched: the rule and the primer are still acquired at the briefing, the planning reports at Return Planning; they are simply not shown.

**b. Citation links.** `LineView.cites` and `OptionView.evidence` now carry only unlocked items; the acquired-but-locked primer and rule that the preparation options cite, and the air / reserve cards the automatic planning lines cite, are absent (not greyed) until their own scene or answer. (The renderer draws no citation links today; the view models are where the sheet and any future rendering read them.)

**c. History** (`describeHistory`; `renderHistory`). The panel shows what play has presented: the alternate-history explanation once play has left the record (the marked phase entered — the earlier return) or after the mission; the facility note once the prologue's plates were walked with Continue (a per-player flag, `fno.prologueSeen`; Skip does not set it, and a run existing is no longer enough); the CAPCOM note once a historical person has spoken a displayed line (Lovell's docking relay); each registry source's title once something displayed cites it — a visible evidence item's provenance, a displayed line's provenance, the prologue (if walked), the debrief paragraphs (after the mission) — and every source after the mission; a source's note only after the mission, except a source only the prologue cites (H10, the renaming), whose note comes with the walked plates. Before anything is cited the panel shows the lamp sentence and "Sources appear here as the mission meets them." No registry dump at mission start; H5's note and the five post-flight positions come after `g8-line-postflight-context` (the accountability brief), the notes at the debrief.

**d. The cue** (`refreshCues` in `app/main.ts`; `renderCueStrip`). At every paint the current visible lists are compared with the last paint of the same run; whatever appeared is announced once: the EVIDENCE · n key (stacked) or the column's heading takes a one-second highlight (`k-tick` / `tick`), a strip under the status bar reads "Added to evidence: …", "Added to the binder: …" (reference pages and procedures) and "Added to History: …" with simultaneous arrivals grouped, and the live region reads the same text (appended to the scene's own announcement when both fire in one click). The next click clears it. A new or loaded run starts from what it already shows, so loading, reopening an overlay or a repaint never re-announces. Nothing here touches the run.

**e. Binder.** Procedures: adopted AND unlocked; reference pages: the visible reference evidence. Empty state: "Nothing adopted yet. Reference pages appear as the mission gives you them." (the packet's line).

**f. Validator.** The packet's `validateUnlocks` (required `unlocked_by`, unknown node / line / preparation targets, duplicate stable line ids) runs inside `npm run validate`; two planted faults in `npm run validate:fail` prove it fails on a record without `unlocked_by` and on an unlock naming a line no line carries.

**g.** See Part 1.

The stacked layout's EVIDENCE key and the overlay's title count the visible list; the debrief's post-flight context card is the visible one.

## Part 3 — the playtest-3 notes

1. **Sound on by default (R1).** `DEFAULT_AUDIO.enabled` is true and an unset `fno.audio` reads as on: SOUND: ON on the start screen, the film, the credits, the menu, the room, the prologue, the resolution. The first pointer or key gesture anywhere arms the audio context (`armAudio`, a capture listener; the Begin / Skip / menu rule is kept). The toggle from the unset / on state turns sound off and persists it; only a persisted off renders OFF; the volume slider is unchanged. Updated cases: the ac12 opening case, the ac12 audio case (renamed to the R1 wording), the m02 sound case, the phone walk (SOUND: ON before any gesture).
2. **Start screen.** The line "Best played full screen — press F11 on Windows" (the menu's `FULLSCREEN_LINE`) and a FULL SCREEN key beside SOUND, the menu key's action (`fullscreen-toggle`, the same Fullscreen API call), hidden when the API is unavailable or refused.
3. **The hand-over.** The film stage now paints the den (plate, beam, one smoke instance at their registry placements) beneath the letterboxed video (`denUnderlay`; the film frame is transparent, the video's own black covers its box). At 2:18.0 the video goes transparent in the frame of detection and is removed on the next animation frame, when the credits stage paints the same den with its live layers. `pt3.spec.ts` captures frames on the real file across the hand-over and asserts no frame differs from both its neighbours beyond a threshold and no frame is black or white; the frames are in the zip (`37-handover-*`).
4. **Resize during the credits.** The scroll position is kept in the wall's own pixels with the design unit it was measured at (`scrollPos` / `scrollUnit`); a resize or full screen in / out rescales it (`rescaleCredits`, from the resize event and after every repaint) so the same line stays on the wall and the timed scroll keeps running; a clamp the browser applies during the resize is not taken for a manual scroll. Test: 1920 → 1200 → 1920 mid-credits, the same first visible line, ±12 design px, still running at each size.
5. **Prologue lag.** The five prologue plates, their layers, the scenario card's plate and the room plate are preloaded and decoded from Begin (and from NEW CAMPAIGN); the resolution plates from the mission's last phase. A plate that is not yet decoded when painted is held at opacity 0 (`pl-pending`) and revealed by `img.decode()` — a fade from black instead of a partially loaded picture; a decoded plate keeps the crossfade. Test: the plates are requested during the opening; on a throttled network (CDP, 600 KB/s) the first plate is never shown incomplete.
8. **Asked questions.** An asked question's key is disabled, greyed like a closed card, carries a small ASKED stamp (the CHOSEN / ORDERED family) and leaves the focus order; when every question in a scene has been asked the row is gone and the answers stand in the body. Contrast sampled on the greyed key and its stamp.

## Part 4 — checks and evidence

`npm run validate`, `npm run validate:fail`, `npm run typecheck`, `npm test`, `npm run test:e2e`, `npm run build`, `npm run release-check`: transcripts under `evidence/`. Screenshots: the empty Binder and bare History at the briefing (30, 31), the unlock cue for a worksheet (32) and for the rule (33), History after the mission (34), the stacked cue (35), the start screen (36), the hand-over frames (37), the resized credits (38), the decoded plate (39), an asked question and the collapsed row (40, 41).

## Decisions taken here (reversible)

1. **Reference pages announce under the binder**, reports under evidence; the EVIDENCE · n key ticks for both (it counts both). One strip line per list, arrivals grouped.
2. **A source's note waits for the debrief** (or, for a prologue-only source, the walked plates). Codex's audit warns that a source cited early can carry a note about a later crisis (H1 at loss of contact names the stabilization and the return; H3 at docking the termination sequence); showing titles as they are cited and notes after the mission is the simplest scoped block that never spoils. After the mission every source appears, cited or not.
3. **The alternate-history explanation is gated on the record being left** (the marked phase entered), the condition its own wording describes; the lamp sentence is always there.
4. **The prologue-seen flag is per player, not per run** — a presentation flag, never in a save; a walked prologue in this browser counts for later runs and loads.
5. **`--credits-rate` and the rescale share the wall-pixel position**; the phone sheet's pace is untouched.

## Not changed

Mechanics, the film, the home page, content beyond the 0.5.5 patch. Content 0.5.5 and its fingerprint are the packet's.
