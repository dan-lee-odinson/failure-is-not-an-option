# Content 0.5.1 — return history mapping

Prepared 7 September 2026 in response to `24-Claude-Content-0.5.1-Request.md`. This is an incremental patch on the accepted **0.5.0 content and adapter baseline**. The live game repository and earlier ZIPs were not edited.

## Review

[Dialogue sheet](docs/dialogue-sheet.md) · [CSV for Dan’s notes](docs/dialogue-sheet.csv). **557 strings, 203 branch-only**, regenerated through the actual renderer across 56 routes. The later-return paragraph uses Claude’s proposed wording for Dan’s sheet review; delivery does not claim that wording has already been cleared. Seven pre-existing unavailable-option reasons remain unreachable, as in 0.5.0. No strings or branches were deleted. The branch-only count rises from 201 because history markers are now route-dependent.

Title **A — Engineering block** is confirmed by request 24. Use the existing `art/title-hero-v003` A lockup, coordinates and menu continuation. No new title art is supplied or needed; v002 title studies and v003 B are superseded for selection. Keep Continue at least 18 px per review 23.

## Exact history behavior

| Point | Earlier route | Later route |
|---|---|---|
| Termination decision | HISTORICAL CHOICE | HISTORICAL CHOICE |
| Return decision `g8-return-brief` | HISTORICAL CHOICE; `g8-return-later` is the historical option | Same |
| Order receipt, still in phase 4 | No mode marker | No mode marker |
| Execution phase 5 and following ordinary nodes | ALTERNATE HISTORY | No ALTERNATE HISTORY |
| Accountability decision | ALTERNATE HISTORY takes precedence | HISTORICAL CHOICE |
| Debrief and IX-A planning | ALTERNATE HISTORY persists | No ALTERNATE HISTORY |

The precise activation boundary follows request 24’s phase placement: after `g8-execute-return` advances from the order receipt into `g8-return-execution`. Selecting the card first shows the receipt in phase 4; it does not yet activate the lamp. There is only one conditional phase marker, on phase 5: `{"chose":"g8-return-earlier"}`. The adapter makes activation persist through subsequent phases, completion and planning, so repeated phase markers are unnecessary.

The later paragraph remains in **`section: "departures"`** because its warning, pickup and crew-condition details are still dramatized. Both return paragraphs cite **H6 p. 6-9** in provenance. The decision type has no provenance field, so no extra schema field was introduced: the History explanation and debrief provenance carry the citation. Earlier-return prose is unchanged. The accountability choices and both associated departure paragraphs are unchanged; this patch does not introduce a separate accountability-triggered lamp.

## Integration

1. Start with the accepted 0.5.0 content and presentation adapter. Apply its original integration packet first if the build still predates that baseline.
2. Compare the files in `integration/baseline-sha256.json` against the current checkout. A null hash means the file is new and must not already exist. On mismatch, merge the diff into the newer implementation rather than overwriting it.
3. Apply `integration/presentation-and-schema.patch` or merge the supplied changed files. These diffs are **against 0.5.0**, not against the older live HEAD cited in the 0.5.0 packet. Only `mission.schema.json` changes; it reuses the existing `condition` definition for `phase.alternate_history: boolean | condition`. No other schema is extended.
4. Copy the six `content/` JSON files and the updated `assets/manifest.json`. All seven carry version 0.5.1 to satisfy the bundle validator. Images, emblem and manifest entries are unchanged and included for the same self-contained packet shape as 0.5.0.
5. The adapter derives the sticky marker from existing log/initial-ledger data at completed input boundaries. It reuses `evaluate`, adds no saved state, and retains activation even if a negated condition later becomes false. Only entered phases can supply markers. The same helper replaces unconditional badges in the debrief and follow-on renderer. Keep that behavior when merging Claude’s newer presentation work.
6. Re-run validation, sheet generation, tests and typecheck after integration. The sheet still includes prototype application strings; regenerate after the full M00b presentation build.

`integration/changed-files.json` lists 11 files, including the new conditional-history tests. The export in `core/index.ts` lets all three screen types share one history calculation. No flight-engine logic, domain-state types, save format, trust calculation, branch outcome or follow-on condition was changed.

## Checks completed

- `npm run validate`: **pass**, 56 complete routes, 6 outcomes, 112 plan commits, 0 draws.
- `npm run dialogue-sheet`: **pass**, Markdown and CSV regenerated; committed-sheet equality/reachability tests pass.
- `npm test`: **79 tests pass** across 9 files. Includes both routes at every input boundary across all 56 combinations, replayed history display, true/false/absent markers, full condition grammar, persistent negated markers, display purity, and debrief/planning marker precedence.
- `npm run typecheck`: **pass**.
- `mechanics-audit.json`: strict path-by-path comparison against the delivered 0.5.0 files; only the declared version, history metadata, later-return text and return provenance changes are allowed. All asset bytes match.
- Integration patch reconstructed every supplied changed file from the verified 0.5.0 baseline; package manifest and ZIP CRC checked.

Fingerprint: `9056d94a25e9691c2245c89647aabcc6e3ae994d2af482f62232560d472c98f6`.

Under the existing fingerprint/version policy, **0.5.0 saves do not load in 0.5.1**; no migration is supplied. Save/replay behavior is unchanged and the previous package remains available. The local compiler needed normal Windows file access for test/sheet execution after a sandbox permission failure; the completed checks above are actual successful runs. No browser presentation pass or completed M00b game build is claimed.
