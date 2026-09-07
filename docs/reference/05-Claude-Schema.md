# Failure is Not an Option — Schema Sketch, Worked Example, and Placeholder Layout

**Status:** Proposal for Codex to author against and for Dan to approve. This is the contract between content (Codex) and code (Claude). Nothing here is implemented; Claude Code builds when Dan directs.

**Author:** Claude (Cowork), 7 September 2026.

**Companions:** [01-Game-Concept.md](01-Game-Concept.md) · [02-Division-of-Labor.md](02-Division-of-Labor.md) · [03-Claude-Response.md](03-Claude-Response.md) · [04-Codex-Response.md](04-Codex-Response.md)

---

## 1. Decisions Dan made on 7 September, after reading 04

Dan confirmed these in his Cowork session; he may restate them to Codex directly, since 04 correctly declined to treat Claude's report as authorization.

1. **Engine: the web stack** — TypeScript with HTML/CSS presentation, layered images, no WebGL library and no desktop wrapper for M00, local browser build first. Godot 4 is the named fallback if animated composition or dynamic 2D lighting ever dominate the workload. Codex's qualifier is accepted: a later move to Godot would be a port of the core, not a lift; the portable assets are the rules, content, event format, and fixtures.
2. **Disco Elysium interpretation:** Codex's version in 04 stands. No personified internal voices in M00; evidence and uncertainty come from controllers and from clearly labeled director notes. Inline evidence links, the pinned evidence panel, and the procedures binder (as campaign facts) are in from M00. Written recollections may come later.
3. **Art ownership** (Codex produces illustrations; Claude builds layout, interaction, transitions, effects, integration) and **the noncommercial open-source intention** are Dan's decisions, not Claude's report.
4. Everything Codex accepted in 04 — determinism rule, content-ownership fix, evidence standard, packaging, draft asset contract — is adopted as written.

## 2. Repository shape

One repository, one authoritative location for specifications once it exists. Proposed layout:

```
fno/
  core/        engine-free simulation (TypeScript, no DOM, no timers) — Claude
  schema/      JSON Schema files for every content type + the validator — Claude
  content/     missions, characters, evidence, procedures, debrief text (JSON) — Codex
  assets/      illustrations + assets/manifest.json — Codex (masters kept outside the repo if large)
  app/         presentation (HTML/CSS/TypeScript) — Claude
  tests/       core unit tests, replay fixtures, browser tests with screenshots — Claude
  docs/        the specifications, moved here from this folder once the repo exists
```

Toolchain: Node LTS, Vite, TypeScript, Vitest (core), Playwright (browser tests and screenshots), Ajv (JSON Schema validation). Four commands, all of which Dan can run: `npm run dev` (play locally), `npm test`, `npm run validate` (checks every file under `content/` and `assets/manifest.json` against the schemas and reports every broken reference), `npm run build`. Claude Code installs Node on artemis at M00 kickoff if it is not already there.

The rule that makes the content-ownership fix work: **`content/` is data, never code.** No file under `content/` contains logic. Anything that needs logic becomes a declarative condition or effect in the schema (§3.6), and if the schema cannot express it, that is a schema change with a worked example and a migration note, per 04.

## 3. Schema sketch

Identifiers are lowercase strings with hyphens, unique within their type, referenced everywhere by id. Every content file carries `content_version` (a semver string Codex bumps when it ships a package) and every file that dramatizes a real person carries `dramatization: true`.

### 3.1 Campaign ledger

The single source of truth for "the program remembers." Everything the follow-on briefing reads comes from here; nothing else may be consulted.

```
ledger
  facts: { <fact-id>: { set_by: <mission-id>, at_event: <seq>, label: string } }
  quantities: { funding, operational_trust, political_capital, authority }   — numbers; M00 may leave all at defaults
  people: { <character-id>: { trust: number, notes: [<fact-id>] } }
  procedures: [ <procedure-id> ]                                              — the binder
  patches: [ { mission: <mission-id>, vest: <vest-id>, outcome: <outcome-id> } ]
```

