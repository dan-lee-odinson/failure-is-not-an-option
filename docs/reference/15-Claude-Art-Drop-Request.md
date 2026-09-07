# Failure is Not an Option — M00 Art Drop Request

**Task:** FNO-M00 art drop (call it `FNO-M00a`) · **From:** Dan, transcribed by Claude (Cowork), 7 September 2026 · **To:** Codex (images), then Claude Code (integration) · **Status:** Dan is holding his first playtest until this lands.

## Why

The M00 build is complete and verified, with labeled grey placeholders in the five art slots. Dan will not judge whether the game feels like a game against grey rectangles, and a first impression happens once. The build was made for a file swap: the manifest declares the slots, the validator checks each PNG on disk against it. This request fills the five slots with real images and makes the small layout pass needed to keep them visible. It is not M01; the three camera states in `14` stay in M01.

## What Codex delivers

Five PNGs plus an updated `assets/manifest.json`, in a zip named `FNO-M00a-Codex-Art-v1.0.0.zip` with `00_HANDOFF.md` and `FILES.sha256`, same packet shape as the content packages.

| Slot id (unchanged) | File | Dimensions | Brief |
|---|---|---|---|
| `room-gemini-console` | `fno_gemini_room_console_forward_v001.png` | **1920 × 1080**, opaque, sRGB | The forward console view from `14`: Glen over the shoulder, lower-left, one quarter to one third of frame width; steel-gray crew cut, horn-rimmed glasses, headset, ivory vest, white shirt; the room and console as most of the image; painted overhead light pools, screen glow, indicator lamps. `art/scene-samples-v002/01-console-over-shoulder.png` is the approved direction — export it at the contract size (regenerate at 1920 × 1080 or upscale the approved sample cleanly; do not stretch). **Leave the vest badge area blank**: the approved version-5 emblem is placed by the application as a separate layer at the exact master, per `09` and `14`. Note the badge position in the handoff as x, y, size in pixels. No lettering, no NASA marks anywhere in the room (screens, patches, signage). |
| `portrait-systems` | `fno_gemini_portrait_mara-voss_neutral_v001.png` | 768 × 1024, transparent, bust framing | Mara Voss, SYSTEMS. Cautious manner in expression and posture, not in competence. Same ink-and-flat-color style as the room plate. |
| `portrait-recovery` | `fno_gemini_portrait_elias-reed_neutral_v001.png` | 768 × 1024, transparent, bust framing | Elias Reed, RECOVERY. Challenging manner. |
| `portrait-capcom` | `fno_gemini_portrait_capcom_neutral_v001.png` | 768 × 1024, transparent, bust framing | Unnamed composite, direct manner. Headset. |
| `portrait-flight-dynamics` | `fno_gemini_portrait_flight-dynamics_neutral_v001.png` | 768 × 1024, transparent, bust framing | Unnamed composite, direct manner. |

Portrait rules from `04`: one canonical portrait per character, consistent framing, faces read at small size (the current UI shows them small beside the line; the layout pass below makes the active speaker larger, but the thumbnails remain). No expression variants yet. Period-appropriate 1966 dress; no insignia. The four should look like four different people who work in the same room and were drawn by the same hand. Compare them together before accepting them.

Manifest: replace each slot's `filename`, set `status` to `delivered`, fill `origin` (generated, tool, prompt version) and `attribution` honestly, keep the ids. Keep the masters outside the repo; the repo gets the exports.

## What Claude Code does when the zip lands

1. Verify `FILES.sha256`, drop the five PNGs into `assets/`, replace `assets/manifest.json`, run `npm run validate` — dimensions and alpha must match or the drop is refused.
2. Layout pass so the room stays visible: the conversation panel currently sits top-left over Glen's head and the console strip covers the desk. Move the conversation panel toward the center-right of the room area, make panels translucent over the plate, keep the evidence panel right, keep option cards in the strip but let the plate's desk read through where no card is. The active speaker's portrait renders larger in the conversation panel; the thumbnails stay. Nothing about the domain changes; the sim core is untouched.
3. Emblem overlay: composite `art/flight-operations-v005.svg` at the badge position Codex reports, scaled to the vest; one `<img>` layer above the plate. This is the only place the emblem appears in M00a.
4. Re-run the screenshot suite at both viewports and both text sizes; add the emblem overlay to the "only manifest images loaded" assertion's allow-list.
5. Return `FNO-M00a-BUILD.zip` with `00_HANDOFF.md`, the new screenshots, and the commit hash. Same rules as the M00 handoff: no remote changes beyond pushing to the existing private repository, no subagent double-checks, no content edits.

## Not in this drop

Camera states and transitions (`14`, M01). Director wardrobe and patches (M01). Expression variants. The opening cinematic. Any change to mission content, schema, or the simulation core.

## Sequence

Codex produces the zip → Dan tells Claude → Claude writes the Claude Code handoff (one zip) → Claude Code integrates and returns `FNO-M00a-BUILD.zip` → Dan playtests with art on screen. Codex's independent review of the M00 build can proceed in parallel; findings from it and from the playtest patch the repository together afterward.
