# Content 0.5.3 — Lovell relay, credits, den reveal

**To:** Dan and Claude · **From:** Codex · **Request:** 31 · **Baseline:** M01 `d679b2b198c4f4e933229138355b679e1e314524`, integrated content 0.5.2.

## Confirmed direction — Lovell conveys Scott's report

Dan has reaffirmed the relay model: **Scott reports the tumbling from Gemini VIII; Lovell conveys that report to Glen and Mission Control.** Lovell remains the on-screen speaker, with his headshot, name and CAPCOM role. The source attribution identifies whose report he is relaying.

The delivered crisis line already implements this: “Flight, Coastal Sentry Quebec relays Scott…” Keep that line and its H7 PDF page 76 provenance. The Scott attribution is a correction to the original crew speaker named in the brief; it does not change Lovell's role delivering the report in the game. The Houston relay framing remains identified as dramatized in provenance.

Proceed with the existing 0.5.3 relay implementation, including Glen's two optional questions. This confirmation requires no dialogue, portrait, mechanics or code revision. The separately discussed Command 400 exchange is a possible future addition and is not added to this drop by this confirmation.

One incremental content drop. Six content files, full manifest, five new runtime PNGs, regenerated Markdown/CSV dialogue sheet, integration patch and reference files, provenance scans, source art, treatment, audit and hashes are included. All 135 tests pass; the sweep remains 56 routes and six outcomes.

## 1. What changes

- `g8-capcom` retains its ID and is now **Jim Lovell — CAPCOM**, historical, with neutral/concerned portraits cut from the v003 shirt/tie/headset sheet at 768×1024 RGBA. No new drawing. The composite CAPCOM is retired from the manifest and preserved in `art/history/`.
- All seven CAPCOM utterances, including question answers, have relay or procedural provenance. No new opinion, return recommendation or invented feeling is assigned to Lovell. Glen gains the two requested optional questions. Accountability participants are unchanged.
- The History panel gains the requested Lovell note. The alternate-history explanation loses only the two inline F-code groups; the fiction register and provenance remain intact.
- `registry.credits` has Sources, Music, Sound, Type, Archive, Made by, in that order. The seven Freesound attributions retain their original credit text, including the CC BY line verbatim. Archive remains a placeholder for the selected clips. The draft's blanket “NASA content is not copyrighted” sentence is omitted; the non-endorsement statement remains. Names, production roles and the proposed MIT/CC BY release line remain Dan's draft, with the latter explicitly pending confirmation.
- Glen's ageless rule is in his existing `portrayal` field and the shared v003 `CHARACTER-SHEETS.md` notes. The notes checksum is updated; the character sheet image and older packages are unchanged. This packet includes the revised notes.
- The den plate, smoke and beam layers are manifest assets. `registry.opening_den` records the projection rectangle and placement/motion contract. See [the treatment](art/OPENING-DEN.md) for pull-back, loop and transition details.

## 2. Historical correction for clearance

The brief attributes the emergency call to Armstrong. The scan labels the 07:17:15 call **P**, pilot **David Scott**, on **H7 PDF page 76 / printed page 75**. The delivered relay names Scott. The quotation's ellipsis removes the repeated “we’re”; the outer Houston relay and final disengagement sentence are marked as dramatized framing/paraphrase in provenance.

The return answer relays Armstrong's stated control status. In the cited local exchange, preference for area 7-3 is a ground/Flight statement; Lovell does not turn it into either a crew preference or his own recommendation. The absence of a crew request is limited to the reports available at this decision. No medical diagnosis is inferred.

## 3. Every CAPCOM line — clearance list

