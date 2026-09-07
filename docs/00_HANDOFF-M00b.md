# FNO-M00b — Presentation pass (content 0.5.1, opening screens, Apollo theme, music and soundscape)

**Task id:** FNO-M00b · **From:** Claude (Cowork) for Dan · **To:** Claude Code · **Date:** 7 September 2026
**Repo:** `C:\Users\wolfe\projects\failure-is-not-an-option` · **Baseline:** HEAD `2524c16` (dialogue-sheet generator), content 0.4.0
**Shared folder (read-only source of assets):** `C:\Users\wolfe\Documents\Claude_GPT_Shared_Workflow\Failure-is-Not-an-Option` — referred to below as `SHARED\`
**Deliverable:** commits on `main` + `SHARED\FNO-M00b-BUILD.zip` (see §11). Do not write game files into `SHARED\` root; only the BUILD zip.

This is one bounded pass. It has seven parts; do them in order because later parts depend on earlier ones. Parts 1–4 are required for playtest 2; parts 5–6 (audio) ship in the same pass but must degrade to silence if any audio file is absent. Ask Dan (stop and report) only if a baseline hash mismatch cannot be merged or a ruling below contradicts what you find in the repo.

Standing rules that apply to every screen (Dan's directions, docs 12, 16, 17, 18, 19):

- **Label, never delete.** No content text is removed or softened by the build.
- **No fiction call-outs in play text.** The only in-play history signals are the two mode lamps (HISTORICAL CHOICE / ALTERNATE HISTORY), the History panel, and the debrief section "Departures from the record". Retire the "Simulated report" badge and every F-label / register chip from play screens; they stay in History.
- **No source provenance in dialogue or evidence bodies.** Provenance renders only in History.
- **Two vocabularies:** hardware for controls (kit bezels, lamps, keys), paper for content (cards, evidence, binder).
- **No NASA marks anywhere** (doc 09). The emblem is `flight-operations-v005.svg` only.
- **Nothing presentational touches the simulation.** Audio, theme, text size, overlays, pin state never enter the ledger, the log, or the replay; the replay test must not see them.
- **Deterministic build.** Generated audio (§6.4) is produced by a script with fixed parameters and committed, so the manifest fingerprints are stable.

---

## Part 1 — Content 0.5.1 integration

Inputs: `content-0.5.0/` and `content-0.5.1/` in this zip (the unpacked Codex packets; hashes verified against `FILES.sha256` in each).

1. Codex's 0.5.0 packet carries a presentation adapter (`content-0.5.0/integration/`) diffed against a snapshot of the repo; 0.5.1's adapter (`content-0.5.1/integration/`) is diffed against **0.5.0**, not against HEAD. Apply in that order. Before each: compare `integration/baseline-sha256.json` against the checkout (`null` = file must not yet exist). On any mismatch, merge by hand into the newer file — never overwrite. Report every merge in `00_BUILD.md`.
2. Copy the six `content-0.5.1/content/*.json` and `content-0.5.1/assets/manifest.json` (content_version 0.5.1; no image bytes change — verify with the manifest hashes). Copy the two schema files from 0.5.1's `integration/schema/` (0.5.0 added `decision.historical_option`, `debrief[].section`, `debrief[].provenance`, registry labels `historical_choice_badge` and `departures_heading`; 0.5.1 changes only `phase.alternate_history: boolean | condition`).
3. Expected after integration: `npm run validate` → 56 routes, 6 outcomes, 112 plan commits, 0 draws; fingerprint `9056d94a25e9691c2245c89647aabcc6e3ae994d2af482f62232560d472c98f6`; `npm test` → Codex reports 79 passing across 9 files at 0.5.1 (their count; ours will differ once §2–§6 add tests); `npm run typecheck`; `npm run dialogue-sheet` regenerates byte-identically to `content-0.5.1/docs/dialogue-sheet.md` **before** your presentation changes (after them the sheet changes — regenerate and commit at the end, §11).
4. **History marker semantics (0.5.1, binding):** termination decision and return decision carry `historical_option` (later = historical timing); ALTERNATE HISTORY activates only when `g8-return-earlier` was chosen, at entry to phase 5 (`g8-return-execution`) after Execute Return, and persists through debrief and IX-A planning; a later historically aligned accountability stance does not reset it; the order receipt in phase 4 shows no lamp. Codex's adapter implements this; keep it when merging.
5. **Save policy note.** 0.4.0 and 0.5.0 saves do not import into 0.5.1 (fingerprint policy, no migration). Add one sentence to README under Saves. Do not write a migration.
6. **Two known defects to fix in the adapter/renderer:**
   - History panel provenance lines print empty fields as `Sources: . Fiction register: .` (0.5.1 sheet rows 482–496). Suppress empty fields; no trailing separators.
   - Debrief "Notes:" lines print raw fact ids (found in the M00b-SHEET pass, doc 16). Render the human-readable label from the registry; if a fact has no label, omit the note rather than print the id.

## Part 2 — Opening screens (docs 18, 07 revised, hero v003 A)

Inputs: `SHARED\art\title-hero-v003\` (Chakra Petch Bold + OFL, `title-layout.json`, `hero-title.css`, `preview.html`, `menu-continuation.png`), `SHARED\art\apollo-navigation-v002\` (Barlow fonts + OFL, title-scale keys), `08-Dedication-and-Disclaimers.md` (approved copy — verbatim from `registry.notices`, unchanged), `07-Opening-Cinematic.md` (revised flow).

Replace the M00/M00a stand-in opening entirely. Sequence on first launch:

| Stage | Build |
|---|---|
| Start | Quiet dark screen, one **Begin** key (Apollo key style) and a visible **Skip to menu**. Begin is the explicit player interaction that permits audio (§5). No countdown. |
| Dedication | The two dedication paragraphs as one unboxed prose column (Barlow Regular, 20–24 px desktop, ~55–65 characters per line, generous leading), moving slowly upward against darkness. No panel borders, no card. Controls outside the moving text: Pause/Resume, Continue, Skip to menu, volume. |
| Notices | New chapter after the dedication has cleared: project notice, AI disclosure, dramatization statement as three ordinary paragraphs in one continuous column, same treatment. All words reachable by manual scroll while paused. |
| (Montage slot) | A named, empty stage between Notices and Title so the future archival montage (07) drops in without restructuring. In M00b it is a 0-duration pass-through. |
| Hero title | **Study A — Engineering block.** Approved room (`fno_gemini_room_console_forward_v001.png`, via the manifest) under a separate dark overlay (do not edit the bitmap); title as **live text** in Chakra Petch Bold 700 at the coordinates/sizes in `title-layout.json` study `a` (1920×1080: FAILURE 320.8 px baseline 335; IS NOT AN 269.4 px baseline 576; OPTION 360.8 px baseline 890; x 475, width 1320), scaled proportionally to the viewport; Glen's head clear zone preserved. One small **Continue →** label (Barlow Condensed, ≥18 px at 1366×768), keyboard-reachable. No compulsory hold; never tied to music or a countdown. The bracket corners in the study are optional. |
| Main menu | On Continue: the same lockup shrinks/rises to the `menu-continuation.png` proportions and four Apollo title-scale keys appear beneath: **NEW CAMPAIGN · CONTINUE · LOAD · ABOUT**. Keys are native `<button>`s with live text over label-free SVG faces from the kit (§3). CONTINUE is disabled with a visible reason when no valid save exists. LOAD opens the existing save chooser/import panel; NEW CAMPAIGN uses the existing new-run path; ABOUT opens About/Credits. Preserve existing `start-new`, `start-load`, `open:saveload`, `open:about` hooks and test ids. |

Rules: reduced motion → static chapters with Continue and immediate cuts; never animate text off-screen while it has focus; Continue advances one stage, Skip bypasses the rest; on later launches (opening viewed or skipped once, stored per player with text size) go straight to the menu; About/Credits carries **Replay opening**, the dedication, all notices, the source list (H1–H8 from the registry), the OST list (§5), the soundscape credits (§6.5), the font licences (Barlow, Barlow Condensed, Chakra Petch — SIL OFL 1.1, shipped as files under `public/fonts/` with their OFL.txt), and the project/content licences (proposed MIT / CC BY 4.0, "pending confirmation" wording unchanged). A brief title→menu motion is allowed; reduced motion cuts. No mission time or state advances during any of this.

Fonts: bundle the three unmodified TTFs and their OFL files; `@font-face` with `font-display: swap` and a real fallback stack. Chakra Petch is scoped to the hero/menu title only.

## Part 3 — Apollo interface kit as a theme (doc 19 §6, v002 handoff)

Inputs: `SHARED\art\apollo-navigation-v002\` (start with `00-V002-HANDOFF.md`, `01-STATES-AND-SIZING.md`, `apollo-theme-v002.css`, `additions/`, `templates/`, `navigation-map.json`).

1. **Theme mechanism.** Root element carries `data-ui-mode="apollo"`. All kit colours and face URLs are CSS custom properties defined under `[data-ui-mode="apollo"]`; geometry (sizes, padding, focus ring, layout) is shared and mode-independent. One constant `MODERN_UI_AVAILABLE = false` in presentation code; the settings control for the mode is hidden until it is true. **Do not build a Modern skin.** No engine, content, eligibility or app decision logic reads the mode.
2. **Controls.** Native buttons/inputs with live text; the label-free SVG faces are backgrounds resolved through the existing manifest loader (add the selected SVGs to `assets/manifest.json` as `kind: image, format: svg`, credited to the kit). Six states per family (default, hover, pressed, selected, disabled, focus) — the reflow templates (`preserveAspectRatio="none"`) allow enlarged text without clipping. Keep the enlarged-text setting working at 1366×768 (M00a note: cramped).
3. **Decision cards (paper).** Rest: intent + risk/cost visible, **Details +** disclosure holding attraction, uncertainty and the rehearsal readout; Details open by default at the return fork only. Chosen: **ORDERED** stamp (CHOSEN for non-order contexts such as plan and lesson), Choose key removed. Unavailable: greyed paper with the readable reason. On commitment: stamp the chosen card, grey and disable the others (Dan's playtest note: "when a selection is made, the other option should grey out"), move focus to the next valid continuation, not to a removed key. Same on prep, return, lesson, stance and plan screens.
4. **Mode lamps.** HISTORICAL CHOICE (slate) and ALTERNATE HISTORY (blue-white) as steady lamps in the status bar, distinct from green/amber/red operational status; rendered as buttons that open History, with a visible focus outline; driven by the 0.5.1 semantics in §1.4. Neither lamp is a recommendation.
5. **Pinning.** Evidence panel only. Remove all pin chips from option cards and dialogue. A pin glyph on each evidence item; a once-only hint on first hover/focus: "Pin to keep this report in view. Pinning changes nothing in the mission." Hint dismissal persists per player with text size. Pin state is presentation only.
6. **Panels.** Translucent dialogue/evidence panels from the kit, sized to content so quiet screens show the room. Retire the M00 debug event-record display from play screens (keep it behind the existing debug flag if there is one).
7. **Contrast.** Re-run the contrast checks on every kit face + live-text combination at both text sizes; record results.

## Part 4 — Remaining playtest-1 items (doc 16 §3, 17 §5)

Cross-check that each is done by the parts above, and list them in `00_BUILD.md` with where they were resolved: evidence chips removed from cards (§3.5); stamped/greyed decision state (§3.3); intent+cost first, Details expander (§3.3); "ON THE RECORD" element **is superseded** — Dan ruled no fiction call-outs; the lamps + debrief "Departures from the record" section (rendered from `section: "departures"` under `registry.labels.departures_heading`) replace it; conversation panel sized to content (§3.6); pinning explained (§3.5); markers after the choice (§1.4, §3.4).

## Part 5 — Music (doc 20 §3 and §5)

Inputs: `SHARED\audio\*.mp3` (five tracks, owned by Dan, Suno Pro, instrumental — see `audio-README.md` in this zip for the rights lines), `music-map.json` in this zip (starting map; copy to `app/music-map.json`), `audio-analysis.json` (measured durations/levels).

1. Copy the five MP3s into `public/audio/` and add manifest entries `kind: audio` with title, credit and rights lines from the README (schema addition: `kind: audio` with `credit`, `rights`, `duration_s`).
2. Playback through Web Audio (one `AudioContext` created on Begin/first interaction; `decodeAudioData`; gain nodes: master → music / effects / beds). Sample-accurate start/end/fade; loop crossfade by scheduling two overlapping buffer sources.
3. **Off by default.** Music and soundscape are silent until the player turns the master on the first time (volume control on the Start screen, the menu and the settings panel); persisted per player with text size. Reduced motion has no bearing on audio.
4. Cue map semantics: `trigger` = screen id or node id entered; `start`/`end` seconds; `fade_in`/`fade_out`; `loop {from,to,crossfade}` or null; `stop_on` = input ids or screen ids that fade the cue out. **No loops on any screen where the player reads and decides.** Cues never touch domain state; no audio event enters the log.
5. Rulings in the starting map (all tunable numbers): `opening` Orbit of Hope 0:00→0:42 under dedication/notices/title, 2.5 s fade crossfading into `menu-loop`; if the scroll runs past 0:42, extend to the seam at 2:04; `menu-loop` Orbit of Hope (refrain) from 0:00, loop 60.5→111.7 s, crossfade 0.2 s, 2 s fade on start-new/start-load; `crisis` Mission in Danger from 0:00 on `g8-crisis-report`, once, fade 2 s on the return Choose, **provisional**; `postflight` Per Aspera **start 90.0 s**, fade-in 1.0 s, on `g8-accountability-brief`, once, runs out naturally; Disaster and Loss: manifest entry, no cue.
6. Tests: every cue's asset exists; start/end/loop points lie inside `duration_s`; every `trigger` and `stop_on` names a real screen or input id; the replay test remains byte-identical with audio on and off.
7. About/Credits lists the OST from the map (title, "Music: Dan Lee-Odinson, produced with Suno Pro, instrumental").

## Part 6 — Soundscape (docs 21 §3, 22, audio README; Dan's rulings)

Inputs: `soundscape-map.json` in this zip; `audio-README.md`; Dan's file set — **downloaded by Dan into `SHARED\audio\soundscape-cc0\`** under the original Freesound filenames. If that folder is empty or partial at build time, build everything, leave the missing manifest entries flagged in `npm run placeholders`, and play silence for missing roles. Never fail the build on a missing sound.

1. **Files and roles** (all Freesound; licences verified on each sound page):

| Role | File / uploader | Licence |
|---|---|---|
| Room bed (loop) | Room Tone – Empty room with AC & desktop computer running — seventhsamurai #332417 | CC0 1.0 |
| Walla layer (loop) | Typing Office chatter in background — SduggySounds #725718 | CC0 1.0 |
| Button press | SWITCH BUTTON PRESSING.wav — EricsSoundschmiede #457411 | CC0 1.0 |
| Toggle click **and** rotary detent | 130111 light switches, clicks, dimmer slides, hotel London ON (.mp3) — TRP #713997 (two cue regions from one file; pick offsets by listening/analysis) | CC0 1.0 |
| Paper | Paper Rustling 01.wav — swidmark #171320 | CC0 1.0 |
| Headset / loop click | End radio transmission — ReadeOnly #47646 | CC0 1.0 |
| Electronic alert | Beep 8 count (loopable).wav — JonNicholas #266156 — **use one beep, not the loop** | **CC BY 3.0 — credit required** |
| Quindar tones | generated (§6.4) | project-owned |

2. **Room bed level — Dan's ruling:** the bed plays at a reduced level by default, 60–75 % below full scale: `room_bed_gain` default **0.3** in `soundscape-map.json`, tunable without a rebuild. The walla layer sits **under** the bed (`walla_gain` 0.2 default) and is enabled only on preparation and post-flight screens. The bed runs as a seamless loop under every console screen from Begin (with audio on); loop points from the same analysis approach as the music (choose a region with steady spectrum; 0.3 s crossfade).
3. **One-shots bound to UI events only**, never to domain events: Choose/Commit/Continue → button press; menu key selection → toggle click; settings/volume change → rotary detent; pin and binder open → paper; History/loop panel open/close → headset click; alert beep on the arrival of a crisis-class report card (a presentation event on card render, not on the log entry). Effects have their own gain (`effects_gain` 0.6 default).
4. **Quindar tones, generated at build:** `scripts/gen-quindar.ts` writes `public/audio/generated/quindar-open.wav` (2525 Hz) and `quindar-close.wav` (2475 Hz), 250 ms sine, 10 ms linear ramps in/out, 44.1 kHz 16-bit mono, −12 dBFS peak; deterministic (no random); committed. Cue: open tone at the start of a CAPCOM line render, close tone at its end — presentation only, and only when effects are on.
5. **Credits and rights.** About/Credits gets a Soundscape block listing each file as title — uploader — freesound.org — licence, and the exact line **"Beep 8 count (loopable) by JonNicholas, freesound.org, CC BY 3.0"**. Same block in `README`. Manifest entries `kind: audio` with `credit`, `rights`, source URL.
6. **Never commit** `SHARED\audio\soundscape\` (Epidemic Sound; not redistributable). Add `public/audio/soundscape/` and `**/soundscape/*.mp3` to `.gitignore` as a guard even though nothing should copy them.

## Part 7 — Layout, accessibility, tests, docs

1. Screens at 1920×1080 and 1366×768, normal and enlarged text: opening (each chapter), hero title, menu (Continue disabled and enabled), prep decision (rest/chosen/unavailable), loss-of-contact, crisis, return decision (Details open, both lamps states), execution beat, post-flight decision, debrief with "Departures from the record", IX-A planning, About/Credits. Glen's head clear zone respected on every room screen; images only through the manifest.
2. Keyboard: every stage of the opening, the menu, every card and lamp; focus never lands on a removed key.
3. e2e (Playwright): opening flow incl. Skip and reduced motion; return-to-menu on second launch; marker precedence on the earlier and later routes; Continue disabled/enabled; audio off by default and no audio in the log.
4. `npm run dialogue-sheet` regenerated and committed after all presentation changes (application strings change: opening, menu, hints, credits). Update exact-text assertions.
5. README: opening/menu, theme setting (Apollo only for now), audio section (rights, credits, CC BY line, `room_bed_gain`), saves note (§1.5), the `soundscape-cc0/` instruction for contributors.

## What not to do

No Modern skin. No equipment boards in the manifest (M01). No archival montage (slot only). No engine or save-format changes beyond the Codex adapter. No editing of room/portrait bitmaps. No NASA marks. No fiction call-outs or provenance in play text. No audio on by default. No loops on decision screens. No Epidemic Sound files in the repo. No deletion of content strings.

## Deliverables

1. Commits on `main`, conventional messages, one per part is fine.
2. `SHARED\FNO-M00b-BUILD.zip` containing `00_BUILD.md` (what was done per part; every hash-mismatch merge; test counts; the contrast table; open questions), the screenshots from §7.1, `docs/dialogue-sheet.md/.csv` as regenerated, and the git log since `2524c16`. No `node_modules`, no `dist`.
3. Report the commands Dan runs to see it: `npm install`, `npm run dev` → http://localhost:5173, `npm test`, `npm run validate`, `npm run placeholders`.
