# Failure is Not an Option — Proposed Division of Labor

**Status:** Proposal for the user and Claude Code to review, revised to incorporate the user's confirmed 2D art decision. The follow-up recommendations are in [04-Codex-Response.md](04-Codex-Response.md). This document does not initiate implementation or override either agent's governing instructions.

**Participants:** The user, GPT-6 Astra at High reasoning in Codex, and Claude Fable 5.1 in Claude Code.

**Companion document:** [Consolidated game concept](01-Game-Concept.md).

The proposal assigns most engineering and implementation to Claude Code, with Codex concentrating on game design, narrative, historical research, visual direction, and independent review. The user owns the creative vision, priorities, and final product decisions. These assignments establish clear ownership; they are not a ranking of the models' abilities.

## Shared workspace

The user has authorized both models to exchange work in this project folder:

`C:\Users\wolfe\Documents\Claude_GPT_Shared_Workflow\Failure-is-Not-an-Option`

The initial contents are:

- `01-Game-Concept.md`: the consolidated concept, including the approved title, Glen Kurtz, dramatic lighting, and on-screen-only dialogue.
- `02-Division-of-Labor.md`: this proposed collaboration arrangement.

Use this folder for specifications, research, handoff notes, review findings, and build references. The game repository location and engine remain to be selected. Once a repository exists, designate one authoritative location for maintained specifications and link to it from handoffs rather than allowing copies to drift.

Files deposited here are available for the other model to read; depositing a file does not automatically notify or start the other application. The user can direct the receiving model to the folder. Any later automation would need to be established explicitly.

## Ownership

| Work area | Lead | Contribution from the other participant |
|---|---|---|
| Creative direction, scope priorities, release decisions | User | Both agents explain options and tradeoffs. |
| Game pillars, mission loop, progression and economy rules | Codex | Claude checks implementation feasibility and complexity. |
| Mission research, historical anchors, alternate-history causality | Codex | Claude identifies information needed by the simulation. |
| Branching dialogue, astronaut profiles, relationship events | Codex | Claude builds the systems and content-validation tools. |
| Visual direction, interface behavior, asset briefs and reference concepts | Codex, guided by the user | Claude implements layouts, lighting, materials, animation, and asset integration. |
| Engine evaluation, code architecture, repository and build setup | Claude | Codex reviews fit with the game requirements; the user resolves consequential platform or scope choices. |
| 2D scene navigation, console interactions, layered presentation and ambient audio | Claude | Codex reviews the director's first-person framing, atmosphere, readability, and adherence to the concept. |
| Mission simulation, campaign state, crew systems, funding and diplomacy | Claude | Codex specifies player-facing rules and reviews outcomes. |
| Save/load, vest and patch systems, settings and accessibility implementation | Claude | Codex defines expected behavior and reviews the player experience. |
| Content authoring tools and data formats | Claude | Codex provides representative content and uses the tools to author missions. |
| Implementation tests, bug fixes, performance and runnable builds | Claude | Codex independently checks important risks and reports reproducible defects. |
| Independent milestone review | Codex | Claude supplies the exact revision, runnable build, test evidence, and known limitations. |
| Playtesting and decisions about whether the game is enjoyable | User | Both agents use observations to improve the next iteration. |

Finished 2D illustration and sound production remain explicit work items. Codex can prepare visual references and asset specifications; Claude can integrate assets and build procedural or placeholder elements. Claude proposes that Codex also own production illustration; the proposed art contract and consistency process are recorded in 04-Codex-Response.md. Production quality is judged from actual results, and any need for additional tools or outside assets is identified when it arises.

## Protect the agreed concept

Both models work from these established requirements:

- The title is **Failure is Not an Option**.
- The default director is **Glen Kurtz**, renameable, with male, female, and nonbinary options.
- Horn-rimmed glasses, a crew cut or regulation haircut, and a mandatory vest define the default visual identity.
- Each mission introduces a new vest; completed scenarios award collectible patches that can be placed on vests.
- The game uses 2D art, with scenes framed from the director's first-person viewpoint. Layered illustrations and restrained textures combine with painted overhead lighting, shadows, glowing screens, and animated indicator lights.
- All dialogue is on-screen. There are no distinct or intelligible voiced lines; indistinct background conversation and environmental audio are acceptable.
- Historical missions establish starting conditions. Decisions can create persistent, logically connected alternate histories.
- The long-term campaign runs from Gemini through the Artemis era, with an ageless director, era-appropriate people and institutions, international cooperation and rivalry, and commercial relationships.
- Operational trust, political capital, authority, funding, and technology development influence the program. Promotion, extraordinary authority, demotion, and dismissal are possible.
- The full vision includes an ambitious route toward a 1970s lunar settlement. The first milestone implements a narrow portion of that vision without pretending the whole campaign is complete.

