/**
 * The dialogue sheet cannot lie:
 *  1. The committed docs/dialogue-sheet.{md,csv} equal a fresh generation.
 *  2. An independent walk of all 56 routes (the acceptance-test script, not
 *     the generator's explorer) collects every string the view-models expose
 *     and every text run the renderer emits; every one is on the sheet, and
 *     every sheet row is reachable (content rows via the view-models, app
 *     rows via the renderer, message rows via app/main.ts).
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { describeDebrief, describeEvidence, describeFollowOnForRun, describeNode, type Run } from '../../core';
import { render } from '../../app/render';
import type { Store, UiState } from '../../app/main';
import { MESSAGE_SOURCES, buildSheet, dedupeKey, extractRuns, norm, provenanceText, toCsv, toMarkdown, type Sheet } from '../../scripts/lib/dialogue-sheet';
import { PREP_SETS, ROOT, content, newRun, play, script, type Lesson, type Route, type Stance } from './helpers';

const routes: Route[] = ['earlier', 'later'];
const lessons: Lesson[] = ['provenance', 'recovery'];
const stances: Stance[] = ['blame', 'ground'];

let cachedSheet: Sheet | null = null;
function sheet(): Sheet {
  if (!cachedSheet) cachedSheet = buildSheet(ROOT);
  return cachedSheet;
}

function ui(overrides: Partial<UiState> = {}): UiState {
  return { screen: 'console', overlay: null, pinned: [], textSize: 'default', highlightPlan: null, message: null, saveMessage: null, hasBrowserSave: true, open: [], ...overrides };
}

function store(run: Run | null, u: UiState): Store {
  return { content: content(), run, ui: u };
}

/** Every string a player could read from the view-models of this state. */
function viewStrings(run: Run): string[] {
  const out: string[] = [];
  const v = describeNode(run);
  if (v) {
    out.push(v.phase.title, v.phase.display_time);
    if (v.node.title) out.push(v.node.title);
    if (v.node.header_label) out.push(v.node.header_label);
    if (v.node.text) out.push(v.node.text);
    if (v.node.prompt) out.push(v.node.prompt);
    for (const l of v.lines) out.push(l.text);
    for (const q of v.questions) { out.push(q.text); if (q.asked) out.push(q.answer.text); }
    for (const r of v.readout ?? []) out.push(r.label, r.text);
    for (const o of v.options ?? []) {
      out.push(o.intent, o.cost, o.uncertainty);
      if (o.attraction) out.push(o.attraction);
      if (o.statement) out.push(o.statement);
      if (o.subtitle) out.push(o.subtitle);
      if (!o.available && o.reason) out.push(o.reason);
      for (const s of o.supported_by) out.push(s.label);
    }
    if (v.continue) out.push(v.continue.label);
    if (v.event_text) out.push(v.event_text);
    for (const s of v.status ?? []) out.push(s);
    for (const a of v.applied) out.push(a.label);
    for (const e of describeEvidence(content(), run.state)) {
      out.push(e.title, e.badge, e.stage);
      if (e.body !== null) out.push(e.body);
      out.push(provenanceText(e));
    }
  }
  const d = describeDebrief(run);
  if (d) {
    out.push(d.outcome.title);
    if (d.consequence) out.push(d.consequence.text);
    if (d.relationship) for (const l of d.relationship.lines) out.push(l.text);
    for (const p of [...d.controllers, ...d.postflight.astronauts]) out.push(p.label);
    if (d.constraint) out.push(d.constraint.text);
    if (d.postflight.statement) out.push(d.postflight.statement);
    if (d.postflight.response) out.push(d.postflight.response.text);
    if (d.postflight.context?.body) out.push(d.postflight.context.body);
    for (const s of d.postflight.status) out.push(s.title, s.text);
    for (const p of d.procedures) out.push(p.title, p.text);
    for (const p of d.paragraphs) out.push(p.text);
  }
  const f = describeFollowOnForRun(run);
  if (f) {
    out.push(f.display_title, f.completion.title);
    if (f.constraint_text) out.push(f.constraint_text);
    for (const p of [...f.controllers, ...f.astronauts]) out.push(p.label);
    for (const s of f.status_blocks) out.push(s.title, s.text);
    for (const p of f.plans) { out.push(p.label, p.benefit); if (!p.enabled && p.reason) out.push(p.reason); }
    if (f.committed) out.push(f.committed_text);
  }
  return out;
}

function renderedStrings(run: Run | null, u: UiState): string[] {
  return extractRuns(render(store(run, u))).map((r) => r.text);
}

