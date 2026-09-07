# FNO-M00 — Gemini VIII: The Weight of the Call

**Content version:** 0.4.0. Complete successor to 0.3.0. Adds the user's sourced post-flight accountability branch without replacing the operational return choice. Target: approximately twenty minutes plus a short, skippable-reading post-flight scene; no reading deadlines, chance draws, new portraits, or global resource economy.

## Experience and historical boundary

At the console, choose which danger to accept: put the crew down sooner with a prolonged sea recovery ahead, or keep them aboard for one additional modeled orbit to reach stronger recovery coverage while the remaining control reserve runs low. Both choices can be sensible. The room executes the order according to its preparation; both the mission's ending and the next mission's preparation change.

The historical opening retains docking, the communications gap, the crew's stabilization of their spacecraft, termination of remaining objectives after RCS use, and western Pacific recovery. H1–H4 support this broad sequence. Glen Kurtz and the ground characters are fictional; all dialogue is original. The astronauts remain competent on every route.

**The two selectable return opportunities, control-reserve warning, recovery conditions, crew-condition variations, relationships, and next-mission constraints are fictional game modeling.** They are not a reconstruction of two options available to the actual flight director. In particular, a source describing an orbit before historical recovery does not establish our invented extra-orbit alternative or its feasibility. The game authorizes both options by its scenario setup, not by possession of a worksheet. Historical sources do not certify the invented margins.

At the start, show: “A historical mission with fictional return decisions and alternate outcomes.” At return planning, change the persistent mission-header badge to “ALTERNATE HISTORY”; retain it through the debrief and follow-on. A linked short explanation identifies F7–F9. Keep technical provenance in the history panel, not repeated inside every dramatic line.

## Initial state, identity, and presentation

- Mission ID `gemini-8`; content version `0.4.0`; exact content and simulation fingerprints supplied by integration. Store seed; use zero random draws.
- Start with empty facts, procedures and patches. Seed `people.g8-systems`, `people.g8-recovery`, `people.armstrong`, `people.scott`, `people.cunningham`, and `people.stafford` with `trust: 0` and `notes: []`. These are fictional relationship points toward Glen, not percentages or historical personality ratings. Global funding, operational trust, political capital and authority remain zero and unused.
- Mara/Elias trust changes only at the return's explicit relationship event; the four astronaut relationships change only at the separate post-flight response event. There is no clamping or hidden decay in M00; possible final values remain -2, -1, 0, and +1. Record before/after values and causes. Do not treat a character's criticism as a measured failure of competence.
- Every fact includes mission/event provenance. Labels are the human-readable form of its ID unless exact wording is supplied below. Immutable events retain history; pinning, reading, portraits, text size and animation never change domain state.
- Ordered nodes and explicit Continue inputs advance the simulation. Display-only time is a stage label except docking's “MET approximately 06:33”. “One additional orbit” is an authored decision cost, not a running timer or computed trajectory.
- Both operational options are available for all seven permitted preparation sets, including no preparation. Basic safety rules and risk summaries are always visible. Preparation changes additional evidence and logged ground execution, never vehicle eligibility.
- First-person 2D room, text dialogue only, dramatic steady lighting. Brief switch to an authored status panel is application UI over the same room asset; no extra illustration or portrait is needed.

| Character ID | Display | Manner / portrayal | Asset |
|---|---|---|---|
| `glen-kurtz` | Glen Kurtz — FLIGHT | Fictional player director | None |
| `armstrong` | Neil Armstrong — Command Pilot | Historical person; fictional relationship toward Glen | Text only |
| `scott` | David Scott — Pilot | Historical person; fictional relationship toward Glen | Text only |
| `cunningham` | Walt Cunningham — Astronaut | Historical criticism attributed to H5; fictional relationship toward Glen | Text only |
| `stafford` | Tom Stafford — Astronaut | Historical criticism attributed to H5; fictional relationship toward Glen | Text only |
| `g8-capcom` | CAPCOM | Unnamed composite; direct | `portrait-capcom` |
| `g8-systems` | Mara Voss — SYSTEMS | Original fictional controller; cautious | `portrait-systems` |
| `g8-flight-dynamics` | FLIGHT DYNAMICS | Unnamed composite; direct | `portrait-flight-dynamics` |
| `g8-recovery` | Elias Reed — RECOVERY | Original fictional controller; challenging | `portrait-recovery` |

Mara and Elias reuse the existing controller slots and IDs. Neither represents an actual historical console operator. Manner affects wording only. A disappointed controller still supplies every critical report and executes the order; trust does not make safety information disappear.

## Evidence registry

Acquisition AND eligibility are required to expose a body. References have no live badge. Reports retain receipt stage and known/unknown observation time; contact changes never refresh their contents. “Simulated report” is displayed on every F7 report.