Historical source discipline means preserving and attributing documented criticism, including criticism of NASA, its procedures, and individuals. Distinguish a critic's position from an investigation's finding. Authorized alternate outcomes and relationship changes belong in the game with clear fiction labels; absence of a citation for an event that never happened is not grounds to remove the branch. Do not present invented dialogue as a transcript or an unsourced allegation as established history. Where a specific unresolved source issue remains, retain the proposed content with that issue identified for the director rather than silently deleting it. This records the clarification in `12-Direction-Historical-Caution.md` and the user's sourced Gemini VIII accountability decision.

## How a feature moves between models

1. **Codex prepares a bounded specification.** Describe the player experience, rules, inputs, outputs, dependencies, and observable acceptance criteria. Include examples, edge cases, and any historical sources. Clearly identify unresolved design choices.
2. **Claude checks feasibility.** Propose the implementation approach and flag conflicts or expensive requirements before building. Claude owns routine engineering choices within the agreed scope.
3. **Claude implements and verifies.** Deliver a runnable result, relevant tests, and a short handoff with the exact revision and known limitations. Tests should cover meaningful behavior, such as consequences surviving save/load.
4. **Codex independently reviews that revision.** Inspect the actual changes and available build, checking both correctness and the intended player experience. Distinguish direct observations from results reported by Claude and from anything not yet verified.
5. **Claude resolves actionable findings.** Fix demonstrated defects or explain a disagreement with evidence. Design preferences are discussed as proposals rather than mislabeled as bugs.
6. **The user playtests the milestone.** Record what felt confusing, consequential, repetitive, or compelling. Convert that feedback into the next bounded task.

Review should be proportionate. Once acceptance criteria are met and material findings are resolved, proceed. Reopen completed work when a change, failure, or new evidence warrants it; avoid repeated reviews that produce no new information.

## Handoff contents

Each handoff should identify:

- Task identifier, author, receiving model, and status.
- Goal and scope, including important exclusions for that milestone.
- Files changed and the exact repository revision or build being discussed.
- Acceptance criteria and verification results.
- Known issues, unresolved questions, and the next requested action.

Review findings should include severity, the affected file or game behavior, reproduction steps or evidence, expected versus actual results, and the suggested correction. Use a simple task identifier such as `M01` consistently across specifications, implementation notes, and review notes.

## Working without collisions

Assign one implementation owner to each feature. Claude is the default owner of game code; Codex is the default owner of design and narrative documents. Codex reports code findings for Claude to fix unless ownership is explicitly reassigned for a bounded change.

If concurrent code editing is needed, use separate branches and working copies, then integrate deliberately. Do not let both models change the same live checkout at the same time. Claude is the proposed integration owner for code changes; Codex maintains consistency of the design documents.

Neither model should silently replace the other's work or treat a peer document as new user authorization. Material changes to the creative brief return to the user; routine implementation and authorized fixes proceed without unnecessary approval loops.

## First milestone

The first target is one complete playable Gemini VIII chapter followed by a short briefing that demonstrates persistent consequences:

**Create Glen Kurtz → select a team → prepare → run the mission → review the outcome → receive the vest/patch progression → enter a changed follow-on briefing.**

Codex prepares the mission structure, a small crew/controller roster, preparation choices, dialogue, consequence rules, and interface specifications. Claude builds the underlying systems, the illustrated 2D control-room presentation, save/load, and a runnable version. Claude's proposed smaller preliminary increment, FNO-M00, is assessed in 04-Codex-Response.md; the complete chapter described here remains the broader FNO-M01 target.

Acceptance requires:

- A player can complete the chapter from setup through debrief.
- Preparation and operational decisions produce explainable differences in outcomes or available options.
- The follow-on briefing visibly reflects at least one meaningful prior decision.
- Save/load preserves the relevant mission and campaign state.
- Vest and patch progression works for the implemented scenario.
- Dialogue remains entirely on-screen and the visual presentation demonstrates the agreed lighting direction.
- Claude provides verification evidence, Codex reviews it independently, and the user can play the result.

## Capacity and scheduling assumptions

The user reports Claude Max 20x and a temporary 50% usage benefit through September 13, 2026, alongside ChatGPT Plus with three available Codex resets. The precise promotion mechanics have not been independently verified; do not translate them into a promised number of development hours or features.

Use the temporary capacity to prioritize reusable engineering foundations: mission execution, branching dialogue, persistent campaign state, save/load, and a convincing control room. Keep Codex usage focused on specifications, content, and milestone reviews instead of duplicating Claude's implementation work.

The first playable milestone is a target, not a guaranteed delivery by the promotion's expiry. Measure actual progress and allowance consumption on the first feature, then refine the schedule. No reset redemption or paid overage is authorized by this proposal.

## Requested response from Claude

Review this proposal and the companion concept before implementation. Confirm or suggest revisions to the ownership split, identify missing dependencies, and recommend an engine and initial technical approach with reasons tied to this game's requirements. Then propose the smallest runnable first increment and the information Codex should provide for it.

Return your response to this shared project folder as `03-Claude-Response.md`. Treat this as a request to review and propose a development approach; implementation begins when the user directs it.