describe('dialogue sheet', () => {
  it('the committed sheet equals a fresh generation', () => {
    const s = sheet();
    const md = readFileSync(resolve(ROOT, 'docs', 'dialogue-sheet.md'), 'utf8').replace(/\r\n/g, '\n');
    const csv = readFileSync(resolve(ROOT, 'docs', 'dialogue-sheet.csv'), 'utf8').replace(/\r\n/g, '\n');
    expect(md).toBe(toMarkdown(s));
    expect(csv).toBe(toCsv(s));
    expect(s.version).toBe('0.4.0');
    expect(s.fingerprint).toBe(content().fingerprint);
    expect(s.runs).toBe(56);
  });

  it('every string reachable in play is on the sheet, and every sheet row is reachable', () => {
    const s = sheet();
    const onSheet = new Set(s.rows.map((r) => dedupeKey(r.text)));
    const reachableView = new Set<string>();
    const reachableRendered = new Set<string>();
    const note = (list: string[], into: Set<string>) => { for (const t of list) into.add(dedupeKey(t)); };

    // Start screen.
    note(renderedStrings(null, ui({ screen: 'notices' })), reachableRendered);
    note(renderedStrings(null, ui({ screen: 'notices', textSize: 'large' })), reachableRendered);
    for (const overlay of ['history', 'about', 'saveload'] as const) note(renderedStrings(null, ui({ screen: 'notices', overlay })), reachableRendered);

    // All 56 routes, questions asked, every stop.
    let steps = 0;
    for (const prep of PREP_SETS) for (const route of routes) for (const lesson of lessons) for (const stance of stances) {
      const inputs = script({ prep, route, lesson, stance, questions: true });
      const run = newRun();
      const capture = (): void => {
        note(viewStrings(run), reachableView);
        if (run.currentNode()) {
          note(renderedStrings(run, ui()), reachableRendered);
          note(renderedStrings(run, ui({ open: Object.keys(run.state.mission.evidence), pinned: Object.keys(run.state.mission.evidence).slice(0, 1) })), reachableRendered);
          note(renderedStrings(run, ui({ overlay: 'binder' })), reachableRendered);
        }
        steps++;
      };
      capture();
      for (const inp of inputs) { play(run, [inp]); capture(); }
      note(renderedStrings(run, ui({ screen: 'debrief' })), reachableRendered);
      note(renderedStrings(run, ui({ screen: 'planning' })), reachableRendered);
      const fo = describeFollowOnForRun(run)!;
      for (const p of fo.plans.filter((x) => x.enabled)) {
        const again = play(newRun(), inputs);
        note(renderedStrings(again, ui({ screen: 'planning', highlightPlan: p.id })), reachableRendered);
        play(again, [{ kind: 'confirm_plan', id: 'g9-confirm-plan', plan: p.id }]);
        note(viewStrings(again), reachableView);
        note(renderedStrings(again, ui({ screen: 'planning' })), reachableRendered);
        note(renderedStrings(again, ui({ screen: 'planning', overlay: 'binder' })), reachableRendered);
      }
    }
    expect(steps).toBeGreaterThan(56 * 20);

    // 1. Everything the view-models expose is on the sheet.
    const missingView = [...reachableView].filter((k) => !onSheet.has(k));
    expect(missingView, 'view-model strings missing from the sheet').toEqual([]);
    // 2. Everything the renderer shows is on the sheet.
    const missingRendered = [...reachableRendered].filter((k) => !onSheet.has(k));
    expect(missingRendered, 'rendered strings missing from the sheet').toEqual([]);
    // 3. Nothing on the sheet is unreachable.
    const messageSrc = MESSAGE_SOURCES.map((f) => readFileSync(resolve(ROOT, f), 'utf8')).join('\n').replace(/\\'/g, "'");
    const unreachable = s.rows.filter((r) => {
      const k = dedupeKey(r.text);
      if (r.kind === 'ui.message') return !messageSrc.includes(r.text.split('…')[0]!.trim().slice(0, 24));
      if (r.source === 'app') return !reachableRendered.has(k);
      return !reachableView.has(k) && !reachableRendered.has(k);
    });
    expect(unreachable.map((r) => `${r.node} ${r.kind} ${r.text}`), 'sheet rows no route reaches').toEqual([]);
  });

  it('order follows play, branch labels are right, and nothing is duplicated', () => {
    const s = sheet();
    const nodeOrder = s.rows.map((r) => r.node);
    const firstIndex = new Map<string, number>();
    nodeOrder.forEach((n, i) => { if (!firstIndex.has(n)) firstIndex.set(n, i); });
    const missionNodes = content().mission.phases.flatMap((p) => p.nodes.map((n) => n.id));
    const seen = missionNodes.filter((n) => firstIndex.has(n));
    expect(seen).toEqual(missionNodes); // every node present, in content order
    for (let i = 1; i < seen.length; i++) expect(firstIndex.get(seen[i]!)!).toBeGreaterThan(firstIndex.get(seen[i - 1]!)!);
    expect(firstIndex.get('start')).toBe(0);
    expect(firstIndex.get('debrief')!).toBeGreaterThan(firstIndex.get(missionNodes[missionNodes.length - 1]!)!);
    expect(firstIndex.get('g9-plan-decision')!).toBeGreaterThan(firstIndex.get('debrief')!);

    const keys = s.rows.map((r) => dedupeKey(r.text));
    expect(new Set(keys).size).toBe(keys.length); // no duplicates
    const by = (text: string) => s.rows.find((r) => norm(r.text) === norm(text));
    expect(by('Bring them down at the earlier opportunity.')!.branch).toBe('');
    expect(by("They're down. My part is not over.")!.branch).toBe('earlier');
    expect(by('Reserve warning. This is the margin we spent to reach their recovery force.')!.branch).toBe('later');
    expect(by('The pickup approach is delayed by the two ground handoff corrections. The crew are badly exhausted by the time the retrieval team reaches them; both need help transferring aboard.')!.branch).toBe('earlier q0');
    expect(by('I wanted the later return. You gave my team the preparation to make the earlier one work. We still need to practice that sea-recovery problem.')!.branch).toBe('earlier q2');
    expect(by('Your endorsement gives the critics a stronger position in this fictional timeline. Armstrong and Scott\'s confidence in you falls. A disagreement within the astronaut corps has become a division sharpened by its flight director.')!.branch).toBe('crew-blame');
    expect(by("This mission must include the systems-warning drill after Gemini VIII's reserve warning.")!.branch).toBe('later');
    expect(by('The handoff board has a blank acknowledgement field for the next report.')!.branch).toBe('contact rehearsal');
    expect(by('Crew recovered — earlier return, punishing sea wait')!.branch).toBe('earlier q0');
    expect(by('You carried report provenance into the procedures binder.')!.branch).toBe('lesson: provenance');
    expect(s.rows.filter((r) => /^varies/.test(r.branch)).map((r) => r.text), 'rows whose branch could not be named').toEqual([]);
  });
});
