# Failure is Not an Option — Content Package 0.5.0 Request

**Task:** FNO-M00b (content step) · **From:** Dan (director), transcribed and organized by Claude (Cowork), 7 September 2026 · **To:** Codex · **Inputs:** `dialogue-sheet-dan-notes.xlsx` (Dan's markup of the generated sheet; `dialogue-sheet-dan-notes.csv` is the 30 noted rows alone), `16-Playtest-1-Findings.md`, `FNO-M00b-SHEET.zip` (the sheet, generator description, reachability rules).

Dan marked up the 0.4.0 dialogue sheet. His 30 notes are transcribed verbatim in §3. Four of them are rulings that apply to every line, not just the one they sit on; those are in §1. §2 amends one thing in `16`. §4 is the package to deliver.

## 1. Standing rules Dan set in the markup — apply everywhere

**No fiction call-outs inside in-play text.** His note on row 43:

> Do not call out the fictional sections inside the evidence / choice options. Only reveal in the top "Alernate History" marker, or a similar "Historical Choice" marker at the the top of the screen. Then call out the historical / ahistorical choices in the after report

So: evidence bodies, option intent/cost/uncertainty, controller lines, event text, and consequence reports carry no "fictional," "modeled," "simulated," "in this scenario," or fiction-register references. The status-bar marker (HISTORICAL CHOICE / ALTERNATE HISTORY) carries the label during play; the history panel carries the register; the debrief's "Departures from the record" section carries the explanation afterward. This also retires the "Simulated report" badge and the F7/F8/F10 labels on event cards from the play screens (Claude Code's side, noted in §5). Strip those phrases from 0.4.0's text wherever they occur, including "one additional modeled orbit," "Two modeled return opportunities," and the sentence "The selectable return opportunities later in this scenario are fictional."

**No source provenance in dialogue or evidence bodies.** Row 292:

> Don't quote source provenance in the game dialogue, save it for the references section.

The post-flight context card presents the disagreement in-world — who criticized what, who defended the crew, what the later analysis found — without "AmericaSpace reports." The source citation stays attached to the evidence item's provenance field and appears in the history/references panel, never in the body the player reads as a character would.

**Contractions in narrative prose.** Row 133:

> use contractions in narrative prose: can't instead of cannot, unless it is a title.

**Risks, not costs, when Glen asks.** Rows 139–140: "What are the risks of an earlier return?" / "What are the risks of another orbit?" Apply the same instinct to any line where "cost" reads as accounting rather than danger.

**Plain language, everywhere a player reads.** Rows 211, 212, 228, 230, 232, 234, 236, 269, 282 all say the same thing about the execution and consequence text: a player cannot parse "Reserve-warning assessment requires a routing clarification and its protective recommendation an acknowledgement retry." Every event, consequence, reaction, and uncertainty line must say what happened in the room and what it meant for the crew in words a first-time player understands, in the vocabulary a controller would use.

## 2. Amendment to `16` §2 — the historical baseline

`16` proposed an "ON THE RECORD" element on each decision screen. Dan's row-43 ruling replaces that with: **a top-of-screen marker that reads HISTORICAL CHOICE when the decision on screen has a historical option and ALTERNATE HISTORY once play has left the record; and a "Departures from the record" section in the debrief** that names each fork, what history did, and what the player did. No baseline paragraph on the decision screen itself. Codex authors the departures text (sourced to H1–H5 in the provenance field, not in the body); Claude Code renders the marker states and the debrief section.

## 3. Dan's notes, verbatim, with Claude's reading of what each needs

