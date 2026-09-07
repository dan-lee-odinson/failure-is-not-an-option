/**
 * The run engine.
 *
 * A run is identified by (initial ledger, content version + fingerprint,
 * simulation version, seed, ordered inputs). Every input is validated, then
 * applied atomically to a working copy of the state; on success the copy
 * becomes the state and the log entries are appended. On failure nothing
 * changes and a structured error is returned. Replaying the same identity
 * produces a byte-identical canonical log and final ledger.
 */

import { canonical, cloneDeep } from './canonical';
import { evaluate, witness } from './conditions';
import { SIM_VERSION, type ContentIndex } from './content';
import { describeFollowOn, validateFollowOnLedger } from './followon';
import type {
  Condition, ConditionalDocument, Effect, Input, Ledger, LogEntry, Node, Option, Phase, Resolution, RunIdentity, RunState,
} from './types';

export class EngineError extends Error {
  constructor(public code: string, message: string) {
    super(message);
    this.name = 'EngineError';
  }
}

export type ApplyResult = { ok: true } | { ok: false; code: string; message: string };

/** Omit that distributes over a union (so each log entry variant keeps its own shape). */
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;
type LogEntryBody = DistributiveOmit<LogEntry, 'seq'>;

export function emptyLedger(seedPeople: string[]): Ledger {
  const people: Ledger['people'] = {};
  for (const id of seedPeople) people[id] = { trust: 0, notes: [] };
  return {
    facts: {},
    quantities: { funding: 0, operational_trust: 0, political_capital: 0, authority: 0 },
    people,
    procedures: [],
    patches: [],
  };
}

interface Working {
  state: RunState;
  log: LogEntry[];
  /** Phase index requested by a `goto` effect, consumed by the next transition. */
  pendingGoto?: number;
}

export class Run {
  readonly content: ContentIndex;
  readonly identity: RunIdentity;
  private _state: RunState;
  private _log: LogEntry[] = [];

  constructor(content: ContentIndex, opts: { seed: number; initial_ledger?: Ledger }) {
    this.content = content;
    const initial = opts.initial_ledger ?? emptyLedger(content.mission.seed_people);
    this.identity = {
      initial_ledger: cloneDeep(initial),
      content_version: content.mission.content_version,
      content_fingerprint: content.fingerprint,
      sim_version: SIM_VERSION,
      seed: opts.seed,
      inputs: [],
    };
    this._state = {
      ledger: cloneDeep(initial),
      mission: {
        id: content.mission.id,
        cursor: { phase: 0, node: 0 },
        attention: null,
        evidence: {},
        chosen: [],
        questions_asked: [],
        events_seen: [],
        node_resolution: {},
        completed: null,
      },
      followon: { id: content.followon.id, active: false, committed: null, at_event: null },
      seq: 0,
      draws: 0,
    };
    const w: Working = { state: this._state, log: this._log };
    push(w, {
      type: 'run',
      content_version: this.identity.content_version,
      content_fingerprint: this.identity.content_fingerprint,
      sim_version: this.identity.sim_version,
      seed: this.identity.seed,
      player_visible: false,
    });
    const phase0 = content.mission.phases[0];
    if (!phase0) throw new EngineError('no-phases', 'mission has no phases');
    enterPhase(w, content, 0);
    enterNode(w, content);
  }

  get state(): RunState {
    return this._state;
  }

  get log(): readonly LogEntry[] {
    return this._log;
  }

  /** The node the cursor is on, or null when the mission is finalized. */
  currentNode(): { phase: Phase; node: Node } | null {
    const c = this._state.mission.cursor;
    if (!c) return null;
    const phase = this.content.mission.phases[c.phase];
    const node = phase?.nodes[c.node];
    if (!phase || !node) throw new EngineError('bad-cursor', 'cursor points outside the mission');
    return { phase, node };
  }

  /** Apply one domain input atomically. Never throws for invalid input. */
  apply(input: Input): ApplyResult {
    const w: Working = { state: cloneDeep(this._state), log: [] };
    try {
      applyInput(w, this.content, input);
    } catch (e) {
      if (e instanceof EngineError) return { ok: false, code: e.code, message: e.message };
      throw e;
    }
    this._state = w.state;
    for (const entry of w.log) this._log.push(entry);
    this.identity.inputs.push(cloneDeep(input));
    return { ok: true };
  }

