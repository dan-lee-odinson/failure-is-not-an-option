/**
 * Dialogue sheet: every player-visible string, once, in the order a player
 * meets it, with kind, speaker, branch, and owning id.
 *
 * How it is derived (never maintained by hand):
 *   1. A generic explorer plays every route the engine allows — every
 *      preparation subset, every decision option, every question, every
 *      enabled Gemini IX-A plan — and stops at every node.
 *   2. At each stop the view-models (core/views.ts) give the structured
 *      strings with their kinds and ids, and the real renderer (app/render.ts)
 *      is run over the same state so anything the app authors itself
 *      (buttons, headings, hints, badges, tooltips, compositions such as
 *      "Trust 0 → 1 · Confidence strengthened") is captured exactly as
 *      displayed. Overlays are rendered too.
 *   3. Strings are deduplicated on their text (digit runs collapsed, so a
 *      counter such as "EVIDENCE · 12" is one row) and attributed to the
 *      first node where a player can meet them. A string seen only on some
 *      routes gets a branch label computed from the routes that show it.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  Run, indexContent, describeNode, describeEvidence, describeDebrief, describeFollowOnForRun, optionAvailability,
  type ContentIndex, type Input, type LineView,
} from '../../core';
import { loadBundle } from './load-content';
import { render } from '../../app/render';
import type { Store, UiState } from '../../app/main';

export type Source = 'content' | 'core' | 'app';

export interface Captured {
  kind: string;
  speaker: string;
  id: string;
  text: string;
  source: Source;
}

export interface SheetRow extends Captured {
  order: number;
  phase: string;
  phaseTitle: string;
  node: string;
  nodeTitle: string;
  branch: string;
}

export interface Sheet {
  version: string;
  fingerprint: string;
  rows: SheetRow[];
  runs: number;
  /** Content strings that no reachable state displays (not on the sheet). */
  unreachable: { kind: string; id: string; text: string }[];
}

// ---------------------------------------------------------------------------
// Text helpers
// ---------------------------------------------------------------------------

export function norm(s: string): string {
  return s.replace(/\s+/g, ' ').trim();
}

/** Dedupe key: whitespace-normalized, digit runs and hex fingerprints collapsed. */
export function dedupeKey(s: string): string {
  return norm(s).replace(/[0-9a-f]{12,}/g, '#').replace(/\d+/g, '#');
}

const ENTITIES: Record<string, string> = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'" };
function decode(s: string): string {
  return s.replace(/&(amp|lt|gt|quot|#39);/g, (m) => ENTITIES[m] ?? m);
}

export interface DomRun {
  text: string;
  tag: string;
  cls: string;
  attr: 'title' | 'alt' | 'aria-label' | null;
}

const VOID = new Set(['img', 'input', 'br', 'hr', 'meta', 'link']);
/** Inline text-level elements do not split a run (a <code> inside a sentence stays in the sentence). */
const INLINE = new Set(['b', 'i', 'em', 'strong', 'code', 'small', 'u', 'sub', 'sup', 'abbr', 'kbd', 'a']);

/** Text runs and player-facing attribute values of an HTML string, in document order, with the enclosing element. */
export function extractRuns(html: string): DomRun[] {
  const out: DomRun[] = [];
  const stack: { tag: string; cls: string }[] = [];
  let buffer = '';
  let owner: { tag: string; cls: string } | null = null;
  const flush = (): void => {
    const text = norm(buffer);
    buffer = '';
    if (!text || !/[A-Za-z0-9]/.test(text)) { owner = null; return; }
    const o = owner ?? { tag: '', cls: '' };
    owner = null;
    if (o.cls.includes('event-record') || stack.some((s) => s.cls.includes('event-record'))) return; // raw JSON log lines
    out.push({ text, tag: o.tag, cls: o.cls, attr: null });
  };
  const re = /<!--[\s\S]*?-->|<\/?[a-zA-Z][^>]*>|[^<]+/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const tok = m[0];
    if (tok.startsWith('<!--')) continue;
    if (tok.startsWith('</')) {
      const name = /^<\/([a-zA-Z0-9]+)/.exec(tok)?.[1]?.toLowerCase() ?? '';
      const top = stack[stack.length - 1];
      const inline = INLINE.has(name) || (name === 'span' && top?.tag === 'span' && !top.cls);
      if (!inline) flush();
      for (let i = stack.length - 1; i >= 0; i--) if (stack[i]!.tag === name) { stack.length = i; break; }
      continue;
    }
    if (tok.startsWith('<')) {
      const name = /^<([a-zA-Z0-9]+)/.exec(tok)?.[1]?.toLowerCase() ?? '';
      const cls = /\sclass="([^"]*)"/.exec(tok)?.[1] ?? '';
      const inline = INLINE.has(name) || (name === 'span' && !cls);
      if (!inline) flush();
      for (const attr of ['title', 'alt', 'aria-label'] as const) {
        const v = new RegExp(`\\s${attr}="([^"]*)"`).exec(tok)?.[1];
        if (v && norm(decode(v))) out.push({ text: norm(decode(v)), tag: name, cls, attr });
      }
      if (!VOID.has(name) && !tok.endsWith('/>')) stack.push({ tag: name, cls });
      if (!inline) owner = null;
      continue;
    }
    const text = decode(tok);
    if (!owner) owner = stack[stack.length - 1] ?? { tag: '', cls: '' };
    buffer += text;
  }
  flush();
  return out;
}

