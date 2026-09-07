# FNO-M00a — Codex art delivery v1.0.0

**For:** Dan and Claude Code · **Date:** 7 September 2026  
**Request:** `15-Claude-Art-Drop-Request.md` · **Content compatibility:** 0.4.0

Five production PNG exports fill the existing M00 slots. The room keeps the approved over-the-shoulder direction, with Glen and his chair occupying approximately the left 30% of the frame. The four controller portraits have real transparency and matching illustrated treatment. This is an art delivery; game integration and the layout pass remain with Claude Code.

## Payload and manifest

| Existing slot ID | Export filename | Format |
|---|---|---|
| room-gemini-console | fno_gemini_room_console_forward_v001.png | 1920 x 1080, RGB, opaque |
| portrait-systems | fno_gemini_portrait_mara-voss_neutral_v001.png | 768 x 1024, RGBA |
| portrait-recovery | fno_gemini_portrait_elias-reed_neutral_v001.png | 768 x 1024, RGBA |
| portrait-capcom | fno_gemini_portrait_capcom_neutral_v001.png | 768 x 1024, RGBA |
| portrait-flight-dynamics | fno_gemini_portrait_flight-dynamics_neutral_v001.png | 768 x 1024, RGBA |

All PNGs embed an sRGB ICC profile. Portrait backgrounds contain alpha 0, figure interiors alpha 255, and antialiased edges intermediate alpha values. The room contains no alpha channel. Images contain no UI lettering or official NASA marks. The vest badge is deliberately absent from the exported room plate.

`assets/manifest.json` preserves all five IDs and the existing field structure. **Compatibility adjustment:** the brief requested asset status `delivered`, but the actual manifest schema accepts only `to-generate`, `placeholder`, or `final`. Each asset therefore uses `final`; the top-level delivery status is `delivered`. No schema edit is required. Manifest version is 1.0.0 and task is FNO-M00a; content version remains 0.4.0.

`FILES.sha256` lists every payload file except itself. Paths are relative to the extracted packet root. The ZIP contains exactly five PNGs, one manifest, this handoff, and the checksum file. It contains no masters, code, content changes, or preview images.

## Exact emblem placement

Use the existing shared project master **`art/flight-operations-v005.svg`**, rendered directly as the separate application image layer. It is intentionally not redrawn or baked into this PNG delivery.

At the room's native **1920 x 1080** dimensions, the complete SVG image rectangle is:

- **x = 180 px, y = 628 px** (top-left origin).
- **width = 30 px, height = 40 px**.
- No rotation; preserve the SVG's complete 900 x 1200 viewBox and its internal transparent margins.

This places the small emblem on the upper vest back below the collar. The placement was visually checked using the existing v005 PNG companion; application integration should render the exact SVG master.

For a plate-sized overlay container these correspond to left **9.375%**, top **58.148148%**, width **1.5625%**, height **3.703704%**. If the plate uses `object-fit: cover` or `contain`, apply its scale and image offsets to the badge as well: screen x = image offset x + 180 * scale; screen y = image offset y + 628 * scale. Do not position the badge independently against the viewport or the surrounding UI panel. Keep it behind conversation/evidence overlays and non-interactive.

## Validation and visual review

The actual build's `scripts/validate.ts` was run against a temporary root containing these assets and a copy of the repository's unchanged content, using the repository's existing schemas. Result: **validate: OK**, content version **0.4.0**, **56 complete routes**, **6 distinct outcomes**, **112 plan commits**, **0 draws**.

Content fingerprint: `95f41b37ff67b2424db30544cb14106d7517f1ae110bc1a7b74bae76b96ce85f`.

Additional export checks verified PNG dimensions, RGB/RGBA modes, embedded sRGB profiles, actual transparent and opaque pixel populations, and package checksums. All four portraits were compared together on dark and light backgrounds at 288 x 384 and 72 x 96 display sizes. Heads, glasses, headsets and clothes remain distinct and readable. Mara and Elias preserve their established scene-reference identities; the two unnamed controllers are fictional composites.

This validation does not replace Claude Code's integration screenshots. The new conversation-panel placement, active portrait sizing, evidence panel, option-strip transparency, emblem overlay, and default/large-text checks at 1366 x 768 and 1920 x 1080 still need to be verified in the application.

## Provenance and masters

Generation used the **built-in OpenAI image_gen.imagegen tool**, with Dan's human art direction and Codex prompt preparation. No API/CLI image-generation fallback was used. The room was edited from the approved `art/scene-samples-v002/01-console-over-shoulder.png`; portrait style and Mara/Elias identities were referenced from `02-return-decision-over-shoulder.png` in that same folder. These are project-generated references, not third-party photographic cutouts.

The room was uniformly resampled from 1672 x 941 to 1920 x 1080 using Lanczos, with a subpixel vertical crop to match 16:9; it was not stretched. Portrait sources were 1086 x 1448. After **Dan explicitly authorized local image processing**, pale painted checkerboards were removed from Mara, CAPCOM and Flight Dynamics; Elias's existing alpha was normalized and residual edge key color removed. The cutouts were proportionally resized and placed on transparent 768 x 1024 canvases. No anatomy, face identity, or clothing was redrawn during local cleanup.

The shared project retains the following outside the game repository and outside this ZIP:

- `art/FNO-M00a-v1.0.0/masters/`: original generated selections and cleaned alpha masters.
- `art/FNO-M00a-v1.0.0/PROMPTS-USED.md`: generation and edit prompts, version 1.0.0.
- `art/FNO-M00a-v1.0.0/SOURCES.json`: selected generator filenames.
- `art/FNO-M00a-v1.0.0/qa/`: light/dark portrait comparisons, alpha report, emblem placement preview, validator output and package verification.

## Claude Code integration

Follow section "What Claude Code does when the zip lands" in request 15: verify hashes, swap assets and manifest, perform the panel visibility pass, add the exact SVG overlay at the coordinates above, run validation and the screenshot suite, and return `FNO-M00a-BUILD.zip` with screenshots and commit hash. Keep mission content, schemas and simulation unchanged. Camera-state transitions remain M01. No repository files were changed by this art delivery.