  canonicalLog(): string {
    return canonical(this._log);
  }

  canonicalState(): string {
    return canonical(this._state);
  }
}

/** Replay an identity from scratch. Throws EngineError on any invalid input. */
export function replay(content: ContentIndex, identity: RunIdentity): Run {
  if (identity.content_version !== content.mission.content_version) {
    throw new EngineError('unsupported-content-version', `unsupported content version ${identity.content_version}; this build supports ${content.mission.content_version}`);
  }
  if (identity.content_fingerprint !== content.fingerprint) {
    throw new EngineError('content-fingerprint-mismatch', 'content fingerprint does not match this build');
  }
  if (identity.sim_version !== SIM_VERSION) {
    throw new EngineError('unsupported-sim-version', `unsupported simulation version ${identity.sim_version}; this build is ${SIM_VERSION}`);
  }
  const run = new Run(content, { seed: identity.seed, initial_ledger: identity.initial_ledger });
  identity.inputs.forEach((input, i) => {
    const r = run.apply(input);
    if (!r.ok) throw new EngineError(r.code, `input ${i} (${describeInput(input)}): ${r.message}`);
  });
  return run;
}

export function describeInput(input: Input): string {
  switch (input.kind) {
    case 'option': return `option ${input.option} at ${input.node}`;
    case 'question': return `question ${input.question} at ${input.node}`;
    case 'continue': return `continue ${input.id} at ${input.node}`;
    case 'confirm_plan': return `${input.id} ${input.plan}`;
  }
}

// ---------------------------------------------------------------------------
// Internals — every function below mutates only the working copy.
// ---------------------------------------------------------------------------

function push(w: Working, entry: LogEntryBody): number {
  w.state.seq += 1;
  const full = { seq: w.state.seq, ...entry } as LogEntry;
  w.log.push(full);
  return full.seq;
}

function currentRef(w: Working, content: ContentIndex): { phase: Phase; node: Node; phaseIndex: number; nodeIndex: number } {
  const c = w.state.mission.cursor;
  if (!c) throw new EngineError('mission-complete', 'the mission is finalized; no further mission inputs are accepted');
  const phase = content.mission.phases[c.phase];
  const node = phase?.nodes[c.node];
  if (!phase || !node) throw new EngineError('bad-cursor', 'cursor points outside the mission');
  return { phase, node, phaseIndex: c.phase, nodeIndex: c.node };
}

function enterPhase(w: Working, content: ContentIndex, phaseIndex: number): void {
  const phase = content.mission.phases[phaseIndex];
  if (!phase) throw new EngineError('bad-phase', 'phase index out of range');
  w.state.mission.cursor = { phase: phaseIndex, node: 0 };
  w.state.mission.attention = phase.attention;
  push(w, { type: 'phase', phase: phase.id, contact: phase.contact, attention: phase.attention, player_visible: true });
}

function enterNode(w: Working, content: ContentIndex): void {
  const { phase, node } = currentRef(w, content);
  push(w, { type: 'node', phase: phase.id, node: node.id, player_visible: true });
  const docs: ConditionalDocument[] | undefined = node.type === 'briefing' || node.type === 'decision' ? node.documents : undefined;
  for (const d of docs ?? []) {
    if (d.when && !evaluate(d.when, w.state)) continue;
    acquire(w, content, d.evidence, node.id);
  }
  if (node.type === 'event') {
    const matches = node.resolutions.filter((r) => evaluate(r.when, w.state));
    if (matches.length !== 1) {
      throw new EngineError('resolution-count', `event ${node.id}: ${matches.length} resolutions match; exactly one is required`);
    }
    const r = matches[0]!;
    const wit = witness(r.when, w.state);
    const seq = push(w, { type: 'resolution', node: node.id, resolution: r.id, witness: wit, player_visible: true });
    applyEffects(w, content, r.effects, r.id, wit, node.id);
    for (const sub of r.sub_effects ?? []) {
      if (!evaluate(sub.when, w.state)) continue;
      const subWit = { ...wit, ...witness(sub.when, w.state) };
      applyEffects(w, content, sub.effects, r.id, subWit, node.id);
    }
    applyEffects(w, content, r.finally ?? [], r.id, wit, node.id);
    w.state.mission.events_seen.push(node.id, r.id);
    w.state.mission.node_resolution[node.id] = r.id;
    void seq;
    if (w.pendingGoto !== undefined) {
      const target = w.pendingGoto;
      delete w.pendingGoto;
      enterPhase(w, content, target);
      enterNode(w, content);
    }
  }
}

