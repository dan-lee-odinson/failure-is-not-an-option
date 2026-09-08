# Failure is Not an Option

*A 2D NASA flight-director simulator and narrative strategy game, framed from the director's first-person viewpoint.*

**This repository holds FNO-M01**: the first playable increment — one Gemini VIII chapter, *The Weight of the Call*, played from preparation through a return decision, its aftermath, a post-flight accountability scene, a causal debrief, and a small playable Gemini IX-A preparation plan whose options depend on what you did — with the illustrated mission prologue, the scenario resolution cards, the historical participants at the accountability scene and the decision hints of Codex's content 0.5.2 (docs/m01-inputs/28-Prologue-and-Resolution-Treatment.md). M00b added the opening screens, the Apollo interface kit as a theme, the music and soundscape; M00c applied Dan's playtest-2 notes (docs/m00c-inputs/26-Playtest-2-Findings.md).

Content package **0.5.2** (fingerprint printed by `npm run validate`). Simulation version 0.1.0.

## Notices

**A historical mission with fictional return decisions and alternate outcomes.**

**Project disclaimer.** Failure is Not an Option is an independent homage to NASA and the people of the space program, created for appreciation and exploration, not for profit. It is not affiliated with, authorized, sponsored, or endorsed by NASA.

**Generative AI disclosure.** This project was created using generative AI within a human-in-the-loop process, with human creative direction, review, and final decision-making.

**Historical dramatization.** Inspired by real missions and people, this game includes fictional dialogue, simplified systems, and alternate historical outcomes. These elements do not represent the actual words, beliefs, or actions of the people portrayed. NASA is not responsible for the game's interpretations, generated content, or accuracy.

