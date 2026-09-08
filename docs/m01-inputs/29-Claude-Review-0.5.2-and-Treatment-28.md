# Review — Content 0.5.2 and treatment 28

**From:** Claude · **To:** Dan and Codex · **Date:** 7 September 2026 · **Reviews:** `FNO-M00-Codex-Content-v0.5.2.zip` and `28-Prologue-and-Resolution-Treatment.md` against 26 and 27.

## 1. Verdict

Accepted as the M01 content and art baseline, subject to Dan's clearance of the 0.5.2 sheet and the plates. Everything 27 §3 asked for is present, and the two rulings in 27 §1 are honoured exactly: the facility caption is "Manned Spacecraft Center, Houston" with the 1973 renaming as a History note (H10), and the four astronauts appear as portraits with name-and-role labels and no speech. The M01 handoff (`FNO-M01-INPUTS.zip`) is written against this packet.

## 2. Integrity

`FILES.sha256`: 83 entries, all OK. 22 new PNGs: 12 portraits at 768×1024 RGBA (Armstrong, Scott, Cunningham, Stafford, Voss, Reed × neutral/concerned), 8 backgrounds/plates at 1920×1080 RGB, 2 moving layers at 1920×1080 RGBA. Fingerprint `250a1244…d780`. Codex reports 56 routes / 6 outcomes / 112 plan commits / 0 draws / 103 tests, mechanics unchanged against frozen 0.5.1 — to be re-run by Claude Code at integration. Patch baseline is M00b `223a6cb`; Claude Code merges over M00c, not the reverse.

## 3. Content

- **Hints** on all four decision nodes are procedural ("Ask Glen's questions and read each card's risks before choosing a return opportunity."); none recommends an option. Pass.
- **Lesson intent** now reads "Make every report say what's been confirmed and what's still unknown." (Dan's note 11). For Dan's sheet pass.
- **Participants** on both accountability nodes: NEIL ARMSTRONG — COMMAND PILOT, DAVID SCOTT — PILOT, WALT CUNNINGHAM — ASTRONAUT OFFICE, TOM STAFFORD — ASTRONAUT OFFICE. No lines. Pass.
- **Tiers:** SUCCESS (earlier-2, later-2), MIXED (earlier-1, later-1), COSTLY (earlier-0, later-0) — Codex took the fourth-tier option from 27 §2; FAILURE and LOSS reserved. Result lines are plain and say the mission still ended early on the SUCCESS routes, which keeps "success" honest. Pass.
- **Prologue captions** (five beats): plain, contractions, chronologically right (Agena first, then the Titan II from Cape Kennedy; first docking of two spacecraft in orbit; Scott's planned EVA). The inflection caption sets up the communications gap without revealing the crisis. The scenario card carries the context line "Earlier that day — mission preparation" so the jump back to rehearsals is explicit — a good catch by Codex, since the playable sequence starts before the docking the prologue ends on.
- New registry entries H9 (Gemini program context), H10 (MSC renaming), F11 (illustrated presentation register). Standing rules hold: no fiction call-outs in play text; F11 lives in History/About only.

Two wording items for Dan's sheet pass, not blockers: the relationship card heading "THE ROOM REMEMBERS" is more literary than anything else on screen (alternative: "STANDING WITH THE ROOM" or plain "RELATIONSHIPS"); and the result heading "RECOVERY RESULT" is fine.

## 4. Art

Plates read in the room's hand and carry no marks. Resolution plates make the tier visible without a word: warm evening deck for SUCCESS, storm-grey for MIXED, dark deck with empty chairs and blankets for COSTLY; hatches open, crew already aboard — consistent with every M00 outcome recovering the crew. The two moving layers are properly transparent (the haze exported with luminance alpha, so no rectangular cloud).

Three observations for Dan, none blocking:

1. **Post-flight dress.** Armstrong, Scott and Stafford are in pressure suits, Cunningham in a jacket and tie. The accountability scene is post-flight, so suits are a stretch; the same portraits serve the prologue crew beat where suits are right. If it bothers you, Codex can cut a second pair in shirt-and-tie for the accountability scene later; the runtime already supports per-scene portrait ids.
2. **Facility plate** is an illustrated interpretation (a low office block and a windowless high-bay), not the MSC campus as built; H10's note says so. Acceptable under the caution rules; say if you want it closer to the real Building 1 silhouette.
3. **Launch plate**: check the Titan II GLV silhouette against the equipment sheet when you look — at contact-sheet size it reads right, and the equipment reference was used in generation.

## 5. Treatment 28 — what Claude Code builds (carried into the M01 handoff)

Prologue after New Campaign only (not on Continue/Load); five plates + scenario card, each a background plus one moving layer animated once, linearly, from `motion.from` to `motion.to` over the stated seconds, then held; ~450 ms fades between plates, 700 ms into the room; captions and controls as live text over a left text area with a gentle dark gradient; Continue always available; Skip Prologue goes to the scenario card; reduced motion = static `from` composition and cuts; Orbit of Hope runs under it uninterrupted. Resolution: two cards after the outcome record (result: plate + heading + tier in the hero face + outcome title + result line; relationships: darker overlay, only characters whose trust changed, neutral for up / concerned for down, "Trust up"/"Trust down" as words, fixed order Voss, Reed, Armstrong, Scott, Cunningham, Stafford), then the existing debrief; nothing on these cards touches the run. Participants rendered as portrait + label at both accountability nodes. Hints read from content by the M00c idle helper.

## 6. Scope note

M01 = prologue player, resolution cards, participants, expression pairs, hints text, About/Sources H9–H10. Camera states (doc 14) and equipment runtime use move to **M02**, so M01 stays one bounded pass. Per Aspera stays on the post-flight brief; moving it to the resolution card is a number in the music map after Dan hears it.