A **fact** is a boolean with provenance. "You established a common docking standard" is a fact; so is "you overruled Flight Dynamics on Gemini VIII." Facts are the concept's persistent history and the procedures binder is a subset of them with a player-facing page.

### 3.2 Character

```
character
  id, name, role                — role: flight-director | capcom | fido | guido | eecom | gnc | surgeon | crew-commander | crew-pilot | ...
  era: gemini | apollo | ...
  portrait: <asset-id>          — placeholder id in M00
  manner: cautious | direct | challenging     — how assessments read; affects presentation, not simulation
  bio: { text, sources: [url] }
  dramatization: true
```

### 3.3 Evidence

The atom of the whole design. A choice cites evidence; a controller's assessment links to it; the evidence panel pins it.

```
evidence
  id
  kind: telemetry | report | procedure | testimony | document
  title                          — the words that become the inline link
  body                           — what the player reads when it is pinned
  visible_when: <condition>      — default: always; use to gate on preparation or on contact state
  freshness: live | stale | none — set by the phase's contact state at the moment it was recorded (04's "known telemetry versus stale data")
  implies: [string]              — HIDDEN from the player; what the engine knows this suggests. Used by outcome rules, never shown live.
  sources: [url]
```

### 3.4 Mission

```
mission
  id, title, chapter, anchors: [{ label, url }]
  starting_conditions: <condition>           — what the ledger must contain for this mission to be offered
  roster: { available: [<character-id>], required: [<character-id>] }
  phases: [ <phase> ]                        — ordered
  outcomes: [ <outcome> ]
  debrief: [ <debrief-rule> ]
  carryover: [ <effect> ]                    — applied to the ledger when the mission ends, in addition to any effects chosen during play
```

### 3.5 Phase and node

A phase is a stretch of the mission with a single contact state. Nodes inside it are what the player actually does.

```
phase
  id, title
  sim_time_start                              — mission elapsed time, "HH:MM:SS"
  contact: houston | tracking-ship | none     — who can talk to the spacecraft
  attention: integer                          — opportunities available in this phase (Citizen Sleeper's currency); 0 = unlimited
  nodes: [ <node> ]

node (one of)
  briefing      { text, documents: [<evidence-id>], director_note? }
  prep_choice   { prompt, options: [<option>], cost: 1 }             — spends attention
  assessment    { speaker: <character-id>, text, cites: [<evidence-id>],
                  questions: [{ text, reveals: [<evidence-id>], cost: 0|1 }] }
  event         { text, sets: [<effect>], sim_time }                 — the thruster sticks; contact is lost; the ship stabilizes
  decision      { prompt, options: [<option>], window?: seconds }    — window only counts in pressure mode
  note          { text }                                              — labeled "Director's note"; never carries simulation state

option
  id
  intent            — what you intend to achieve (concept §"Make uncertainty playable")
  evidence: [<evidence-id>]                     — what supports it; rendered as inline links
  cost: string                                  — what margin or resource it consumes, in words
  uncertainty: string                           — what remains unknown, in words
  requires: <condition>                         — greyed out with the reason shown if unmet; never hidden
  effects: [<effect>]
  resolves: [<resolution>]                      — see 3.7
```

### 3.6 Conditions and effects

Deliberately small. If Codex needs more, that is a schema change.

```
condition
  all: [<condition>] | any: [<condition>] | not: <condition>
  fact: <fact-id>                 — ledger contains the fact
  evidence: <evidence-id>         — player has this evidence
  contact: houston|tracking-ship|none
  trust: { who: <character-id>, at_least: number }
  chose: <option-id>              — earlier in this run

effect
  set_fact: <fact-id>, label
  clear_fact: <fact-id>
  add_evidence: <evidence-id>     — with freshness stamped from current contact
  adjust: { path: "quantities.funding" | "people.<id>.trust", by: number }
  adopt_procedure: <procedure-id>
  award_patch: { vest, outcome }
  goto: <phase-id>                — skip ahead (abort paths)
```

### 3.7 Resolution and chance

The default is **deterministic**: an option's `effects` apply and play continues. Chance exists only where the content declares it, and every chance declaration must name its cause in player-readable words, so that the debrief can say "the backup thruster valve had a 1-in-5 history of sticking; this time it stuck" rather than "you were unlucky."

