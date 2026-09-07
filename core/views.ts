/**
 * View-models. Pure functions from (content, run) to plain data the app
 * renders and the tests assert on. Nothing here mutates the run.
 */

import { evaluate } from './conditions';
import type { ContentIndex } from './content';
import { optionAvailability, type Run } from './engine';
import { describeFollowOn, trustLabel, type FollowOnView } from './followon';
import type { Character, Condition, Evidence, Line, LogEntry, Node, Option, Phase, RunState } from './types';

export interface SpeakerView {
  id: string;
  display: string;
  name: string;
  role: string;
  portrait: string | null;
  kind: Character['kind'];
}

export interface EvidenceLink {
  id: string;
  title: string;
  acquired: boolean;
}

export interface LineView {
  speaker: SpeakerView | null;
  text: string;
  cites: EvidenceLink[];
}

export interface OptionView {
  id: string;
  intent: string;
  statement: string | null;
  subtitle: string | null;
  evidence: EvidenceLink[];
  attraction: string | null;
  cost: string;
  uncertainty: string;
  available: boolean;
  reason: string | null;
  chosen: boolean;
  supported_by: { fact: string; label: string; ready: boolean }[];
}

export interface NodeView {
  phase: { id: string; title: string; display_time: string; contact: Phase['contact']; alternate_history: boolean; index: number; count: number };
  attention: { remaining: number; declared: number } | null;
  node: { id: string; type: Node['type']; title: string | null; header_label: string | null; text: string | null; prompt: string | null };
  lines: LineView[];
  questions: { id: string; text: string; asked: boolean; answer: LineView }[];
  readout: { label: string; ready: boolean; text: string }[] | null;
  options: OptionView[] | null;
  continue: { id: string; label: string } | null;
  status: string[] | null;
  event_text: string | null;
  resolution: string | null;
  acquired_here: string[];
  /** Effects the current event node applied on arrival, in order, as player-readable labels. */
  applied: { kind: 'fact' | 'trust' | 'procedure' | 'note'; label: string }[];
}

export interface EvidenceView {
  id: string;
  kind: Evidence['kind'];
  title: string;
  body: string | null;
  eligible: boolean;
  simulated: boolean;
  badge: 'REFERENCE' | 'CURRENT CONTACT' | 'PREVIOUS CONTACT';
  stage: string;
  channel: string;
  observation: 'known' | 'unknown' | null;
  provenance: Evidence['provenance'];
  at_event: number;
}

function speaker(content: ContentIndex, id: string | null): SpeakerView | null {
  if (!id) return null;
  const c = content.characters.get(id);
  if (!c) return { id, display: id, name: id, role: '', portrait: null, kind: 'composite-controller' };
  return { id: c.id, display: c.display, name: c.name, role: c.role, portrait: c.portrait, kind: c.kind };
}

function link(content: ContentIndex, state: RunState, id: string): EvidenceLink {
  const e = content.evidence.get(id);
  return { id, title: e?.title ?? id, acquired: Object.prototype.hasOwnProperty.call(state.mission.evidence, id) };
}

function lineView(content: ContentIndex, state: RunState, l: Line): LineView {
  return { speaker: speaker(content, l.speaker), text: l.text, cites: (l.cites ?? []).map((c) => link(content, state, c)) };
}

function alternateHistoryActive(content: ContentIndex, phaseIndex: number): boolean {
  for (let i = 0; i <= phaseIndex; i++) if (content.mission.phases[i]?.alternate_history) return true;
  return false;
}

function optionView(content: ContentIndex, state: RunState, node: Node, o: Option): OptionView {
  const avail = optionAvailability(state, node, o);
  return {
    id: o.id,
    intent: o.intent,
    statement: o.statement ?? null,
    subtitle: o.subtitle ?? null,
    evidence: o.evidence.map((e) => link(content, state, e)),
    attraction: o.attraction ?? null,
    cost: o.cost,
    uncertainty: o.uncertainty,
    available: avail.available,
    reason: avail.reason ?? null,
    chosen: state.mission.chosen.some((c) => c.option === o.id),
    supported_by: (o.supported_by ?? []).map((f) => ({ fact: f, label: factLabel(content, f), ready: Object.prototype.hasOwnProperty.call(state.ledger.facts, f) })),
  };
}

function factLabel(content: ContentIndex, fact: string): string {
  // Look for an authored label on any set_fact effect; fall back to the humanized id.
  for (const { option } of content.options.values()) {
    for (const e of option.effects) if ('set_fact' in e && e.set_fact === fact && e.label) return e.label;
  }
  for (const { resolution } of content.resolutions.values()) {
    for (const e of resolution.effects) if ('set_fact' in e && e.set_fact === fact && e.label) return e.label;
  }
  return fact.replace(/^g\d+[a-z]?-/, '').replace(/-/g, ' ');
}

