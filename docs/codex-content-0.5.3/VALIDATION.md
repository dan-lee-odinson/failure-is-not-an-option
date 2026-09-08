# Content 0.5.3 — validation

Baseline: content 0.5.2 integrated in M01, commit `d679b2b198c4f4e933229138355b679e1e314524`. All work ran in a separate copy of that baseline. The live repository was not edited.

| Check | Result |
|---|---|
| npm test | PASS — 135 tests, 15 files |
| npm run typecheck | PASS |
| npm run validate | PASS — 56 complete routes, 6 outcomes, 112 plan commits, 0 draws |
| npm run dialogue-sheet | Regenerated; committed sheet equals fresh generation in tests |
| Dialogue sheet | 728 strings; 219 branch-only; content 377, core 73, app 278 |
| Mechanics comparison | PASS — see mechanics-audit.json |
| Existing manifest entries | All 64 retained entries identical; only composite CAPCOM removed; 5 additions; 69 total |
| Image metadata / alpha | PASS — all 5 exports; see image-qa.json |
| Image visual review | Both Lovell cuts and den/layer composite inspected |
| Original Lovell source | Byte-identical to the v003 sheet; hash recorded |
| Integration patch | git apply --check passed against the frozen M01 baseline |

Content fingerprint: `63fa5eacd8b7433e9e08b6c03f366d621eac5bc7fa72d24c994f427897ccf36d`.

The new contract tests reject missing CAPCOM provenance, impossible H7 pages and invalid den rectangles. They check the two optional questions cause no immediate ledger/evidence/cursor change and preserve the resulting semantic ledger and outcome. Questions retain the existing asked/answered log behavior, so later `at_event` indices shift when the questions are asked. No save migration: the existing version gate now rejects pre-0.5.3 saves, including 0.5.2.

The dialogue-sheet coverage test continues to check the M01 renderer. Only the newly authored credits are labeled as future montage content; they are captured on the sheet without claiming they already appear in the opening. Seven unreachable legacy content strings remain unchanged from M01.

No browser end-to-end suite was run for this content drop. M01's previously reported 37 browser tests are baseline evidence, not a new 0.5.3 result. The den is reviewed as assets/composite, not as an implemented animated opening. Packaging integrity and ZIP CRC results are recorded in FNO-M00-Codex-Content-v0.5.3-VERIFICATION.json beside the ZIP.

## Lighting revision — lamp off

At Dan's request, the den is darker and the floor lamp is off, retained only as set dressing. The projector and its reflected wall light are the primary illumination. Glen and the furniture recede into shadow with light on their projector-facing edges. Composition, projection coordinates, smoke/beam layers and motion are retained.

This is an art-only revision within content 0.5.3. The runtime filename `fno_opening_den_room_plate_v001.png` and asset ID `opening-den` are retained for integration compatibility; its pixels are now asset revision 2. The standalone versioned export is `art/M02-opening-den-v001/runtime/fno_opening_den_room_plate_v002.png` in the shared project. Replace the old runtime PNG if 0.5.3 has already been copied. No content JSON, manifest, integration patch, dialogue sheet or gameplay code changes accompany this revision, so the content fingerprint is unchanged.

The built-in image-generation tool performed the lighting edit. The exact prompt and source path are recorded in `art/lighting-revision-record.json`. The prior plate and composite are in `art/history/`. Image dimensions and the composite with existing smoke and beam were checked again; packet file hashes and the ZIP were rebuilt and verified. The original gameplay test results remain those of the delivered 0.5.3 content drop.
