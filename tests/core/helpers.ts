import { resolve } from 'node:path';
import { expect } from 'vitest';
import { Run, indexContent, type ContentIndex, type Input } from '../../core';
import { loadBundle } from '../../scripts/lib/load-content';

export const ROOT = resolve(__dirname, '..', '..');

let cached: ContentIndex | null = null;
export function content(): ContentIndex {
  if (!cached) cached = indexContent(loadBundle(ROOT));
  return cached;
}

export function newRun(seed = 1): Run {
  return new Run(content(), { seed });
}

export type Prep = 'contact' | 'recovery' | 'systems';
export type Route = 'earlier' | 'later';
export type Lesson = 'provenance' | 'recovery';
export type Stance = 'blame' | 'ground';

export interface Script {
  prep?: Prep[];
  route?: Route;
  lesson?: Lesson;
  stance?: Stance;
  questions?: boolean;
  /** Plan id to confirm after finalization; null = do not confirm. */
  plan?: string | null;
  /** Stop after this many inputs of the full script (for boundary tests). */
  upTo?: number;
}

export const cont = (node: string, id?: string): Input => ({ kind: 'continue', node, id: id ?? node + '-continue' });
export const opt = (node: string, option: string): Input => ({ kind: 'option', node, option });
export const ask = (node: string, question: string): Input => ({ kind: 'question', node, question });
export const confirm = (plan: string): Input => ({ kind: 'confirm_plan', id: 'g9-confirm-plan', plan });

/** The standard route from 02-Sources-and-Acceptance, parameterized. */
export function script(s: Script = {}): Input[] {
  const prep = s.prep ?? [];
  const route = s.route ?? 'earlier';
  const lesson = s.lesson ?? 'provenance';
  const stance = s.stance ?? 'ground';
  const inputs: Input[] = [];
  inputs.push(cont('g8-brief'));
  for (const p of prep) inputs.push(opt('g8-prep-select', 'g8-prep-' + p));
  inputs.push(cont('g8-prep-select', 'g8-prep-finish'));
  inputs.push(cont('g8-docking-report'));
  inputs.push(cont('g8-loss-of-contact'));
  if (s.questions) inputs.push(ask('g8-gap-note', 'g8-q-gap'));
  inputs.push(cont('g8-gap-note'));
  inputs.push(cont('g8-crisis-report'));
  inputs.push(cont('g8-stabilization-report'));
  inputs.push(opt('g8-rule-decision', 'g8-order-return'));
  if (s.questions) {
    inputs.push(ask('g8-return-brief', 'g8-q-recovery-risk'));
    inputs.push(ask('g8-return-brief', 'g8-q-reserve-risk'));
  }
  inputs.push(opt('g8-return-brief', 'g8-return-' + route));
  inputs.push(cont('g8-order-receipt', 'g8-execute-return'));
  inputs.push(cont('g8-ground-execution'));
  inputs.push(cont('g8-return-beat-1'));
  inputs.push(cont('g8-return-beat-2'));
  inputs.push(cont('g8-pickup-report'));
  inputs.push(cont('g8-relationship-response'));
  inputs.push(opt('g8-lesson-decision', 'g8-adopt-' + lesson));
  inputs.push(cont('g8-accountability-brief'));
  inputs.push(opt('g8-accountability-decision', stance === 'blame' ? 'g8-back-crew-criticism' : 'g8-own-ground-contingencies'));
  inputs.push(cont('g8-accountability-receipt', 'g8-resolve-accountability'));
  inputs.push(cont('g8-accountability-response', 'g8-finish'));
  if (s.plan) inputs.push(confirm(s.plan));
  return s.upTo === undefined ? inputs : inputs.slice(0, s.upTo);
}

/** Apply inputs, failing the test on the first rejection. */
export function play(run: Run, inputs: Input[]): Run {
  for (const inp of inputs) {
    const r = run.apply(inp);
    if (!r.ok) throw new Error(`input rejected: ${JSON.stringify(inp)} -> ${r.code}: ${r.message}`);
  }
  return run;
}

export function playScript(s: Script = {}, seed = 1): Run {
  return play(newRun(seed), script(s));
}

/** Index of the first input in the standard script that targets `node` (or has `id`). */
export function indexOf(inputs: Input[], pred: (i: Input) => boolean): number {
  const i = inputs.findIndex(pred);
  expect(i).toBeGreaterThanOrEqual(0);
  return i;
}

export const PREP_SETS: Prep[][] = [[], ['contact'], ['recovery'], ['systems'], ['contact', 'recovery'], ['contact', 'systems'], ['recovery', 'systems']];

export const ORACLE: Record<string, { earlier: number; later: number }> = {
  '': { earlier: 0, later: 0 },
  'contact': { earlier: 1, later: 1 },
  'recovery': { earlier: 1, later: 0 },
  'systems': { earlier: 0, later: 1 },
  'contact+recovery': { earlier: 2, later: 1 },
  'contact+systems': { earlier: 1, later: 2 },
  'recovery+systems': { earlier: 1, later: 1 },
};

export function prepKey(prep: Prep[]): string {
  return [...prep].sort().join('+');
}

export function trust(run: Run, id: string): number {
  return run.state.ledger.people[id]!.trust;
}

export function hasFact(run: Run, id: string): boolean {
  return Object.prototype.hasOwnProperty.call(run.state.ledger.facts, id);
}
