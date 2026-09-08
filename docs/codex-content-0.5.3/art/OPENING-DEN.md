# Den reveal — asset and treatment notes, content 0.5.3

The film begins as a full-frame projection. The pull-back reveals Glen watching it in his den: dark hair, horn-rimmed glasses, vest, back to camera, still in the lounger. Glen is ageless. The lamp is off and remains set dressing. The projector and its reflected wall light are the main illumination; Glen and the furniture sit in deep shadow with selective rim light.

## Delivered layers

All coordinates are in a 1920×1080 design frame, with the origin at top left. Resolve asset IDs through the manifest.

| Layer | Asset ID | Placement x, y, width, height | Opacity |
|---|---|---|---|
| Room | opening-den | 0, 0, 1920, 1080 | 1 |
| Smoke | opening-den-smoke | 390, 315, 1152, 648 | 0.16 |
| Beam | opening-den-beam | 144, -101, 1920, 1080 | 0.32 |

The plate is RGB; smoke and beam are true RGBA. Clip both layers to the design frame. The smoke rises from the cigar/ashtray near (938, 922). The cone begins at the projector lens near (1190, 895). Composite order: room, film or credits on the projection rectangle, beam, smoke. The review PNG shows the initial wide composition with the supplied opacity values; it is a preview, not a runtime background.

`projection_rect = { x: 830, y: 115, width: 928, height: 522 }`

This is an exact 16:9 inset safely inside the illustrated wall's slightly angled outer border. It is the video/credits surface. Keep the illustrated border as overscan; do not stretch the video to that outer quadrilateral. In the initial full-film framing, set scale to `1920 / 928` and translation to `(-830 * scale, -115 * scale)` with transform origin (0, 0). At the reveal, interpolate scale and translation together to (1, 0, 0). Apply the camera transform to the entire room/layer group, not the video alone.

## Motion and timing for the montage build

Follow the later ruling in 30 §8: the credits play on the wall before final run-out. This supersedes the earlier bare-wall timing in 30 §§3 and 7.

- Start with the projector beam flickering in under the swell. Flicker is a runtime opacity multiplier, separate from the asset's base opacity; no flicker is baked into these PNGs.
- At 2:12, begin the six-second ease-out pull-back; reach the full room at 2:18. Glen does not turn or age.
- Smoke motion follows the existing moving-layer shape: `kind: rise`, `direction: up`, `seconds: 12`, `from: {x:0,y:0}`, `to: {x:0,y:-55}`. For a seamless loop, overlap successive 12-second instances by three seconds (start a new instance every nine seconds), crossfade their weights over that overlap, and reset only the invisible instance. Do not visibly snap the single layer back down. Each instance's drift is linear; weights crossfade smoothly.
- At the wide framing, scroll dedication, notices and then the ordered `registry.credits` sections inside the projection rectangle. Text stays live, readable and reviewable; no text is baked into the art.
- After credits, run out: fade the beam and darken the den over 1.5 seconds. Dissolve for 700 ms into the existing console/title composition. Match the dying warm projector glow to the console indicators and screen light. No extra transition PNG is required: the supplied room and separated light layer support this frame.
- Skip/reduced motion: static wide den and static credits, then title. Avoid mandatory waiting or animated smoke/flicker in reduced motion. This presentation never enters the run ledger.

The assets and coordinate contract are ready; the montage, archive selection, credits player, camera animation and cue wiring remain Claude Code's assembly task. This drop changes no opening player, audio cue or stage ordering. M01's existing opening remains operational.

## Source and export record

The two Lovell exports use the existing v003 sheet only. `lovell-export-record.json` records both source and inner crop boxes, preserved-pixel matte cleanup, resize and padding. Original source: `sources/lovell-sheet-v003-original.png`. No new Lovell drawing or generated face was made.

Den, smoke and beam were generated for this drop; prompts and original output paths are in `all-generation-records.json`. Runtime mapping is in `export-inventory.json`. `sources/beam.png` is the rejected first beam attempt (visible checker treatment); it is retained only as source history. `sources/beam-final.png` supplies the accepted runtime beam. The black smoke/beam mattes were converted to alpha; no checker pattern is used in runtime art. `export-*.mjs` are the original workstation processing scripts with local paths; the final JSON export record is the authoritative crop metadata. The original composite CAPCOM file remains under `history/` and is absent from the runtime manifest.

## Lighting revision — lamp off

At Dan's request, the den is darker and the floor lamp is off, retained only as set dressing. The projector and its reflected wall light are the primary illumination. Glen and the furniture recede into shadow with light on their projector-facing edges. Composition, projection coordinates, smoke/beam layers and motion are retained.

This is an art-only revision within content 0.5.3. The runtime filename `fno_opening_den_room_plate_v001.png` and asset ID `opening-den` are retained for integration compatibility; its pixels are now asset revision 2. The standalone versioned export is `art/M02-opening-den-v001/runtime/fno_opening_den_room_plate_v002.png` in the shared project. Replace the old runtime PNG if 0.5.3 has already been copied. No content JSON, manifest, integration patch, dialogue sheet or gameplay code changes accompany this revision, so the content fingerprint is unchanged.

The built-in image-generation tool performed the lighting edit. The exact prompt and source path are recorded in `art/lighting-revision-record.json`. The prior plate and composite are in `art/history/`. Image dimensions and the composite with existing smoke and beam were checked again; packet file hashes and the ZIP were rebuilt and verified. The original gameplay test results remain those of the delivered 0.5.3 content drop.