function acquire(w: Working, content: ContentIndex, evidenceId: string, cause: string): void {
  if (!content.evidence.has(evidenceId)) throw new EngineError('unknown-evidence', `unknown evidence ${evidenceId}`);
  if (w.state.mission.evidence[evidenceId]) throw new EngineError('duplicate-acquire', `evidence ${evidenceId} already acquired`);
  const { phase, node } = currentRef(w, content);
  const seq = push(w, {
    type: 'acquire', evidence: evidenceId, node: node.id, phase: phase.id, stage: phase.display_time, channel: phase.contact, cause, player_visible: true,
  });
  w.state.mission.evidence[evidenceId] = { at_event: seq, phase: phase.id, stage: phase.display_time, channel: phase.contact, node: node.id };
}

function applyEffects(w: Working, content: ContentIndex, effects: Effect[], cause: string, refs: Record<string, number>, nodeId: string): void {
  for (const e of effects) applyEffect(w, content, e, cause, refs, nodeId);
}

function applyEffect(w: Working, content: ContentIndex, e: Effect, cause: string, refs: Record<string, number>, nodeId: string): void {
  const st = w.state;
  if ('set_fact' in e) {
    if (st.ledger.facts[e.set_fact]) throw new EngineError('duplicate-fact', `fact ${e.set_fact} is already set`);
    const label = e.label ?? humanize(e.set_fact);
    const seq = push(w, { type: 'effect', effect: 'set_fact', fact: e.set_fact, label, cause, player_visible: true });
    st.ledger.facts[e.set_fact] = { set_by: st.mission.id, at_event: seq, label };
    return;
  }
  if ('add_evidence' in e) {
    acquire(w, content, e.add_evidence, cause);
    return;
  }
  if ('adjust' in e) {
    const parts = e.adjust.path.split('.');
    if (parts[0] === 'people' && parts.length === 3 && parts[2] === 'trust') {
      const person = st.ledger.people[parts[1]!];
      if (!person) throw new EngineError('unknown-person', `unknown person ${parts[1]} in adjust path`);
      const before = person.trust;
      const after = before + e.adjust.by;
      push(w, { type: 'effect', effect: 'adjust', path: e.adjust.path, by: e.adjust.by, before, after, cause, refs, player_visible: true });
      person.trust = after;
      return;
    }
    if (parts[0] === 'quantities' && parts.length === 2) {
      const q = st.ledger.quantities as Record<string, number>;
      if (!(parts[1]! in q)) throw new EngineError('unknown-quantity', `unknown quantity ${parts[1]}`);
      const before = q[parts[1]!]!;
      const after = before + e.adjust.by;
      push(w, { type: 'effect', effect: 'adjust', path: e.adjust.path, by: e.adjust.by, before, after, cause, refs, player_visible: true });
      q[parts[1]!] = after;
      return;
    }
    throw new EngineError('bad-adjust-path', `unsupported adjust path ${e.adjust.path}`);
  }
  if ('adopt_procedure' in e) {
    if (!content.procedures.has(e.adopt_procedure)) throw new EngineError('unknown-procedure', `unknown procedure ${e.adopt_procedure}`);
    if (st.ledger.procedures.includes(e.adopt_procedure)) throw new EngineError('duplicate-procedure', `procedure ${e.adopt_procedure} already in the binder`);
    push(w, { type: 'effect', effect: 'adopt_procedure', procedure: e.adopt_procedure, cause, player_visible: true });
    st.ledger.procedures.push(e.adopt_procedure);
    return;
  }
  if ('append_note' in e) {
    const person = st.ledger.people[e.append_note.person];
    if (!person) throw new EngineError('unknown-person', `unknown person ${e.append_note.person} in append_note`);
    if (person.notes.includes(e.append_note.fact)) throw new EngineError('duplicate-note', `note ${e.append_note.fact} already on ${e.append_note.person}`);
    push(w, { type: 'effect', effect: 'append_note', person: e.append_note.person, fact: e.append_note.fact, cause, player_visible: true });
    person.notes.push(e.append_note.fact);
    return;
  }
  if ('goto' in e) {
    const idx = content.mission.phases.findIndex((p) => p.id === e.goto);
    if (idx < 0) throw new EngineError('unknown-phase', `unknown phase ${e.goto} in goto`);
    push(w, { type: 'effect', effect: 'goto', phase: e.goto, cause, player_visible: true });
    // Transition is deferred: options consume it in advance(); events consume it at the end of enterNode().
    w.pendingGoto = idx;
    void nodeId;
    return;
  }
  throw new EngineError('bad-effect', 'unknown effect shape ' + JSON.stringify(e));
}