| ID | Title and exact body | Acquisition / provenance |
|---|---|---|
| `g8-ev-rule` | **Terminate the mission after RCS use.** “Once RCS use is reported, the remaining docking and EVA objectives are relinquished and the room plans the contingency return. The selectable return opportunities later in this scenario are fictional.” | Automatic at briefing; reference. Historical termination principle H2; game selection boundary F7. |
| `g8-ev-contact-primer` | **A report is not continuous coverage.** “Separate the last received observation from the spacecraft's current unknown state. The crew must act onboard when contact is unavailable.” | Automatic at briefing; instructional reference grounded in H1. |
| `g8-ev-contact-worksheet` | **Rehearsed contact handoff.** “One desk sends each request; the receiving desk confirms receipt. Record unknown observation times as unknown. A sent instruction is not yet an acknowledged instruction.” | `g8-prep-contact`; original F1 reference. |
| `g8-ev-recovery-worksheet` | **Rehearsed recovery coordination.** “Assign the final pickup instruction to one desk and rehearse its readback. Keep aircraft support and surface retrieval distinct. A request cannot move a ship instantly.” | `g8-prep-recovery`; original F2 reference. |
| `g8-ev-systems-worksheet` | **Rehearsed reserve-warning handoff.** “Separate the observed warning from a diagnosis. Route an operational warning and its protective recommendation together; do not wait for a complete fault explanation.” | `g8-prep-systems`; original F3 reference. |
| `g8-ev-docked` | **Docking confirmed.** “The crew have confirmed docking with Agena.” | Docking event; H3. No roll data appended during gap. |
| `g8-ev-crisis` | **Emergency report through the tracking ship.** “The crew report an uncontrolled tumble after undocking. The report reaches the ground through Coastal Sentry Quebec.” | Crisis receipt only; H1. |
| `g8-ev-stabilized` | **Crew regain control.** “The crew have used the reentry control system to stabilize the spacecraft. The remaining mission objectives must be relinquished.” | Later stabilization receipt; H2. |
| `g8-ev-return` | **Two modeled return opportunities.** “Both offered routes terminate the mission and return to the western Pacific. Earlier return ends spacecraft exposure sooner but leaves a long wait for surface pickup. The later opportunity improves pickup coverage and costs another orbit aboard the damaged spacecraft.” | Automatic at return planning; F7 simulated planning report. Western Pacific historical context only is H2. |
| `g8-ev-air` | **Recovery support — simulated report.** “Air support is available on either route. In the earlier area, the retrieval ship is still distant. In the later area, recovery forces are concentrated closer to the modeled splashdown point.” | Automatic at return planning; F4/F7. No real coordinates or ships assigned. |
| `g8-ev-reserve` | **Control reserve — simulated report.** “Attitude is stable now. Reserve is limited. An extra orbit buys recovery coverage at the cost of reserve and another critical handoff. An exact remaining-fuel figure is not available in this model.” | Automatic at return planning; F7. This is not actual Gemini VIII telemetry. |
| `g8-ev-recovery-readback` | **Pickup desk readback — simulated report.** “The rehearsed desks have confirmed which station owns the final pickup instruction. This can avoid an approach being repeated; it cannot remove the ship's transit.” | Automatic at planning only if recovery preparation selected; F2/F7. |
| `g8-ev-systems-readback` | **Warning-routing readback — simulated report.** “The rehearsed desks have agreed how a reserve warning reaches FLIGHT and CAPCOM together. This can avoid repeating the assessment while the entry handoff is under way.” | Automatic at planning only if systems preparation selected; F3/F7. |
| `g8-ev-contact-readback` | **Acknowledgement plan — simulated report.** “The next instruction has a named sender and an acknowledgement route. The room will distinguish pending from received. This arrangement serves either return plan.” | Automatic at planning only if contact preparation selected; F1/F7. |
| `g8-ev-recovered` | **Both crew members aboard the recovery ship.** “Armstrong and Scott have been recovered alive. Their condition and the course of this return are recorded below.” | Only at actual modeled pickup event. Alive recovery has H3 context; branch details F7. |
| `g8-ev-postflight-context` | **Disagreement after Gemini VIII.** “AmericaSpace reports that later analysis cleared Armstrong and Scott. Cunningham nevertheless criticized their performance, while Stafford criticized undocking. Kranz instead identified insufficient ground contingency procedures for the docked phase. Borman and Schirra defended the crew.” | Automatic only in the later post-flight scene. Attributed paraphrase of H5, a secondary account; not a transcript or an investigation document reproduced here. |

The readback reports attest to rehearsed ground arrangements, not new fuel, ships, radio coverage, or onboard competence. Inspecting them does not perform the later handoff. It must be logged when the room executes the chosen order.

## 1. Preparation — `g8-prep`

`g8-brief` acquires the two base references. Text: “Your crew will attempt docking with Agena. Choose up to two supplemental ground rehearsals. The crew's training and the mission rules are already in place. You are deciding which handoffs this room will practice together.”

`g8-prep-select`: attention 2. Each option is one-shot, costs 1, and sets the fact and acquires the reference below. `g8-prep-finish` explicitly continues with zero, one, or two selections. Completed options show “Completed”; over-budget options show “No preparation opportunities remaining.” No transferable leftover resource.

