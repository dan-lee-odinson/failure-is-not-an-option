/**
 * Failure is Not an Option — core types.
 *
 * Content types describe the JSON under content/ (data, never code).
 * State types describe a run: the campaign ledger, the mission cursor, the
 * follow-on planning state, and the immutable event log.
 *
 * The core is engine-free: no DOM, no timers, no rendering, no I/O.
 */

// ---------------------------------------------------------------------------
// Content
// ---------------------------------------------------------------------------

/** Who can talk to the spacecraft during a phase; `not-in-flight` is used for pre-flight and post-flight scenes. */
export type Contact = 'houston' | 'tracking-ship' | 'none' | 'not-in-flight';

/** The tiny formal condition union (SC-06). */
export type Condition =
  | { fact: string }
  | { evidence: string }
  | { procedure: string }
  | { chose: string }
  | { event_seen: string }
  | { all: Condition[] }
  | { any: Condition[] }
  | { not: Condition };

/** Effects, applied atomically and in order (SC-05). */
export type Effect =
  | { set_fact: string; label?: string }
  | { add_evidence: string }
  | { adjust: { path: string; by: number } }
  | { adopt_procedure: string }
  | { append_note: { person: string; fact: string } }
  | { goto: string };

export interface Line {
  /** Character id, or null for narration / director's brief. */
  speaker: string | null;
  text: string;
  /** Evidence ids rendered as inline links beneath the line. */
  cites?: string[];
  /** Only shown when the condition holds (e.g. rehearsal-dependent appendices). */
  when?: Condition;
}

export interface Question {
  id: string;
  text: string;
  answer: Line;
  /** Evidence acquired by asking. Empty in 0.4.0 — free questions have no domain effects. */
  reveals?: string[];
}

export interface ConditionalDocument {
  evidence: string;
  when?: Condition;
}

export interface ContinueInput {
  id: string;
  label: string;
}

export interface Option {
  id: string;
  intent: string;
  /** Glen's exact spoken statement, when the option is a statement. */
  statement?: string;
  /** UI subtitle, e.g. "Historically grounded response". */
  subtitle?: string;
  evidence: string[];
  attraction?: string;
  cost: string;
  uncertainty: string;
  requires?: Condition;
  /** Reason text shown when `requires` is unmet. */
  unavailable_reason?: string;
  /** Rehearsal facts that support the execution of this order (informational). */
  supported_by?: string[];
  effects: Effect[];
}

export interface Readout {
  label: string;
  fact: string;
  ready: string;
  not_ready: string;
}

/**
 * A real person shown as a portrait with a name-and-role label and no line (content 0.5.2, direction 27 §1):
 * presentation only; never a speaker, never read by the engine.
 */
export interface Participant {
  id: string;
  label: string;
}

export interface BriefingNode {
  type: 'briefing';
  id: string;
  title?: string;
  header_label?: string;
  text?: string;
  /** Text chosen by condition; the first matching variant is shown. Used for receipts. */
  variants?: { when: Condition; text: string }[];
  documents?: ConditionalDocument[];
  lines?: Line[];
  questions?: Question[];
  /** Portraits with labels beside the conversation, the way the controllers appear, with nothing that reads as speech. */
  participants?: Participant[];
  continue: ContinueInput;
}

export interface PrepChoiceNode {
  type: 'prep_choice';
  id: string;
  prompt: string;
  text?: string;
  cost: number;
  options: Option[];
  reasons: { completed: string; exhausted: string };
  finish: ContinueInput;
}

export interface DecisionNode {
  /** Presentation metadata; never an eligibility rule. */
  historical_option?: string;
  /** Presentation only: a procedural hint shown above the cards after idling (M00c); never a recommendation; never read by the engine. */
  hint?: string;
  type: 'decision';
  id: string;
  prompt: string;
  title?: string;
  header_label?: string;
  text?: string;
  documents?: ConditionalDocument[];
  lines?: Line[];
  questions?: Question[];
  /** Portraits with labels beside the conversation (see BriefingNode). */
  participants?: Participant[];
  readout?: Readout[];
  options: Option[];
}

export interface Resolution {
  id: string;
  when: Condition;
  effects: Effect[];
  /** Conditional sub-effects, applied after `effects`, each only when its condition holds. */
  sub_effects?: { when: Condition; effects: Effect[] }[];
  /** Applied after every sub-effect, still inside the same atomic step. */
  finally?: Effect[];
  lines?: Line[];
  /** Exact visible report text (consequence beats, narrative responses). */
  text?: string;
  /** Status-panel lines shown during the return beats. */
  status?: string[];
}

export interface EventNode {
  type: 'event';
  id: string;
  title?: string;
  label?: string;
  resolutions: Resolution[];
  continue: ContinueInput;
}

export type Node = BriefingNode | PrepChoiceNode | DecisionNode | EventNode;