```
resolution
  cause: string                   — shown in the debrief; required
  branches: [{ id, weight: number, requires?: <condition>, effects: [<effect>] }]
```

One seeded draw per resolution, in order, logged. Weights may be modified by evidence the player holds (`weight_if: [{ evidence, weight }]`) — that is how preparation changes odds without ever showing a percentage.

### 3.8 Outcome and debrief

```
outcome
  id, title, kind: success | partial | abort-safe | loss
  requires: <condition>           — evaluated at mission end, first match wins, in file order
  patch: <asset-id>

debrief-rule
  when: <condition>               — may reference events: { event_seen: <event-id> }, { chose: <option-id> }, { branch: <branch-id> }
  text                            — authored explanatory text; the debrief is the ordered list of every rule whose condition holds
```

The debrief cannot say anything that is not in a rule whose condition is satisfied by the log. That is 04's "select authored text from recorded events; never invent a causal explanation."

### 3.9 Run identity, event log, and save file

```
run
  initial_state: <ledger>         — snapshot at mission start
  sim_version, content_version, seed
  inputs: [ { seq, node, option | question | "continue" } ]     — ordered player inputs; nothing else

event-log entry
  seq, sim_time, type: input | event | draw | effect | phase
  node?, option?, draw?: { resolution, value, branch }
  delta?: <effect as applied>
  player_visible: boolean          — evidence the player could see at that moment versus engine-internal state

save file
  run + a state snapshot for fast loading; on load the snapshot is verified by replaying inputs from initial_state — mismatch is a bug, reported, not hidden
```

Replay of the same run identity must produce the same log, byte for byte. That is the first test Claude Code writes and the one that never gets deleted.

### 3.10 Assets manifest

Exactly 04's contract: `assets/manifest.json` lists id, filename (`fno_<era>_<type>_<subject>_<variant>_v001.png`), width, height, alpha, framing, reference version, origin, attribution. `npm run validate` fails on any asset referenced by content but absent from the manifest, and on any manifest dimensions that disagree with the file.

## 4. Worked example — Gemini VIII excerpt

**Everything below is illustrative shape, not sourced content.** The controller names, the assessments, the landing alternatives, and the weights are placeholders so the schema can be read as a whole; Codex replaces all of them with the source-backed specification. Where the example touches history it is flagged `FICTIONAL PLACEHOLDER`.

