# Failure is Not an Option — Playtest 1 Findings and Next Task

**From:** Dan (director), transcribed by Claude (Cowork), 7 September 2026 · **To:** Codex and Claude Code · **Build played:** M00a, commit `c6850fe`, content 0.4.0, at 1920×1080 with enlarged text · **Status:** Dan's rulings; triage below is Claude's proposal for him to confirm.

Dan played both return routes and both post-flight stances. What follows is his feedback verbatim, then a triage into who fixes what, then the proposed next bounded task.

## 1. Dan's feedback, verbatim

> I'm not certain what pinning does.

> "A report is not continuous coverage" does not sound like language used by NASA, it sounds AI written and awkward. same with "A silent loop is not a diagnosis".

> clicking the buttons makes them blue or yellow but isn't clear if it's selecting one or the other - when a selection is made, the other option should grey out.

> Some of the choice responses are very dense, need to be simplified to be understandable.

> Use real mission control and flight terminology, but make the narrative and dialogue feel more natural.

> I do like the clarity of the outcome of the disagreement.

> There should be better markers about the decisions being historical or alternate history after the choice is made. The first time through I tried to choose the historical route but I still wasn't clear where I deviated after reading the after report.

## 2. What each finding is, and whose it is

**Pinning (Claude Code, presentation).** The evidence chips under a line and on option cards toggle an item into the right-hand Evidence panel; yellow means pinned, blue means acquired but not pinned. Nothing in the game explains this, and pinning has no effect on the mission, so it reads as a choice that does nothing. Two acceptable fixes: explain it once (a first-use hint and a tooltip: "Pin to keep this report in view. Pinning changes nothing in the mission.") and make pinned chips look pinned (a pin glyph, not a color change); or remove the chips from option cards entirely and keep pinning only in the Evidence panel. Claude's recommendation is the second: the chips on option cards sit right next to the Choose button and compete with the real decision.

**Blue/yellow buttons and greying the other option (Claude Code, presentation).** Dan read the chips as the selection mechanism. Once a Choose button is pressed the other card must visibly close: grey it, drop its Choose button, and stamp the chosen card ("ORDERED" / "CHOSEN") so the state of the decision is unambiguous. Same for prep cards (already show "Completed"; the unselected ones should not still look live when attention is exhausted — they do grey, but the chip colors distract) and for the post-flight stance. Choice state and evidence state must not share a visual language.

**Language (Codex, content).** Evidence titles like "A report is not continuous coverage." and director notes like "A silent loop is not a diagnosis." are aphorisms, not documents. A flight controller's reference is titled the way the room would name it — a mission rule number and subject, a network coverage table, a flight plan page, a procedures checklist — and a director's note reads like something Glen would actually think at the console. Controller lines should use the vocabulary of the loop: FLIGHT, CAPCOM, AOS/LOS, go/no-go, the tracking ship by its call sign, "copy," "stand by," rules by number. Sources for vocabulary that do not become fake verbatim (per `12`, item 4): the Gemini VIII mission report, the Gemini VIII air-to-ground transcript held by NASA history, and Kranz's memoir for how the flight director's loop sounded. Study the cadence; write original lines.

**Density (Codex, content; Claude Code, presentation).** The option cards carry intent, evidence, attraction, cost, uncertainty, and a "Supported by" readout — six blocks per card, two cards side by side. The content fix is fewer, plainer sentences per field, one idea each. The presentation fix is that the card should lead with intent and cost and tuck the rest behind a "Details" expander, so the choice can be read at a glance and studied on demand. Both, not one.

**The historical baseline (Codex content + Claude Code presentation — the most important finding).** Dan tried to "choose the historical route" at the return decision and could not tell afterward where he had left history. There is a structural reason: in 0.4.0 *both* return options are fictional modeling; there is no historical option on that screen, and the game says so only on a badge and in the history panel. An alternate-history game has to show the player the baseline at every point where the road forks, and it has to tell him afterward exactly where he left it. Proposed rule, for the concept and the content contract: **at every decision where the record is known, the screen states in one or two sentences what actually happened, sourced; after the run, the debrief carries a "Departures from the record" section listing each divergence point, what history did, and what the player did.** For Gemini VIII that means, at the return decision: what the real flight director's decision was and how the real recovery went (the western Pacific contingency landing on the seventh revolution, the destroyer recovery, the roughly three hours in the water), with the note that neither offered option reproduces it; and at the post-flight stance: that the ground-contingency option follows Kranz's reported position and the crew-blame option follows no historical director. Codex authors the baseline lines from H1–H5; Claude Code renders a consistent "ON THE RECORD" element at each decision and the departures section in the debrief. The ALTERNATE HISTORY badge stays, but it is not enough on its own.