function humanize(id: string): string {
  return id.replace(/^g\d+[a-z]?-/, '').replace(/-/g, ' ');
}

/** Availability of an option at the current node, with the reason text when unavailable. */
export function optionAvailability(state: RunState, node: Node, option: Option): { available: boolean; reason?: string } {
  const chosen = state.mission.chosen.some((c) => c.option === option.id);
  if (node.type === 'prep_choice') {
    if (chosen) return { available: false, reason: node.reasons.completed };
    if (state.mission.attention !== null && state.mission.attention < node.cost) return { available: false, reason: node.reasons.exhausted };
  } else if (chosen) {
    return { available: false, reason: option.unavailable_reason ?? 'Already selected.' };
  }
  if (option.requires && !evaluate(option.requires, state)) {
    return { available: false, reason: option.unavailable_reason ?? 'Requirements not met.' };
  }
  return { available: true };
}

function applyInput(w: Working, content: ContentIndex, input: Input): void {
  if (input.kind === 'confirm_plan') {
    applyConfirmPlan(w, content, input);
    return;
  }
  const { phase, node, phaseIndex, nodeIndex } = currentRef(w, content);
  if (input.node !== node.id) {
    throw new EngineError('wrong-node', `input targets node ${input.node} but the cursor is at ${node.id}`);
  }

  if (input.kind === 'question') {
    const qs = node.type === 'briefing' || node.type === 'decision' ? node.questions ?? [] : [];
    const q = qs.find((x) => x.id === input.question);
    if (!q) throw new EngineError('unknown-question', `node ${node.id} has no question ${input.question}`);
    push(w, { type: 'input', input, player_visible: true });
    if (!w.state.mission.questions_asked.includes(q.id)) w.state.mission.questions_asked.push(q.id);
    for (const ev of q.reveals ?? []) {
      if (!w.state.mission.evidence[ev]) acquire(w, content, ev, q.id);
    }
    return;
  }

  if (input.kind === 'option') {
    if (node.type !== 'prep_choice' && node.type !== 'decision') {
      throw new EngineError('no-options', `node ${node.id} takes no option input`);
    }
    const option = node.options.find((o) => o.id === input.option);
    if (!option) throw new EngineError('unknown-option', `node ${node.id} has no option ${input.option}`);
    const avail = optionAvailability(w.state, node, option);
    if (!avail.available) throw new EngineError('option-unavailable', `${option.id}: ${avail.reason}`);
    const seq = push(w, { type: 'input', input, player_visible: true });
    if (node.type === 'prep_choice') {
      const before = w.state.mission.attention;
      if (before !== null) {
        const after = before - node.cost;
        push(w, { type: 'attention', phase: phase.id, before, after, cause: option.id, player_visible: true });
        w.state.mission.attention = after;
      }
    }
    w.state.mission.chosen.push({ option: option.id, node: node.id, at_event: seq });
    applyEffects(w, content, option.effects, option.id, { ['input:' + option.id]: seq }, node.id);
    if (node.type === 'decision') advance(w, content, phaseIndex, nodeIndex);
    return;
  }

  // continue
  const cont = node.type === 'prep_choice' ? node.finish : node.type === 'decision' ? null : node.continue;
  if (!cont) throw new EngineError('no-continue', `node ${node.id} requires a selection, not a Continue`);
  if (cont.id !== input.id) throw new EngineError('wrong-continue', `node ${node.id} expects continue ${cont.id}, got ${input.id}`);
  push(w, { type: 'input', input, player_visible: true });
  if (cont.id === content.mission.finish.id) {
    finalize(w, content, phaseIndex, nodeIndex);
    return;
  }
  advance(w, content, phaseIndex, nodeIndex);
}

