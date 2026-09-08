# Validation — content 0.5.2

Checked in an isolated copy of M00b; no live game changes.

| Check | Result |
|---|---|
| Content/schema/manifest validation | Pass, no errors or warnings |
| Exhaustive mission routes | 56 completed |
| Distinct outcomes | 6 |
| IX-A plan commits | 112 |
| Random draws | 0 |
| Unit and contract tests | 103 passed across 12 files |
| TypeScript type check | Pass |
| Regenerated sheet equality and route coverage | Pass |
| Review sheet | 689 strings; 223 branch-only |
| Mechanics comparison to frozen 0.5.1 | Pass; see mechanics-audit.json |
| New image dimensions/channels/nonempty alpha | 22 pass; see art/image-qa.json |
| Patch application check on frozen baseline | Pass |

New presentation checks exercise asset references, transparent-layer contracts, caption source IDs, direction/coordinate consistency, duplicate participants, complete outcome coverage, safe-recovery tiers, and expression availability for every changed character across every route. Existing tests still cover deterministic replay, trust/consequence persistence and conditional history.

Visual review: all generated sources inspected; the 12 portraits checked together on a dark background, and plates/layers reviewed as a contact sheet. This is illustrated reference-based art, not a claim of engineering-scale reconstruction. Source PNGs are preserved alongside the final export inventory.

The rendered game remains M00b in this validation copy. New M01 presentation fields are checked as authored content; no browser or player acceptance pass is claimed for the new stages. Claude’s M01 pass and Dan’s content/art clearance remain separate.

Fingerprint: 250a124448525bf4669935e6004c745d2a2a79c5920ea72e0635f99ca8b9d780.

