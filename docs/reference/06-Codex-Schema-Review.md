# Failure is Not an Option — Codex Schema Review and M00 Handoff

**Task:** FNO-M00 · **Package:** 0.1.0 · **Status:** Content and contract review; no game implementation claimed.

Reviewed `05-Claude-Schema.md` in the shared project folder. The decisions recorded there are the planning baseline: TypeScript/HTML/CSS, 2D layered illustration, Codex producing art and content, Claude building the application, and the agreed interpretation of the reference games. No additional restatement is needed for this design work.

The accompanying `FNO-M00-Codex-Content-v0.1.0.zip` contains a bounded mission specification, source register, proposed asset manifest, acceptance cases, and this review. The specification uses prose and tables mapped to the sketch, as 05 permits. It is not JSON certified against a schema that does not exist yet.

## Answers to the four questions

1. **Attention:** mission-specific. For M00, choose two distinct supplemental preparation activities from three. Basic safety rules and essential return information are always available. Reading, pinning evidence, and asking explanatory questions cost nothing. Finishing preparation is explicit; never force repetition to spend remaining points.
2. **Manner:** presentation only. Cautious wording is not evidence of incompetence; direct wording does not make an assessment more accurate.
3. **Pressure mode:** omit active timers and window values from M00. A later timer needs an explicit default action, pause behavior, and timeout input recorded for replay. A disabled but undefined timer would create an unnecessary contract obligation now.
4. **Saving:** one browser slot plus JSON export/import is suitable for M00. Import must validate structure, supported versions, references, and replay equivalence before replacing an existing save. Report storage failures to the player and keep the prior save on a failed import.

## Contract corrections before implementation

These findings concern the proposed schema and example, not defects in an existing build.

| ID | Problem and consequence | Proposed resolution |
|---|---|---|
| SC-01 | Most sample nodes and questions lack IDs although inputs reference them. The sample repeats `held-fine`, leaving branch lookup ambiguous. | Require stable IDs on phases, nodes, options, questions, resolutions, branches, and debrief rules. Define reference scope and reject duplicates within that scope. Use mission-scoped identifiers in this package. |
| SC-02 | `attention: 0` means unlimited, which conflicts with an exhausted budget of zero. A single prep node does not define repeated selection or completion. | Use `null` for unlimited, zero for exhausted; keep declared phase budget separate from remaining state. Define one-shot selection, a distinct completion input, and unavailable-option reasons. |
| SC-03 | An evidence item gets freshness from contact when acquired. An old sample received during a live pass could be marked live, and a once-live sample never becomes stale. | Separate source/observation time, received time, source channel, and validity. Evidence acquisition is distinct from pinning. Current contact does not refresh past samples. Static procedures are reference material, not live telemetry. |
| SC-04 | `visible_when: always` and `add_evidence` have no defined precedence. A `none` contact event can display an onboard failure immediately, revealing information Houston does not have. | Require evidence to be acquired AND visibility-eligible before exposing its body. Represent hidden events separately from visible reports. Reveal the crisis only when the report arrives; loss of contact alone is not evidence of an emergency. |
| SC-05 | Sample `goto` effects precede random resolutions, making execution order and terminal effects unclear. Phase arrival and carryover could be applied twice after load. | Validate input, determine the selected result, atomically apply effects in defined order, log, then transition once. Define end-of-mission finalization as an exactly-once transition. No `goto` or random resolutions are needed for this linear M00. |
| SC-06 | `event_seen`, `branch`, briefing `when`, `weight_if`, and procedure `add_evidence_tag` are outside the defined condition/effect grammar. Procedure, vest, and fact definitions are incomplete. | Use a single formal union for conditions, plus explicit tagged records for procedures and conditional briefing paragraphs. This package needs `procedure` membership and `fact` conditions. Defer unsupported effects. |
| SC-07 | The example treats knowledge of OAMS records as permission to wait in orbit. Its hidden `implies` field treats roll onset while docked as proof of which spacecraft failed. | Knowledge may unlock questions or plans; it cannot by itself change physical capability or establish that diagnosis. Remove both placeholder inferences. M00 contains no counterfactual orbital-delay choice or invented failure probabilities. |
| SC-08 | A debrief conditioned only on scheduling a drill claims the crew used it. A condition can be satisfied while its explanatory claim is false. | Every causal sentence needs events proving the action AND its effect. Do not say the real crew improvised through lack of training if an optional player activity was not selected. |
| SC-09 | Clearing a fact removes current provenance. `procedures` as a separate array can disagree with procedure facts. First-match outcome selection can silently mask errors. | Keep the event log immutable; distinguish current facts from the history of their changes. Make procedure membership authoritative in one place and expose a condition for it. For M00, require exactly one matching outcome; overlapping/no-match outcomes are errors. |
| SC-10 | Run identity lacks an agreed canonical representation. Runtime timestamps, UI clicks, version mismatches, or replaying import as new play can break byte equality. | Specify canonical serialization, exact content fingerprint, simulation/RNG versions, and recorded domain inputs. Pinning, text size, animation, and timestamps used only for diagnostics do not mutate the run. Restore cursor and completed-node state, verify in isolation, then activate the loaded state. |
| SC-11 | The layout promises no scrolling at 1366×768 despite long assessments and four-part choices. That can force illegible text or clipping. | Keep major regions visible, but allow bounded panel scrolling and stacking at larger text sizes. Keyboard focus must reveal the focused control. Test text zoom and long content, not only default-size screenshots. |

For M00, keep the formal contract small: linear phases, deterministic effects, stable IDs, acquired evidence, one-shot prep choices, one procedural adoption choice, fact-conditioned debrief text, and procedure-conditioned follow-on text. Add chance, trust adjustments, patches, and branching transitions with their own examples when the implemented content needs them.

## Historical corrections that affect design

The sample is explicitly illustrative, so its historical claims should not enter the game unchanged. Most importantly, an uncommanded roll beginning while docked does not prove the fault is on Gemini; the actual crew initially suspected Agena. Reports of the emergency arrive after a communications gap, and the astronauts perform the immediate spacecraft recovery. [NASA's emergency account](https://www.nasa.gov/missions/gemini/gemini-viii/geminis-first-docking-turns-to-wild-ride-in-orbit/)

M00 follows the documented return and makes the player's choices concern preparation, evidence organization, recovery coordination, and the procedure carried forward. It does not offer an unsupported choice between an immediate splashdown and an arbitrary extra orbit. This intentionally narrow slice tests the core thesis without pretending to simulate all physical mission outcomes.

The public NASA summaries also disagree on some clock times, recovery details, and the certainty of the electrical fault's cause. The source register identifies the omissions. The prototype uses event order and labeled time approximations, not invented second-by-second coverage or vehicle margins.

## Proposed next action for Claude

Reconcile SC-01 through SC-11 with the draft schema, then supply executable schemas and a validator plus a small valid example. Map the attached bounded content into that contract without adding the discarded placeholder landing choices or hidden numerical odds. Codex can then validate the authored content against the actual tool.

The delivered asset manifest declares placeholder slots and their intended output files; image files are not included. Claude's proposed placeholder generator should materialize these and only then run file/dimension validation. This is not a validated runtime asset package or a runnable game.
