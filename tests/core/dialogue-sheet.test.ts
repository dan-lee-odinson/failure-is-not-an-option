/**
 * The dialogue sheet cannot lie:
 *  1. The committed docs/dialogue-sheet.{md,csv} equal a fresh generation.
 *  2. An independent walk of all 56 routes (the acceptance-test script, not
 *     the generator's explorer) collects every string the view-models expose
 *     and every text run the renderer emits — the opening stages, every
 *     console stop, the debrief, the planning screen and every overlay; every
 *     one is on the sheet, and every sheet row is reachable (content rows via
 *     the view-models, app rows via the renderer, message rows via app/main.ts).
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { describeDebrief, describeEvidence, describeFollowOnForRun, describeNode, type Run } from '../../core';
import { render } from '../../app/render';
import { CAMPAIGN_COMPLETE_REASON } from '../../app/storage';
import { STAGES, defaultUi, type Store, type UiState } from '../../app/ui-state';
import { MESSAGE_SOURCES, buildSheet, dedupeKey, extractRuns, historyHiddenStrings, norm, provenanceText, toCsv, toMarkdown, type Sheet } from '../../scripts/lib/dialogue-sheet';
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
  return defaultUi({ screen: 'console', hasBrowserSave: true, ...overrides });
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
  it('the committed sheet equals a fresh generation', { timeout: 20000 }, () => {
    const s = sheet();
    const md = readFileSync(resolve(ROOT, 'docs', 'dialogue-sheet.md'), 'utf8').replace(/\r\n/g, '\n');
    const csv = readFileSync(resolve(ROOT, 'docs', 'dialogue-sheet.csv'), 'utf8').replace(/\r\n/g, '\n');
    expect(md).toBe(toMarkdown(s));
    expect(csv).toBe(toCsv(s));
    expect(s.version).toBe('0.5.5');
    expect(s.fingerprint).toBe(content().fingerprint);
    expect(s.runs).toBe(56);
  });

  it('every string reachable in play is on the sheet, and every sheet row is reachable', { timeout: 20000 }, () => {
    const s = sheet();
    const onSheet = new Set(s.rows.map((r) => dedupeKey(r.text)));
    const reachableView = new Set<string>();
    const reachableRendered = new Set<string>();
    const note = (list: string[], into: Set<string>) => { for (const t of list) into.add(dedupeKey(t)); };
    const reg = content().bundle.registry;
    const futureCredits = new Set((reg.credits ?? []).flatMap(s => [s.heading, ...s.lines]).map(dedupeKey));
    expect([...futureCredits].filter(k => !onSheet.has(k))).toEqual([]);
    const m = content().mission;
    note([...reg.notices.dedication, reg.notices.project_disclaimer, reg.notices.ai_disclosure, reg.notices.dramatization, m.title, m.subtitle ?? '', m.start_notice].filter(Boolean), reachableView);
    // Content 0.5.2 presentation text (M01): authored strings the new stages display; collected from the content and checked against the sheet both ways.
    const authored = new Set<string>();
    const prologue = m.prologue!;
    for (const plate of prologue.plates) note([plate.title, plate.caption], authored);
    const card = prologue.scenario_card;
    note([card.facility, card.date, card.mission, card.scenario, card.context, prologue.history_note], authored);
    // The prologue: every plate and the scenario card, both text sizes, mid-crossfade, reduced motion.
    for (let i = 0; i <= prologue.plates.length; i++) for (const textSize of ['default', 'large'] as const) {
      note(renderedStrings(null, ui({ screen: 'prologue', textSize, prologue: { index: i, prev: null, prevProgress: 0 } })), reachableRendered);
      note(renderedStrings(null, ui({ screen: 'prologue', textSize, prologue: { index: i, prev: Math.max(0, i - 1), prevProgress: 0.5 } })), reachableRendered);
      note(renderedStrings(null, ui({ screen: 'prologue', textSize, reducedMotion: true, prologue: { index: i, prev: null, prevProgress: 0 } })), reachableRendered);
    }

    // The opening: every stage, both text sizes, paused and reduced-motion chapters, the menu with CONTINUE both ways.
    for (const stage of STAGES) for (const textSize of ['default', 'large'] as const) {
      note(renderedStrings(null, ui({ screen: 'opening', stage, textSize })), reachableRendered);
      note(renderedStrings(null, ui({ screen: 'opening', stage, textSize, scrollPaused: true })), reachableRendered);
      note(renderedStrings(null, ui({ screen: 'opening', stage, textSize, reducedMotion: true })), reachableRendered);
      note(renderedStrings(null, ui({ screen: 'opening', stage, textSize, continueSave: { ok: true } })), reachableRendered);
      note(renderedStrings(null, ui({ screen: 'opening', stage, textSize, continueSave: { ok: false, reason: CAMPAIGN_COMPLETE_REASON, complete: true } })), reachableRendered); // a finished campaign in the slot (FNO-DEMO-END)
      note(renderedStrings(null, ui({ screen: 'opening', stage, textSize, fullscreen: 'available' })), reachableRendered);
      note(renderedStrings(null, ui({ screen: 'opening', stage, textSize, fullscreen: 'active' })), reachableRendered);
    }
    // History no longer renders these; they are content and stay on the sheet as history-hidden.
    const hidden = new Set(historyHiddenStrings(content()).map((c) => dedupeKey(c.text)));
    for (const k of hidden) reachableView.add(k);
    for (const overlay of ['history', 'about', 'saveload', 'settings'] as const) {
      note(renderedStrings(null, ui({ screen: 'opening', stage: 'menu', overlay })), reachableRendered);
      note(renderedStrings(null, ui({ screen: 'opening', stage: 'menu', overlay, reducedMotion: true, audio: { enabled: true, master: 0.8, music: 1, effects: 1, beds: 1 }, hints: false })), reachableRendered);
    }

    // All 56 routes, questions asked, every stop.
    let steps = 0;
    for (const prep of PREP_SETS) for (const route of routes) for (const lesson of lessons) for (const stance of stances) {
      const inputs = script({ prep, route, lesson, stance, questions: true });
      const run = newRun();
      const capture = (): void => {
        note(viewStrings(run), reachableView);
        const n = run.currentNode()?.node;
        if (n?.type === 'decision' && n.hint) note([n.hint], authored);
        if (n?.type === 'briefing' || n?.type === 'decision') note((n.participants ?? []).map((p) => p.label), authored);
        if (run.currentNode()) {
          note(renderedStrings(run, ui()), reachableRendered);
          note(renderedStrings(run, ui({ open: Object.keys(run.state.mission.evidence), pinned: Object.keys(run.state.mission.evidence).slice(0, 1) })), reachableRendered);
          note(renderedStrings(run, ui({ pinHintOpen: true })), reachableRendered);
          note(renderedStrings(run, ui({ idle: true })), reachableRendered);
          note(renderedStrings(run, ui({ overlay: 'binder' })), reachableRendered);
          note(renderedStrings(run, ui({ overlay: 'history' })), reachableRendered);
          note(renderedStrings(run, ui({ overlay: 'history', prologueSeen: true })), reachableRendered); // the plates walked (R2): the facility note
          // The stacked layout (M02): the status bar's short labels and EVIDENCE key, and the evidence list as an overlay.
          note(renderedStrings(run, ui({ stacked: true })), reachableRendered);
          note(renderedStrings(run, ui({ stacked: true, overlay: 'evidence', pinned: Object.keys(run.state.mission.evidence).slice(0, 1), pinHintOpen: true })), reachableRendered);
        }
        steps++;
      };
      capture();
      for (const inp of inputs) { play(run, [inp]); capture(); }
      // The resolution cards: the outcome's tier, title and line; each changed relationship's name and label.
      const o = m.outcomes.find((x) => x.id === run.state.mission.completed?.outcome)!;
      const labels = m.resolution_presentation!;
      note([o.tier!, o.title, o.result_line!, labels.heading, labels.relationships_heading, labels.tiers.find((t) => t.id === o.tier)!.meaning], authored);
      for (const c of content().characters.values()) {
        const delta = (run.state.ledger.people[c.id]?.trust ?? 0) - (run.identity.initial_ledger.people[c.id]?.trust ?? 0);
        if (delta) note([c.name, delta > 0 ? labels.trust_up : labels.trust_down], authored);
      }
      note(renderedStrings(run, ui({ screen: 'resolution', resolution: 'result' })), reachableRendered);
      note(renderedStrings(run, ui({ screen: 'resolution', resolution: 'result', tierInfo: true })), reachableRendered);
      note(renderedStrings(run, ui({ screen: 'resolution', resolution: 'relationships' })), reachableRendered);
      note(renderedStrings(run, ui({ screen: 'debrief' })), reachableRendered);
      note(renderedStrings(run, ui({ screen: 'planning' })), reachableRendered);
      const fo = describeFollowOnForRun(run)!;
      for (const p of fo.plans.filter((x) => x.enabled)) {
        const again = play(newRun(), inputs);
        note(renderedStrings(again, ui({ screen: 'planning', highlightPlan: p.id })), reachableRendered);
        play(again, [{ kind: 'confirm_plan', id: 'g9-confirm-plan', plan: p.id }]);
        note(viewStrings(again), reachableView);
        note(renderedStrings(again, ui({ screen: 'planning' })), reachableRendered);
        note(renderedStrings(again, ui({ screen: 'demo-end' })), reachableRendered); // the demo-complete screen after the committed plan (FNO-DEMO-END)
        note(renderedStrings(again, ui({ screen: 'planning', overlay: 'binder' })), reachableRendered);
        note(renderedStrings(again, ui({ screen: 'planning', overlay: 'history', prologueSeen: true })), reachableRendered); // after the mission: every source and note (R2)
      }
    }
    expect(steps).toBeGreaterThan(56 * 20);

    // 1. Everything the view-models expose is on the sheet.
    const missingView = [...reachableView].filter((k) => !onSheet.has(k));
    expect(missingView, 'view-model strings missing from the sheet').toEqual([]);
    // 2. Everything the renderer shows is on the sheet.
    const missingRendered = [...reachableRendered].filter((k) => !onSheet.has(k));
    expect(missingRendered, 'rendered strings missing from the sheet').toEqual([]);
    // 2b. Every authored 0.5.2 presentation string is on the sheet, and the renderer shows every one of them somewhere.
    expect([...authored].filter((k) => !onSheet.has(k)), 'M01 authored strings missing from the sheet').toEqual([]);
    expect([...authored].filter((k) => !reachableRendered.has(k)), 'M01 authored strings the renderer never shows').toEqual([]);
    // 3. Nothing on the sheet is unreachable.
    const messageSrc = MESSAGE_SOURCES.map((f) => readFileSync(resolve(ROOT, f), 'utf8')).join('\n').replace(/\\'/g, "'");
    const unreachable = s.rows.filter((r) => {
      const k = dedupeKey(r.text);
      if (r.phase === 'site') return false; // Separately checked against named items, notice references and the approved HTML fixture.
      if (r.kind === 'history-hidden') return !hidden.has(k) && !reachableView.has(k);
      if (r.kind === 'ui.message') return !messageSrc.includes(r.text.split('…')[0]!.trim().slice(0, 24));
      if (r.source === 'app') return !reachableRendered.has(k);
      if (r.kind.startsWith('credits.')) return !futureCredits.has(k);
      return !reachableView.has(k) && !reachableRendered.has(k) && !authored.has(k);
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
    expect(firstIndex.get('opening-start')).toBe(0);
    for (const stage of STAGES) expect(firstIndex.has('opening-' + stage), `opening stage ${stage} on the sheet`).toBe(true);
    expect(firstIndex.get('opening-menu')!).toBeLessThan(firstIndex.get(missionNodes[0]!)!);
    // The prologue sits between the menu and the first console screen, in plate order; the resolution between the last node and the debrief.
    const prologue = content().mission.prologue!;
    const plateBuckets = [...prologue.plates.map((p) => 'prologue-' + p.id), 'prologue-' + prologue.scenario_card.id];
    for (const b of plateBuckets) expect(firstIndex.has(b), `prologue bucket ${b}`).toBe(true);
    for (let i = 1; i < plateBuckets.length; i++) expect(firstIndex.get(plateBuckets[i]!)!).toBeGreaterThan(firstIndex.get(plateBuckets[i - 1]!)!);
    expect(firstIndex.get(plateBuckets[0]!)!).toBeGreaterThan(firstIndex.get('opening-menu')!);
    expect(firstIndex.get(plateBuckets[plateBuckets.length - 1]!)!).toBeLessThan(firstIndex.get(missionNodes[0]!)!);
    expect(firstIndex.get('resolution')!).toBeGreaterThan(firstIndex.get(missionNodes[missionNodes.length - 1]!)!);
    expect(firstIndex.get('resolution')!).toBeLessThan(firstIndex.get('debrief')!);
    expect(s.rows.filter((r) => r.kind === 'prologue.caption')).toHaveLength(prologue.plates.length);
    expect(s.rows.filter((r) => r.kind === 'decision.hint')).toHaveLength(4);
    expect(s.rows.filter((r) => r.kind === 'participant.label')).toHaveLength(4);
    expect(s.rows.filter((r) => r.kind === 'outcome.result_line')).toHaveLength(6);
    expect(s.rows.filter((r) => r.kind === 'outcome.tier').map((r) => r.text).sort()).toEqual(['COSTLY', 'MIXED', 'SUCCESS']);
    expect(s.rows.filter((r) => r.kind === 'history.note')).toHaveLength(1);
    expect(firstIndex.get('debrief')!).toBeGreaterThan(firstIndex.get(missionNodes[missionNodes.length - 1]!)!);
    expect(firstIndex.get('g9-plan-decision')!).toBeGreaterThan(firstIndex.get('debrief')!);
    expect(firstIndex.get('demo-end')!).toBeGreaterThan(firstIndex.get('g9-plan-decision')!); // the demo-complete screen follows the committed plan (FNO-DEMO-END)
    expect(firstIndex.has('overlay-settings')).toBe(true);
    expect(s.rows.filter((r) => r.kind === 'notice')).toHaveLength(5); // two dedication paragraphs and three notices, as content
    // Every history-hidden row is a content string History used to show; every such string is on the sheet.
    const hiddenKeys = new Set(historyHiddenStrings(content()).map((c) => dedupeKey(c.text)));
    const onSheetKeys = new Set(s.rows.map((r) => dedupeKey(r.text)));
    for (const r of s.rows.filter((r) => r.kind === 'history-hidden')) expect(hiddenKeys.has(dedupeKey(r.text)), `history-hidden row ${r.id}`).toBe(true);
    for (const k of hiddenKeys) expect(onSheetKeys.has(k), `hidden string on the sheet: ${k.slice(0, 60)}`).toBe(true);
    expect(s.rows.some((r) => r.kind === 'evidence.provenance')).toBe(false);

    const keys = s.rows.filter(r => r.phase !== 'site').map((r) => dedupeKey(r.text));
    expect(new Set(keys).size).toBe(keys.length); // no duplicates
    const by = (text: string) => s.rows.find((r) => norm(r.text) === norm(text));
    expect(by('Bring them down at the earlier opportunity.')!.branch).toBe('');
    expect(by('Contact drill: instruction and readback')!.branch).toBe('contact rehearsal');
    expect(by('Earlier return — two calls need correction')!.branch).toBe('earlier q0');
    expect(s.rows.find((r) => r.id === 'g8-order-receipt' && r.kind === 'briefing' && /earlier opportunity/.test(r.text))!.branch).toBe('earlier');
    expect(by("This mission must include the systems-warning drill after Gemini VIII's reserve warning.")!.branch).toBe('later');
    expect(by('ORDERED')!.branch).toBe('');
    expect(by('CHOSEN')!.branch).toBe('any rehearsal'); // the stamp first appears on a rehearsed prep card
    expect(by('HISTORICAL CHOICE')!.branch).toBe('');
    expect(by('ALTERNATE HISTORY')!.branch).toBe('earlier');
    expect(s.rows.filter((r) => /^varies/.test(r.branch)).map((r) => r.text), 'rows whose branch could not be named').toEqual([]);
  });
});