export interface Phase {
  id: string;
  title: string;
  /** Stage label; only docking carries an approximate MET. */
  display_time: string;
  contact: Contact;
  /** null = unlimited; an integer is the declared budget (SC-02). */
  attention: number | null;
  /** From this phase on, the ALTERNATE HISTORY badge is shown. */
  /** Once active, persists for the rest of this run; absent means false. */
  alternate_history?: boolean | Condition;
  nodes: Node[];
}

/** Result tier shown on the resolution card (content 0.5.2, direction 27 §2): a label on the outcome, never a mechanic. FAILURE and LOSS are reserved for later scenarios. */
export type ResultTier = 'SUCCESS' | 'MIXED' | 'COSTLY' | 'FAILURE' | 'LOSS';

export interface Outcome {
  id: string;
  title: string;
  kind: 'success' | 'partial' | 'abort-safe' | 'loss';
  requires: Condition;
  /** Presentation only (0.5.2): the tier word, the one- or two-sentence result line, and the plate shown on the resolution card. */
  tier?: ResultTier;
  result_line?: string;
  plate?: string;
}

export interface DebriefRule {
  section?: 'departures';
  provenance?: { sources: string[]; fiction: string[]; note: string };
  id: string;
  when: Condition;
  text: string;
}

/**
 * One moving layer on a prologue plate (content 0.5.2, treatment 28 §3): a transparent 1920×1080 manifest
 * image placed in design pixels (with its opacity) and moved once, linearly, from `placement + motion.from`
 * to `placement + motion.to` over `motion.seconds`, then held. Durations are animation lengths, never deadlines.
 */
export interface MovingElement {
  asset: string;
  placement: { x: number; y: number; width: number; height: number; opacity: number };
  motion: { kind: 'drift' | 'rise' | 'pan'; direction: 'left' | 'right' | 'up' | 'down'; seconds: number; from: { x: number; y: number }; to: { x: number; y: number } };
}

/** A prologue beat: one background, one moving layer, a heading and a caption, with its sources. */
export interface ProloguePlate {
  id: string;
  title: string;
  background: string;
  moving_element: MovingElement;
  caption: string;
  sources: string[];
}

/** The scenario card that closes the prologue: the facility, the date, the mission and scenario names, and the time transition back to preparation. */
export interface ScenarioCard {
  id: string;
  background: string;
  facility: string;
  date: string;
  mission: string;
  scenario: string;
  context: string;
  sources: string[];
  moving_element: MovingElement;
}

/** The illustrated mission overview played once after NEW CAMPAIGN (content 0.5.2). Presentation only; never read by the engine. */
export interface Prologue {
  plates: ProloguePlate[];
  scenario_card: ScenarioCard;
  /** Shown in the History panel once a run exists (the 1973 renaming of the facility). */
  history_note: string;
  history_sources: string[];
  interpretation: string;
}

/** Headings and labels for the resolution cards (content 0.5.2). Presentation only. */
export interface ResolutionPresentation {
  heading: string;
  relationships_heading: string;
  trust_up: string;
  trust_down: string;
  tiers: { id: ResultTier; meaning: string }[];
}

export interface Mission {
  content_version: string;
  id: string;
  title: string;
  subtitle?: string;
  chapter: string;
  dramatization: true;
  anchors: { label: string; url: string }[];
  start_notice: string;
  /** People seeded in the ledger with trust 0 and no notes. */
  seed_people: string[];
  finish: { id: string; requires: Condition };
  phases: Phase[];
  outcomes: Outcome[];
  debrief: DebriefRule[];
  debrief_layout: {
    consequence_node: string;
    relationship_node: string;
    accountability_node: string;
    controllers: string[];
    astronauts: string[];
    constraint_facts: string[];
  };
  prologue?: Prologue;
  resolution_presentation?: ResolutionPresentation;
}

export interface Character {
  id: string;
  name: string;
  role: string;
  display: string;
  kind: 'player' | 'historical' | 'fictional-controller' | 'composite-controller';
  manner?: 'cautious' | 'direct' | 'challenging';
  portrait: string | null;
  /** Matched expression pair (0.5.2): neutral for a trust increase, concerned for a decrease, on the resolution card only. */
  portraits?: { neutral: string; concerned: string };
  portrayal: string;
  dramatization: true;
  sources?: string[];
}

export interface Evidence {
  id: string;
  kind: 'reference' | 'report' | 'simulated-report';
  title: string;
  body: string;
  /** Reports carry a known or unknown observation time; references have none. */
  observation?: 'known' | 'unknown';
  visible_when?: Condition;
  simulated: boolean;
  provenance: { sources: string[]; fiction: string[]; note: string };
}

export interface Procedure {
  id: string;
  title: string;
  text: string;
  status: 'adopted-procedure' | 'commissioned-task';
  provenance: { sources: string[]; fiction: string[]; note: string };
}

export interface Plan {
  id: string;
  label: string;
  benefit: string;
  available_when: Condition;
  disabled_reasons: { when: Condition; text: string }[];
  effects: Effect[];
}