| Option ID | Intent | Evidence | Cost / uncertainty | Effects |
|---|---|---|---|---|
| `g8-prep-contact` | Rehearse sender, receipt and acknowledgement handoffs. | `g8-ev-contact-primer` | One opportunity. Supports either route; does not improve radio coverage. | Set `g8-prepared-contact`; acquire contact worksheet. |
| `g8-prep-recovery` | Rehearse the aircraft-to-ship pickup handoff. | `g8-ev-rule` | One opportunity. Helps a stretched recovery; does not put ships closer. | Set `g8-prepared-recovery`; acquire recovery worksheet. |
| `g8-prep-systems` | Rehearse routing an uncertain reserve warning. | `g8-ev-contact-primer` | One opportunity. Helps the extra-orbit handoff; does not increase reserve. | Set `g8-prepared-systems`; acquire systems worksheet. |

All require remaining attention >=1 and no earlier selection of the same option. Each validated input atomically spends one opportunity, records the actual rehearsal as completed, sets its fact, and acquires its reference. These are performed ground exercises, not merely books the player has read.

## 2. Docking — `g8-docking`

At `g8-docking-report`, acquire `g8-ev-docked`. Display “MET approximately 06:33”. CAPCOM: “Docking is confirmed. We'll carry that report into the next contact.” Continue advances to the gap.

## 3. Communications gap — `g8-gap`

`g8-loss-of-contact`: contact none. Show “The scheduled contact has ended. There is no new spacecraft report.” Docking becomes “Previous contact”; no current spacecraft condition appears.

`g8-gap-note`: “A silent loop is not a diagnosis.” CAPCOM: “We have the last report. We do not have the next one.” Free question `g8-q-gap`, “What can we confirm?”, answers: “Docking was reported. Current attitude and crew actions are not visible to us here.” It has no domain effects.

If contact-prepared, append: “The handoff board has a blank acknowledgement field for the next report.” No hidden failure or future reserve warning is exposed. Continue reaches the report; real time and rereading do nothing.

## 4. Stabilization report — `g8-report`

`g8-crisis-report` acquires the crisis evidence. CAPCOM: “An emergency report has reached the tracking ship. The crew are dealing with the tumble onboard.”

Continue separately enters `g8-stabilization-report`, acquires stabilization evidence. Mara: “They've regained control using RCS. End the remaining objectives. Now we decide how to bring them home.” If systems-prepared, append: “The room has rehearsed separating a warning from a diagnosis. We still do not have the complete diagnosis.”

`g8-rule-decision` has one acknowledgement, `g8-order-return`: “Terminate the remaining mission and plan contingency return.” Requires the rule and stabilization evidence. Cost: remaining objectives relinquished. Uncertainty: reserve and recovery conditions. Effect: set `g8-return-directed`. This is not the strategic decision; it leads straight to it.

## 5. The operational decision — `g8-recovery`

`g8-return-brief` acquires all three base simulated reports (return, air, reserve) and applicable prepared readbacks. The alternate-history badge begins here. No optional question is needed to reveal either route's attraction or cost.

FLIGHT DYNAMICS: “Two return opportunities in this plan. The first gets them down sooner. The second puts the recovery force closer. We cannot have both.”

Mara: “Get them off the spacecraft. Stable is what they're doing now. It isn't a promise about another orbit.”

Elias: “And the ocean is not a safe room. Give me the later opportunity and I can have the recovery force waiting closer to them.”

Glen's prompt: **“Which danger are you willing to carry?”**

Free question `g8-q-recovery-risk`: “What does the earlier return cost them?” Elias: “A long wait for pickup. Air support helps, but it cannot turn a distant ship into a nearby one. A clean handoff can shorten the last part.”

Free question `g8-q-reserve-risk`: “What does another orbit cost them?” Mara: “More exposure on a damaged spacecraft and less room for a confused entry handoff. Rehearsal helps us handle the warning. It does not replenish the reserve.”

Show a plain preparation readout: recovery rehearsal READY/NOT REHEARSED; systems-warning rehearsal READY/NOT REHEARSED; acknowledgement rehearsal READY/NOT REHEARSED. Each option identifies which two rehearsals support it. Unrehearsed does not mean untrained or incapable.

| Option ID | Intent | Evidence | Attraction | Cost and uncertainty | Requirements / effects |
|---|---|---|---|---|---|
| `g8-return-earlier` | **Bring them down at the earlier opportunity.** | Return, air, reserve; relevant prepared readbacks if acquired | Ends exposure aboard the damaged spacecraft sooner. Backs Mara's priority. | Accept a prolonged wait at sea and the crew's increasing exhaustion. Elias must execute with sparse surface coverage. Supported by recovery + contact rehearsals. | Return-directed and current decision node; not previously chosen. Set `g8-return-earlier-ordered`. |
| `g8-return-later` | **Take the later opportunity, one additional modeled orbit.** | Same base reports; relevant prepared readbacks if acquired | Concentrates recovery support near pickup and avoids the earlier route's long sea wait. Backs Elias's priority. | Keep the crew aboard as control reserve becomes critical. Mara must execute a more demanding warning/entry handoff. Supported by systems + contact rehearsals. | Identical eligibility. Set `g8-return-later-ordered`. |

This is a fixed order, not a trial selection. It leads to `g8-order-receipt`, showing the chosen order and its accepted cost. Save can occur here before execution. Recorded Continue `g8-execute-return` enters the execution event. Both options remain selectable without any preparation, sufficient trust, reference pin, or hidden diagnosis.

