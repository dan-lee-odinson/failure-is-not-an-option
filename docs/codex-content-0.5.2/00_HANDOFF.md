# Content 0.5.2 — Codex handoff

Requested package: 27 §3, following 26. Document 28 combines the prologue and resolution treatment.

## Review entry points

- [Treatment 28](28-Prologue-and-Resolution-Treatment.md)
- [Dialogue sheet](docs/dialogue-sheet.md) · [CSV for notes](docs/dialogue-sheet.csv)
- [Portrait review](art/portrait-review.png) · [Plate review](art/plate-review.png)
- [Validation](VALIDATION.md)

The sheet contains **689 strings**, including 223 branch-only strings. It includes authored M01 presentation text awaiting Claude’s player implementation; Dan’s clearance is pending.

## Delivered

Six content files at 0.5.2; hints on all four decision nodes; revised lesson intent; four historical participants with names/roles and no invented speech; six result lines and tier/plate mappings; prologue captions, layers and motion as data; period facility caption and History note.

**22 new runtime PNGs:** eight astronaut expressions, four Voss/Reed expressions, five prologue/facility backgrounds, three recovery plates, and two moving layers. The five prologue beats reuse the orbit background and docked-craft layer. All portraits are 768×1024 RGBA; backgrounds/layers are 1920×1080. Original generated sources and prompts are in art/.

SUCCESS / MIXED / COSTLY grade recovery coordination. All six original outcomes recover the crew and retain abort-safe. Existing gameplay and relationship effects are unchanged.

## Claude integration

Baseline: M00b commit **223a6cb8606b64abd11968b0f454ede12a8760fc**, content 0.5.1. The live game checkout was not edited.

1. Preserve current M00c work. Inspect integration/baseline-hashes.json and the incremental patch before merging.
2. Merge integration/content-0.5.2.patch into the current branch. It contains the content, manifest, schemas, types, validator, review-sheet tooling/tests and regenerated sheets. It passes git apply --check on the frozen M00b baseline. On a newer branch, reconcile changed contexts; do not blindly replace the checkout.
3. Copy the **22 new PNGs** from assets/ alongside the existing assets. Retain the prior room, controls, emblem, fonts and audio. The manifest is complete; this ZIP deliberately does not duplicate those unchanged media.
4. integration/files/ contains reference snapshots of code changes for manual merging. It is not an alternate player or a command to overwrite newer code. No app/ code is supplied.
5. Implement M01 using treatment 28, then regenerate the sheet against that renderer and rerun tests.

Content fingerprint: **250a124448525bf4669935e6004c745d2a2a79c5920ea72e0635f99ca8b9d780**.

The current save-version/fingerprint policy rejects older-content saves. Keep the older build available for those saves; no migration or identity rewrite is introduced here.

## Artwork provenance

Generated using OpenAI’s built-in imagegen with the accepted equipment/character/scene references. All 16 original outputs are preserved. Paired portrait atlases were cut into runtime cells with local edge-connected matte cleanup; the moving craft preserves generated alpha. The haze is exported as white light texture with luminance-derived alpha to avoid a dark rectangular cloud. Backgrounds and layers receive proportional contract-size exports.

See art/generation-record.json for the exact prompts and reference paths; art/export-inventory.json maps outputs to sources. The export script records the local preparation. Per-asset final is the manifest’s existing delivered flag, not a claim that Dan has approved the new art.

F11 labels illustrative staging, expressions, lighting and result summaries. F7/F8/F10 and the historical criticism remain intact. No new agency marks or real-person dialogue were added.