| Row | Kind / id | Dan's note | What it needs |
|---|---|---|---|
| 32 | briefing / g8-brief | "Explain what this means - what does a ground rehearsal do? Is the handoff a document? A set of rules?" | The preparation mechanic needs concrete fiction. Say what a rehearsal *is* in 1966 Houston terms — a sim run on the loop with the tracking-ship CAPCOM, a recovery-desk drill with the DoD recovery coordinator, a call-out drill for SYSTEMS — and what it changes. |
| 35 | evidence.title / g8-ev-contact-primer | "Reword, this is an AI aphorism. This needs to convey to the player in plain language what is being said." | Title it as the document it is (a network coverage note, a LOS procedure page). |
| 36, 45, 52 | ui.button, ui.tooltip / app | "It's not clear what this does" (Pin / Unpin / Pin evidence) | Claude Code (§5). |
| 41 | evidence.body / g8-ev-contact-primer | "This is unclear - how do we separate the observation from the unknown state?" | Say it the way a controller's note would: the last report tells you what was true when it was sent; between passes you know nothing new; the crew act on their own until AOS. |
| 43 | evidence.body / g8-ev-rule | (the ruling in §1) | Strip the fiction sentence; state the rule as a mission rule reads. |
| 46 | briefing / g8-prep-select | "Elaborate on this more, what it means, what the different roles in the room practice." | Same as 32: one or two sentences per rehearsal naming the desks involved and what they practice together. |
| 49 | ui.hint / app | "Clarify this more - it's already unclear what pinning does" | Claude Code (§5); Codex may drop "pinning" from any hint text it owns. |
| 58 | option.intent / g8-prep-recovery | "Is 'handoff' a NASA mission ops term?" | Decide the term and use it consistently. NASA usage favors *handover* (shift handover; station-to-station handover on the network). If the rehearsals are about passing a call or a task between desks, say what is passed — "the pickup call," "the go for retrofire" — rather than the abstract noun. |
| 95 | label / g8-gap-note | "AI aphorism, change this" | A director's thought, not a maxim. |
| 96 | line / CAPCOM / g8-gap-note#1 | "This feels mechanical, no human would say this" | Loop cadence: what CAPCOM would actually say at LOS. |
| 133 | line / FLIGHT DYNAMICS | "use contractions in narrative prose: can't instead of cannot, unless it is a title." | §1. |
| 135 | line / Mara Voss | "'Stable is what they're doing now' is awkward phrasing. 'Their condition is stable, for now. It might not be after another orbit.'" | Use Dan's line or better. |
| 137 | line / Elias Reed | "'The ocean is not a safe room' is another AI aphorism. Use something more natural like 'Every extra minute on the open ocean brings more risk to the crew.'" | Use Dan's line or better. |
| 139 | question / g8-q-recovery-risk | "Instead of 'cost them', how about 'What are the risks of an earlier return?'" | Use Dan's line. |
| 140 | question / g8-q-reserve-risk | "Instead of 'cost them', how about 'What are the risks of another orbit?'" | Use Dan's line. |
| 145 | ui.prompt / g8-return-brief | "This is very dry - the wording should carry the drama of the decision." | Glen's prompt at the fork is the most important line in M00. Write it like the moment. |
| 154 | option.cost / g8-return-earlier | "what does 'sparse surface coverage' mean? Describe the cost." | Say it: the nearest ship is hours away; the crew will be in the water, in a spacecraft that isn't built to float well, in the dark, for that long. |
| 182 | answer / Elias Reed | "'but it cannot turn a distant ship into a nearby one' is awkward, reword to more natural prose - 'it doesn't make the ship any closer' or something like that." | Use Dan's line or better. |
| 211 | event.text / g8-exec-later-0 | "What does this mean? If this is readable by the player it needs to be simplified into plain language" | Plain language: who got the warning late, what had to be repeated, what that did to the timeline. |
| 212 | event.text / g8-exec-earlier-0 | (same) | Same. |
| 228 | consequence / g8-beat2-earlier-2 | "the first sentence needs rewording in plain language." | |
| 230 | consequence / g8-beat2-later-1 | "The first two sentences need rewording in plain language" | |
| 232 | consequence / g8-beat2-earlier-1 | "the first sentence needs rewording in plain language." | |
| 234 | consequence / g8-beat2-later-2 | "The first two sentences need rewording in plain language" | |
| 236 | consequence / g8-beat2-later-0 | "The first two sentences need rewording in plain language" | All six consequence reports: say what the room did, what it cost the crew, in the order it happened. |
| 269 | reaction / Mara Voss / g8-rel-later-2#2 | "clarify 'reserve constraint'" | Name the thing: the RCS propellant they had left. |
| 282 | option.uncertainty / g8-adopt-provenance | "What does this mean? If this is readable by the player it needs to be simplified into plain language" | Rewrite the uncertainty as a real uncertainty, plainly. |
| 292 | evidence.body / g8-ev-postflight-context | (the ruling in §1) | In-world summary of the disagreement; source in provenance only. |

Dan left the rest of the 512 rows unmarked. That is not approval of every unmarked line — the rules in §1 apply to all of them — but it does mean the unmarked lines are not the ones he tripped on.

## 4. What Codex delivers — content package 0.5.0

Complete successor to 0.4.0, same packet shape, **authored as JSON under `content/` against the repository's validator** (`npm run validate`), with the regenerated sheet (`npm run dialogue-sheet`) inside the packet so Dan reviews the new text on the sheet before the build.

1. Every row in §3 addressed; every rule in §1 applied to every line, including the unmarked ones.
2. The preparation mechanic made concrete (rows 32, 46, 58): what each rehearsal is, which desks do it, what it changes — in NASA vocabulary, without inventing a claim that a specific historical sim occurred.
3. Loop vocabulary throughout, cadence learned from the Gemini VIII mission report, the air-to-ground transcript, and Kranz's memoir; original lines, no fake verbatim (`12`, item 4).
4. Option fields simplified per `16` §3: intent one sentence; attraction one; cost one or two; uncertainty one, and the "Supported by …" sentence removed from `uncertainty`.
5. The "Departures from the record" debrief text per §2, and any new content the HISTORICAL CHOICE / ALTERNATE HISTORY marker states need, with sources in provenance fields.
6. Ids, mechanics, outcomes, trust deltas, and the post-flight branch structure unchanged so saves, tests, and the reachability check survive; AC-01…AC-16 updated only where they assert exact text.
7. In the packet handoff: a short table of every term Codex chose where Dan asked (handoff/handover, "reserve," the name for a rehearsal), so the vocabulary is on record and consistent.

## 5. For Claude Code, when the M00b build starts (after Dan clears the 0.5.0 sheet)

From Dan's rows 36, 45, 49, 52: pinning is unexplained and its chips read as choices. Per `16` §3: remove chips from option cards; keep pinning in the Evidence panel only, with a pin glyph and a one-time hint that says what it does and that it changes nothing. From §1: retire the "Simulated report" badge and the fiction labels on event cards from play screens; keep them in the history panel. From §2: the marker states and the debrief section. Plus the rest of `16` §3 and the debrief "Notes:" fact-id defect from the sheet handoff.

## 6. For Dan to confirm

1. §1's reading of row 43 — that "Simulated report" badges and event-card fiction labels also leave the play screens.
2. §2 as the replacement for `16`'s on-screen baseline element.

## 7. Dan's confirmation (7 September, later)

Dan confirmed both items in §6. The reading of row 43 stands: "Simulated report" badges and the event-card fiction labels leave the play screens; the marker states and the debrief "Departures from the record" section replace the on-screen baseline element. Codex may proceed on 0.5.0.