## 6. Order execution and recovery — `g8-return-execution`

Use one deterministic execution event `g8-ground-execution`. No random resolution. Let C, R, S be presence of the contact, recovery and systems preparation facts at order time. Earlier route uses R+C; later uses S+C. The following explicit resolution table is authoritative; the count q is explanatory shorthand, not a new player resource or runtime schema requirement.

| Resolution ID | Order and preparation condition | q / resulting fact | Ground execution to log |
|---|---|---|---|
| `g8-exec-earlier-0` | Earlier; neither R nor C | 0; set `g8-earlier-q0` | Final pickup instruction requires an ownership clarification and an acknowledgement retry. Set `g8-pickup-ownership-rework` and `g8-ack-rework`. |
| `g8-exec-earlier-1` | Earlier; exactly one of R,C | 1; set `g8-earlier-q1` | If R, log successful pickup handoff (`g8-pickup-handoff-clean`) and acknowledgement retry (`g8-ack-rework`). If C, log clean acknowledgement (`g8-ack-clean`) and pickup ownership clarification (`g8-pickup-ownership-rework`). |
| `g8-exec-earlier-2` | Earlier; R and C | 2; set `g8-earlier-q2` | Log successful pickup handoff and clean acknowledgement; set `g8-pickup-handoff-clean` and `g8-ack-clean`. |
| `g8-exec-later-0` | Later; neither S nor C | 0; set `g8-later-q0` | Reserve-warning assessment requires a routing clarification and its protective recommendation an acknowledgement retry. Set `g8-warning-routing-rework` and `g8-ack-rework`. |
| `g8-exec-later-1` | Later; exactly one of S,C | 1; set `g8-later-q1` | If S, log prompt warning handoff (`g8-warning-handoff-clean`) and acknowledgement retry (`g8-ack-rework`). If C, log clean acknowledgement (`g8-ack-clean`) and warning-routing clarification (`g8-warning-routing-rework`). |
| `g8-exec-later-2` | Later; S and C | 2; set `g8-later-q2` | Log prompt warning handoff and clean acknowledgement; set `g8-warning-handoff-clean` and `g8-ack-clean`. |

Execute exactly one row and its subconditions atomically, then set `g8-ground-execution-complete`. Capture the selected order and prerequisite rehearsal-event references in its log payload. The crew always stabilize and operate the spacecraft competently. Ground preparation improves coordination; it does not create a physical reserve or retrospective spacecraft measurement. All assets start in the same route-specific positions regardless of q. Earlier-route rework delays final pickup coordination, not ship speed. Later-route rework compresses the ground handoff, not the crew's inherent skill or spacecraft capability.

### Three visible beats, using the room and status panel

Continue through `g8-return-beat-1`, `g8-return-beat-2`, and `g8-pickup-report`. No wall-clock pressure; each Continue is recorded. These are outcome events, not choices.

At beat 1, earlier route sets `g8-earlier-splashdown` and `g8-long-sea-wait`: CAPCOM: “Splashdown confirmed. Both crew members responding.” Status: SPACECRAFT EXPOSURE ENDED / SURFACE PICKUP DISTANT. Elias: “They're down. My part is not over.”

At beat 1, later route sets `g8-extra-orbit-flown` and `g8-control-reserve-critical`: Mara: “Reserve warning. This is the margin we spent to reach their recovery force.” Status: PICKUP COVERAGE IMPROVED / CONTROL RESERVE CRITICAL. This is the scripted F7 warning, not a hidden chance of death or an actual historical reading.

At beat 2, select the matching consequence below. Set its consequence fact and log the corresponding execution facts as its cause; show the text. These mechanical effects are explicitly authored fiction.

| Case | Consequence fact | Exact visible report |
|---|---|---|
| Earlier q0 | `g8-sea-exhaustion-severe` | “The pickup approach is delayed by the two ground handoff corrections. The crew are badly exhausted by the time the retrieval team reaches them; both need help transferring aboard.” |
| Earlier q1 | `g8-sea-exhaustion-moderate` | “One ground handoff needs correction before pickup. The crew are exhausted after the sea wait, but the retrieval team completes the transfer.” |
| Earlier q2 | `g8-sea-exhaustion-limited` | “The rehearsed handoffs avoid an additional pickup delay. The sea wait still leaves the crew worn down; the retrieval team brings both aboard.” |
| Later q0 | `g8-entry-handoff-compressed` | “The reserve warning and its acknowledgement need two ground handoff corrections. Entry coordination becomes a scramble. The crew complete entry and reach the closer recovery force visibly spent.” |
| Later q1 | `g8-entry-handoff-strained` | “One ground handoff needs correction under the reserve warning. The room completes the entry handoff under strain. The crew reach the closer recovery force tired but responsive.” |
| Later q2 | `g8-entry-handoff-clean` | “The reserve warning and protective recommendation pass through the rehearsed handoffs without rework. Reserve remains critical through the modeled entry sequence. The crew reach the closer recovery force tired but responsive.” |