export interface FollowOn {
  content_version: string;
  id: string;
  title: string;
  display_title: string;
  node: string;
  confirm_input: string;
  requires_completion_of: string;
  /** Exactly one of these facts must be present in a valid committed ledger. */
  constraint_facts: string[];
  constraint: { when: Condition; text: string }[];
  trust_labels: Record<string, string>;
  controllers: string[];
  astronauts: string[];
  status_blocks: { id: string; when: Condition; title: string; text: string; procedure?: string }[];
  plans: Plan[];
  committed_text: string;
}

export interface SourceEntry {
  id: string;
  title: string;
  url: string;
  author?: string;
  note: string;
}

export interface FictionEntry {
  id: string;
  title: string;
  text: string;
}

export interface Registry {
  content_version: string;
  labels: {
    start_notice: string;
    alternate_history_badge: string;
    historical_choice_badge?: string;
    departures_heading?: string;
    alternate_history_explanation: string;
    simulated_report: string;
    postflight_header: string;
  };
  notices: { dedication: string[]; project_disclaimer: string; ai_disclosure: string; dramatization: string };
  sources: SourceEntry[];
  fiction: FictionEntry[];
}

export interface ContentBundle {
  mission: Mission;
  characters: Character[];
  evidence: Evidence[];
  procedures: Procedure[];
  followon: FollowOn;
  registry: Registry;
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

export interface FactRecord {
  set_by: string;
  at_event: number;
  label: string;
}

export interface PersonState {
  trust: number;
  notes: string[];
}

export interface Ledger {
  facts: Record<string, FactRecord>;
  quantities: { funding: number; operational_trust: number; political_capital: number; authority: number };
  people: Record<string, PersonState>;
  /** Authoritative procedure membership (SC-09). */
  procedures: string[];
  patches: { mission: string; vest: string; outcome: string }[];
}

export interface EvidenceRecord {
  at_event: number;
  phase: string;
  stage: string;
  channel: Contact;
  node: string;
}

export interface Completion {
  mission: string;
  outcome: string;
  title: string;
  kind: string;
  at_event: number;
}

export interface MissionState {
  id: string;
  /** Ordered indices; null once the mission is finalized. */
  cursor: { phase: number; node: number } | null;
  /** Remaining attention in the current phase; null = unlimited. */
  attention: number | null;
  evidence: Record<string, EvidenceRecord>;
  chosen: { option: string; node: string; at_event: number }[];
  questions_asked: string[];
  events_seen: string[];
  /** Which resolution each event node applied on arrival. */
  node_resolution: Record<string, string>;
  completed: Completion | null;
}

export interface FollowOnState {
  id: string;
  active: boolean;
  committed: string | null;
  at_event: number | null;
}

export interface RunState {
  ledger: Ledger;
  mission: MissionState;
  followon: FollowOnState;
  seq: number;
  /** Number of seeded draws consumed; 0.4.0 content makes zero. */
  draws: number;
}

export type Input =
  | { kind: 'option'; node: string; option: string }
  | { kind: 'question'; node: string; question: string }
  | { kind: 'continue'; node: string; id: string }
  | { kind: 'confirm_plan'; id: string; plan: string };

export interface RunIdentity {
  initial_ledger: Ledger;
  content_version: string;
  content_fingerprint: string;
  sim_version: string;
  seed: number;
  inputs: Input[];
}

// ---------------------------------------------------------------------------
// Event log
// ---------------------------------------------------------------------------

export type LogEntry =
  | { seq: number; type: 'run'; content_version: string; content_fingerprint: string; sim_version: string; seed: number; player_visible: false }
  | { seq: number; type: 'phase'; phase: string; contact: Contact; attention: number | null; player_visible: true }
  | { seq: number; type: 'node'; phase: string; node: string; player_visible: true }
  | { seq: number; type: 'input'; input: Input; player_visible: true }
  | { seq: number; type: 'acquire'; evidence: string; node: string; phase: string; stage: string; channel: Contact; cause: string; player_visible: true }
  | { seq: number; type: 'effect'; effect: 'set_fact'; fact: string; label: string; cause: string; player_visible: true }
  | { seq: number; type: 'effect'; effect: 'adjust'; path: string; by: number; before: number; after: number; cause: string; refs: Record<string, number>; player_visible: true }
  | { seq: number; type: 'effect'; effect: 'adopt_procedure'; procedure: string; cause: string; player_visible: true }
  | { seq: number; type: 'effect'; effect: 'append_note'; person: string; fact: string; cause: string; player_visible: true }
  | { seq: number; type: 'effect'; effect: 'goto'; phase: string; cause: string; player_visible: true }
  | { seq: number; type: 'resolution'; node: string; resolution: string; witness: Record<string, number>; player_visible: true }
  | { seq: number; type: 'attention'; phase: string; before: number; after: number; cause: string; player_visible: true }
  | { seq: number; type: 'finalize'; mission: string; outcome: string; title: string; kind: string; player_visible: true }
  | { seq: number; type: 'followon'; id: string; enabled: string[]; disabled: { plan: string; reason: string }[]; player_visible: true }
  | { seq: number; type: 'commit_plan'; id: string; plan: string; player_visible: true };