function uiKind(r: DomRun): string {
  if (r.attr === 'title') return 'ui.tooltip';
  if (r.attr === 'alt') return 'ui.alt';
  if (r.attr === 'aria-label') return 'ui.aria';
  const c = ' ' + r.cls + ' ';
  if (r.tag === 'button') return 'ui.button';
  if (/^h[1-3]$/.test(r.tag) || r.tag === 'summary' || r.tag === 'figcaption') return c.includes(' prompt ') ? 'ui.prompt' : 'ui.heading';
  if (c.includes(' prompt ')) return 'ui.prompt';
  if (/ (label|scene-title|header-label|who|glen|subtitle|status|committed-text) /.test(c)) return 'ui.label';
  if (/ (badge|lamp) /.test(c)) return 'ui.badge';
  if (/ (hint|muted|ev-prov|ev-meta|reason|notes|trust|message) /.test(c)) return 'ui.hint';
  return 'ui.text';
}

// ---------------------------------------------------------------------------
// Route enumeration (generic; no content ids hard-coded)
// ---------------------------------------------------------------------------

export interface RouteSpec {
  inputs: Input[];
}

/** Every complete route: prep subsets × decision options; every question asked; plans handled separately. */
export function enumerateRoutes(content: ContentIndex): RouteSpec[] {
  const routes: RouteSpec[] = [];
  const explore = (inputs: Input[]): void => {
    const run = new Run(content, { seed: 0 });
    for (const inp of inputs) {
      const r = run.apply(inp);
      if (!r.ok) throw new Error(`route rejected: ${r.message}`);
    }
    const cur = run.currentNode();
    if (!cur) { routes.push({ inputs }); return; }
    const { node } = cur;
    const questions = node.type === 'briefing' || node.type === 'decision' ? (node.questions ?? []) : [];
    const asked: Input[] = questions.filter((q) => !run.state.mission.questions_asked.includes(q.id)).map((q) => ({ kind: 'question', node: node.id, question: q.id }));
    if (asked.length) { explore([...inputs, ...asked]); return; }
    if (node.type === 'prep_choice') {
      const avail = node.options.filter((o) => optionAvailability(run.state, node, o).available);
      const chosenIdx = run.state.mission.chosen.filter((c) => c.node === node.id).map((c) => node.options.findIndex((x) => x.id === c.option));
      const floor = chosenIdx.length ? Math.max(...chosenIdx) : -1;
      for (const o of avail) {
        const idx = node.options.findIndex((x) => x.id === o.id);
        if (idx > floor) explore([...inputs, { kind: 'option', node: node.id, option: o.id }]);
      }
      explore([...inputs, { kind: 'continue', node: node.id, id: node.finish.id }]);
      return;
    }
    if (node.type === 'decision') {
      const avail = node.options.filter((o) => optionAvailability(run.state, node, o).available);
      for (const o of avail) explore([...inputs, { kind: 'option', node: node.id, option: o.id }]);
      return;
    }
    explore([...inputs, { kind: 'continue', node: node.id, id: node.continue.id }]);
  };
  explore([]);
  return routes;
}

// ---------------------------------------------------------------------------
// Signatures and branch labels
// ---------------------------------------------------------------------------

type Dims = Record<string, boolean>;

/** The route's final signature: every option chosen, the execution grade, derived counts, and the committed plan. */
export function signature(run: Run, plan: string | null): Dims {
  const d: Dims = {};
  const prepNodes = new Set<string>();
  for (const ref of run.content.nodes.values()) if (ref.node.type === 'prep_choice') prepNodes.add(ref.node.id);
  let preps = 0;
  for (const c of run.state.mission.chosen) {
    d['chose:' + c.option] = true;
    if (prepNodes.has(c.node)) preps++;
  }
  if (preps >= 1) d['prep:any'] = true;
  if (preps >= 2) d['prep:two'] = true;
  for (const f of Object.keys(run.state.ledger.facts)) {
    const m = /-q(\d)$/.exec(f);
    if (m) { d['fact:' + f] = true; d['grade:q' + m[1]] = true; }
  }
  if (plan) { d['plan:' + plan] = true; d['plan:any'] = true; }
  return d;
}

function sigKey(d: Dims): string {
  return Object.keys(d).filter((k) => d[k]).sort().join('|');
}

