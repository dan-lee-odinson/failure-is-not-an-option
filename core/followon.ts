/**
 * Gemini IX-A planning screen — initialized solely from the committed ledger,
 * the completion record, and the follow-on's own content. Nothing here reads
 * the mission's evidence, cursor, or UI state.
 */

import { evaluate } from './conditions';
import type { ContentIndex } from './content';
import type { Completion, Condition, FollowOn, Ledger, RunState } from './types';

/** A minimal state view so the condition evaluator can run on ledger-only data. */
function ledgerOnlyState(ledger: Ledger): RunState {
  return {
    ledger,
    mission: { id: '', cursor: null, attention: null, evidence: {}, chosen: [], questions_asked: [], events_seen: [], node_resolution: {}, completed: null },
    followon: { id: '', active: false, committed: null, at_event: null },
    seq: 0,
    draws: 0,
  };
}

export function holdsOnLedger(cond: Condition, ledger: Ledger): boolean {
  return evaluate(cond, ledgerOnlyState(ledger));
}

/** Returns a problem description, or null when the committed ledger is a valid follow-on input. */
export function validateFollowOnLedger(fo: FollowOn, ledger: Ledger, completion: Completion | null, missionId: string): string | null {
  if (!completion) return 'no completion record';
  if (completion.mission !== fo.requires_completion_of || completion.mission !== missionId) {
    return `completion record is for ${completion.mission}, expected ${fo.requires_completion_of}`;
  }
  const present = fo.constraint_facts.filter((f) => Object.prototype.hasOwnProperty.call(ledger.facts, f));
  if (present.length !== 1) {
    return `exactly one operational constraint is required; found ${present.length} (${present.join(', ') || 'none'})`;
  }
  const committed = fo.plans.filter((p) => p.effects.some((e) => 'set_fact' in e && Object.prototype.hasOwnProperty.call(ledger.facts, e.set_fact)));
  if (committed.length > 1) return `more than one plan appears committed: ${committed.map((p) => p.id).join(', ')}`;
  return null;
}

export interface FollowOnView {
  id: string;
  title: string;
  display_title: string;
  node: string;
  completion: Completion;
  constraint_text: string | null;
  controllers: { id: string; trust: number; label: string; notes: string[] }[];
  astronauts: { id: string; trust: number; label: string; notes: string[] }[];
  status_blocks: { id: string; title: string; text: string; procedure: string | null }[];
  procedures: string[];
  plans: { id: string; label: string; benefit: string; enabled: boolean; reason: string | null; committed: boolean }[];
  committed: string | null;
  committed_text: string;
}

export function trustLabel(fo: FollowOn, trust: number): string {
  return fo.trust_labels[String(trust)] ?? `Trust ${trust}`;
}

export function describeFollowOn(content: ContentIndex, ledger: Ledger, completion: Completion, committed: string | null): FollowOnView {
  const fo = content.followon;
  const st = ledgerOnlyState(ledger);
  const constraint = fo.constraint.find((c) => evaluate(c.when, st));
  const person = (id: string) => {
    const p = ledger.people[id] ?? { trust: 0, notes: [] };
    return { id, trust: p.trust, label: trustLabel(fo, p.trust), notes: [...p.notes] };
  };
  const plans = fo.plans.map((plan) => {
    const enabled = evaluate(plan.available_when, st);
    const reason = enabled ? null : plan.disabled_reasons.find((r) => evaluate(r.when, st))?.text ?? 'Not available on this route.';
    return { id: plan.id, label: plan.label, benefit: plan.benefit, enabled, reason, committed: committed === plan.id };
  });
  return {
    id: fo.id,
    title: fo.title,
    display_title: fo.display_title,
    node: fo.node,
    completion,
    constraint_text: constraint?.text ?? null,
    controllers: fo.controllers.map(person),
    astronauts: fo.astronauts.map(person),
    status_blocks: fo.status_blocks.filter((b) => evaluate(b.when, st)).map((b) => ({ id: b.id, title: b.title, text: b.text, procedure: b.procedure ?? null })),
    procedures: [...ledger.procedures],
    plans,
    committed,
    committed_text: fo.committed_text,
  };
}