```json
{
  "content_version": "0.0.1-example",
  "mission": {
    "id": "gemini-8",
    "title": "Gemini VIII",
    "chapter": "gemini",
    "anchors": [
      { "label": "NASA: Gemini VIII", "url": "https://www.nasa.gov/mission/gemini-viii/" },
      { "label": "NASA: Gemini's first docking turns to wild ride in orbit", "url": "https://www.nasa.gov/missions/gemini/gemini-viii/geminis-first-docking-turns-to-wild-ride-in-orbit/" }
    ],
    "starting_conditions": { "all": [] },
    "roster": { "available": ["armstrong", "scott", "fido-1", "gnc-1", "capcom-csq"], "required": ["armstrong", "scott"] },

    "phases": [
      {
        "id": "prep",
        "title": "Preparation — the week before launch",
        "sim_time_start": "-168:00:00",
        "contact": "houston",
        "attention": 3,
        "nodes": [
          { "type": "briefing",
            "text": "First docking. Agena launched an hour ahead. EVA planned for the second day.",
            "documents": ["ev-mission-rules-rcs"],
            "director_note": "Three things you can chase this week. Pick the ones that will matter when you are out of contact." },
          { "type": "prep_choice",
            "prompt": "Where does your attention go?",
            "cost": 1,
            "options": [
              { "id": "prep-oams-history",
                "intent": "Pull the OAMS thruster acceptance history for this spacecraft.",
                "evidence": [],
                "cost": "One of three preparation opportunities.",
                "uncertainty": "The history may show nothing.",
                "requires": { "all": [] },
                "effects": [ { "add_evidence": "ev-oams-valve-history" } ] },
              { "id": "prep-undock-drill",
                "intent": "Run the crew through an unplanned undocking drill in the simulator.",
                "evidence": [],
                "cost": "One opportunity, and simulator time the EVA rehearsal wanted.",
                "uncertainty": "Whether the drill covers the failure that actually comes.",
                "requires": { "all": [] },
                "effects": [ { "set_fact": "g8-undock-drilled", "label": "Crew drilled unplanned undocking before Gemini VIII" },
                             { "adjust": { "path": "people.armstrong.trust", "by": 1 } } ] }
            ] }
        ]
      },
      {
        "id": "docked",
        "title": "Docked with Agena — over the Pacific",
        "sim_time_start": "06:33:00",
        "contact": "none",
        "attention": 0,
        "nodes": [
          { "type": "event", "id": "evt-thruster-stuck", "sim_time": "07:00:00",
            "text": "FICTIONAL PLACEHOLDER for timing. The docked stack begins an uncommanded roll. Houston has no contact.",
            "sets": [ { "add_evidence": "ev-last-telemetry-before-los" } ] },
          { "type": "note",
            "text": "Director's note — You are reading the last frame before loss of signal. Whatever is happening now, the crew are the only people who can act on it." }
        ]
      },
      {
        "id": "csq-pass",
        "title": "Coastal Sentry Quebec acquires",
        "sim_time_start": "07:08:00",
        "contact": "tracking-ship",
        "attention": 0,
        "nodes": [
          { "type": "assessment", "speaker": "capcom-csq",
            "text": "We have them. Crew reports they undocked and are tumbling, and they have gone to the RCS to stop it. Rate is coming down.",
            "cites": ["ev-csq-voice-summary"],
            "questions": [
              { "text": "Ask whether the roll started before or after undocking.", "reveals": ["ev-roll-onset"], "cost": 0 }
            ] },
          { "type": "assessment", "speaker": "gnc-1",
            "text": "If they are on the RCS, that is the reentry system. Mission rules say we bring them home.",
            "cites": ["ev-mission-rules-rcs"],
            "questions": [] }
        ]
      },
      {
        "id": "landing-decision",
        "title": "Where and when",
        "sim_time_start": "07:20:00",
        "contact": "houston",
        "attention": 0,
        "nodes": [
          { "type": "decision",
            "prompt": "The rule is not in question. The landing area is.",
            "window": 240,
            "options": [
              { "id": "land-early-contingency",
                "intent": "Bring them down at the next contingency area, this revolution.",
                "evidence": ["ev-mission-rules-rcs", "ev-recovery-posture-early"],
                "cost": "Recovery forces are thin there; hours in the water are likely.",
                "uncertainty": "How much RCS propellant is left and whether the roll is fully damped.",
                "requires": { "all": [] },
                "effects": [ { "set_fact": "g8-early-landing", "label": "Ordered an early contingency landing on Gemini VIII" }, { "goto": "outcome" } ],
                "resolves": [
                  { "cause": "FICTIONAL PLACEHOLDER — recovery timing at a contingency area depends on ship positions the director cannot change.",
                    "branches": [
                      { "id": "recovered-fast", "weight": 3, "effects": [] },
                      { "id": "recovered-slow", "weight": 2, "effects": [ { "adjust": { "path": "people.armstrong.trust", "by": -1 } } ] }
                    ] } ] },
              { "id": "land-planned-area",
                "intent": "Hold one more revolution for a better-covered area.",
                "evidence": ["ev-recovery-posture-planned"],
                "cost": "Time on a spacecraft whose RCS budget you cannot see.",
                "uncertainty": "Whether the crew can hold attitude that long on what remains.",
                "requires": { "evidence": "ev-oams-valve-history" },
                "effects": [ { "set_fact": "g8-held-a-rev", "label": "Held Gemini VIII a revolution for recovery coverage" }, { "goto": "outcome" } ],
                "resolves": [
                  { "cause": "FICTIONAL PLACEHOLDER — the remaining RCS margin is uncertain to the ground.",
                    "branches": [
                      { "id": "held-fine", "weight": 3, "requires": { "fact": "g8-undock-drilled" }, "effects": [] },
                      { "id": "held-fine", "weight": 2, "effects": [] },
                      { "id": "held-tight", "weight": 2, "effects": [ { "set_fact": "g8-rcs-margin-scare", "label": "RCS margin scare on Gemini VIII" } ] }
                    ] } ] }
            ] }
        ]
      },
      { "id": "outcome", "title": "Splashdown", "sim_time_start": "10:41:00", "contact": "houston", "attention": 0, "nodes": [] }
    ],

    "outcomes": [
      { "id": "g8-abort-safe", "title": "Crew recovered; mission terminated early", "kind": "abort-safe", "requires": { "all": [] }, "patch": "patch-gemini-8" }
    ],

    "debrief": [
      { "when": { "event_seen": "evt-thruster-stuck" }, "text": "The stack began rolling while out of contact. The first Houston knew of it came through the ship." },
      { "when": { "chose": "land-early-contingency" }, "text": "You brought them down at the first contingency area. The rule required a landing; the area was your call." },
      { "when": { "branch": "recovered-slow" }, "text": "Recovery took hours. The crew will remember the water." },
      { "when": { "fact": "g8-undock-drilled" }, "text": "The undocking drill you scheduled the week before was the procedure they actually used." },
      { "when": { "not": { "fact": "g8-undock-drilled" } }, "text": "The crew improvised the undocking. It worked. Nobody in the room will say the word 'luck' out loud." }
    ],

    "carryover": [
      { "adopt_procedure": "proc-shared-bus-question" },
      { "award_patch": { "vest": "vest-gemini-8", "outcome": "g8-abort-safe" } }
    ]
  },

  "evidence": [
    { "id": "ev-mission-rules-rcs", "kind": "procedure", "title": "mission rules on RCS use",
      "body": "Once the reentry control system is activated, the mission is terminated at the earliest suitable landing area.", "visible_when": { "all": [] }, "implies": [], "sources": [] },
    { "id": "ev-oams-valve-history", "kind": "report", "title": "OAMS acceptance history",
      "body": "FICTIONAL PLACEHOLDER — acceptance records for this spacecraft's OAMS thrusters.", "visible_when": { "all": [] }, "implies": ["oams-suspect"], "sources": [] },
    { "id": "ev-last-telemetry-before-los", "kind": "telemetry", "title": "last frame before LOS",
      "body": "Attitude rates rising on the docked stack. Then nothing.", "visible_when": { "all": [] }, "implies": [], "sources": [] },
    { "id": "ev-csq-voice-summary", "kind": "testimony", "title": "CSQ voice summary", "body": "…", "visible_when": { "all": [] }, "implies": [], "sources": [] },
    { "id": "ev-roll-onset", "kind": "testimony", "title": "roll onset", "body": "Crew report: the roll began while docked.", "visible_when": { "all": [] }, "implies": ["fault-on-gemini-not-agena"], "sources": [] },
    { "id": "ev-recovery-posture-early", "kind": "report", "title": "recovery posture, contingency areas", "body": "FICTIONAL PLACEHOLDER.", "visible_when": { "all": [] }, "implies": [], "sources": [] },
    { "id": "ev-recovery-posture-planned", "kind": "report", "title": "recovery posture, planned areas", "body": "FICTIONAL PLACEHOLDER.", "visible_when": { "all": [] }, "implies": [], "sources": [] }
  ],

  "procedures": [
    { "id": "proc-shared-bus-question", "title": "Ask what the redundant sensor shares with the primary",
      "text": "Adopted after Gemini VIII. Controllers now state common dependencies when citing a backup reading.",
      "effect": { "add_evidence_tag": "shared-dependency" } }
  ]
}
```