function advance(w: Working, content: ContentIndex, phaseIndex: number, nodeIndex: number): void {
  const pending = w.pendingGoto;
  if (pending !== undefined) {
    delete w.pendingGoto;
    enterPhase(w, content, pending);
    enterNode(w, content);
    return;
  }
  const phase = content.mission.phases[phaseIndex]!;
  if (nodeIndex + 1 < phase.nodes.length) {
    w.state.mission.cursor = { phase: phaseIndex, node: nodeIndex + 1 };
    enterNode(w, content);
    return;
  }
  if (phaseIndex + 1 < content.mission.phases.length) {
    enterPhase(w, content, phaseIndex + 1);
    enterNode(w, content);
    return;
  }
  throw new EngineError('past-end', `node ${phase.nodes[nodeIndex]!.id} is the last node; the mission must be finished with ${content.mission.finish.id}`);
}

function finalize(w: Working, content: ContentIndex, phaseIndex: number, nodeIndex: number): void {
  const phase = content.mission.phases[phaseIndex]!;
  const isLast = phaseIndex === content.mission.phases.length - 1 && nodeIndex === phase.nodes.length - 1;
  if (!isLast) throw new EngineError('early-finish', 'finish is only accepted at the last node of the mission');
  if (w.state.mission.completed) throw new EngineError('already-finalized', 'the mission is already finalized');
  if (!evaluate(content.mission.finish.requires, w.state)) {
    throw new EngineError('finish-requirements', 'finish requirements are not satisfied by the recorded run');
  }
  const matches = content.mission.outcomes.filter((o) => evaluate(o.requires, w.state));
  if (matches.length !== 1) {
    throw new EngineError('outcome-count', `${matches.length} outcomes match; exactly one is required (${matches.map((m) => m.id).join(', ') || 'none'})`);
  }
  const o = matches[0]!;
  const seq = push(w, { type: 'finalize', mission: content.mission.id, outcome: o.id, title: o.title, kind: o.kind, player_visible: true });
  w.state.mission.completed = { mission: content.mission.id, outcome: o.id, title: o.title, kind: o.kind, at_event: seq };
  w.state.mission.cursor = null;
  activateFollowOn(w, content);
}

function activateFollowOn(w: Working, content: ContentIndex): void {
  const completion = w.state.mission.completed!;
  const problem = validateFollowOnLedger(content.followon, w.state.ledger, completion, content.mission.id);
  if (problem) throw new EngineError('followon-ledger', problem);
  const view = describeFollowOn(content, w.state.ledger, completion, null);
  push(w, {
    type: 'followon', id: content.followon.id,
    enabled: view.plans.filter((p) => p.enabled).map((p) => p.id),
    disabled: view.plans.filter((p) => !p.enabled).map((p) => ({ plan: p.id, reason: p.reason ?? '' })),
    player_visible: true,
  });
  w.state.followon.active = true;
}

function applyConfirmPlan(w: Working, content: ContentIndex, input: Extract<Input, { kind: 'confirm_plan' }>): void {
  const fo = content.followon;
  if (input.id !== fo.confirm_input) throw new EngineError('unknown-input', `unknown follow-on input ${input.id}`);
  const completion = w.state.mission.completed;
  if (!completion || !w.state.followon.active) throw new EngineError('followon-inactive', 'the Gemini IX-A planning screen is not active until the mission is finalized');
  if (w.state.followon.committed) throw new EngineError('plan-already-committed', `a plan is already committed (${w.state.followon.committed})`);
  const problem = validateFollowOnLedger(fo, w.state.ledger, completion, content.mission.id);
  if (problem) throw new EngineError('followon-ledger', problem);
  const plan = content.plans.get(input.plan);
  if (!plan) throw new EngineError('unknown-plan', `unknown plan ${input.plan}`);
  const view = describeFollowOn(content, w.state.ledger, completion, null);
  const tile = view.plans.find((p) => p.id === plan.id)!;
  if (!tile.enabled) throw new EngineError('plan-unavailable', `${plan.id}: ${tile.reason}`);
  const seq = push(w, { type: 'input', input, player_visible: true });
  push(w, { type: 'commit_plan', id: fo.confirm_input, plan: plan.id, player_visible: true });
  applyEffects(w, content, plan.effects, plan.id, { ['input:' + plan.id]: seq }, fo.node);
  w.state.followon.committed = plan.id;
  w.state.followon.at_event = seq;
}

/** Re-export for callers that want to evaluate content conditions against a run. */
export function holds(cond: Condition, state: RunState): boolean {
  return evaluate(cond, state);
}

/** Re-export used by view-models. */
export { evaluate as evaluateCondition, type Resolution };