const ALIAS: Record<string, string> = {
  'chose:g8-prep-contact': 'contact rehearsal',
  'chose:g8-prep-recovery': 'recovery rehearsal',
  'chose:g8-prep-systems': 'systems rehearsal',
  'prep:any': 'any rehearsal',
  'prep:two': 'two rehearsals',
  'chose:g8-return-earlier': 'earlier',
  'chose:g8-return-later': 'later',
  'fact:g8-earlier-q0': 'earlier q0', 'fact:g8-earlier-q1': 'earlier q1', 'fact:g8-earlier-q2': 'earlier q2',
  'fact:g8-later-q0': 'later q0', 'fact:g8-later-q1': 'later q1', 'fact:g8-later-q2': 'later q2',
  'grade:q0': 'q0', 'grade:q1': 'q1', 'grade:q2': 'q2',
  'chose:g8-adopt-provenance': 'lesson: provenance',
  'chose:g8-adopt-recovery': 'lesson: recovery cross-check',
  'chose:g8-back-crew-criticism': 'crew-blame',
  'chose:g8-own-ground-contingencies': 'ground-accountability',
  'plan:any': 'plan committed',
  'plan:g9-plan-recovery-systems': 'plan: recovery+systems',
  'plan:g9-plan-recovery-contact': 'plan: recovery+contact',
  'plan:g9-plan-systems-contact': 'plan: systems+contact',
};

function dimLabel(dim: string, value: boolean): string {
  const base = ALIAS[dim] ?? dim.replace(/^(chose|fact|plan|grade|prep):/, '');
  if (value) return base;
  if (dim.startsWith('chose:g8-prep-') || dim.startsWith('prep:')) return 'no ' + base;
  return 'not ' + base;
}

function dimRank(dim: string): number {
  if (/return-/.test(dim)) return 0;
  if (/^fact:.*-q\d$/.test(dim)) return 1;
  if (dim.startsWith('grade:')) return 2;
  if (/criticism|contingencies/.test(dim)) return 3;
  if (/adopt-/.test(dim)) return 4;
  if (dim.startsWith('prep:')) return 5;
  if (/prep-/.test(dim)) return 6;
  if (dim === 'plan:any') return 7;
  if (dim.startsWith('plan:')) return 8;
  return 9;
}

interface Pred { dim: string; value: boolean; mask: boolean[] }

/**
 * Shortest description of `have` inside `universe`: a conjunction of up to
 * three route predicates, else a disjunction of two such conjunctions (each
 * up to two predicates), else "varies".
 */
export function branchLabel(have: Set<string>, universe: Map<string, Dims>): string {
  if (have.size === universe.size) return '';
  const keys = [...universe.keys()];
  const target = keys.map((k) => have.has(k));
  const dims = new Set<string>();
  for (const d of universe.values()) for (const k of Object.keys(d)) dims.add(k);
  const ordered = [...dims].sort((a, b) => dimRank(a) - dimRank(b) || a.localeCompare(b));
  const preds: Pred[] = [];
  for (const value of [true, false]) {
    for (const dim of ordered) {
      const mask = keys.map((k) => !!universe.get(k)![dim] === value);
      const t = mask.filter(Boolean).length;
      if (t > 0 && t < keys.length) preds.push({ dim, value, mask });
    }
  }
  const equal = (mask: boolean[]): boolean => mask.every((v, i) => v === target[i]);
  const and = (a: boolean[], b: boolean[]): boolean[] => a.map((v, i) => v && b[i]!);
  const or = (a: boolean[], b: boolean[]): boolean[] => a.map((v, i) => v || b[i]!);
  const label = (ps: Pred[]): string => ps.map((p) => dimLabel(p.dim, p.value)).join(' & ');

  // Conjunctions of 1..3 predicates over distinct dimensions.
  const conj: { ps: Pred[]; mask: boolean[] }[] = [];
  for (let i = 0; i < preds.length; i++) {
    const a = preds[i]!;
    if (equal(a.mask)) return label([a]);
    conj.push({ ps: [a], mask: a.mask });
  }
  for (let i = 0; i < preds.length; i++) for (let j = i + 1; j < preds.length; j++) {
    const a = preds[i]!, b = preds[j]!;
    if (a.dim === b.dim) continue;
    const mask = and(a.mask, b.mask);
    if (equal(mask)) return label([a, b]);
    conj.push({ ps: [a, b], mask });
  }
  for (let i = 0; i < preds.length; i++) for (let j = i + 1; j < preds.length; j++) for (let k = j + 1; k < preds.length; k++) {
    const a = preds[i]!, b = preds[j]!, c = preds[k]!;
    if (a.dim === b.dim || a.dim === c.dim || b.dim === c.dim) continue;
    if (equal(and(and(a.mask, b.mask), c.mask))) return label([a, b, c]);
  }
  // Disjunction of two conjunctions (each of size ≤ 2).
  for (let i = 0; i < conj.length; i++) for (let j = i + 1; j < conj.length; j++) {
    if (equal(or(conj[i]!.mask, conj[j]!.mask))) return `${label(conj[i]!.ps)} | ${label(conj[j]!.ps)}`;
  }
  return `varies (${have.size} of ${universe.size} routes)`;
}

