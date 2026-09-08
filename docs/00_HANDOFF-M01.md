# FNO-M01 — Prologue, resolution cards, historical participants (content 0.5.2)

**Task id:** FNO-M01 · **From:** Claude (Cowork) for Dan · **To:** Claude Code · **Date:** 7 September 2026
**Repo:** `C:\Users\wolfe\projects\failure-is-not-an-option`, `main`. **Baseline: the FNO-M00c delivery commit.** If M00c has not been run yet, run `SHARED\FNO-M00c-INPUTS.zip` first and deliver it, then start this task from its commit. Do not start M01 from `223a6cb`.
**Shared folder:** `C:\Users\wolfe\Documents\Claude_GPT_Shared_Workflow\Failure-is-Not-an-Option` = `SHARED\`.
**Deliverable:** commits on `main` + `SHARED\FNO-M01-BUILD.zip` (same shape as M00b: `00_BUILD.md`, evidence, screenshots, regenerated sheet). Nothing else written into `SHARED\`.

**Read in this order:** `content-0.5.2/00_HANDOFF.md` → `docs/28-Prologue-and-Resolution-Treatment.md` (the spec; its JSON field names are authoritative) → `docs/29-…` §5–6 (what I've confirmed and the scope line) → `docs/27-…` (Dan's rulings) → `docs/26-…` §4–6 (origin of the asks). `docs/12-…` is the standing historical-caution rule.

Standing rules from M00b/M00c still apply: presentation never touches the simulation (no domain event, no log entry, replay byte-identical); no fiction call-outs in play text (History and About only); no source provenance in dialogue; label never delete; no NASA marks; images and audio only through the manifest; native controls with live text over kit faces; reduced motion = static and cuts; keyboard reachable; contrast ≥ 4.5:1 at both text sizes and both viewports.

## Part 1 — Content 0.5.2 integration

1. Codex's patch (`content-0.5.2/integration/content-0.5.2.patch`) is diffed against **M00b `223a6cb`**; your checkout is M00c. Check `integration/baseline-hashes.json`; merge by hand wherever M00c changed the same files (types, validator, sheet generator, tests). Never revert an M00c fix. `integration/files/` are reference snapshots, not replacements. No `app/` code is supplied — everything in Parts 2–5 is yours.
2. Copy the six `content/*.json`, the full `assets/manifest.json`, and the **22 new PNGs** from `content-0.5.2/assets/` (the packet deliberately omits the unchanged room, portraits, emblem, kit faces, fonts and audio — keep yours). Schema: new optional fields `decision.hint`, `node.participants[]`, `outcomes[].tier/result_line/plate`, `characters[].portraits.{neutral,concerned}`, `mission.prologue`, `mission.resolution_presentation`; registry gains H9, H10, F11.
3. Expected after integration: validate 56 / 6 / 112 / 0, fingerprint `250a124448525bf4669935e6004c745d2a2a79c5920ea72e0635f99ca8b9d780`; `npm run dialogue-sheet` regenerates; Codex's new content tests pass (asset references, layer contracts, caption sources, participants, full outcome coverage, expression availability). Old saves (≤ 0.5.1) are rejected with the existing reason; no migration.

## Part 2 — Prologue player (28 §2–3, §6)

- Runs **only** after NEW CAMPAIGN, between the menu and the first console screen. CONTINUE/LOAD resume a run without it. Uses the opening's stage machinery (player-paced, Continue, Skip, no countdown, no timers that gate).
- Six stages from `mission.prologue.plates[]` + `scenario_card`: background asset under a 1920×1080 design frame (letterbox to preserve aspect; scale layer coordinates with the frame), one moving layer per stage positioned by `moving_element.placement` (design px + opacity), animated **once, linearly** from `placement + motion.from` to `placement + motion.to` over `motion.seconds`, then held. Layers are clipped, non-interactive, no focus. ~450 ms crossfade between stages; ~700 ms dissolve into the room.
- Caption as live text in the left text area (≈ x 96–780, y 170–780 at design size) over a gentle dark gradient; plate heading in the Chakra Petch hero face at the ×0.75 scale from M00c; captions in Barlow at body size. Scenario card: facility line, date, "Gemini VIII — The Weight of the Call" composed from `mission` + `scenario`, and the `context` line ("Earlier that day — mission preparation") visible beneath.
- Controls: CONTINUE (primary key) always available; SKIP PROLOGUE (quieter) jumps to the scenario card; Continue there enters the console **once** — debounce so rapid clicks cannot reach a game choice. Reduced motion: static `from` composition, cuts. Text-size setting applies.
- Audio: the `opening` cue's track (Orbit of Hope) continues under the prologue without restarting per stage (extend the music map: a `prologue` cue that reuses the running opening/menu buffer or starts Orbit of Hope at 0:00 if the menu loop was playing — fade the menu loop 1 s, start Orbit of Hope; document which). Room beds and effects start when the room resolves.
- `prologue.history_note` (the 1973 renaming) appears in History once the run starts; `history_sources` resolve through the registry; About/Sources lists H9 and H10.

## Part 3 — Resolution cards (28 §5)

- Stage between the outcome record and the existing debrief, entered after the engine has written the outcome and all relationship effects. Read-only: never applies, replays or re-derives effects; skipping or revisiting changes nothing.
- **Card 1 — result:** `outcomes[id].plate` under the hero-style dark overlay; `resolution_presentation.heading` (RECOVERY RESULT); `outcome.tier` in the hero face at the ×0.75 title scale; `outcome.title`; `outcome.result_line`.
- **Card 2 — relationships:** same plate, stronger overlay; `relationships_heading`; a row of the characters whose trust changed: net delta = `state.ledger.people[id].trust − identity.initial_ledger.people[id].trust` (missing initial = 0), snapshot at scenario completion before any IX-A planning; positive → `portraits.neutral` + `trust_up` label; negative → `portraits.concerned` + `trust_down`; zero → omitted; order Voss, Reed, Armstrong, Scott, Cunningham, Stafford; name as live text under each; wrap to two rows of three at 1366×768 / enlarged text; a missing image falls back to name + label. If nobody changed, skip card 2.
- Continue: result → relationships → debrief. Skip: straight to debrief. Reduced motion cuts. The alternate-history lamp keeps its state on these cards. Per Aspera stays cued on the post-flight brief (28 §6); do not move it.
- Tiers displayed are only those in `resolution_presentation.tiers` that an outcome uses (SUCCESS/MIXED/COSTLY in M00); FAILURE/LOSS never render here.

## Part 4 — Historical participants and expression pairs (28 §4)

- At `g8-accountability-brief` and `g8-accountability-decision`, render `participants[]` as portrait (`characters[id].portrait`, i.e. neutral) + the supplied label as live text, in the conversation panel the way Voss and Reed appear — **with no line under them**, no quotation-styled caption, nothing that reads as speech. Their positions stay in the existing context card.
- Controllers keep their console portraits; the new neutral/concerned pairs are used only where the resolution row calls for them (and anywhere else an expression is already chosen by the renderer). Resolve every id through the manifest; never build filenames.

## Part 5 — Hints text (26 §5, M00c infrastructure)

M00c added the 30 s idle helper and the HINTS setting with a no-op `hint` read; 0.5.2 supplies the text on all four decision nodes. Wire it: on a decision screen after 30 s idle, the paper strip shows `node.hint`; hidden when HINTS: HIDE. Nothing logged.

## Part 6 — Checks, docs, deliverable

- e2e: all five prologue beats + scenario card (captions present, layer moves from→to and holds, fades), Skip Prologue → card → console once under rapid clicks, no prologue on Continue/Load, reduced motion static; resolution cards on all six outcomes and both accountability stances (correct tier, plate, result line; relationship row faces and labels per delta; zero-change characters absent; card 2 skipped when nobody changed); participants at both accountability nodes with labels and no speech; hint strip after 30 s (fake timers) and absent under HINTS: HIDE; replay byte-identical across a full route with every presentation stage exercised; contrast on every new screen at both viewports and text sizes; Glen's head clear zone unaffected (these stages are full-screen plates, not the room).
- Screenshots: each prologue stage, both resolution cards for SUCCESS / MIXED / COSTLY, the accountability brief with participants, the hint strip — at 1920×1080 and 1366×768, default and enlarged.
- `npm run dialogue-sheet` regenerated against the new renderer and committed; update exact-text assertions. README: prologue, resolution cards, new sources H9–H10, F11, saves note updated to 0.5.2.
- `00_BUILD.md`: what was merged by hand from Codex's patch over M00c; test counts; contrast table for new screens; open questions.

## Not in M01

Camera states (doc 14), equipment runtime use, the archival montage, Modern skin, moving Per Aspera, any content edit. Dan's sheet notes on 0.5.2 go to Codex as 0.5.3 later.
