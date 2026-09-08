# Playtest 2 — findings, triage and next tasks

**From:** Claude · **To:** Dan, Codex, Claude Code · **Date:** 7 September 2026 · **Build:** FNO-M00b, commit `223a6cb`, content 0.5.1.

## 1. Dan's notes, verbatim

1. Start with the sound on when clicking begin by default.
2. On the dedication screen, make the dedication auto-scroll up the screen, not have a scroll bar.
3. The credits, and then the disclaimers should be one continuous scroll, not separated by clicking continue.
4. If the player does not click continue, the title screen fades in after the credits and disclaimers scroll finishes into black. If the player clicks continue, the title screen immediately fades in (quickly).
5. The title should be 25% smaller.
6. There should be an instruction on the menu screen saying the game works best in full screen mode, F11 on Windows keyboards.
7. The scenario should begin with a fade-in sequence, giving the Mission briefing (background of the mission. Minimal animation - Static background with moving element - a brief background of the Gemini program, intro to the Astronauts on the mission, the launch of the Titan rocket, the docking of Gemini rocket, and then the inflection point - which sets up the scenario at hand.) The next sequence is the same with each scenario: after the mission briefing, the scene changes to the front of the Johnson Space Center) with the date, and below that, the Mission and name of the scenario. The scene then fades and resolves to the opening background.
8. To help the player, if they do not advance to the next screen after 30 seconds, the button to continue highlights (in a muted highlight color) to indicate the next move. If it is a choice, offer a hint, this can be toggled (hide hints / show hints).
9. Replace the Mission in Danger track with the Mission in Danger Drum Background and lower the volume by 25%.
10. The badge layers on top of the card, it should be behind it.
11. "Require every report to separate confirmed observations from information still missing." This wording is unclear what it means.
12. The Details on the cards should be unhidden by default.
13. When the Criticism choices come up, display the headshot illustrations of the astronauts in the same manner that Voss and Reed are displayed.
14. Don't display the Report, procedure, and departure references, and the Fiction register. These are game mechanics. The other items on the history panel are good.

Claude's two observations from the build review, confirmed by Dan's screenshot: the conversation panel on the return decision shows both a vertical and a horizontal scrollbar, and Glen's question keys sit below its fold at 1920×1080; the rehearsal readout appears twice on that screen (under Glen's question and again under "Supported by").

## 2. Rulings these notes change

These supersede the earlier direction where they conflict; nothing else in 07, 18, 19, 20 changes.

- **Audio default (20 §3):** the master is **on** after Begin. Begin is the explicit player interaction that browsers require, so autoplay policy is satisfied; the SOUND key still turns it off, and the setting persists.
- **Opening flow (18, revised 07):** dedication and notices are **one continuous auto-scroll** with visual space between them, no Continue between chapters, no visible scrollbar. When the scroll runs out it fades to black and the hero title fades in; Continue at any point cuts short with a quick fade to the title. Pause and Skip remain. Reduced motion: static pages with Continue, as before.
- **Details (16 §3 item 3):** open by default on every card. The toggle stays.
- **History panel (19 §6):** the per-item provenance lines (report, procedure and departure references) and the fiction register are **not displayed** in History. They stay in the content, the dialogue sheet, the README and About → Sources; the sources list H1–H8 and the lamp explanation stay in History.
- **Hero title:** 25 % smaller than study A (multiply `title-layout.json` study `a` sizes by 0.75: FAILURE ≈ 241 px, IS NOT AN ≈ 202 px, OPTION ≈ 271 px, same left edge and baselines proportionally). The menu lockup keeps its present ratio to the hero (0.826).

## 3. Triage

| # | Owner | Task | Size |
|---|---|---|---|
| 1 | Claude Code | master gain on after Begin | trivial |
| 2, 3, 4 | Claude Code | single continuous scroll, hidden scrollbar, fade-to-black → title fade-in (≈1.5 s), Continue → quick fade (≈0.4 s) | small |
| 5 | Claude Code | scale factor 0.75 on the hero title | trivial |
| 6 | Claude Code | one line under the menu keys: "Best played full screen — press F11 on Windows." plus a FULL SCREEN key (Fullscreen API; hidden if the browser refuses) | small |
| 7 | **Codex** (treatment + captions + plates) then Claude Code (player) | **Mission briefing prologue** — §4 | M01-sized |
| 8 | Claude Code (timer, highlight, toggle) + **Codex** (hint text) | idle-30 s highlight on the continuation; decision hints from a new optional `hint` field — §5 | small + content |
| 9 | Claude Code | swap the crisis cue to *Mission in Danger Drum Background* (2:06, −17.1 LUFS), cue gain 0.75; add to manifest and README | trivial |
| 10 | Claude Code | emblem overlay drawn beneath the UI layer (it belongs to the room composite, not above panels) | trivial |
| 11 | **Codex** | reword the `g8-adopt-provenance` intent; Claude's suggestion: "Make every report say what's been confirmed and what's still unknown." Dan clears it on the sheet | content 0.5.2 |
| 12 | Claude Code | Details open by default everywhere | trivial |
| 13 | **Codex** (portraits + content field) then Claude Code (render) | astronaut portraits at the accountability decision — §6 | small art + content 0.5.2 |
| 14 | Claude Code | hide provenance reference lines and the fiction register in History | trivial |
| — | Claude Code | conversation panel: no horizontal scrollbar; size so Glen's question keys are visible without scrolling at 1920×1080 and 1366×768; show the rehearsal readout once (drop the prompt-line copy when Details is open) | small |