**Keep as is.** The post-flight disagreement's outcome — the H5 card never altered by the stance, Glen's statement, the response, the trust log — is clear and Dan likes it. Do not redesign it; apply only the language and density passes.

## 3. Proposed next bounded task — `FNO-M00b`

Two packages, one build, then playtest 2. Camera states and the rest of M01 wait behind this; a second playtest against confusing text would waste the playtest.

**Codex — content package 0.5.0** (complete successor to 0.4.0, same packet shape; no mechanics change, ids stable so saves and tests survive):

1. Rewrite every evidence title as the document the room would call it; rewrite every director note as Glen's own thought; rewrite controller lines in loop vocabulary while keeping every fact, cost, and consequence the 0.4.0 mechanics depend on.
2. Simplify option text: intent one sentence; attraction one; cost one or two; uncertainty one. Remove the "Supported by …" sentence from `uncertainty` (it is already structured data) and write real uncertainty there.
3. Add the historical baseline lines for the two decisions and the departures-from-the-record text for the debrief, sourced to H1–H5, labeled per `12`.
4. Do not touch: the return mechanics, the six outcomes, the trust deltas, the post-flight branch's structure, AC-01…AC-16 (update only the exact-text assertions).

**Claude Code — presentation pass** (after 0.5.0 lands, one handoff zip):

1. Remove evidence chips from option cards; keep pinning in the Evidence panel with a first-use hint and a pin glyph.
2. Decision state: on Choose, stamp the chosen card and grey and disable the others; same on prep, return, lesson, stance, and plan screens.
3. Option cards lead with intent and cost; attraction, uncertainty, and the readout behind a "Details" expander, open by default on the return decision only.
4. Render the "ON THE RECORD" baseline element at each decision and the "Departures from the record" section in the debrief from the 0.5.0 content.
5. Conversation panel sized to content, so quiet screens show the room.
6. Same rules as before: no core or schema change unless a content field needs one (the baseline text is a new optional field on decision nodes and a new debrief section — record it as a contract addition), tests updated for new exact text, screenshots re-shot, one zip back.

## 4. For Dan to confirm

1. The triage above, especially removing chips from option cards.
2. The baseline rule in §2 as a standing addition to the concept ("show the record at every fork; list the departures afterward").
3. That M00b goes before the M01 camera work.

## 5. Dan's confirmation and one addition (7 September, later)

Dan confirmed §3 and §4 and added:

> I think having a separate dialogue sheet I can review outside of the playthrough would be good so that the language pieces can be reviewed and fixed cheaper.

Adopted as a standing tool, and it follows the project's own rule — if it can be derived, derive it. The sheet is **generated from `content/`**, never maintained by hand, so it cannot drift from what the game shows.

**The dialogue sheet.** `npm run dialogue-sheet` walks every mission and follow-on in play order and emits every player-visible string: scene and node, the speaker or field it belongs to (line, question, answer, director note, option intent / attraction / cost / uncertainty, evidence title / body, event text, reaction, consequence report, debrief rule, follow-on paragraph, plan label, disabled reason, UI prompt), the stable id, and the text. Two outputs from one pass: `docs/dialogue-sheet.md` for reading and for Codex, and `docs/dialogue-sheet.csv` with an empty `notes` column for Dan to mark up in a spreadsheet. Grouped by phase, in the order a player meets the text; branch-only text labeled with its branch.

**How it is used.** Claude Code builds the generator now against 0.4.0 and drops the two files in the shared subfolder. Dan marks up the CSV — what sounds wrong, what is too dense, what he would say instead — and puts it back in the subfolder. Codex writes 0.5.0 against Dan's marks and delivers the JSON content **with the regenerated sheet** in the packet, so Dan reviews the new text on the sheet before anything is built. Only after he clears the sheet does the M00b build start. That is the cheap loop: text is reviewed as text, the build is reviewed as a build, and neither waits on the other.

**Contract note.** From 0.5.0 on, Codex authors JSON against the validator (the 05/06 agreement) rather than prose tables; the sheet is how a non-programmer reviews JSON content. The sheet generator is part of `npm run validate`'s neighborhood, not the game, and lives in `scripts/`.
