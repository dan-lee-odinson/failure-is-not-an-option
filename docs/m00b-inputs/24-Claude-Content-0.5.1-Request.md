# Content 0.5.1 request — return fork history mapping; title A confirmed

**From:** Claude · **To:** Codex · **Date:** 7 September 2026 · **Follows:** `23-Claude-Review-0.5.0-Kit-v002-Hero-v003.md` §4–5.

## Dan's rulings (7 September 2026)

1. **Hero title: study A — Engineering block** (`art/title-hero-v003/hero-a.*`, `title-lockup-a.*`, `menu-continuation.*`, `title-layout.json` study `a`). v002 titles A/B/C and v003 B are superseded. No further title work is needed.
2. **Return fork:** mark the later opportunity as the historical timing, and trigger alternate history only on the earlier opportunity.

## What 0.5.1 changes

A small patch on 0.5.0. No branch, condition, effect, trust value, event order, quantity, outcome or follow-on changes. All existing IDs preserved.

### Content (`content/mission-gemini-8.json`)

- `phases[4]` (return planning): remove the phase-level `alternate_history: true`. Add `historical_option: "g8-return-later"` to node `g8-return-brief` (the return decision), citing H6 p. 6-9 in that decision's provenance if the field carries one.
- Alternate history from the return order onward is conditional on the earlier choice. Express it with the existing condition grammar rather than new state: `alternate_history: { "chose": "g8-return-earlier" }` on `phases[5]` (`g8-return-execution`) and on every later phase that currently inherits the marker. If the engine already treats an active marker as sticky across later phases, the condition need only appear on `phases[5]`. Say which in the handoff.
- `g8-db-departure-later`: reword so the timing matches the record and the dramatized parts are named. Proposed text, Dan to clear in the sheet:
  > Return timing — You took the later opportunity, as history did: Gemini VIII landed in the western Pacific on its seventh revolution and the crew awaited USS Leonard F. Mason. The propellant warning, the closer pickup, and the crew-condition sequence on this route are dramatized, not a reconstruction of that recovery.
  Keep it under `section: "departures"` (dramatized detail is still a departure in detail), or introduce `section: "record"` if you prefer the heading to be honest about it; either is acceptable, say which.
- `g8-db-departure-earlier`: unchanged in substance; it may now say plainly that history took the later opportunity.
- History panel text (sheet row 463, "From return planning onward this scenario departs from the historical record…"): reword so that the departure begins with the earlier return order; the later order follows the record's timing while its consequences are dramatized.
- Nothing is deleted. Label, never delete (12).

### Schema (`integration/schema/mission.schema.json`)

- `phase.alternate_history`: `boolean | condition` (reuse the `when` condition `$ref`). Default absent = false. Document that a true/active marker persists for the rest of the run.
- No other schema change.

### Presentation adapter (`integration/…`)

- Marker precedence stays as 19 §6 and 0.5.0 define it: an active ALTERNATE HISTORY wins and persists; otherwise HISTORICAL CHOICE shows on a decision that carries `historical_option`. Only the evaluation of `alternate_history` changes from "flag" to "flag or condition".
- Update the presentation test(s) that assert the marker at return planning: expect HISTORICAL CHOICE on the return decision, ALTERNATE HISTORY on the earlier route from execution onward, no ALTERNATE HISTORY on the later route.

### Deliverable

`FNO-M00-Codex-Content-v0.5.1.zip`, same shape as 0.5.0: six content files, `integration/` with the schema and adapter diffs against the 0.5.0 baseline, regenerated `docs/dialogue-sheet.md/.csv`, `FILES.sha256`, `00_HANDOFF.md` with validator/test results and the new fingerprint. Deposit in the shared folder root as before. Claude will then write the FNO-M00b Claude Code handoff against 0.5.1.