// ---------------------------------------------------------------------------
// Structured strings from the view-models
// ---------------------------------------------------------------------------

const GLEN = 'Glen Kurtz — FLIGHT';

function line(l: LineView, kind: string, id: string): Captured[] {
  return [{ kind, speaker: l.speaker ? l.speaker.display : '(narration)', id, text: l.text, source: 'content' }];
}

export function provenanceText(e: { provenance: { note: string; sources: string[]; fiction: string[] } }): string {
  return `${e.provenance.note}${e.provenance.sources.length ? ` Sources: ${e.provenance.sources.join(', ')}.` : ''}${e.provenance.fiction.length ? ` Fiction register: ${e.provenance.fiction.join(', ')}.` : ''}`;
}

function structuredNode(run: Run): Captured[] {
  const v = describeNode(run);
  if (!v) return [];
  const content = run.content;
  const out: Captured[] = [];
  out.push({ kind: 'label', speaker: '', id: v.phase.id, text: v.phase.title, source: 'content' });
  out.push({ kind: 'label', speaker: '', id: v.phase.id, text: v.phase.display_time, source: 'content' });
  if (v.node.title) out.push({ kind: 'label', speaker: '', id: v.node.id, text: v.node.title, source: 'content' });
  if (v.node.header_label) out.push({ kind: 'label', speaker: '', id: v.node.id, text: v.node.header_label, source: 'content' });
  if (v.node.text) out.push({ kind: 'briefing', speaker: '', id: v.node.id, text: v.node.text, source: 'content' });
  const isReaction = v.node.id === content.mission.debrief_layout.relationship_node;
  for (const [i, l] of v.lines.entries()) out.push(...line(l, isReaction ? 'reaction' : 'line', `${v.resolution ?? v.node.id}#${i + 1}`));
  if (v.event_text) out.push({ kind: v.node.id === content.mission.debrief_layout.consequence_node ? 'consequence' : 'event.text', speaker: '', id: v.resolution ?? v.node.id, text: v.event_text, source: 'content' });
  for (const s of v.status ?? []) out.push({ kind: 'event.status', speaker: '', id: v.resolution ?? v.node.id, text: s, source: 'content' });
  for (const a of v.applied) out.push({ kind: 'event.logged', speaker: '', id: v.resolution ?? v.node.id, text: a.label, source: 'core' });
  for (const q of v.questions) {
    out.push({ kind: 'question', speaker: GLEN, id: q.id, text: q.text, source: 'content' });
    if (q.asked) out.push(...line(q.answer, 'answer', q.id));
  }
  if (v.node.prompt) out.push({ kind: 'ui.prompt', speaker: GLEN, id: v.node.id, text: v.node.prompt, source: 'content' });
  for (const r of v.readout ?? []) {
    out.push({ kind: 'label', speaker: '', id: v.node.id, text: r.label, source: 'content' });
    out.push({ kind: 'label', speaker: '', id: v.node.id, text: r.text, source: 'content' });
  }
  for (const o of v.options ?? []) {
    if (o.subtitle) out.push({ kind: 'option.subtitle', speaker: '', id: o.id, text: o.subtitle, source: 'content' });
    out.push({ kind: 'option.intent', speaker: '', id: o.id, text: o.intent, source: 'content' });
    if (o.statement) out.push({ kind: 'option.statement', speaker: GLEN, id: o.id, text: o.statement, source: 'content' });
    if (o.attraction) out.push({ kind: 'option.attraction', speaker: '', id: o.id, text: o.attraction, source: 'content' });
    out.push({ kind: 'option.cost', speaker: '', id: o.id, text: o.cost, source: 'content' });
    out.push({ kind: 'option.uncertainty', speaker: '', id: o.id, text: o.uncertainty, source: 'content' });
    for (const s of o.supported_by) out.push({ kind: 'label', speaker: '', id: s.fact, text: s.label, source: 'content' });
    if (!o.available && o.reason) out.push({ kind: 'option.requirement-reason', speaker: '', id: o.id, text: o.reason, source: 'content' });
  }
  if (v.continue) out.push({ kind: 'ui.button', speaker: '', id: v.continue.id, text: v.continue.label, source: 'content' });
  for (const e of describeEvidence(content, run.state)) {
    out.push({ kind: 'evidence.title', speaker: '', id: e.id, text: e.title, source: 'content' });
    if (e.body !== null) out.push({ kind: 'evidence.body', speaker: '', id: e.id, text: e.body, source: 'content' });
    out.push({ kind: 'evidence.provenance', speaker: '', id: e.id, text: provenanceText(e), source: 'content' });
    out.push({ kind: 'label', speaker: '', id: e.id, text: e.badge, source: 'core' });
    out.push({ kind: 'label', speaker: '', id: e.id, text: e.stage, source: 'content' });
  }
  return out;
}