At `g8-pickup-report`, acquire `g8-ev-recovered`; set `g8-crew-recovered`. On later routes additionally set `g8-later-splashdown` and `g8-concentrated-pickup`. A crew-condition report is a fictional narrative condition, not a medical diagnosis. Do not invent permanent disability or remove the historical astronauts from a future flight roster.

## 7. The room remembers — `g8-recovered`

`g8-relationship-response` applies the following once, only after actual pickup and the matching consequence event. This is a brief in-room reaction, not a review or report-filing system. It defines confidence in Glen's handling of that station's risk, not whether a controller likes being obeyed.

| Outcome family | Mara Voss trust delta | Elias Reed trust delta | Exact reaction |
|---|---|---|---|
| Earlier q0 | +1 | -2 | Mara: “You got them off the spacecraft. I stand by that priority.” Elias: “I accepted the order. But we sent them into that wait, then made the pickup harder. Next time recovery needs rehearsal time.” |
| Earlier q1 | +1 | -1 | Mara: “You got them off the spacecraft. I stand by that priority.” Elias: “We brought them aboard. One handoff still cost them. I want the recovery rehearsal before the next flight.” |
| Earlier q2 | +1 | 0 | Mara: “You got them off the spacecraft. I stand by that priority.” Elias: “I wanted the later return. You gave my team the preparation to make the earlier one work. We still need to practice that sea-recovery problem.” |
| Later q0 | -2 | +1 | Elias: “The closer recovery force paid off. I stand by that priority.” Mara: “The crew carried that reserve risk for us. Our handoff made the end tighter. Systems needs the next rehearsal.” |
| Later q1 | -1 | +1 | Elias: “The closer recovery force paid off. I stand by that priority.” Mara: “We got through the warning. One handoff still cost us room to think. Systems takes the next rehearsal.” |
| Later q2 | 0 | +1 | Elias: “The closer recovery force paid off. I stand by that priority.” Mara: “I wanted them down sooner. You had the room ready for the warning. We still have to rehearse that reserve constraint before another flight.” |

The critical-side trust delta is q-2 and the backed-priority side is +1. No controller withholds or falsifies future safety information. Preparation can preserve trust despite an override. Set `g8-relationships-recorded`; append the selected consequence fact to each scored person's notes; record both adjustments with the route, execution and pickup event references. At this same event, set exactly one operational lesson constraint: earlier => `g9-recovery-drill-required`; later => `g9-systems-drill-required`. These represent an allocated next-mission ground rehearsal, not a paperwork penalty or new resource meter.

`g8-lesson-decision`: retain the short procedure choice from the baseline. Both require crew-recovered and relationships-recorded. No cost in numeric resources; one selection only.

| Option ID | Intent / procedure | Evidence and limitation |
|---|---|---|
| `g8-adopt-provenance` | Require reports to distinguish confirmation from unknowns. Adopt `proc-report-provenance`. | Contact primer and crisis report. Better provenance cannot restore radio coverage. |
| `g8-adopt-recovery` | Require a combined recovery sheet with separate confirmation fields. Adopt `proc-recovery-crosscheck`. | Return and recovery reports. Better coordination does not create recovery assets. |

Procedure text: provenance — “Record sender, known observation time, receipt and unconfirmed information.” Recovery cross-check — “List air support and surface retrieval separately; distinguish requested from confirmed support.” Neither adoption reverses the experienced outcome, trust, or compulsory rehearsal.

After the procedure choice, advance to the new post-flight scene below. `g8-finish` now requires one order, one execution resolution, corresponding beat/consequence/pickup events, return relationship response, one operational lesson constraint, exactly one of the two optional baseline procedures, one accountability stance, and its completed response event. The ground-accountability route additionally requires `proc-docked-contingencies`; the crew-blame route does not adopt it. Commit one matching flight outcome and completion once. Do not award a patch, apply trust again, or close the next mission's planning choice automatically.

## 8. Post-flight — Who carries the blame?

Insert phase `g8-postflight` after `g8-lesson-decision`, before finalization. Display time: “WEEKS LATER — POST-FLIGHT DISCUSSION”. This compresses a later historical debate into a game scene; it does not assert that the named astronauts and Kranz held this particular meeting, or that every published criticism was made at that time. The exact timing and primary wording of the criticisms have not been verified from their original accounts.

`g8-accountability-brief` acquires `g8-ev-postflight-context`. Its source link and attribution remain visible. Historical background is fixed on every route: the article's reported exoneration is not erased by Glen's choice. The player is choosing the director's stance and institutional response, not voting on what physically caused the failure.

Scene text: “They came home. Now the argument moves from the flight room to the astronaut office. Some call the crew's judgment into question. Others ask what the ground failed to prepare for. Your position will tell the crews whether this room stands behind them when the checklist runs out.”

Present the reported positions as attributed summaries in the context card, not invented verbatim speeches from the historical people. Only Glen's selectable statements below are dialogue. Header label: **“Historical disagreement; fictional player stance and relationship effects.”**

`g8-accountability-decision` has two options, both available on every operational route and preparation set. Requirements: recovered crew, return relationships recorded, one baseline lesson adopted, context acquired, and no prior accountability selection. Neither option changes the return result or the astronauts' skill.

