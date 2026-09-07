import type { Condition, RunState } from './types';

/** Evaluate a condition against the run state. Pure. */
export function evaluate(cond: Condition, state: RunState): boolean {
  if ('fact' in cond) return Object.prototype.hasOwnProperty.call(state.ledger.facts, cond.fact);
  if ('evidence' in cond) return Object.prototype.hasOwnProperty.call(state.mission.evidence, cond.evidence);
  if ('procedure' in cond) return state.ledger.procedures.includes(cond.procedure);
  if ('chose' in cond) return state.mission.chosen.some((c) => c.option === cond.chose);
  if ('event_seen' in cond) return state.mission.events_seen.includes(cond.event_seen);
  if ('all' in cond) return cond.all.every((c) => evaluate(c, state));
  if ('any' in cond) return cond.any.some((c) => evaluate(c, state));
  if ('not' in cond) return !evaluate(cond.not, state);
  throw new Error('evaluate: unknown condition shape ' + JSON.stringify(cond));
}

/**
 * Witness: for every positively referenced fact / chosen option / seen event
 * in the condition that currently holds, the log seq that established it.
 * Recorded with each resolution so the debrief can cite causes (SC-08).
 */
export function witness(cond: Condition, state: RunState): Record<string, number> {
  const out: Record<string, number> = {};
  const visit = (c: Condition, negated: boolean): void => {
    if ('fact' in c) {
      const f = state.ledger.facts[c.fact];
      if (!negated && f) out['fact:' + c.fact] = f.at_event;
    } else if ('chose' in c) {
      const ch = state.mission.chosen.find((x) => x.option === c.chose);
      if (!negated && ch) out['chose:' + c.chose] = ch.at_event;
    } else if ('evidence' in c) {
      const ev = state.mission.evidence[c.evidence];
      if (!negated && ev) out['evidence:' + c.evidence] = ev.at_event;
    } else if ('all' in c) c.all.forEach((x) => visit(x, negated));
    else if ('any' in c) c.any.forEach((x) => visit(x, negated));
    else if ('not' in c) visit(c.not, !negated);
  };
  visit(cond, false);
  return out;
}

/** Collect every id referenced by a condition, by kind. Used by the validator. */
export function references(cond: Condition, acc = { facts: new Set<string>(), evidence: new Set<string>(), procedures: new Set<string>(), options: new Set<string>(), events: new Set<string>() }) {
  if ('fact' in cond) acc.facts.add(cond.fact);
  else if ('evidence' in cond) acc.evidence.add(cond.evidence);
  else if ('procedure' in cond) acc.procedures.add(cond.procedure);
  else if ('chose' in cond) acc.options.add(cond.chose);
  else if ('event_seen' in cond) acc.events.add(cond.event_seen);
  else if ('all' in cond) cond.all.forEach((c) => references(c, acc));
  else if ('any' in cond) cond.any.forEach((c) => references(c, acc));
  else if ('not' in cond) references(cond.not, acc);
  return acc;
}

/** Facts that a condition requires positively at its top-level conjunction (not under any/not). */
export function positiveFacts(cond: Condition): string[] {
  if ('fact' in cond) return [cond.fact];
  if ('all' in cond) return cond.all.flatMap(positiveFacts);
  return [];
}
