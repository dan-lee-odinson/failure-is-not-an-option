# Failure is Not an Option

*A 2D NASA flight-director simulator and narrative strategy game, framed from the director's first-person viewpoint.*

**This repository holds FNO-M00b**, the presentation pass on the first playable increment: one Gemini VIII chapter, *The Weight of the Call*, played from preparation through a return decision, its aftermath, a post-flight accountability scene, a causal debrief, and a small playable Gemini IX-A preparation plan whose options depend on what you did. M00b adds the opening screens, the Apollo interface kit as a theme, the music and soundscape, and Codex's content 0.5.1.

Content package **0.5.1** (fingerprint printed by `npm run validate`). Simulation version 0.1.0.

## Notices

**A historical mission with fictional return decisions and alternate outcomes.**

**Project disclaimer.** Failure is Not an Option is an independent homage to NASA and the people of the space program, created for appreciation and exploration, not for profit. It is not affiliated with, authorized, sponsored, or endorsed by NASA.

**Generative AI disclosure.** This project was created using generative AI within a human-in-the-loop process, with human creative direction, review, and final decision-making.

**Historical dramatization.** Inspired by real missions and people, this game includes fictional dialogue, simplified systems, and alternate historical outcomes. These elements do not represent the actual words, beliefs, or actions of the people portrayed. NASA is not responsible for the game's interpretations, generated content, or accuracy.

No NASA insignia, worm logotype, or seal appears in any generated asset. The room plate and four controller portraits in `assets/` are Codex's art delivery v1.0.0 (AI-generated under Dan's art direction; provenance in `assets/manifest.json` and `docs/codex-art-1.0.0/`). The emblem on Glen's vest is the approved original Flight Operations emblem (version 5), rendered as a separate layer from `assets/flight-operations-v005.svg`. The control faces are the Apollo Navigation kit v002 (original SVG shapes by Codex). `npm run placeholders` only fills image slots that are still waiting for art and lists any sound that is missing.

## Attribution

Dan Lee-Odinson directs and dispositions. Codex (GPT-6 Astra) designs, writes the content package, and reviews independently. Claude (Anthropic, Claude Code) engineers the schema, simulation core, application, and tests. The division of labor, the content specification, the source register (H1–H8), the fiction register (F1–F10), and the acceptance cases are in `docs/`.

Historical caution in this project means labeling, never deleting (`docs/codex-content-0.4.0/12-Direction-Historical-Caution.md`). Sourced criticism stays with its attribution. In play, the only history signals are the two mode lamps in the status bar (HISTORICAL CHOICE on a decision where one option matches the record; ALTERNATE HISTORY once play has left it), the History panel, and the debrief's "Departures from the record". Fiction-register labels and source provenance appear only in the History panel.

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

Vitest against the engine-free core and the renderer: the replay test (written first, never deleted), acceptance cases AC-01…AC-16 where they are domain cases, save/import verification, the validator's fail-on-purpose cases, the 0.5.x history-marker contract, the M00b presentation contract, the music and soundscape maps, the Quindar generator, and the dialogue-sheet proofs.

```bash
npm run test:e2e
```

Playwright display and access cases (AC-12): the opening flow including Skip and reduced motion, return-to-menu on a second launch, marker precedence on both routes, CONTINUE disabled and enabled, audio off by default and absent from the log, keyboard reach, contrast of every kit face and every text sample, and the screenshot set at 1920×1080 and 1366×768, default and enlarged text, written to `artifacts/screenshots/` with the contrast measurements in `artifacts/contrast.json` (ignored by git; shipped in the handoff zip). Requires `npx playwright install chromium` once.

Other scripts: `npm run placeholders` (image placeholders for any slot still marked to-generate or placeholder — none at present — and a list of any missing sound); `npm run dialogue-sheet` (regenerates `docs/dialogue-sheet.md` and `.csv`, every player-visible string once in play order); `npm run gen-quindar` (regenerates the two Quindar tones byte for byte); `npm run fingerprint`; `npm run build` type-checks and builds to `dist/`. Add `?debug` to the URL to see the raw event record on the debrief.

