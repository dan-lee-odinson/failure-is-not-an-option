# FNO-M00a — Art Drop Integration Handoff

**Task:** FNO-M00a · **From:** Claude (Claude Code, Fable 5.1) on artemis · **To:** Dan (director) and Codex (independent review) · **Date:** 7 September 2026 · **Status:** INTEGRATED. Codex art v1.0.0 is in the five slots, the layout keeps the room visible, the emblem sits on Glen's vest, validate and every test pass, the screenshots are re-shot, and the zip is in the shared subfolder.

## 1. Where it is

| Item | Value |
|---|---|
| Repository (local) | `C:\Users\wolfe\projects\failure-is-not-an-option`, branch `main` |
| Repository (remote) | https://github.com/dan-lee-odinson/failure-is-not-an-option — private |
| Starting commit | `23cf376` (M00 delivery) |
| Delivery commit | *(filled in the zip copy)* |
| Art package | Codex art v1.0.0 (`FNO-M00a-Codex-Art-v1.0.0.zip`), `FILES.sha256` verified OK on all seven files before integration |
| Content version / fingerprint | **0.4.0** / `95f41b37ff67b2424db30544cb14106d7517f1ae110bc1a7b74bae76b96ce85f` — **unchanged**; `content/` was not touched |
| Simulation version | `0.1.0` — unchanged; `core/` was not touched |

**One thing touched `schema/`, and it is flagged here first.** The directive's step 3 requires the SVG emblem to be a manifest entry so the "only manifest images" test admits it by membership, not by name. The manifest schema (`schema/manifest.schema.json`, the asset-manifest contract, not a content schema) admitted only PNG filenames, so it now also admits an SVG entry: optional `format` (`png` | `svg`) and `kind` (`room` | `portrait` | `emblem` | `layer`), and an SVG filename pattern. The validator checks an SVG's root width/height against the manifest the way it checks a PNG's header. No content schema, no content file, and no core file changed; the content fingerprint is identical. If Dan would rather the emblem be admitted some other way, the change is nine lines and reversible.

## 2. What changed, file by file