export function describeNode(run: Run): NodeView | null {
  const content = run.content;
  const state = run.state;
  const cur = run.currentNode();
  if (!cur) return null;
  const { phase, node } = cur;
  const phaseIndex = state.mission.cursor!.phase;

  const lines: Line[] = node.type === 'briefing' || node.type === 'decision' ? node.lines ?? [] : [];
  const visibleLines = lines.filter((l) => !l.when || evaluate(l.when, state)).map((l) => lineView(content, state, l));

  let text: string | null = null;
  let status: string[] | null = null;
  let eventText: string | null = null;
  let resolution: string | null = null;
  if (node.type === 'briefing') {
    const variant = node.variants?.find((v) => evaluate(v.when, state));
    text = variant?.text ?? node.text ?? null;
  } else if (node.type === 'decision' || node.type === 'prep_choice') {
    text = node.text ?? null;
  } else {
    const rid = state.mission.node_resolution[node.id] ?? null;
    resolution = rid;
    const r = rid ? content.resolutions.get(rid)?.resolution : undefined;
    if (r) {
      status = r.status ?? null;
      eventText = r.text ?? null;
      for (const l of r.lines ?? []) visibleLines.push(lineView(content, state, l));
    }
  }

  const questions = (node.type === 'briefing' || node.type === 'decision' ? node.questions ?? [] : []).map((q) => ({
    id: q.id,
    text: q.text,
    asked: state.mission.questions_asked.includes(q.id),
    answer: lineView(content, state, q.answer),
  }));

  const readout = node.type === 'decision' && node.readout
    ? node.readout.map((r) => {
      const ready = Object.prototype.hasOwnProperty.call(state.ledger.facts, r.fact);
      return { label: r.label, ready, text: ready ? r.ready : r.not_ready };
    })
    : null;

  const options = node.type === 'prep_choice' || node.type === 'decision' ? node.options.map((o) => optionView(content, state, node, o)) : null;
  const cont = node.type === 'prep_choice' ? node.finish : node.type === 'decision' ? null : node.continue;

  const acquiredHere = Object.entries(state.mission.evidence).filter(([, rec]) => rec.node === node.id).map(([id]) => id);
  const applied: NodeView['applied'] = [];
  if (resolution) {
    for (const e of run.log) {
      if (e.type !== 'effect' || e.cause !== resolution) continue;
      if (e.effect === 'set_fact') applied.push({ kind: 'fact', label: e.label });
      else if (e.effect === 'adjust') {
        const who = content.characters.get(e.path.split('.')[1] ?? '')?.display ?? e.path;
        applied.push({ kind: 'trust', label: `${who}: trust ${e.before} → ${e.after} (${e.by >= 0 ? '+' : ''}${e.by})` });
      } else if (e.effect === 'adopt_procedure') applied.push({ kind: 'procedure', label: `Binder: ${content.procedures.get(e.procedure)?.title ?? e.procedure}` });
      else if (e.effect === 'append_note') applied.push({ kind: 'note', label: `${content.characters.get(e.person)?.display ?? e.person} — note: ${factLabel(content, e.fact)}` });
    }
  }

  return {
    phase: {
      id: phase.id, title: phase.title, display_time: phase.display_time, contact: phase.contact,
      alternate_history: alternateHistoryActive(content, phaseIndex), index: phaseIndex, count: content.mission.phases.length,
    },
    attention: phase.attention === null || state.mission.attention === null ? null : { remaining: state.mission.attention, declared: phase.attention },
    node: {
      id: node.id, type: node.type,
      title: node.type === 'event' || node.type === 'briefing' || node.type === 'decision' ? node.title ?? null : null,
      header_label: node.type === 'briefing' || node.type === 'decision' ? node.header_label ?? null : node.type === 'event' ? node.label ?? null : null,
      text,
      prompt: node.type === 'prep_choice' || node.type === 'decision' ? node.prompt : null,
    },
    lines: visibleLines,
    questions,
    readout,
    options,
    continue: cont ? { id: cont.id, label: cont.label } : null,
    status,
    event_text: eventText,
    resolution,
    acquired_here: acquiredHere,
    applied,
  };
}

export function describeEvidence(content: ContentIndex, state: RunState): EvidenceView[] {
  const curPhase = state.mission.cursor ? content.mission.phases[state.mission.cursor.phase]?.id ?? null : null;
  const out: EvidenceView[] = [];
  for (const [id, rec] of Object.entries(state.mission.evidence)) {
    const e = content.evidence.get(id);
    if (!e) continue;
    const eligible = !e.visible_when || evaluate(e.visible_when, state);
    const badge: EvidenceView['badge'] = e.kind === 'reference' ? 'REFERENCE' : rec.phase === curPhase ? 'CURRENT CONTACT' : 'PREVIOUS CONTACT';
    out.push({
      id, kind: e.kind, title: e.title, body: eligible ? e.body : null, eligible, simulated: e.simulated, badge,
      stage: rec.stage, channel: rec.channel, observation: e.observation ?? null, provenance: e.provenance, at_event: rec.at_event,
    });
  }
  out.sort((a, b) => b.at_event - a.at_event);
  return out;
}

