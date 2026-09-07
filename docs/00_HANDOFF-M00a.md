# FNO-M00a — Art Drop Integration Handoff to Claude Code

**Task:** FNO-M00a · **From:** Dan (director), assembled by Claude in Cowork, 7 September 2026 · **To:** Claude Code on artemis · **Repository:** `C:\Users\wolfe\projects\failure-is-not-an-option`, branch `main`, private remote `dan-lee-odinson/failure-is-not-an-option`, starting from delivery commit `23cf376` · **Status:** READY. Dan's first playtest is waiting on this.

This is a small, bounded task on top of the M00 build: put five real images into the five existing asset slots, make the layout pass that keeps the room visible, overlay the emblem, re-shoot the screenshots, return one zip. **No change to mission content, schemas, or the simulation core.** If you find yourself touching `core/`, `schema/`, or `content/`, stop and ask Dan.

## 1. Read in this order

1. `codex-art-1.0.0/00_CODEX_HANDOFF.md` — Codex's delivery note: what each file is, the exact emblem coordinates, the manifest status note, provenance.
2. `reference/15-Claude-Art-Drop-Request.md` — the request this answers; §"What Claude Code does when the zip lands" is your task list, restated with specifics in §3 below.
3. `reference/14-Over-the-Shoulder-Camera-Direction.md` — the framing the room plate follows. Its three camera states are **M01, not this task**; only the forward view is delivered.
4. `reference/09-Original-Emblem-and-Archive-Policy.md` — why the badge is blank on the plate and why the SVG master is overlaid instead.

## 2. What is in the packet

`codex-art-1.0.0/assets/`: five PNGs and `manifest.json`. Verified by Claude (Cowork) before assembly: the packet's `FILES.sha256` checks out (it is CRLF — strip `\r` before `sha256sum -c`); the room plate is 1920×1080 RGB opaque; all four portraits are 768×1024 RGBA with real alpha; the badge area on the vest is blank. `emblem/flight-operations-v005.svg` (and its PNG preview) is the approved emblem master, copied from the shared folder's `art/`.

| Slot id | File |
|---|---|
| `room-gemini-console` | `fno_gemini_room_console_forward_v001.png` |
| `portrait-systems` (Mara Voss) | `fno_gemini_portrait_mara-voss_neutral_v001.png` |
| `portrait-recovery` (Elias Reed) | `fno_gemini_portrait_elias-reed_neutral_v001.png` |
| `portrait-capcom` | `fno_gemini_portrait_capcom_neutral_v001.png` |
| `portrait-flight-dynamics` | `fno_gemini_portrait_flight-dynamics_neutral_v001.png` |

Manifest note from Codex: your schema accepts asset `status` of `to-generate` / `placeholder` / `final`, so the assets are marked `final` and the top-level `status` is `delivered`. Codex ran your `scripts/validate.ts` against a temp root with these assets and the unchanged content and got `validate: OK`, same fingerprint `95f41b37…ce85f`. Confirm that yourself in step 1 — do not take it on trust.

## 3. Steps — each with its proof

1. **Verify and swap.** Check `codex-art-1.0.0/FILES.sha256`. Copy the five PNGs into `assets/` and replace `assets/manifest.json`. Remove the five placeholder PNGs (they are no longer referenced). Make sure `npm run placeholders` does not overwrite `final` assets — it should generate only for slots whose status is `to-generate` or `placeholder`, and be a no-op now. Run `npm run validate`: dimensions and alpha must match the manifest or the drop is refused. Copy `codex-art-1.0.0/00_CODEX_HANDOFF.md` to `docs/` LF-normalized.
2. **Layout pass so the room stays visible.** The plate has Glen in the lower-left ~30% of the frame and the desk across the bottom; the board and the room are the upper-middle. Currently the conversation panel sits top-left over Glen's head and the console strip covers the desk. Do this: move the conversation panel to the center-right of the room area (roughly x 32–68%), leaving Glen and the left third clear; make the conversation, evidence, and console-strip panels translucent over the plate (a dark tint with a light backdrop blur is fine; keep text contrast ≥ 4.5:1 — assert it in the e2e test for the panel text against its actual backdrop); let the desk read through the console strip where no option card sits; render the active speaker's portrait larger in the conversation panel (on the order of 200–260 px tall at 1920×1080, scaling with viewport), keeping the small thumbnails on the citation lines. The plate uses `object-fit: cover` centered; keep it so and verify Glen is not cropped away at 1366×768 (16:9 both, so no crop — but check enlarged-text reflow doesn't push panels over his face). Nothing about the domain changes.
3. **Emblem overlay.** One `<img>` layer above the plate, below every panel, non-interactive (`pointer-events: none`, `aria-hidden`), rendering `assets/flight-operations-v005.svg` (copy the SVG master into `assets/` and add it to the manifest as a new entry, id `emblem-flight-operations`, `kind`/type as your schema allows, status `final`, origin "original fictional emblem, Dan-approved v5"). Position from Codex, at the plate's native 1920×1080: **x 180, y 628, width 30, height 40**, i.e. left 9.375%, top 58.148148%, width 1.5625%, height 3.703704% of the rendered plate rectangle — computed from the plate's rendered size and offset, never from the viewport. Update the e2e "only manifest images loaded" assertion so the SVG is allowed because it is in the manifest, not by special-casing its name.
4. **Screenshots and tests.** `npm test` (unchanged core tests must still pass — you changed nothing they test). `npm run test:e2e` with the full screenshot set at 1920×1080 and 1366×768, default and enlarged text, both routes, same scene list as M00. Add one assertion: at every screenshot point, Glen's head region of the plate (roughly x 5–25%, y 30–60% of the plate rectangle) is not covered by an opaque panel — check computed styles/opacity of any element whose bounding box intersects it. Look at the screenshots yourself before you ship them: the point of this task is what Dan sees.
5. **Commit and return.** Commit on `main` with a message that names the art package version (`FNO-M00a: Codex art v1.0.0 — real room plate and portraits, layout pass, emblem overlay`), push to the existing private remote. Return `FNO-M00a-BUILD.zip` to the shared subfolder `C:\Users\wolfe\Documents\Claude_GPT_Shared_Workflow\Failure-is-Not-an-Option\` with `00_HANDOFF.md` (commit hash, what changed file by file, validate/test/e2e transcripts, the new screenshots, any layout decision you made that Codex or Dan should look at), and `FILES.sha256`.

## 4. Rules carried over from the M00 handoff

One zip back. No runtime temp files in mounted or synced trees. LF line endings. Do not touch the shared folder root (a pickup service watches it for `<PREFIX>-G<NNN>.zip`). No LLM subagent double-checks. No content edits — if a line of Codex's text needs to change for layout reasons, it doesn't; change the layout. Ask Dan before anything that alters scope, creates a new remote, or changes the fixed decisions.

## 5. Done means

Dan opens `npm run dev`, starts a new campaign, and sees the room — Glen at the console, the board, the light — with Mara, Elias, CAPCOM and FLIGHT DYNAMICS as drawn people, the emblem on Glen's vest, and every panel legible over the art at both viewports and both text sizes. Validate passes with the real files. All prior tests pass. The zip is in the subfolder.