PDF pages count the cover and are one greater than printed page numbers. [H7 transcript](https://www.nasa.gov/wp-content/uploads/2026/01/gt08-tec.pdf); the five checked page images are under `research/`. The same list is available separately in [CAPCOM-PROVENANCE.md](research/CAPCOM-PROVENANCE.md).

### 1. `mission.phases[g8-docking].nodes[g8-docking-report].lines[0]`

> Flight, Rose Knot Victor relays Armstrong's report: they're docked.

**paraphrase** — H7 PDF p. 72; printed p. 71; MET 06:33:52.

Crew report relayed through Houston; not a verbatim Lovell utterance. Original C is command pilot Armstrong.

### 2. `mission.phases[g8-gap].nodes[g8-gap-note].lines[0]`

> Flight, we've lost the signal. We'll call at the next station.

**procedural** — no H7 page claimed.

Original procedural loss-of-signal/next-contact call for the game loop. Not a historical quotation.

### 3. `mission.phases[g8-gap].nodes[g8-gap-note].questions[g8-q-gap].answer`

> The last report confirms docking. We've no new report on their attitude.

**paraphrase** — H7 PDF p. 72; printed p. 71; MET 06:33:52.

Docking confirmation paraphrased; absence of a current report is the procedural limit of this game contact gap.

### 4. `mission.phases[g8-report].nodes[g8-crisis-report].lines[0]`

> Flight, Coastal Sentry Quebec relays Scott: “We have serious problems here. We’re … tumbling end over end up here.” They’re disengaged from the Agena.

**quotation** — H7 PDF p. 76; printed p. 75; MET 07:17:15.

P identifies pilot Scott, not Armstrong. Quoted clauses retain the scan wording; ellipsis replaces the repeated “we’re”; apostrophe typography normalized. Final sentence paraphrases the same call. Houston relay framing is dramatized, not a recorded Lovell quote.

### 5. `mission.phases[g8-report].nodes[g8-crisis-report].questions[g8-q-crew-crisis].answer`

> CSQ's next report: Scott says they're slowly regaining control in RCS DIRECT. Armstrong says they're pulsing the RCS to reduce the roll.

**paraphrase** — H7 PDF p. 77; printed p. 76; MET 07:20:05, 07:21:12.

Two successive crew updates closely paraphrased through the station; the optional question advances the report within the compressed crisis scene. No diagnosis or emotion inferred.

### 6. `mission.phases[g8-recovery].nodes[g8-return-brief].questions[g8-q-crew-return].answer`

> Hawaii relays that Armstrong has the spacecraft under control, drifting slowly with limited control. We've no crew request choosing between these two return opportunities.

**paraphrase** — H7 PDF p. 78, 79; printed p. 77, 78; MET 07:38:07, 07:39:39, 07:39:53.

Control report from C at 07:39:53. The local discussion of areas 6-3/7-3 is ground-originated; it supplies no crew preference. The transcript records Flight preferring 7-3 at 07:39:39; that remains source history, not Lovell’s recommendation. Absence wording is bounded to the relayed reports at this decision, not a claim about every utterance in the mission.

### 7. `mission.phases[g8-return-execution].nodes[g8-return-beat-1].resolutions[g8-beat1-earlier].lines[0]`

> Flight, splashdown report received. Both crew members responding.

**procedural** — no H7 page claimed.

Procedural receipt of the fictional earlier-route recovery report already established by this event; not a historical crew quotation or medical assessment.

## 4. Integration

1. Start from the M01 merged baseline identified above; `references/BUILD-HANDOFF-M01.md` records that state. Check `integration/baseline-hashes.json` before applying. If the checkout has advanced, merge the listed changes into it rather than replacing newer files wholesale.
2. Apply `integration/content-0.5.3.patch` at the repo root. It covers the six content JSON files, manifest, schemas/types, History note renderer, validators, sheet generator, tests and regenerated sheet. `integration/files/` contains reference copies of changed supporting files. Do not apply those snapshots as a second independent change.
3. Copy only the five new PNGs from this packet's `assets/` into repo `assets/`. The full manifest retains M01's audio additions and notes exactly, including Drum Background. Existing assets are intentionally omitted from the packet.
4. Run validate, tests, typecheck and sheet regeneration in the integrated checkout. Expected content fingerprint is `63fa5eacd8b7433e9e08b6c03f366d621eac5bc7fa72d24c994f427897ccf36d`. Content version is 0.5.3; the existing version gate rejects older saves without migration.
5. Assemble the future montage separately from `registry.credits`, `registry.opening_den` and the treatment. This drop changes no opening player, cue, audio routing or stage order. The sole app edit displays the requested History note. Existing prologue/resolution code is preserved.

The two questions are optional and have no gameplay effects or evidence reveals. Asking them produces the normal question log entries, which shifts later event indices; it does not change decisions or the semantic outcome. All original IDs, conditions, effects, trust values and outcomes compare equal after only the authorized presentation/text/version exceptions. See [VALIDATION.md](VALIDATION.md) and `mechanics-audit.json`.

## 5. Review and package contents

Dan can clear all wording in `docs/dialogue-sheet.md` or `.csv` (728 strings; 219 branch-only). Credits are clearly marked as authored content awaiting montage assembly; the existing M01 rendered-text coverage is retained. No further 0.5.2 sheet notes were received before packaging.

`art/lovell-review.png` and `art/den-composite-review.png` are previews. `art/sources/` holds the untouched Lovell sheet and generated art sources, including the rejected first beam for provenance only. `art/all-generation-records.json`, `art/export-inventory.json`, and `art/lovell-export-record.json` record prompts, source mapping and crop details. Runtime assets are only those in the manifest and packet `assets/`.

`FILES.sha256` lists every packet file except itself. The adjacent ZIP has its own SHA-256 file; archive CRC and per-file hash verification are recorded alongside it. Package layout keeps the established `FNO-M00-Codex-Content-v…` naming convention; this does not revert the M01 baseline.

## Lighting revision — lamp off

At Dan's request, the den is darker and the floor lamp is off, retained only as set dressing. The projector and its reflected wall light are the primary illumination. Glen and the furniture recede into shadow with light on their projector-facing edges. Composition, projection coordinates, smoke/beam layers and motion are retained.

This is an art-only revision within content 0.5.3. The runtime filename `fno_opening_den_room_plate_v001.png` and asset ID `opening-den` are retained for integration compatibility; its pixels are now asset revision 2. The standalone versioned export is `art/M02-opening-den-v001/runtime/fno_opening_den_room_plate_v002.png` in the shared project. Replace the old runtime PNG if 0.5.3 has already been copied. No content JSON, manifest, integration patch, dialogue sheet or gameplay code changes accompany this revision, so the content fingerprint is unchanged.

The built-in image-generation tool performed the lighting edit. The exact prompt and source path are recorded in `art/lighting-revision-record.json`. The prior plate and composite are in `art/history/`. Image dimensions and the composite with existing smoke and beam were checked again; packet file hashes and the ZIP were rebuilt and verified. The original gameplay test results remain those of the delivered 0.5.3 content drop.