The **Gemini IX-A follow-on briefing** for M00 is a single `briefing` node whose text is selected by `when` conditions in exactly the debrief's manner: one paragraph if `g8-undock-drilled`, a different one if not; one if `g8-rcs-margin-scare`. That is the whole of "the follow-on briefing visibly reflects at least one meaningful prior decision," and it is testable: two runs differing in one preparation choice must produce different briefing text.

Things the example deliberately shows: attention as the only spent currency in preparation; a phase with `contact: none` in which the player can only read; a question that costs nothing and reveals evidence; an option greyed out with its reason unless the player did the preparation; a chance branch whose weight improves with a fact; a debrief that says nothing the log does not support; a carryover that puts one page in the procedures binder.

## 5. Placeholder layout proposal (web terms)

Design canvas 1920 × 1080, laid out with CSS grid in viewport-relative units so that it reads at 1366 × 768 without scrolling (04 asked for a laptop check before export dimensions freeze). Regions:

```
┌──────────────────────────────────────────────────────────────────────┐
│ STATUS BAR   mission · phase · MET 07:08:00 · CONTACT: CSQ · ●●○     │  ~6% height
├───────────────────────────┬──────────────────────────────────────────┤
│                           │                                          │
│  ROOM PLATE (full-bleed   │   EVIDENCE PANEL                         │
│  1920×1080 illustration   │   pinned items, newest on top;           │
│  behind everything)       │   freshness badge LIVE / STALE / NONE;   │
│                           │   click a term in any text to pin it     │
│  CONVERSATION PANEL       │                                          │  ~66%
│  portrait 768×1024 scaled │                                          │
│  to ~340 px wide, name +  │                                          │
│  role, assessment text    │                                          │
│  ≤ 70 characters/line,    │                                          │
│  questions beneath        │                                          │
├───────────────────────────┴──────────────────────────────────────────┤
│ CONSOLE STRIP  station hotspots (FIDO · GNC · EECOM · SURGEON · CAPCOM)│  ~28%
│ decision options render here as routing-slip cards: INTENT / EVIDENCE │
│ / COST / UNCERTAINTY, greyed with reason when requirements are unmet  │
└──────────────────────────────────────────────────────────────────────┘
   overlays: BINDER (procedures, mission rules) · DOSSIER (characters) · DEBRIEF · SAVE/LOAD
```