## Opening and menu

First launch: a quiet Start screen (Begin, Skip to menu, the sound control) → the dedication as a slow prose scroll → the notices as a second prose chapter → the hero title (Study A, Chakra Petch Bold, live text over the room) → the main menu (NEW CAMPAIGN · CONTINUE · LOAD · ABOUT). Continue advances one stage; Skip bypasses the rest; Pause/Resume stops the scroll, and the text can be scrolled by hand. Under reduced motion the chapters are static with Continue and every transition is a cut. Once the opening has been viewed or skipped, later launches open on the menu; About / Credits carries Replay opening, the dedication, all notices, the sources, the soundtrack, the soundscape credits, the font licences, and the project licences. The archival montage (`docs/m00b-inputs/07-Opening-Cinematic.md`) has a named empty slot between the notices and the title; nothing plays there yet.

CONTINUE resumes the browser slot and is disabled with a visible reason when there is no valid save. LOAD opens the save/import panel.

## Interface theme

The Apollo kit (`docs/m00b-inputs/19-Claude-Review-Equipment-and-Navigation.md` §6) is implemented as a theme: the root element carries `data-ui-mode="apollo"`, the kit's colours live in `app/styles.css` under that attribute, and the label-free control faces are manifest SVGs whose URLs `app/theme.ts` publishes as CSS custom properties. Controls are native buttons with live text over those faces; content is paper (cards, evidence, binder, debrief). A Modern skin would be a second token block and face set with no logic change; it does not exist yet, and the settings control for the mode stays hidden until `MODERN_UI_AVAILABLE` in `app/theme.ts` is true. No engine, content, eligibility or app decision logic reads the mode.

Pinning lives in the Evidence panel only (a pin glyph on each report, with a once-only hint the first time you hover or focus one). Pin state, text size, overlays, the theme and audio never enter the ledger, the log, a save, or the replay.

## Audio

Off by default. Nothing plays until you turn SOUND on (Start screen, menu, or Settings); the setting and the four volumes (master, music, effects, room) persist per player alongside text size. Music never carries information you need, never loops on a screen where you read and decide, and never becomes a clock.

**Soundtrack** — Music: Dan Lee-Odinson, produced with Suno Pro, instrumental. The five original MP3s are unchanged under `public/audio/`; cue points (start, end, fades, the menu loop, what stops a cue) live in `app/music-map.json` and can be tuned without a rebuild. Rights: owned by Dan Lee-Odinson under Suno's Pro plan terms; released with the game under a licence to be chosen before publication (`docs/m00b-inputs/audio-README.md`).

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
app/       presentation (HTML/CSS/TypeScript, Vite): renderer, theme, audio director, cue maps
scripts/   validator, placeholders, fingerprint, dialogue sheet, Quindar generator
tests/     core unit tests (Vitest) and browser tests with screenshots (Playwright)
docs/      the build handoffs, Codex's content packets, the M00b inputs, and the design record
```

## Saving

One browser-storage slot plus JSON export/import. An import is verified before anything is replaced: structure, content version and fingerprint, simulation version, every referenced id, and replay equivalence (the recorded inputs are replayed from the initial ledger and must reproduce the stored state and event-log hash byte for byte). A failed import leaves the existing save untouched and tells the player why. Saves from earlier content versions are rejected with an unsupported-version message; no migration is provided. Saves made with content 0.4.0 or 0.5.0 (the M00, M00a and playtest-1 builds) do not import into 0.5.1: the content fingerprint changed and this project does not migrate saves, so keep the older build if an old playthrough needs replaying.

## Licenses (proposed)

`LICENSE` (MIT) covers the code; `LICENSE-CONTENT` (CC BY 4.0) covers `content/` and `assets/`. Both are proposed and carry a header saying so; Dan confirms them before publication. The soundtrack has its own entry (above) and does not inherit the code licence. The fonts ship under the SIL Open Font License 1.1 with their `OFL.txt`; the CC BY 3.0 sound ships with `LICENSES/CC-BY-3.0.txt`.
