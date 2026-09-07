# Content 0.5.0 — Dan review / Claude integration handoff

**Delivered 7 September 2026.** Complete six-file JSON successor to 0.4.0, with the generated dialogue sheet, source notes, optional presentation schema contract and a scoped integration patch. The live repository was not edited. Review the sheet before Claude’s M00b presentation build, as requested in 17.

## Review first

- [Generated dialogue sheet](docs/dialogue-sheet.md) / [CSV for notes](docs/dialogue-sheet.csv): **557 strings**, **201 branch-only** strings, generated from actual content and renderer over 56 routes. Do not edit the generated source-of-truth sheet by hand; mark a separate review copy.
- [Interface additions and three title studies](../art/apollo-navigation-v002/preview-v002.html), also delivered independently in `FNO-Apollo-Navigation-v002.zip`.
- [Updated opening treatment](07-Opening-Cinematic.md).

The sheet includes the existing start/menu and other application strings. Those still reflect the prototype opening until Claude builds direction 18. Evidence-provenance rows are review metadata retained by the existing generator; provenance is shown in History, not in dialogue or the Evidence body. The seven unreachable strings listed after the sheet are existing unavailable-option reasons whose conditions never occur on valid routes; no dialogue or departure was left unreachable.

## Content changes

Ground rehearsals name the desks, the message passed, and the receipt checked. The communications gap uses a last-known report and explicitly unknown current state. Return cards name the crew’s exposure at sea or the propellant needed for reentry. Consequences tell the reader what happened first, which call needed repeating, and how that affected the crew. Mara and Elias retain their opposed recommendations and lasting relationship consequences. Cunningham and Stafford’s criticism remains attributed in the context card, alongside the analysis clearing Armstrong and Scott and Kranz’s ground-procedure criticism. No branch or criticism was deleted.

All ten options now have one-sentence intent, attraction and uncertainty, with one or two cost sentences. “Supported by” is kept as the separate rehearsal readout, never used as an uncertainty sentence. The later-order and post-flight receipts reproduce their revised choice wording. Four conditional departure paragraphs identify each player’s return fork and accountability fork. Sources stay in provenance fields and History. Contractions replace formal prose where appropriate; RCS is explained at first relevant use.

## Contract and integration

1. Copy the six files in `content/`. They require the two optional schema additions in `integration/schema/`. The asset manifest’s `content_version` is bumped to 0.5.0 solely because the validator requires every bundle component to match. No asset entry, image, dimensions, emblem, or equipment has changed. `assets/` includes the unchanged runtime baseline for a self-contained packet.
2. `decision.historical_option?: optionId` is presentation metadata, set only on termination and ground-accountability decisions. It is not a requirement, recommendation score, or effect. Existing `phase.alternate_history` wins once active. The return fork remains alternate history on either choice; a later historically aligned stance cannot reset it.
3. `debrief[].section?: "departures"` and optional `provenance: {sources, fiction, note}` extend existing rules. The four new rule IDs are the only new mission-content IDs; all preexisting IDs, conditions, effects, trust deltas, event order, quantities, outcomes, and follow-on choices remain intact. Group these paragraphs under `registry.labels.departures_heading`. `historical_choice_badge` supplies the other new label. Missing optional fields preserve 0.4.0 rendering behavior.
4. `integration/presentation-and-schema.patch` plus the full changed files supply a tested reading adapter: history marker precedence, separate departures, source notes moved from Evidence/Binder to History, in-play fiction badges removed, option and dialogue pin chips removed, and human-readable debrief notes. It also updates exact text/version assertions. Use `baseline-sha256.json` to check Claude’s current checkout before applying; merge if the file has since changed. Do not overwrite a newer concurrent presentation implementation.
5. The adapter is not the complete M00b presentation pass. Claude still implements the cinematic opening/menu, title selection, actual Apollo skin integration, once-only pin hint plus glyph, decision Details defaults and commitment stamps in the game, focus transfer on commitment, and final layout/contrast/manifest-only-images/Glen-head checks. The UI kit demonstrates those states separately. The full event-record debug display is not rewritten here. The generated sheet must be regenerated after Claude completes these app changes.

No new domain state or eligibility effects were added for history display. Existing save verification deliberately rejects another content version or fingerprint: **0.4.0 saves do not import into 0.5.0 under the current repository policy.** Preserved IDs do not by themselves bypass that check. 0.5.0 save/import and deterministic replay tests pass; no migration is claimed or implemented. Retain the old build if old playthroughs need review.

## Vocabulary decisions

| Asked term | Chosen wording and meaning |
|---|---|
| Handoff / handover | Say the actual action: pass the pickup instruction, call a warning, confirm receipt. Reserve “handover” for a genuine shift/station responsibility transfer; these drills do not require that abstraction. |
| Ground rehearsal | An extra practice run on the loops between named ground desks; it supplements established crew training. “Drill” is the shorter in-room name. |
| Contact / acknowledgement | CAPCOM and the tracking station send an instruction, read it back, and confirm receipt. A sent message is not automatically received. |
| Reserve | RCS propellant remaining for the reentry thrusters. Not oxygen, battery power, retrorocket fuel, or a generic confidence meter. |
| Cost in Glen’s questions | “What are the risks…?” The schema field `cost` stays unchanged, while its text names the risk accepted. |
| Sparse surface coverage | The nearest recovery ship is hours away; aircraft cannot remove the wait for a ship. |
| Warning routing / ownership rework | Name who had to repeat a call or settle who sends it, then state the consequence. |

The dark sea wait expresses Dan’s requested danger in the game branch. I did not add an unsupported factual claim that Gemini was inherently unfit to float; the fictional wait/exhaustion remains and is identified in the departures/register. Rehearsals, extra warning progression, delays, trust changes, and next-flight drill constraints remain authored game events, not claims about errors by the historical crew.

## Validation

- `npm run validate`: pass; **56 complete routes, 6 outcomes, 112 plan commits, 0 random draws**.
- `npm run dialogue-sheet`: pass; generated Markdown and CSV included.
- `npm test`: **75 tests pass**, including AC-01…AC-16, deterministic replay/save boundaries, generator reachability and two new history/debrief presentation tests.
- `npm run typecheck`: pass.
- `mechanics-audit.json`: independent before/after structural comparison passed, excluding declared presentation/provenance fields. Approved dedication/disclaimer copy is unchanged. All runtime image bytes match the original bundle.
- Fingerprint: `bca3210f63ce6e58be5d3949fe9cf67e72d5fdb3aa16921018eded85ddc9d6e8`.

No finished M00b build, opening movie, archival clip clearances, Modern skin, or equipment runtime integration is claimed.