function structuredDebrief(run: Run): Captured[] {
  const d = describeDebrief(run);
  if (!d) return [];
  const out: Captured[] = [];
  out.push({ kind: 'outcome.title', speaker: '', id: d.outcome.id, text: d.outcome.title, source: 'content' });
  if (d.consequence) out.push({ kind: 'consequence', speaker: '', id: d.consequence.resolution, text: d.consequence.text, source: 'content' });
  if (d.relationship) for (const [i, l] of d.relationship.lines.entries()) out.push(...line(l, 'reaction', `${d.relationship.resolution}#${i + 1}`));
  for (const p of [...d.controllers, ...d.postflight.astronauts]) out.push({ kind: 'label', speaker: '', id: 'trust_labels', text: p.label, source: 'content' });
  if (d.constraint) out.push({ kind: 'followon.paragraph', speaker: '', id: d.constraint.fact, text: d.constraint.text, source: 'content' });
  if (d.postflight.statement && d.postflight.stance) out.push({ kind: 'option.statement', speaker: GLEN, id: d.postflight.stance, text: d.postflight.statement, source: 'content' });
  if (d.postflight.response) out.push({ kind: 'event.text', speaker: '', id: d.postflight.response.resolution, text: d.postflight.response.text, source: 'content' });
  if (d.postflight.context?.body) out.push({ kind: 'evidence.body', speaker: '', id: d.postflight.context.id, text: d.postflight.context.body, source: 'content' });
  for (const s of d.postflight.status) {
    out.push({ kind: 'followon.paragraph', speaker: '', id: s.id, text: s.title, source: 'content' });
    out.push({ kind: 'followon.paragraph', speaker: '', id: s.id, text: s.text, source: 'content' });
  }
  for (const p of d.procedures) {
    out.push({ kind: 'procedure.title', speaker: '', id: p.id, text: p.title, source: 'content' });
    out.push({ kind: 'procedure.text', speaker: '', id: p.id, text: p.text, source: 'content' });
  }
  for (const p of d.paragraphs) out.push({ kind: 'debrief', speaker: '', id: p.id, text: p.text, source: 'content' });
  return out;
}

function structuredPlanning(run: Run): Captured[] {
  const f = describeFollowOnForRun(run);
  if (!f) return [];
  const content = run.content;
  const out: Captured[] = [];
  out.push({ kind: 'label', speaker: '', id: f.id, text: f.display_title, source: 'content' });
  out.push({ kind: 'label', speaker: '', id: f.completion.outcome, text: f.completion.title, source: 'content' });
  if (f.constraint_text) out.push({ kind: 'followon.paragraph', speaker: '', id: f.id, text: f.constraint_text, source: 'content' });
  for (const p of [...f.controllers, ...f.astronauts]) out.push({ kind: 'label', speaker: '', id: 'trust_labels', text: p.label, source: 'content' });
  for (const s of f.status_blocks) {
    out.push({ kind: 'followon.paragraph', speaker: '', id: s.id, text: s.title, source: 'content' });
    out.push({ kind: 'followon.paragraph', speaker: '', id: s.id, text: s.text, source: 'content' });
    if (s.procedure) {
      const p = content.procedures.get(s.procedure);
      if (p) { out.push({ kind: 'procedure.title', speaker: '', id: p.id, text: p.title, source: 'content' }); out.push({ kind: 'procedure.text', speaker: '', id: p.id, text: p.text, source: 'content' }); }
    }
  }
  for (const id of f.procedures) {
    const p = content.procedures.get(id);
    if (p) { out.push({ kind: 'procedure.title', speaker: '', id: p.id, text: p.title, source: 'content' }); out.push({ kind: 'procedure.text', speaker: '', id: p.id, text: p.text, source: 'content' }); }
  }
  for (const p of f.plans) {
    out.push({ kind: 'plan.label', speaker: '', id: p.id, text: p.label, source: 'content' });
    out.push({ kind: 'plan.benefit', speaker: '', id: p.id, text: p.benefit, source: 'content' });
    if (!p.enabled && p.reason) out.push({ kind: 'plan.disabled-reason', speaker: '', id: p.id, text: p.reason, source: 'content' });
  }
  if (f.committed) out.push({ kind: 'followon.paragraph', speaker: '', id: f.id, text: f.committed_text, source: 'content' });
  return out;
}

// ---------------------------------------------------------------------------
// Messages authored in code (status toasts, import rejections)
// ---------------------------------------------------------------------------

export const MESSAGE_SOURCES = ['app/main.ts', 'app/storage.ts', 'core/save.ts'] as const;