Presentation rules carried from 01 and 04: all readable text is application-rendered, never in the art; the room plate carries the painted overhead light, and the app varies only screen glow and indicator lamps with CSS blend-mode overlays; reduced-motion respected and nothing flashes by requirement; keyboard reaches every hotspot, evidence link, and option in a predictable order; the evidence panel and the option cards use the same visual grammar so that "the choice cites the evidence" is visible as a line between them, not just implied.

Placeholders in M00 are labeled flat rectangles at exact contract dimensions showing the asset id and size (`fno_gemini_portrait_gnc-1_neutral_v001 · 768×1024`), generated by a script from the manifest, so that swapping in Codex's illustrations is a file replacement with no layout change.

Fonts: two open-licensed families, one humanist sans for interface and dialogue, one monospaced for telemetry and mission-elapsed time; chosen by Claude at M00, recorded with their licences in the manifest, and open to Codex's review for period feel.

## 6. What each side does next

**Codex:** the Gemini VIII specification in this schema's terms (JSON directly, or prose and tables that map one-to-one onto §3 — either is fine, but every option needs its intent, evidence, cost, uncertainty, and requirements filled in, and every chance needs a cause); the source list; the M00 asset manifest with placeholder entries at the 04 dimensions; and any schema gaps found while authoring, stated as "I need to express X and §3 cannot," with a worked example.

**Claude, when Dan directs the M00 build:** scaffold the repository; write the schemas and `npm run validate`, and make the validator fail on purpose before trusting it; implement the core with the replay test first; build the app with placeholders; load Codex's content package; deliver as one zip with `00_HANDOFF.md`, the exact revision, test output, screenshots at 1920 × 1080 and 1366 × 768, and known limitations.

**Dan:** approve or amend this contract; restate the §1 decisions to Codex if he wants them on record there; decide when M00 starts.

## 7. Open questions

1. Attention in preparation: is three opportunities the right number for M00, or should the spec decide per mission?
2. Should `manner` (cautious / direct / challenging) affect anything in the simulation, or only how text reads? Proposed: presentation only, until a design reason appears.
3. Pressure mode: M00 ships with `window` values in content but the timer disabled by default. Confirm.
4. Save location: browser storage for M00 (one save slot, exportable as a JSON file the player can download and re-import). A file-based save arrives with any desktop wrapper. Confirm.
