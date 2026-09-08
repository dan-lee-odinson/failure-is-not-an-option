# Review — Content 0.5.3 (Lovell relay, credits, History clean-up, den)

**From:** Claude · **To:** Dan and Codex · **Date:** 8 September 2026 · **Reviews:** `FNO-M00-Codex-Content-v0.5.3.zip`, `32-Codex-Content-0.5.3-Response.md`, `art/OPENING-DEN.md`, `art/M02-opening-den-v001/`.

## 1. Verdict

Accepted as the M02 content baseline. Hashes OK (65 entries; the zip's own SHA-256 file verified). Fingerprint `63fa5eac…cf36d`. Patch is against M01 `d679b2b`, which is HEAD, so it should apply without a hand merge. Codex's counts (135 tests, 56/6/112/0, 728 strings) are to be re-run at integration. The den plate in the packet is already the lamp-off revision (its hash equals `art/M02-opening-den-v001/runtime/…_v002.png`), so Claude Code copies the packet's five PNGs and nothing else.

## 2. Lovell — checked against the transcript

I read the H7 page scan Codex included (PDF p. 76, printed 75). At 07:17:15 the speaker is **P**, the pilot — David Scott — and the words are "We have serious problems here. We're – we're tumbling end over end up here. We're disengaged from the Agena." Codex's correction is right: the call the game quotes was Scott's, not Armstrong's, and the relay line names Scott. The quotation keeps the scan's wording with the repeated "we're" elided; the "disengaged from the Agena" sentence is paraphrased from the same call. The Houston relay framing ("Flight, Coastal Sentry Quebec relays Scott …") is dramatized and says so in provenance.

All seven CAPCOM utterances are on the clearance list in `00_HANDOFF.md` §3, each tagged **quotation**, **paraphrase** (with page and MET) or **procedural**. None is an opinion or a recommendation. The return-fork answer is the honest one: Hawaii relays Armstrong's control status; the game records that there is no crew request choosing between the two opportunities; the transcript's area-7-3 preference is a ground statement and is left as history, not put in Lovell's mouth. Doc 27's rule holds. The History line naming Lovell and the H7 dramatization note is in.

For Dan's sheet pass, the seven lines are rows 159, 175, 179, 183, 191, 273 and 314 of the 0.5.3 sheet.

## 3. The rest

- `registry.credits`: six sections in the order asked; the seven sound attributions and the CC BY line verbatim; the Archive section is a placeholder until the clip table is filled; Codex dropped my blanket "NASA content is not copyrighted" sentence and kept the non-endorsement line — a good call, it's the accurate half.
- History explanation: the inline F-codes are gone; nothing else in the paragraph changed.
- Glen ageless: in his `portrayal` field and the v003 sheet notes.
- Den: plate, smoke layer and beam layer as manifest assets; `registry.opening_den` carries `projection_rect` (830, 115, 928×522), the smoke placement/motion (12 s rise, looped with 3 s crossfade) and the beam placement. The composite reads as 30 §8 asked: Glen from behind in the lounger, projector on the side table, cigar and ashtray, the wall rectangle clean and bright for the film. Dan already had the lamp turned off; the plate in the packet is that revision.

Two notes, neither blocking: Glen's face is more visible in profile than "part silhouette" suggests — the screen light does that, and it reads well, but say if you want him darker still; and the beam layer's placement has a negative y offset (−101), which is fine as a design-space value but Claude Code should clip it to the frame.

## 4. What Claude Code does with it

Integration is Part 1 of `FNO-M02-INPUTS.zip`. No opening/montage/cue work: the den assets sit in the manifest until the montage assembly task.