| Option ID | Intent / Glen's exact statement | Attraction | Cost / consequence preview | Immediate effects |
|---|---|---|---|---|
| `g8-back-crew-criticism` | **Side with Cunningham and Stafford; blame the crew's handling of the emergency.** “I agree with the criticism. Armstrong and Scott's handling of the emergency deserves the blame.” | Align with the critics and keep the director's ground organization out of the center of his own criticism. Fictional support from Cunningham and Stafford strengthens. | Armstrong and Scott lose trust in Glen; the director's endorsement deepens division within the corps. This stance does not overturn the reported analysis clearing the crew. | Set `g8-crew-blame-chosen`; record Glen's statement. |
| `g8-own-ground-contingencies` | **Take the historically grounded Kranz position: the ground lacked docked-flight contingencies.** “The failure we own is the lack of ground contingency procedures for the docked phase. We will correct that. I will not blame Armstrong and Scott for bringing the spacecraft home.” | Back the crew and direct the program toward a concrete contingency-procedure response. | Glen openly accepts responsibility for a failure in the ground organization. Historical disagreement among astronauts is not magically erased; no invented funding penalty is attached. | Set `g8-ground-accountability-chosen`; record Glen's statement. |

This addition is intentionally a leadership and relationship decision, independent of the earlier survival-risk tradeoff. The favorable treatment by the critics in the blame route is an explicit game extrapolation, not a sourced promise that either man would reward scapegoating. The player may make an unfair attribution; the game does not convert that attribution into historical fact.

After selection, `g8-accountability-receipt` shows the statement and “Response pending.” Recorded Continue `g8-resolve-accountability` enters the single deterministic event `g8-accountability-response`. This supports a save boundary between action and consequence.

| Resolution ID | Required stance | Exact narrative response | Applied effects |
|---|---|---|---|
| `g8-response-crew-blame` | Crew-blame-chosen, no ground-accountability stance | “Your endorsement gives the critics a stronger position in this fictional timeline. Armstrong and Scott's confidence in you falls. A disagreement within the astronaut corps has become a division sharpened by its flight director.” | Armstrong trust -2; Scott -2; Cunningham +1; Stafford +1. Set `g8-corps-division-deepened` and `g8-critic-support-gained`; append `g8-corps-division-deepened` to Armstrong/Scott notes and `g8-critic-support-gained` to Cunningham/Stafford notes. |
| `g8-response-ground-accountability` | Ground-accountability-chosen, no crew-blame stance | “You take responsibility for the ground's missing contingencies. In this fictional timeline, Armstrong and Scott's confidence in you strengthens. The criticism remains part of the record; your organization begins addressing the procedural gap.” | Armstrong trust +1; Scott +1; Cunningham and Stafford unchanged at 0. Set `g8-crew-confidence-strengthened` and `g8-docked-contingency-work-ordered`; append crew-confidence-strengthened to Armstrong/Scott notes. Adopt `proc-docked-contingencies`. |

Both resolutions set `g8-accountability-resolved`. Record the selected stance event as cause, all before/after trust values, note additions and applied facts/procedure exactly once. Mara/Elias values and operational preparation constraints are unchanged. A selected stance alone cannot support a claim that relationships changed.

`proc-docked-contingencies`, title **Docked-flight contingency development**, exact page: “Develop and rehearse ground contingencies for failures while docked: distinguish observed symptoms from suspected sources, identify the information available to crew and ground, and define coordination before communications are lost.” This is a commissioned program task, not a completed engineering procedure, flight rule or proven safety improvement. It grants no immediate physical capability. Its concrete wording/adoption is original F10, inspired by the reported Kranz criticism; it is not represented as an exact historical NASA corrective document.

Use the UI subtitle **“Historically grounded response”** for the ground-contingency option. Do not label its numerical relationship gains, this invented meeting or the authored procedure task “what happened on record.” The historical grounding is Kranz's reported position; Glen's participation and all modeled social consequences are alternate-history writing.

## Outcome records

All six have kind `abort-safe`. Each has a different ID and title; persist both. All require return-directed, crew-recovered, ground-execution-complete and relationships-recorded in addition to the matching order/q/consequence chain. Exactly one matching outcome is required; first-match selection is invalid.

| Outcome ID | Additional chain | Exact title |
|---|---|---|
| `g8-out-earlier-0` | Earlier, earlier-q0, sea-exhaustion-severe | Crew recovered — earlier return, punishing sea wait |
| `g8-out-earlier-1` | Earlier, earlier-q1, sea-exhaustion-moderate | Crew recovered — earlier return, difficult pickup |
| `g8-out-earlier-2` | Earlier, earlier-q2, sea-exhaustion-limited | Crew recovered — earlier return, coordinated pickup |
| `g8-out-later-0` | Later, later-q0, entry-handoff-compressed | Crew recovered — extra orbit, critical-reserve scramble |
| `g8-out-later-1` | Later, later-q1, entry-handoff-strained | Crew recovered — extra orbit, strained entry handoff |
| `g8-out-later-2` | Later, later-q2, entry-handoff-clean | Crew recovered — extra orbit, coordinated reserve response |