/** Sentence-like string literals in the message-bearing sources, `${…}` shown as an ellipsis. */
export function messagesFromSource(root: string): { file: string; text: string }[] {
  const out: { file: string; text: string }[] = [];
  for (const file of MESSAGE_SOURCES) {
    const src = readFileSync(resolve(root, file), 'utf8');
    const re = /(['"`])((?:\\.|(?!\1)[\s\S])*?)\1/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(src)) !== null) {
      const raw = m[2]!.replace(/\\'/g, "'").replace(/\$\{[^}]*\}/g, '…').trim();
      if (raw.length < 12 || !/^[A-Z]/.test(raw) || !/ /.test(raw)) continue;
      if (/^[A-Z][a-z]+(Error|Node)/.test(raw)) continue;
      if (!out.some((o) => o.text === raw)) out.push({ file, text: raw });
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Assembly
// ---------------------------------------------------------------------------

interface Slot {
  key: string;
  captured: Captured;
  sigs: Set<string>;
}

interface NodeBucket {
  id: string;
  title: string;
  phase: string;
  phaseTitle: string;
  rank: number;
  slots: Map<string, Slot>;
  universe: Map<string, Dims>;
}

const UI_PHASE = { id: 'ui', title: 'Overlays and messages' };

export class SheetBuilder {
  readonly content: ContentIndex;
  private buckets = new Map<string, NodeBucket>();

  constructor(content: ContentIndex) {
    this.content = content;
  }

  private bucket(id: string, title: string, phase: string, phaseTitle: string, rank: number): NodeBucket {
    let b = this.buckets.get(id);
    if (!b) {
      b = { id, title, phase, phaseTitle, rank, slots: new Map(), universe: new Map() };
      this.buckets.set(id, b);
    }
    return b;
  }

  private ui(overrides: Partial<UiState> = {}): UiState {
    return { screen: 'console', overlay: null, pinned: [], textSize: 'default', highlightPlan: null, message: null, saveMessage: null, hasBrowserSave: true, open: [], ...overrides };
  }

  private store(run: Run | null, ui: UiState): Store {
    return { content: this.content, run, ui };
  }

  /** Record one state: structured strings + the rendered DOM, attributed to `bucket` under the route signature `dims`. */
  private record(b: NodeBucket, dims: Dims, structured: Captured[], html: string): void {
    const key = sigKey(dims);
    b.universe.set(key, dims);
    const byText = new Map<string, Captured>();
    for (const c of structured) { const k = norm(c.text); if (!byText.has(k)) byText.set(k, c); }
    const seenStructured = new Set<string>();
    const add = (c: Captured): void => {
      const k = dedupeKey(c.text);
      let slot = b.slots.get(k);
      if (!slot) { slot = { key: k, captured: c, sigs: new Set() }; b.slots.set(k, slot); }
      slot.sigs.add(key);
    };
    for (const r of extractRuns(html)) {
      const direct = byText.get(r.text) ?? byText.get(r.text.replace(/^[“"']+|[”"']+$/g, ''));
      if (direct) { add(direct); seenStructured.add(norm(direct.text)); continue; }
      add({ kind: uiKind(r), speaker: '', id: 'app', text: r.text, source: 'app' });
    }
    // Structured strings the renderer showed only in composed form (e.g. trust labels) still belong on the sheet.
    for (const c of structured) if (!seenStructured.has(norm(c.text))) add(c);
  }

  captureStart(): void {
    const b = this.bucket('start', 'Start screen', 'start', 'Start screen', 0);
    for (const textSize of ['default', 'large'] as const) {
      this.record(b, {}, [], render(this.store(null, this.ui({ screen: 'notices', textSize }))));
    }
  }

  captureMissionNode(run: Run, dims: Dims): void {
    const cur = run.currentNode();
    if (!cur) return;
    const { phase, node } = cur;
    const ref = this.content.nodes.get(node.id)!;
    const rank = 1000 + ref.phaseIndex * 100 + ref.nodeIndex;
    const b = this.bucket(node.id, nodeTitle(run, node.id), phase.id, phase.title, rank);
    const structured = structuredNode(run);
    const allEvidence = Object.keys(run.state.mission.evidence);
    this.record(b, dims, structured, render(this.store(run, this.ui())));
    this.record(b, dims, structured, render(this.store(run, this.ui({ open: allEvidence, pinned: allEvidence.slice(0, 1) }))));
    this.captureOverlay(run, dims, 'binder');
  }

  captureOverlay(run: Run | null, dims: Dims, overlay: 'binder' | 'history' | 'saveload' | 'about'): void {
    const rank = { binder: 9001, history: 9002, saveload: 9003, about: 9004 }[overlay];
    const title = overlay === 'saveload' ? 'Save / Load' : overlay[0]!.toUpperCase() + overlay.slice(1);
    const b = this.bucket('overlay-' + overlay, `Overlay: ${title}`, UI_PHASE.id, UI_PHASE.title, rank);
    const screen: UiState['screen'] = run ? (run.state.mission.completed ? 'planning' : 'console') : 'notices';
    const html = render(this.store(run, this.ui({ overlay, screen })));
    const at = html.indexOf('<div class="overlay-backdrop"');
    this.record(b, dims, [], at >= 0 ? html.slice(at) : '');
  }

  captureDebrief(run: Run, dims: Dims): void {
    const b = this.bucket('debrief', 'Debrief', 'debrief', 'Debrief', 5000);
    this.record(b, dims, structuredDebrief(run), render(this.store(run, this.ui({ screen: 'debrief' }))));
  }

  capturePlanning(run: Run, highlight: string | null, dims: Dims): void {
    const fo = this.content.followon;
    const b = this.bucket(fo.node, fo.display_title, fo.id, fo.display_title, 6000);
    this.record(b, dims, structuredPlanning(run), render(this.store(run, this.ui({ screen: 'planning', highlightPlan: highlight }))));
  }

  captureMessages(root: string): void {
    const b = this.bucket('messages', 'Status and error messages (app/main.ts, app/storage.ts, core/save.ts)', UI_PHASE.id, UI_PHASE.title, 9100);
    b.universe.set('', {});
    for (const m of messagesFromSource(root)) {
      const k = dedupeKey(m.text);
      if (!b.slots.has(k)) b.slots.set(k, { key: k, captured: { kind: 'ui.message', speaker: '', id: m.file, text: m.text, source: m.file.startsWith('core') ? 'core' : 'app' }, sigs: new Set(['']) });
    }
  }

  /** Play every route, capturing at every stop under the route's final signature. */
  walk(): number {
    const routes = enumerateRoutes(this.content);
    for (const route of routes) {
      const complete = new Run(this.content, { seed: 0 });
      for (const inp of route.inputs) complete.apply(inp);
      const dims = signature(complete, null);

      const run = new Run(this.content, { seed: 0 });
      this.captureMissionNode(run, dims);
      for (const inp of route.inputs) {
        const r = run.apply(inp);
        if (!r.ok) throw new Error(`walk: ${r.message}`);
        if (run.currentNode()) this.captureMissionNode(run, dims);
      }
      this.captureDebrief(run, dims);
      this.capturePlanning(run, null, dims);
      const view = describeFollowOnForRun(run)!;
      for (const p of view.plans) {
        if (!p.enabled) continue;
        const again = new Run(this.content, { seed: 0 });
        for (const inp of route.inputs) again.apply(inp);
        const planDims = signature(again, p.id);
        this.capturePlanning(again, p.id, planDims);
        const r = again.apply({ kind: 'confirm_plan', id: this.content.followon.confirm_input, plan: p.id });
        if (!r.ok) throw new Error(`plan ${p.id}: ${r.message}`);
        this.capturePlanning(again, null, planDims);
        this.captureOverlay(again, planDims, 'binder');
      }
    }
    return routes.length;
  }

  build(root: string): Sheet {
    this.captureStart();
    const runs = this.walk();
    this.captureOverlay(null, {}, 'history');
    this.captureOverlay(null, {}, 'about');
    this.captureOverlay(null, {}, 'saveload');
    this.captureMessages(root);

    const ordered = [...this.buckets.values()].sort((a, b) => a.rank - b.rank);
    // Global dedupe: a string belongs to the first node (in play order) where any route shows it.
    const owner = new Map<string, string>();
    for (const b of ordered) for (const key of b.slots.keys()) if (!owner.has(key)) owner.set(key, b.id);

    const rows: SheetRow[] = [];
    let order = 0;
    for (const b of ordered) {
      for (const slot of b.slots.values()) {
        if (owner.get(slot.key) !== b.id) continue;
        order += 1;
        rows.push({
          order, phase: b.phase, phaseTitle: b.phaseTitle, node: b.id, nodeTitle: b.title,
          kind: slot.captured.kind, speaker: slot.captured.speaker, id: slot.captured.id, text: slot.captured.text, source: slot.captured.source,
          branch: branchLabel(slot.sigs, b.universe),
        });
      }
    }
    return { version: this.content.mission.content_version, fingerprint: this.content.fingerprint, rows, runs, unreachable: unreachableContent(this.content, rows) };
  }
}

function nodeTitle(run: Run, id: string): string {
  const ref = run.content.nodes.get(id);
  const n = ref?.node;
  if (!n) return id;
  if (n.type === 'briefing' || n.type === 'decision' || n.type === 'event') return n.title ?? id;
  return n.prompt;
}

/** Content strings a player can never see in this content (e.g. an unavailable-option reason for an always-available option). */
function unreachableContent(content: ContentIndex, rows: SheetRow[]): { kind: string; id: string; text: string }[] {
  const onSheet = new Set(rows.map((r) => dedupeKey(r.text)));
  const out: { kind: string; id: string; text: string }[] = [];
  const check = (kind: string, id: string, text: string | undefined): void => {
    if (text && !onSheet.has(dedupeKey(text))) out.push({ kind, id, text });
  };
  for (const { option } of content.options.values()) {
    check('option.requirement-reason', option.id, option.unavailable_reason);
    check('option.intent', option.id, option.intent);
    check('option.cost', option.id, option.cost);
    check('option.uncertainty', option.id, option.uncertainty);
    check('option.attraction', option.id, option.attraction);
  }
  for (const { resolution } of content.resolutions.values()) {
    check('event.text', resolution.id, resolution.text);
    for (const l of resolution.lines ?? []) check('line', resolution.id, l.text);
  }
  for (const e of content.evidence.values()) { check('evidence.title', e.id, e.title); check('evidence.body', e.id, e.body); }
  for (const p of content.procedures.values()) { check('procedure.title', p.id, p.title); check('procedure.text', p.id, p.text); }
  for (const r of content.mission.debrief) check('debrief', r.id, r.text);
  for (const o of content.mission.outcomes) check('outcome.title', o.id, o.title);
  for (const p of content.followon.plans) { check('plan.label', p.id, p.label); for (const d of p.disabled_reasons) check('plan.disabled-reason', p.id, d.text); }
  for (const [k, v] of Object.entries(content.followon.trust_labels)) check('label', 'trust_labels[' + k + ']', v);
  return out;
}

// ---------------------------------------------------------------------------
// Public entry points and serializers
// ---------------------------------------------------------------------------

export function buildSheet(root: string): Sheet {
  const content = indexContent(loadBundle(root));
  return new SheetBuilder(content).build(root);
}

function csvField(s: string): string {
  return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

export function toCsv(sheet: Sheet): string {
  const lines: string[] = [];
  lines.push(`# Failure is Not an Option — dialogue sheet · content ${sheet.version} · fingerprint ${sheet.fingerprint} · ${sheet.rows.length} strings · generated by npm run dialogue-sheet from content/ and app/ (never edit by hand)`);
  lines.push('order,phase,node,kind,speaker,branch,id,text,notes');
  for (const r of sheet.rows) {
    lines.push([String(r.order), r.phase, r.node, r.kind, r.speaker, r.branch, r.id, r.text, ''].map(csvField).join(','));
  }
  return '﻿' + lines.join('\n') + '\n';
}

function mdCell(s: string): string {
  return s.replace(/\|/g, '\\|').replace(/\r?\n/g, '<br>');
}

export function toMarkdown(sheet: Sheet): string {
  const out: string[] = [];
  out.push('# Dialogue sheet — Failure is Not an Option');
  out.push('');
  out.push(`Content ${sheet.version} · fingerprint \`${sheet.fingerprint}\` · ${sheet.rows.length} player-visible strings across ${sheet.runs} complete routes. Generated by \`npm run dialogue-sheet\` from \`content/\` and \`app/\`; never edit by hand. Every string appears once, at the first point a player can meet it; a string that appears only on some routes carries its branch. Kinds beginning \`ui.\` with id \`app\` are authored in the application, not in the content package.`);
  out.push('');
  const phases: { id: string; title: string; nodes: { id: string; title: string; rows: SheetRow[] }[] }[] = [];
  for (const r of sheet.rows) {
    let p = phases[phases.length - 1];
    if (!p || p.id !== r.phase) { p = { id: r.phase, title: r.phaseTitle, nodes: [] }; phases.push(p); }
    let n = p.nodes[p.nodes.length - 1];
    if (!n || n.id !== r.node) { n = { id: r.node, title: r.nodeTitle, rows: [] }; p.nodes.push(n); }
    n.rows.push(r);
  }
  phases.forEach((p, i) => {
    out.push(`## ${i + 1}. ${p.title} (\`${p.id}\`)`);
    out.push('');
    for (const n of p.nodes) {
      out.push(`### ${n.title} (\`${n.id}\`)`);
      out.push('');
      out.push('| # | kind | speaker | branch | id | text |');
      out.push('|---|---|---|---|---|---|');
      for (const r of n.rows) out.push(`| ${r.order} | ${r.kind} | ${mdCell(r.speaker)} | ${mdCell(r.branch)} | \`${r.id}\` | ${mdCell(r.text)} |`);
      out.push('');
    }
  });
  if (sheet.unreachable.length) {
    out.push('## Content strings no reachable state displays');
    out.push('');
    out.push('These exist in `content/` but the current mechanics never show them (for example an unavailable-option reason for an option that is always available). They are not on the sheet above.');
    out.push('');
    out.push('| kind | id | text |');
    out.push('|---|---|---|');
    for (const u of sheet.unreachable) out.push(`| ${u.kind} | \`${u.id}\` | ${mdCell(u.text)} |`);
    out.push('');
  }
  return out.join('\n');
}