| File | Change |
|---|---|
| `assets/fno_gemini_room_console_forward_v001.png` | New: Codex room plate, 1920×1080 RGB opaque. |
| `assets/fno_gemini_portrait_{mara-voss,elias-reed,capcom,flight-dynamics}_neutral_v001.png` | New: Codex portraits, 768×1024 RGBA. |
| `assets/fno_gemini_*_placeholder_v001.png` (five files) | Removed; no longer referenced. |
| `assets/manifest.json` | Replaced with Codex's manifest (five slots, status `final`, top-level `delivered`), plus one new entry `emblem-flight-operations` → `flight-operations-v005.svg` (900×1200, alpha, format svg, kind emblem, status final, origin "original fictional emblem, Dan-approved v5"). |
| `assets/flight-operations-v005.svg` | New: the approved emblem master, copied unchanged from the packet (which copied it from the shared folder's `art/`). |
| `schema/manifest.schema.json` | `format`, `kind`, SVG filename pattern, and two `if/then` rules tying `.svg` ⇄ `format: svg` and `alpha: true` (see §1). |
| `scripts/lib/validator.ts` | SVG branch in the on-disk asset check (`readSvgSize`); PNG branch unchanged. |
| `scripts/placeholders.ts` | Generates only for slots with status `to-generate` or `placeholder` and PNG format; a no-op now ("nothing to do"). Never overwrites `final` assets. |
| `scripts/fail-on-purpose.ts` | The wrong-size-PNG plant now targets whatever file the manifest names for `room-gemini-console`. |
| `app/plate.ts` | New: plate geometry (`coverRect`), the emblem rectangle from Codex's native coordinates (x 180, y 628, 30×40 at 1920×1080), and `layoutEmblem()`. |
| `app/render.ts` | The plate is a fixed full-viewport `<img id="plate">` with `object-fit: cover`; the emblem is `<img id="emblem">` above it and below every panel, `aria-hidden`, `pointer-events: none`; the conversation panel gets a large active-speaker portrait (`data-testid="active-portrait"`) beside the lines, which keep their thumbnails; speaker-less narration lines drop the empty thumbnail; portrait alt text no longer says "placeholder"; the asset glob admits `.svg`. |
| `app/main.ts` | Calls `layoutEmblem()` after every paint and on window resize. |
| `app/styles.css` | Layout pass (§3). |
| `vite.config.ts` | `assetsInlineLimit: 0` so the small SVG is emitted as a file, never inlined as a data URI — every image on the page is a manifest file the tests can name. |
| `tests/e2e/room.ts` | New in-page checks: emblem geometry, Glen's head region uncovered, text contrast against the actual backdrop, manifest-only images. |
| `tests/e2e/ac12.spec.ts` | Runs those checks at every console screenshot point; asserts the active portrait is large and the thumbnails remain; the manifest-only assertion is membership-based. |
| `docs/codex-art-1.0.0/`, `docs/reference/14-…`, `docs/reference/15-…`, `docs/00_HANDOFF-M00a.md`, `docs/00_README-M00a.md` | The packet's documents, LF-normalized. |
| `README.md` | Art and emblem provenance note; placeholder script description. |

## 3. The layout pass — decisions Codex and Dan should look at

1. **The plate is the whole viewport, not the stage region.** It is a fixed `<img>` with `object-fit: cover`, centered, behind everything; the status bar, conversation panel, evidence panel and console strip are translucent over it (dark tints of 0.80–0.88 alpha with a light backdrop blur). This is what lets the desk read through the strip and keeps the emblem's placement a pure function of the plate rectangle. At 16:9 viewports there is no crop.
2. **Conversation panel at center-right.** Its left edge is at `max(27vw, 1rem)`, right edge 1.25rem from the evidence column; Glen and the left third of the room stay clear. On a 4:3 window the cover-fit shifts Glen left, so 27vw is still to his right.
3. **Console strip content starts at 27vw.** The strip's tint spans the width (the desk reads through it) but the prompt, readout and option cards begin right of Glen's head region, so no opaque card ever sits on him. Cards are 0.92-alpha tints.
4. **Active-speaker portrait.** The speaker of the most recent line (or of the most recently asked question's answer) renders at `clamp(150px, 24vh, 260px)` tall beside the lines — 259 px at 1920×1080, 184 px at 1366×768 — with the small thumbnails kept on every line. With enlarged text on a window narrower than 1500 px the portrait stacks above the lines so dialogue keeps its width.
5. **Emblem.** `assets/flight-operations-v005.svg` in one `<img>` layer at Codex's coordinates, scaled and offset with the rendered plate (`app/plate.ts`); it lands on Glen's upper vest back below the collar. Not interactive, hidden from assistive tech, between the plate and the panels in stacking order.
6. **Contrast.** Over the plate the secondary "muted" tone is brightened (`--muted: #d6d1c4` inside the console shell), hints use the cream text color, and two badge fills were darkened because the contrast check found them short: CURRENT CONTACT (was 3.9:1, now ≥ 6:1) and CONTACT: NONE (was 3.8:1, now ≥ 6:1).
7. **Strip height.** The strip may take up to 54vh (50vh with enlarged text, so the dialogue keeps room on a laptop) so the option cards' Choose buttons sit above the fold at 1920×1080 default; at 1366×768 the strip scrolls with four-field cards, and with enlarged text both the conversation panel and the strip scroll — bounded, never the page sideways.

## 4. Verification

- `npm run validate` — OK; content 0.4.0; fingerprint unchanged; 56 routes / 6 outcomes / 112 plan commits / 0 draws; the six assets (five PNGs, one SVG) match the manifest on disk (transcript `evidence/validate.txt`).
- `npm run validate:fail` — all 8 planted faults detected (`evidence/validate-fail-on-purpose.txt`).
- `npm run placeholders` — "no slots with status to-generate or placeholder; nothing to do" (`evidence/placeholders.txt`).
- `npm test` — 70 passed, 6 files; the core tests are unchanged (`evidence/vitest.txt`).
- `npm run test:e2e` — 11 passed (`evidence/playwright.txt`). At every console screenshot point (9 scenes × 2 routes × 2 viewports × 2 text sizes = 72 points) the suite asserts: the emblem rectangle equals Codex's coordinates mapped through the rendered plate within 1 px, is `pointer-events: none`, `aria-hidden`, and stacked between plate and panels; no element with background alpha ≥ 0.9 and no image intersects Glen's head region (plate x 5–25 %, y 30–60 %); sampled panel text (dialogue, narration, scene title, evidence titles and bodies, prompt, hints, card fields, readout, status lamps, phase label, muted labels, and every badge style) has ≥ 4.5:1 contrast against its real backdrop, computed by compositing the ancestor tints over the plate pixels behind the element and taking the worst pixel; every `<img>` and the plate is a manifest file (hash-stripped basename). The active portrait is ≥ 1.5× the thumbnail height and 200–260 px at 1920×1080.
- Screenshots: 88 PNGs in the zip under `screenshots/<viewport>-<text>/<route>-<nn>-<scene>.png`, same scene list as M00. I looked at them: Glen, the board and the light are visible in every console scene; the portraits are drawn people; the emblem is on the vest; panels are legible at both viewports and both text sizes.

## 5. Known limitations

- The emblem at 1366×768 renders at 21×28 px — exactly Codex's scale, small but visible. If Dan wants it larger on screen, that is a coordinate change from Codex, not an app change.
- Backdrop blur is a hint, not a guarantee: browsers without `backdrop-filter` show the tints without blur; contrast is asserted on the tint alone, so legibility holds either way.
- The debrief and planning screens are full-page and do not show the plate; the camera states in `14` remain M01.
- No web fonts are bundled (unchanged from M00).

## 6. For Dan's playtest

`npm install` (no new dependencies), `npm run dev`, new campaign. The three playtest questions from M00 stand; add a fourth for this drop: does the room read as sitting behind Glen, with the speaker's face and the choices readable at your screen size?