Chain shorthand in tables refers to the exact `g8-...` fact IDs defined above. Reject any contradictory route, grade, consequence or final trust values; reconstruct from the ordered log on import rather than trusting a plausible snapshot. The old single outcome `g8-abort-safe` is superseded, not a seventh fallback.

## Causal debrief rules

Show the final outcome title, crew condition, Mara/Elias before/after relationship values, and the next-mission constraint. Add a separate post-flight panel with the four astronaut relationship values and either the deepened corps division or ground-contingency commitment. Then show the applicable authored paragraphs and an expandable event record. No generated causal prose.

| Rule ID | Required facts / events | Exact text |
|---|---|---|
| `g8-db-return` | Return-directed, crew-recovered | “Docking was achieved. The remaining objectives were terminated. Both crew members were recovered alive.” |
| `g8-db-earlier` | Earlier order, earlier-splashdown, long-sea-wait | “You chose to end spacecraft exposure sooner and accepted a prolonged sea recovery.” |
| `g8-db-later` | Later order, extra-orbit-flown, control-reserve-critical, concentrated-pickup | “You chose another modeled orbit to improve pickup coverage. The crew carried the control-reserve warning through that return.” |
| `g8-db-pickup-clean` | Recovery rehearsal event, pickup-handoff-clean execution, one earlier sea-exhaustion consequence | “The recovery rehearsal was used in the pickup handoff. It avoided an ownership correction; it did not shorten the ship's transit.” |
| `g8-db-warning-clean` | Systems rehearsal event, warning-handoff-clean execution, one later entry-handoff consequence | “The systems rehearsal was used to route the reserve warning. It avoided a repeated ground assessment; it did not replenish the reserve.” |
| `g8-db-ack-clean` | Contact rehearsal event, ack-clean execution, matching return consequence | “The contact rehearsal was used to confirm the instruction's receipt. It avoided an acknowledgement retry during the return.” |
| `g8-db-rework` | Matching rework execution fact(s), corresponding q0/q1 consequence | “The logged handoff corrections affected the return you ordered. Their effects are recorded in the crew-condition and entry/pickup reports.” |
| `g8-db-recovery-next` | Earlier order, long-sea-wait, relationship event, recovery-drill-required | “Elias's response is recorded above. The next mission must include a recovery rehearsal; you will choose its companion exercise.” |
| `g8-db-systems-next` | Later order, control-reserve-critical, relationship event, systems-drill-required | “Mara's response is recorded above. The next mission must include a systems-warning rehearsal; you will choose its companion exercise.” |
| `g8-db-provenance` | Provenance adoption event and procedure membership | “You carried report provenance into the procedures binder.” |
| `g8-db-recovery-procedure` | Recovery procedure adoption event and membership | “You carried recovery cross-checking into the procedures binder.” |
| `g8-db-crew-blame` | Crew-blame-chosen, accountability response event, accountability-resolved, corps-division-deepened and critic-support-gained | “You endorsed the criticism of Armstrong and Scott. The recorded fictional response strengthened your support among the critics, reduced both crew members' trust in you, and deepened division in the astronaut corps.” |
| `g8-db-ground-accountability` | Ground-accountability-chosen, accountability response event, accountability-resolved, crew-confidence-strengthened, docked-contingency-work-ordered and docked-contingencies procedure membership | “You took responsibility for the ground contingency gap. The recorded fictional response strengthened the crew's trust in you and commissioned docked-flight contingency work. This follows the direction of Kranz's criticism as reported in the historical source.” |

Render the exact matched consequence report from section 6 as an event quotation, not a second invented outcome account. Render the exact matched relationship response from section 7 with its logged before/after adjustments. Eligibility must prove action AND effect; selecting a rehearsal alone never proves it was used. The quoted events are immutable content selected by their recorded IDs.

## Gemini IX-A — a small playable preparation decision

This supersedes the read-only 0.2.0 follow-on. It is one planning screen with a genuine selectable commitment, not a simulation of the IX-A flight. It is initialized solely from the committed Gemini VIII ledger, its completion record and the follow-on's own content. It must run without the prior scene's evidence/UI state. If completion is stored outside the ledger by the final schema, pass the validated committed completion record explicitly; do not read a live mission object.

Follow-on ID `gemini-9a-briefing`; node `g9-plan-decision`. Display “Gemini IX-A — ground preparation”. Show Mara and Elias with persisted trust: +1 “Confidence strengthened”, 0 “Working confidence”, -1 “Confidence strained”, -2 “Confidence damaged”. Critical information is always available regardless of value. Show the chosen procedure's reference, but procedure membership does not determine which plan is legal.

Also display a text-only astronaut-relationship panel for Armstrong, Scott, Cunningham and Stafford using the same trust labels. If `g8-corps-division-deepened`, show status **“Astronaut corps divided”** and text: “Your endorsement of the crew criticism still divides the corps. Armstrong and Scott enter future work with damaged confidence in you; Cunningham and Stafford's support is stronger.” If `g8-docked-contingency-work-ordered`, show **“Ground contingency work commissioned”** and its procedure task, plus: “Your crew's confidence has strengthened. The historical criticism remains visible in the source record.” Both are fictional carryover descriptions.