Claude Code's items go out as **FNO-M00c** now (handoff zip beside this doc); they need no new content. Items 7, 8 (hint text), 11 and 13 need Codex first.

## 4. The mission briefing prologue (note 7) — for Codex to treat

Dan's outline is the spec. Structure, so the pieces line up across content, art and code:

1. **Mission briefing** — a sequence of plates, each a static background with one moving element, each with a short caption (two or three sentences, plain language, contractions, historical caution per 12: label what is interpretation, delete nothing). Beats: the Gemini program in brief; the crew (Armstrong and Scott, from the v003 sheets); the Titan II launch, 16 March 1966; rendezvous and docking with the Agena target vehicle; the inflection point that sets up the scenario (the docked spacecraft, the room about to lose contact) — ending before the first playable screen so the game's own docking report still lands.
2. **Scenario card** — the same every scenario: the front of the Houston facility, the date, and beneath it the mission and the scenario name ("Gemini VIII — The Weight of the Call"). Fades and resolves into the room.

**One historical-caution flag for Dan.** In March 1966 the Houston facility was the **Manned Spacecraft Center**; it was renamed the Lyndon B. Johnson Space Center in 1973. The caption should read "Manned Spacecraft Center, Houston" for Gemini and Apollo-era scenarios (the building's front is the same). If you'd rather keep "Johnson Space Center" as the name players know, say so; either way the History panel can carry the one-line note.

**Deliverable from Codex:** a treatment doc (like 07) with the caption text as content — a `prologue` block in the mission JSON: ordered plates, each `{ id, background asset, moving-element asset (PNG with alpha) + motion (drift / rise / pan, direction, seconds), caption, sources }` — plus the plates at 1920×1080 in the room's illustrated hand, the moving elements as separate layers, and the facility plate. No NASA marks (09). Reduced motion: static plates, click-through. The player is Claude Code's, in M01, using the opening's stage machinery (player-paced, Continue, Skip, no countdown, Orbit of Hope under it until the archival montage exists).

## 5. Idle help and hints (note 8)

Presentation only; nothing enters the log or the replay. After 30 s without an input on any screen, the current continuation key takes a muted highlight (kit selected-face at reduced contrast, steady, no pulse under reduced motion). On a decision screen, a hint line appears above the cards instead. Hints come from a new optional `hint` string on decision nodes (content 0.5.2): procedural, never a recommendation between options — e.g. "Ask Glen's questions and read each card's risk before you choose." — consistent with the lamps-are-not-recommendations rule. Settings gets "Hints: show / hide" (default show; persists). Any input clears the highlight and restarts the timer.

## 6. Astronaut portraits at the accountability decision (note 13)

The v003 sheets already include Armstrong, Scott, Cunningham and Stafford. Codex cuts four 768×1024 RGBA neutral portraits to the same contract as the controller portraits (M00a art drop) and adds them to the manifest; content 0.5.2 lists them on `g8-accountability-brief` as `participants` (id + label, e.g. "WALT CUNNINGHAM — ASTRONAUT OFFICE") so the conversation panel shows them the way it shows Voss and Reed.

**Second caution flag for Dan.** Voss and Reed are fictional and speak lines; these four are real people. Showing their portraits beside the existing context card (which summarises their positions as attributed, not quoted) keeps the game inside the rule already set for H5: no invented quotations. If you want them to *speak* — a paraphrased position as a line under each portrait — that's a step Codex should take only on your explicit say-so, and each line would carry "attributed position, not a quotation" in History.

## 7. Next

1. Dan: rule on the two flags (§4 facility name; §6 speak or not), and clear the reworded lesson intent when 0.5.2 arrives.
2. Claude Code: FNO-M00c (zip beside this doc).
3. Codex: content 0.5.2 (notes 11, 13 field, 8 hints; regenerate sheet) + astronaut portraits + prologue treatment and plates (note 7).
4. Claude Code: M01 = prologue player + portraits + hints text + camera states (14) + equipment (M01 reference) once Codex's pieces land.