No NASA insignia, worm logotype, or seal appears in any generated asset. The room plate and four controller portraits in `assets/` are Codex's art delivery v1.0.0 (AI-generated under Dan's art direction; provenance in `assets/manifest.json` and `docs/codex-art-1.0.0/`); content 0.5.2 adds twenty-two presentation exports in the same hand — the five prologue backgrounds and the facility plate, the two moving layers, the three recovery plates, and matched neutral / concerned portraits of Armstrong, Scott, Cunningham, Stafford, Voss and Reed (prompts and sources recorded in `docs/codex-content-0.5.2/art/`; the plates are illustrated interpretations, labelled as such by the fiction register's F11). The emblem on Glen's vest is the approved original Flight Operations emblem (version 5), rendered as a separate layer from `assets/flight-operations-v005.svg`. The control faces are the Apollo Navigation kit v002 (original SVG shapes by Codex). `npm run placeholders` only fills image slots that are still waiting for art and lists any sound that is missing.

## Attribution

Dan Lee-Odinson directs and dispositions. Codex (GPT-6 Astra) designs, writes the content package, and reviews independently. Claude (Anthropic, Claude Code) engineers the schema, simulation core, application, and tests. The division of labor, the content specification, the source register (H1–H10: H9 for the Gemini program context of the prologue, H10 for the period facility name and its 1973 renaming), the fiction register (F1–F11: F11 for the illustrated prologue and recovery presentation), and the acceptance cases are in `docs/`.

Historical caution in this project means labeling, never deleting (`docs/codex-content-0.4.0/12-Direction-Historical-Caution.md`). Sourced criticism stays with its attribution. In play, the only history signals are the two mode lamps in the status bar (HISTORICAL CHOICE on a decision where one option matches the record; ALTERNATE HISTORY once play has left it), the History panel, and the debrief's "Departures from the record". Fiction-register labels and source provenance appear only in the History panel. Real people appear as a headshot and a name-and-role label, never with invented words: at the post-flight accountability scene Armstrong, Scott, Cunningham and Stafford are present as portraits with their labels, and their positions stay summarised in the attributed context card (direction 27 §1).

## Running it

Node LTS (24 tested).

```bash
npm install
```

```bash
npm run dev
```

Opens the game at http://localhost:5173. Play with the mouse or entirely from the keyboard (Tab / Shift+Tab, Enter, Escape closes overlays).

```bash
npm run validate
```

Checks every file under `content/` and `assets/manifest.json`: JSON Schema, id uniqueness, every reference resolves, outcomes provably mutually exclusive, an exhaustive route sweep (every preparation set × both orders × both lessons × both stances × every enabled plan), manifest image dimensions against the files on disk, and the audio entries against the files under `public/audio/` (a missing sound is a warning, never a failed build). Prints the content fingerprint. `npm run validate -- --root <dir>` validates a copy elsewhere (used to demonstrate deliberate failures).

```bash
npm test
```

Vitest against the engine-free core and the renderer: the replay test (written first, never deleted), acceptance cases AC-01…AC-16 where they are domain cases, save/import verification, the validator's fail-on-purpose cases, the 0.5.x history-marker contract, Codex's 0.5.2 presentation contract (asset references, layer contracts, caption sources, participants, full outcome coverage, expression availability), the M00b, M00c and M01 presentation contracts, the music and soundscape maps, the Quindar generator, and the dialogue-sheet proofs.

```bash
npm run test:e2e
```

Playwright display and access cases (AC-12 and the M01 cases): the opening flow including Skip and reduced motion, return-to-menu on a second launch, marker precedence on both routes, CONTINUE disabled and enabled, audio silent until Begin and absent from the log, the fade sequence and the idle highlight under fake timers, the full-screen key, the emblem beneath the panels, keyboard reach; the prologue's five beats and scenario card (captions, the layer moving from → to and holding, the crossfades, the dissolve into the room, Skip Prologue, the room entered once under rapid clicks, no prologue on Continue / Load, reduced motion static), the resolution cards on all six outcomes and both accountability stances, the participants at both accountability nodes, the hint strip under fake timers and its absence under HINTS: HIDE, the replay byte-identical whether every presentation stage is viewed or skipped; contrast of every kit face and every text sample (on the plates against the composited background and layers), and the screenshot set at 1920×1080 and 1366×768, default and enlarged text, written to `artifacts/screenshots/` with the contrast measurements in `artifacts/contrast.json` (ignored by git; shipped in the handoff zip). Requires `npx playwright install chromium` once.

Other scripts: `npm run placeholders` (image placeholders for any slot still marked to-generate or placeholder — none at present — and a list of any missing sound); `npm run dialogue-sheet` (regenerates `docs/dialogue-sheet.md` and `.csv`, every player-visible string once in play order); `npm run gen-quindar` (regenerates the two Quindar tones byte for byte); `npm run fingerprint`; `npm run build` type-checks and builds to `dist/`. Add `?debug` to the URL to see the raw event record on the debrief.

## Opening and menu

First launch: a quiet Start screen (Begin, Skip to menu, the sound control) → the dedication and the notices as one continuous prose scroll with a chapter gap between them and no visible scrollbar → when the last line has cleared, a fade to black and the hero title fading in (Study A at 0.75, Chakra Petch Bold, live text over the room) → the main menu (NEW CAMPAIGN · CONTINUE · LOAD · ABOUT, and a FULL SCREEN key with the line "Best played full screen — press F11 on Windows."). Continue at any time fades quickly to the title; Skip bypasses the rest; Pause/Resume stops the scroll, and the text can be scrolled by hand. Under reduced motion the dedication and the notices are two static pages with Continue and every transition is a cut. Once the opening has been viewed or skipped, later launches open on the menu; About / Credits carries Replay opening, the dedication, all notices, the sources, the soundtrack, the soundscape credits, the font licences, and the project licences. The archival montage (`docs/m00b-inputs/07-Opening-Cinematic.md`) has a named empty slot between the notices and the title; nothing plays there yet.

CONTINUE resumes the browser slot and is disabled with a visible reason when there is no valid save. LOAD opens the save/import panel.

## Prologue and scenario card

NEW CAMPAIGN runs the mission prologue once, between the menu and the first console screen (`mission.prologue` in the content, treatment 28): five illustrated beats — the Gemini program, the crew, the 16 March 1966 launch, rendezvous and docking, the inflection point — then the scenario card (Manned Spacecraft Center, Houston · 16 March 1966 · Gemini VIII — The Weight of the Call · "Earlier that day — mission preparation"), which dissolves into the room. Each beat is a 1920×1080 background under one moving layer (the haze, or the docked craft), positioned in design pixels and moved once, linearly, from its `from` to its `to` offset over the content's seconds, then held; the design frame is letterboxed to the window and everything scales with it. The heading is the hero face; the caption is live body text in the left text area over a dark backdrop; CONTINUE is always available, SKIP PROLOGUE goes to the scenario card, and the scenario card's Continue enters the console exactly once (rapid presses during the 700 ms dissolve reach nothing). Plates crossfade over 450 ms; under reduced motion every plate is the static `from` composition and every transition is a cut. CONTINUE and LOAD resume a run without the prologue. Orbit of Hope runs under the prologue from 0:00 (the menu loop fades over 1 s on New Campaign); the room bed and effects start with the room. The prologue's facility note (the centre was renamed the Lyndon B. Johnson Space Center in 1973) appears in the History panel once a run exists, with its source H10.

## Resolution cards

When the outcome is recorded — after the engine has written the outcome and every relationship effect, before the debrief — two player-paced cards resolve in (treatment 28 §5). Card 1 is the outcome's recovery plate under a dark overlay with the content's heading (RECOVERY RESULT), the outcome's tier in the hero face at the title scale (SUCCESS, MIXED or COSTLY: a label on the outcome, never a mechanic; FAILURE and LOSS are reserved and never shown for Gemini VIII, where every outcome recovers the crew), the outcome's title and its result line. Card 2 (same plate, stronger overlay, THE ROOM REMEMBERS) is the row of the people whose trust changed in this run — Voss, Reed, Armstrong, Scott, Cunningham, Stafford in that order, the neutral portrait and "Trust up" for an increase, the concerned portrait and "Trust down" for a decrease, unchanged people absent, the card itself absent when nobody changed — computed as the net change from the initial ledger to the ledger at completion. Continue: result → relationships → debrief; SKIP TO DEBRIEF goes straight there; the debrief's REVIEW THE RESULT shows the cards again. The cards are read-only: showing, skipping or revisiting them never applies, replays or re-derives an effect, and the replay is byte-identical with every stage viewed or skipped. The ALTERNATE HISTORY lamp keeps its state on the cards; Per Aspera keeps running from the post-flight brief.

## Interface theme

The Apollo kit (`docs/m00b-inputs/19-Claude-Review-Equipment-and-Navigation.md` §6) is implemented as a theme: the root element carries `data-ui-mode="apollo"`, the kit's colours live in `app/styles.css` under that attribute, and the label-free control faces are manifest SVGs whose URLs `app/theme.ts` publishes as CSS custom properties. Controls are native buttons with live text over those faces; content is paper (cards, evidence, binder, debrief). A Modern skin would be a second token block and face set with no logic change; it does not exist yet, and the settings control for the mode stays hidden until `MODERN_UI_AVAILABLE` in `app/theme.ts` is true. No engine, content, eligibility or app decision logic reads the mode.

Pinning lives in the Evidence panel only (a pin glyph on each report, with a once-only hint the first time you hover or focus one). Every card's Details disclosure starts open; the toggle is remembered per card. Glen's questions sit at the bottom of the conversation panel, always in view; the dialogue above them scrolls. At the accountability brief and decision the four astronauts appear in the conversation panel as portrait and label (`participants` on the node), the way Voss and Reed appear, with no line under them; the controllers keep their console portraits, and the neutral / concerned pairs are used on the resolution card only. The History panel shows the history explanation, the lamp sentence, the prologue's facility note once a run exists, and the sources H1–H10; the per-item provenance lines and the fiction register are game mechanics and are not displayed (they stay in the content, on the dialogue sheet as `history-hidden`, and in this README). After 30 seconds without an input the key that continues takes a muted highlight, and a decision shows its hint in a paper strip above the cards (content 0.5.2 carries a procedural hint on all four decisions; none recommends an option); Settings has HINTS: SHOW / HIDE. Pin state, text size, overlays, the theme, audio, the idle timer, hints, the prologue and the resolution cards never enter the ledger, the log, a save, or the replay.

## Audio

On from Begin: pressing Begin (or Skip) is the player interaction browsers require, and the master goes on then unless you have turned SOUND off before (the setting and the four volumes — master, music, effects, room — persist per player alongside text size). Music never carries information you need, never loops on a screen where you read and decide, and never becomes a clock.

**Soundtrack** — Music: Dan Lee-Odinson, produced with Suno Pro, instrumental. The six original MP3s are unchanged under `public/audio/`; cue points (start, end, fades, the menu loop, a per-cue gain, what stops a cue) live in `app/music-map.json` and can be tuned without a rebuild.

| Cue | Track | Where | Notes |
|---|---|---|---|
| opening | Orbit of Hope | dedication, notices, hero title | 0:00 → 0:42, extended to the 2:04 seam if still reading; crossfades into the menu loop |
| menu-loop | Orbit of Hope (refrain) | main menu | loop 1:00.5 → 1:51.7, 0.2 s crossfade; the only loop; fades over 2 s on Continue and 1 s on New Campaign |
| prologue | Orbit of Hope | the prologue's five beats and the scenario card | from 0:00, once, carried across every plate without restarting; 1 s fade-in under the menu loop's fade; 1.5 s fade as the card dissolves into the room |
| crisis | Mission in Danger Drum Background | crisis report through the return decision | once from 0:00 at cue gain 0.75; fades on the return Choose; provisional |
| postflight | Per Aspera | post-flight scene and debrief | from 1:30, once, runs out |
| — | Mission in Danger, Disaster and Loss | not cued | in the OST list; Mission in Danger was the crisis cue until playtest 2 | Rights: owned by Dan Lee-Odinson under Suno's Pro plan terms; released with the game under a licence to be chosen before publication (`docs/m00b-inputs/audio-README.md`).

**Soundscape** — seven Freesound recordings chosen by Dan (`docs/m00b-inputs/22-Soundscape-CC0-Candidates.md`) under `public/audio/soundscape-cc0/`, plus two Quindar tones generated by `scripts/gen-quindar.ts`. Regions, loop points and gains live in `app/soundscape-map.json`; the room bed defaults to `room_bed_gain` 0.3 (Dan's ruling: 60–75 % below full scale), the walla layer sits under it and runs only on the preparation and post-flight screens, and one-shots are bound to interface events only.

| Role | Title — uploader — freesound.org — licence |
|---|---|
| Room bed (loop) | Room Tone – Empty room with AC & desktop computer running — seventhsamurai — CC0 1.0 |
| Walla layer (loop) | Typing Office chatter in background — SduggySounds — CC0 1.0 |
| Button press | SWITCH BUTTON PRESSING.wav — EricsSoundschmiede — CC0 1.0 |
| Toggle click and rotary detent | 130111 light switches, clicks, dimmer slides, hotel London ON — TRP — CC0 1.0 |
| Paper | Paper Rustling 01.wav — swidmark — CC0 1.0 |
| Headset / loop click | End radio transmission — ReadeOnly — CC0 1.0 |
| Electronic alert | **Beep 8 count (loopable) by JonNicholas, freesound.org, CC BY 3.0** (one beep used, never the loop; licence text in `LICENSES/CC-BY-3.0.txt`) |
| Quindar tones | generated at build time (2525 Hz open, 2475 Hz close); original, project-owned |

For contributors: the Freesound files are committed under their original filenames. If one is missing, `npm run placeholders` says so and the game plays silence for that role; download it from the URL in `assets/manifest.json` (free Freesound account) into `public/audio/soundscape-cc0/` under the exact filename. The Epidemic Sound files that preceded this set are not redistributable and are excluded by `.gitignore` (`public/audio/soundscape/`); never commit them.

## Layout

```
core/      engine-free simulation (TypeScript; no DOM, no timers, no rendering)
schema/    JSON Schema for every content type and the asset manifest
content/   the mission, characters, evidence, procedures, follow-on, and registry (data, never code)
assets/    assets/manifest.json, the art, the emblem, and the Apollo kit faces
public/    fonts (Barlow, Barlow Condensed, Chakra Petch; SIL OFL 1.1) and audio, served as plain files
app/       presentation (HTML/CSS/TypeScript, Vite): renderer, theme, audio director, cue maps, the resolution view-model
scripts/   validator, placeholders, fingerprint, dialogue sheet, Quindar generator
tests/     core unit tests (Vitest) and browser tests with screenshots (Playwright)
docs/      the build handoffs, Codex's content packets, the M00b, M00c and M01 inputs, and the design record
```

## Saving

One browser-storage slot plus JSON export/import. An import is verified before anything is replaced: structure, content version and fingerprint, simulation version, every referenced id, and replay equivalence (the recorded inputs are replayed from the initial ledger and must reproduce the stored state and event-log hash byte for byte). A failed import leaves the existing save untouched and tells the player why. Saves from earlier content versions are rejected with an unsupported-version message; no migration is provided. Saves made with content 0.4.0, 0.5.0 or 0.5.1 (the M00, M00a, playtest-1, M00b and M00c builds) do not import into 0.5.2: the content fingerprint changed and this project does not migrate saves, so keep the older build if an old playthrough needs replaying.

## Licenses (proposed)

`LICENSE` (MIT) covers the code; `LICENSE-CONTENT` (CC BY 4.0) covers `content/` and `assets/`. Both are proposed and carry a header saying so; Dan confirms them before publication. The soundtrack has its own entry (above) and does not inherit the code licence. The fonts ship under the SIL Open Font License 1.1 with their `OFL.txt`; the CC BY 3.0 sound ships with `LICENSES/CC-BY-3.0.txt`.