These relationship facts survive the next plan commitment. This version does not secretly change the historical IX-A flight roster, suppress Stafford's safety reports or claim a future reconciliation is complete. The corps division is a persistent campaign condition for later interpersonal scenes; it does not replace or relax either operational drill constraint below.

Earlier-route constraint: “The crew paid for the earlier return with a long sea wait. Recovery rehearsal is required. Choose the other exercise.” Later-route constraint: “The extra orbit carried a critical-reserve warning. Systems-warning rehearsal is required. Choose the other exercise.” These are operational ground-training commitments, not administrative corrections.

There are three authored plan options. All three tiles are visible, but only two are enabled on each valid route. No new attention counter is needed: each plan contains exactly two supplemental exercises. Each option costs the opportunity to conduct the omitted third exercise in this preparation block; all basic crew training and safety material remain in place.

| Option ID | Exact label / benefit | Availability | Commit effects |
|---|---|---|---|
| `g9-plan-recovery-systems` | **Recovery + systems-warning drills.** Rehearse both specialized risks; omit the supplemental acknowledgement drill. | Either valid branch constraint | Set `g9-plan-recovery-systems-committed` and `g9-plan-committed`. |
| `g9-plan-recovery-contact` | **Recovery + acknowledgement drills.** Strengthen the recovery handoff end to end; omit the supplemental systems-warning drill. | Recovery-drill-required only | Set `g9-plan-recovery-contact-committed` and `g9-plan-committed`. |
| `g9-plan-systems-contact` | **Systems-warning + acknowledgement drills.** Strengthen the reserve-warning handoff end to end; omit the supplemental recovery drill. | Systems-drill-required only | Set `g9-plan-systems-contact-committed` and `g9-plan-committed`. |

Disabled reasons: `g9-plan-recovery-contact` on later route — “This mission must include the systems-warning drill after Gemini VIII's reserve warning.” `g9-plan-systems-contact` on earlier route — “This mission must include the recovery drill after Gemini VIII's prolonged sea recovery.”

A selection first creates a UI-only highlighted plan. `g9-confirm-plan` is the single recorded domain input with that plan's stable option ID as payload. Validate availability again before mutation. Commit exactly one plan and show “Preparation plan committed. Flight simulation continues in a later build.” Plans are scheduled, not already performed; do not grant new rehearsal-completed facts or future safety benefits. Persist the follow-on cursor and selected commitment in the normal save/export/replay envelope. Before commitment the highlight may be reset on load; after commitment it is reconstructed from the committed fact. A duplicate confirm is rejected without mutation.

The earlier route excludes a systems+contact-only plan; the later route excludes a recovery+contact-only plan. This is a different playable offering and constraint, not a different reference-card paragraph. Both routes retain a useful alternative. The shared recovery+systems plan is deliberately a hedge that gives up the contact drill.

## State invariants and implementation boundaries

- Linear nodes, deterministic conditional effects, zero chance draws. Define recorded Continue IDs consistently for every ordinary node; the two named transition inputs above must keep their IDs.
- Exactly one operational order and one of six execution resolutions. Derive execution from recorded performed rehearsals, not pinned/read evidence. Require the correct route-specific consequence and pickup event before trust/finalization.
- Each intermediate stage has a valid save boundary: after order before execution; after execution; after each visible beat; after pickup before relationships; after relationships before lesson; after completion; at IX-A plan selection and after commitment. Restore completed-node state; do not reapply trust, facts or plans.
- Follow-on branch constraints and trust must agree with committed outcome and recorded effects. Two/no constraints, mismatched outcome/grade/people state, impossible prep budgets and any fabricated future plan are rejected by validation and replay before activation.
- The returned-complete-account, review/slot, and reference-access mechanics of 0.2.0 are removed. Its report IDs and facts are not valid 0.3.0 inputs. Earlier save versions require explicit tested migration or a clear unsupported-version error; no silent replay across versions.
- The old optional recovery-information organization choice is removed. Its useful information is folded into the operational briefing; its IDs are not aliases for the new orders. This keeps the mission short and focused.
- No physical recovery outcome depends on a trust threshold. No historical crew action is retroactively made incompetent by Glen's blame. Sourced criticisms remain attributed and visible; the user-authorized astronaut relationship losses/gains are expressly fictional responses to Glen. All grade and relationship effects are labeled game fiction.
- Exactly one post-flight stance and response; source context is acquired only after the flight, never used as crew fault evidence during the crisis. Crew-blame requires astronaut trust (-2,-2,+1,+1), division and critic-support facts, and no commissioned contingency task. Ground-accountability requires (+1,+1,0,0), confidence/work facts and the commissioned task, with no division-deepened fact. Order of vector: Armstrong, Scott, Cunningham, Stafford. Neither branch removes the historically reported disagreement.
- The final baseline lesson invariant is one selection among provenance/recovery-crosscheck, not exactly one total procedure in the ledger. The ground-accountability branch has the additional commissioned task. Duplicate response/adoption/note application, early finish before accountability resolution, or mismatched trust/stance/facts are errors. Unsupported 0.3.0 saves require explicit migration or rejection, not defaulting the new choice.