export interface Adjustment {
  person: string;
  display: string;
  before: number;
  after: number;
  by: number;
  label: string;
}

export interface DebriefView {
  outcome: { id: string; title: string; kind: string };
  consequence: { resolution: string; text: string } | null;
  relationship: { resolution: string; lines: LineView[]; adjustments: Adjustment[] } | null;
  controllers: { id: string; display: string; before: number; after: number; label: string; notes: string[] }[];
  constraint: { fact: string; text: string } | null;
  postflight: {
    stance: string | null;
    statement: string | null;
    response: { resolution: string; text: string } | null;
    astronauts: { id: string; display: string; before: number; after: number; label: string; notes: string[] }[];
    status: { id: string; title: string; text: string; procedure: string | null }[];
    context: EvidenceView | null;
  };
  procedures: { id: string; title: string; text: string; status: string }[];
  paragraphs: { id: string; text: string }[];
  events: LogEntry[];
}

function adjustmentsFor(content: ContentIndex, log: readonly LogEntry[], cause: string): Adjustment[] {
  const out: Adjustment[] = [];
  for (const entry of log) {
    if (entry.type === 'effect' && entry.effect === 'adjust' && entry.cause === cause) {
      const person = entry.path.split('.')[1] ?? '';
      const c = content.characters.get(person);
      out.push({ person, display: c?.display ?? person, before: entry.before, after: entry.after, by: entry.by, label: trustLabel(content.followon, entry.after) });
    }
  }
  return out;
}

export function describeDebrief(run: Run): DebriefView | null {
  const content = run.content;
  const state = run.state;
  const done = state.mission.completed;
  if (!done) return null;
  const layout = content.mission.debrief_layout;
  const log = run.log;

  const consRes = state.mission.node_resolution[layout.consequence_node];
  const consequence = consRes ? { resolution: consRes, text: content.resolutions.get(consRes)?.resolution.text ?? '' } : null;

  const relRes = state.mission.node_resolution[layout.relationship_node];
  const relationship = relRes
    ? {
      resolution: relRes,
      lines: (content.resolutions.get(relRes)?.resolution.lines ?? []).map((l) => lineView(content, state, l)),
      adjustments: adjustmentsFor(content, log, relRes),
    }
    : null;

  const personRow = (id: string) => {
    const p = state.ledger.people[id] ?? { trust: 0, notes: [] };
    const first = log.find((e) => e.type === 'effect' && e.effect === 'adjust' && e.path === `people.${id}.trust`);
    const before = first && first.type === 'effect' && first.effect === 'adjust' ? first.before : p.trust;
    const c = content.characters.get(id);
    return { id, display: c?.display ?? id, before, after: p.trust, label: trustLabel(content.followon, p.trust), notes: [...p.notes] };
  };

  const constraintFact = layout.constraint_facts.find((f) => Object.prototype.hasOwnProperty.call(state.ledger.facts, f)) ?? null;
  const constraintText = constraintFact ? content.followon.constraint.find((c) => evaluate(c.when, state))?.text ?? null : null;

  const accRes = state.mission.node_resolution[layout.accountability_node];
  const stanceChoice = state.mission.chosen.find((c) => content.nodes.get(c.node)?.node.type === 'decision' && content.options.get(c.option)?.option.statement);
  const stanceOption = stanceChoice ? content.options.get(stanceChoice.option)?.option : undefined;
  const fo = describeFollowOn(content, state.ledger, done, state.followon.committed);
  const contextEv = describeEvidence(content, state).find((e) => e.id === 'g8-ev-postflight-context') ?? null;

  const paragraphs = content.mission.debrief.filter((r) => evaluate(r.when, state)).map((r) => ({ id: r.id, text: r.text }));

  return {
    outcome: { id: done.outcome, title: done.title, kind: done.kind },
    consequence,
    relationship,
    controllers: layout.controllers.map(personRow),
    constraint: constraintFact ? { fact: constraintFact, text: constraintText ?? '' } : null,
    postflight: {
      stance: stanceOption?.id ?? null,
      statement: stanceOption?.statement ?? null,
      response: accRes ? { resolution: accRes, text: content.resolutions.get(accRes)?.resolution.text ?? '' } : null,
      astronauts: layout.astronauts.map(personRow),
      status: fo.status_blocks,
      context: contextEv,
    },
    procedures: state.ledger.procedures.map((id) => {
      const p = content.procedures.get(id);
      return { id, title: p?.title ?? id, text: p?.text ?? '', status: p?.status ?? '' };
    }),
    paragraphs,
    events: log.filter((e) => e.player_visible),
  };
}

export function describeFollowOnForRun(run: Run): FollowOnView | null {
  const done = run.state.mission.completed;
  if (!done || !run.state.followon.active) return null;
  return describeFollowOn(run.content, run.state.ledger, done, run.state.followon.committed);
}

export function conditionHolds(run: Run, cond: Condition): boolean {
  return evaluate(cond, run.state);
}
