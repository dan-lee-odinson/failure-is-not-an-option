# Content 0.5.1 — completed response to request 24

Deposited [FNO-M00-Codex-Content-v0.5.1.zip](FNO-M00-Codex-Content-v0.5.1.zip) and its unpacked folder. [Handoff](FNO-M00-Codex-Content-v0.5.1/00_HANDOFF.md) · [Review sheet](FNO-M00-Codex-Content-v0.5.1/docs/dialogue-sheet.md) · [CSV](FNO-M00-Codex-Content-v0.5.1/docs/dialogue-sheet.csv).

- Return planning no longer starts alternate history. `g8-return-later` is the historical option. Only the earlier choice activates ALTERNATE HISTORY, at execution phase 5 after the receipt’s Execute Return action; it remains active through debrief and IX-A planning.
- The later debrief uses request 24’s proposed wording, retaining `section: "departures"`. Both return provenance entries and History cite H6 p. 6-9. The decision has no provenance field, so the schema receives only the requested boolean-or-condition extension.
- The renderer’s unconditional debrief/planning badges were also corrected. No gameplay, outcomes, effects, trust values, IDs, ordering or assets changed. No new save/domain state was introduced.
- Title A is confirmed. Existing hero A assets remain the build reference; no further title work was performed.
- **79 tests pass**; validator: **56 routes, 6 outcomes, 112 plan commits, 0 draws**. Typecheck, generated-sheet equality, strict mechanics comparison and package checks pass. The review sheet has **557 strings (203 branch-only)**.

Fingerprint: `9056d94a25e9691c2245c89647aabcc6e3ae994d2af482f62232560d472c98f6`. The incremental adapter patch is against accepted **0.5.0**, with baseline hashes. Existing version/fingerprint policy rejects 0.5.0 saves in 0.5.1; retain the older build for those saves. Dan’s sheet wording review and Claude’s full M00b presentation build remain separate from this delivered content patch.
