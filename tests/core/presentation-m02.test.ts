/**
 * FNO-M02 presentation contract (docs/00_HANDOFF-M02.md):
 *  - content 0.5.3: Jim Lovell as CAPCOM resolves from the content (label, portrait pair), his seven lines render as
 *    lines with his label and portrait and never carry provenance in play; the two new questions render like any
 *    question; the History panel carries the Lovell note; the composite CAPCOM portrait is gone from the manifest and
 *    the disk; credits and the den are data only (validated, on the sheet, not rendered);
 *  - the stacked play layout: a UI flag never persisted; the panel takes the content width, the evidence column
 *    becomes a status-bar key that opens the list as an overlay with pinning; short key labels;
 *  - the tier meaning: a title on the tier word, an ⓘ key, a paper strip on request; only the tiers an outcome uses;
 *  - the Save / Load panel's new-campaign hint.
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { describeEvidence, type Run as RunType } from '../../core';
import { assetEntry } from '../../app/assets';
import { esc, render } from '../../app/render';
import { describeResolution } from '../../app/resolution';
import { PREF_KEYS, defaultUi, type Store, type UiState } from '../../app/ui-state';
import { extractRuns } from '../../scripts/lib/dialogue-sheet';
import { ask, content, newRun, play, ROOT, script } from './helpers';

function store(run: RunType | null, u: Partial<UiState> = {}): Store {
  return { content: content(), run, ui: defaultUi({ screen: run ? 'console' : 'opening', ...u }) };
}

function upTo(node: string, questions = false): RunType {
  const inputs = script({ prep: ['recovery'], route: 'earlier', questions });
  const cut = inputs.findIndex((i) => 'node' in i && i.node === node);
  expect(cut).toBeGreaterThanOrEqual(0);
  return play(newRun(), inputs.slice(0, cut));
}

const filename = (id: string | null): string => assetEntry(id)?.filename ?? `no asset ${id}`;

describe('content 0.5.3: Jim Lovell as CAPCOM', () => {
  it('the character resolves from the content: label, kind, portrait pair; the composite portrait is retired from the manifest and the disk', () => {
    const c = content().characters.get('g8-capcom')!;
    expect(c.name).toBe('Jim Lovell');
    expect(c.display).toBe('JIM LOVELL — CAPCOM');
    expect(c.kind).toBe('historical');
    expect(c.portrait).toBe('portrait-lovell-neutral');
    expect(c.portraits).toEqual({ neutral: 'portrait-lovell-neutral', concerned: 'portrait-lovell-concerned' });
    expect(filename(c.portrait)).toBe('fno_gemini_portrait_lovell_neutral_v001.png');
    expect(existsSync(resolve(ROOT, 'assets', 'fno_gemini_portrait_lovell_neutral_v001.png'))).toBe(true);
    expect(existsSync(resolve(ROOT, 'assets', 'fno_gemini_portrait_lovell_concerned_v001.png'))).toBe(true);
    const manifest = JSON.parse(readFileSync(resolve(ROOT, 'assets', 'manifest.json'), 'utf8')) as { content_version: string; assets: { id: string; filename: string }[] };
    expect(manifest.content_version).toBe('0.5.3');
    expect(manifest.assets.some((a) => a.filename === 'fno_gemini_portrait_capcom_neutral_v001.png' || a.id === 'portrait-capcom')).toBe(false);
    expect(existsSync(resolve(ROOT, 'assets', 'fno_gemini_portrait_capcom_neutral_v001.png'))).toBe(false);
    expect(manifest.assets).toHaveLength(69);
    // The den plate and layers are manifest assets on disk, rendered nowhere yet.
    for (const id of ['opening-den', 'opening-den-smoke', 'opening-den-beam']) expect(existsSync(resolve(ROOT, 'assets', filename(id)))).toBe(true);
  });

  it('all seven CAPCOM lines render with his label and portrait as lines, never with provenance in play; the two new questions render like any question', () => {
    const lovell = content().characters.get('g8-capcom')!;
    const seen = new Map<string, string>();
    const checkLines = (html: string, node: string): void => {
      const re = /<div class="line "[^>]*data-role="CAPCOM"[^>]*>([\s\S]*?)<div class="what">([\s\S]*?)<\/div><\/div><\/div>/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(html)) !== null) {
        expect(m[1]).toContain(`<div class="who">${esc(lovell.display)}</div>`);
        expect(m[1]).toContain(filename(lovell.portrait));
        expect(m[1]).toContain(`alt="Portrait: ${esc(lovell.display)}"`);
        seen.set(node + '|' + m[2]!.slice(0, 40), m[2]!);
      }
      // No provenance in play text (17 §1): no page numbers, tags or MET stamps reach the visible text (SVG path data in the inlined faces is not text).
      const visible = extractRuns(html).map((r) => r.text).join(' | ');
      for (const s of ['H7', 'PDF', 'paraphrase', 'quotation', 'procedural', 'printed page', '07:17:15', 'transcript']) expect(visible, node).not.toContain(s);
    };
    const inputs = script({ prep: ['recovery'], route: 'earlier', questions: true });
    const run = newRun();
    checkLines(render(store(run)), 'g8-brief');
    for (const inp of inputs) {
      play(run, [inp]);
      const node = run.currentNode()?.node.id;
      if (node) checkLines(render(store(run)), node);
    }
    expect(seen.size).toBe(7); // docking, loss of signal, the gap answer, the crisis relay, the crisis answer, the return answer, the splashdown receipt
    const texts = [...seen.values()];
    expect(texts.some((t) => t.includes('relays Scott'))).toBe(true);
    expect(texts.some((t) => t.includes('regaining control in RCS DIRECT'))).toBe(true);
    expect(texts.some((t) => t.includes('no crew request choosing between these two return opportunities'))).toBe(true);
    expect(texts.some((t) => t.includes('splashdown report received'))).toBe(true);
    // The questions render as paper question keys and, asked, their answers as Lovell's lines with the large active portrait.
    const crisis = upTo('g8-crisis-report');
    let html = render(store(crisis));
    expect(html).toContain('data-testid="question-g8-q-crew-crisis"');
    expect(html).not.toContain('RCS DIRECT');
    play(crisis, [ask('g8-crisis-report', 'g8-q-crew-crisis')]);
    html = render(store(crisis));
    expect(html).toContain('RCS DIRECT');
    expect(html).toMatch(/data-testid="active-portrait" data-speaker="g8-capcom"/);
    const brief = upTo('g8-return-brief');
    expect(render(store(brief))).toContain('data-testid="question-g8-q-crew-return"');
    expect(brief.log.filter((e) => e.type === 'input' && e.input.kind === 'question')).toHaveLength(0);
    play(brief, [ask('g8-return-brief', 'g8-q-crew-return')]);
    expect(brief.log.filter((e) => e.type === 'input' && e.input.kind === 'question' && e.input.question === 'g8-q-crew-return')).toHaveLength(1);
  });

  it('the History panel carries the Lovell note; credits and the den are validated data that no screen renders', () => {
    const labels = content().bundle.registry.labels;
    expect(labels.capcom_history_note).toContain('Jim Lovell');
    const history = render(store(newRun(), { overlay: 'history' }));
    expect(history).toContain(`<p class="history-note" data-testid="capcom-history-note">${esc(labels.capcom_history_note!)}</p>`);
    expect(labels.alternate_history_explanation).not.toMatch(/\(F(?:7|10)/);
    const reg = content().bundle.registry;
    expect(reg.credits!.map((s) => s.heading)).toEqual(['Sources', 'Music', 'Sound', 'Type', 'Archive', 'Made by']);
    expect(reg.opening_den!.projection_rect).toEqual({ x: 830, y: 115, width: 928, height: 522 });
    const madeBy = reg.credits!.find((s) => s.heading === 'Made by')!.lines;
    const run = play(newRun(), script({ prep: ['recovery'], route: 'earlier' }));
    const screens = [
      render(store(null, { stage: 'menu', overlay: 'about' })),
      render(store(null, { stage: 'title' })),
      render(store(null, { screen: 'prologue' })),
      render(store(run, { screen: 'resolution' })),
      render(store(run, { screen: 'debrief' })),
      render(store(run, { screen: 'planning' })),
    ];
    for (const html of screens) {
      for (const line of madeBy) expect(html).not.toContain(esc(line));
      expect(html).not.toContain(filename('opening-den'));
      expect(html).not.toContain(filename('opening-den-beam'));
    }
  });
});

describe('stacked play layout (M02)', () => {
  it('is a UI flag, never persisted; the column layout keeps the evidence panel and the long key labels', () => {
    expect(defaultUi().stacked).toBe(false);
    expect(Object.values(PREF_KEYS).some((k) => /stack/i.test(k))).toBe(false);
    const run = upTo('g8-return-brief');
    const columns = render(store(run));
    expect(columns).toContain('data-layout="columns"');
    expect(columns).not.toContain('console-shell stacked');
    expect(columns).toContain('data-testid="evidence-panel"');
    expect(columns).not.toContain('data-testid="open-evidence"');
    expect(columns).toMatch(/data-testid="open-saveload">SAVE \/ LOAD</);
    expect(columns).toMatch(/data-testid="open-settings">SETTINGS</);
    expect(columns).toContain('<div class="status-left">');
    expect(columns).toContain('<div class="status-keys" data-testid="status-keys">');
  });

  it('stacked: the panel takes the content width, the evidence column becomes an EVIDENCE · n key, the key labels shorten, and the rest of the screen is unchanged', () => {
    const run = upTo('g8-return-brief');
    const n = describeEvidence(content(), run.state).length;
    const html = render(store(run, { stacked: true }));
    expect(html).toContain('class="console-shell stacked"');
    expect(html).toContain('data-layout="stacked"');
    expect(html).not.toContain('<aside class="evidence panel"');
    expect(html).toMatch(new RegExp(`data-testid="open-evidence" aria-label="Evidence: ${n} items — open the evidence list">EVIDENCE · ${n}<`));
    expect(html).toMatch(/data-testid="open-binder">BINDER</);
    expect(html).toMatch(/data-testid="open-history">HISTORY</);
    expect(html).toMatch(/data-testid="open-saveload" aria-label="Save \/ Load">SAVE</);
    expect(html).toMatch(/data-testid="open-settings" aria-label="Settings">SET</);
    // The conversation, its questions footer, the cards, the room layer and the hint strip are the same markup in both layouts.
    const columns = render(store(run));
    const stackedIdle = render(store(run, { stacked: true, idle: true }));
    const columnsIdle = render(store(run, { idle: true }));
    for (const s of ['data-testid="conversation"', '<div class="conv-questions">', 'data-testid="question-g8-q-crew-return"', 'data-testid="card-g8-return-earlier"', 'class="room-layer"', 'data-testid="strip"']) {
      expect(html).toContain(s);
      expect(columns).toContain(s);
    }
    const conversation = (h: string) => /<section class="conversation panel"[\s\S]*?<\/section>/.exec(h)![0];
    expect(conversation(html)).toBe(conversation(columns));
    expect(stackedIdle).toContain('data-testid="hint-strip"');
    expect(columnsIdle).toContain('data-testid="hint-strip"');
    // Every conversation screen stacks the same way.
    for (const node of ['g8-brief', 'g8-crisis-report', 'g8-accountability-brief']) {
      const r = node === 'g8-brief' ? newRun() : upTo(node);
      const s = render(store(r, { stacked: true }));
      expect(s).toContain('class="console-shell stacked"');
      expect(s).toContain('data-testid="open-evidence"');
      expect(s).not.toContain('data-testid="evidence-panel"');
    }
  });

  it('the evidence overlay lists the same items with their pins, pinned first, with the once-only hint, in the translucent panel style', () => {
    const run = upTo('g8-return-brief');
    const evidence = describeEvidence(content(), run.state);
    const pinned = evidence[evidence.length - 1]!.id;
    const html = render(store(run, { stacked: true, overlay: 'evidence', pinned: [pinned], pinHintOpen: true }));
    expect(html).toContain('data-testid="overlay-evidence"');
    expect(html).toContain('class="overlay evidence-overlay panel"');
    expect(html).toContain(`<h2 id="overlay-title">Evidence · ${evidence.length}</h2>`);
    const list = /<div class="evidence-list" data-testid="evidence-panel">([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>\s*$/.exec(html)![1]!;
    for (const e of evidence) {
      expect(list).toContain(`data-testid="evidence-${e.id}"`);
      expect(list).toContain(`data-testid="pin-${e.id}"`);
    }
    expect(list.indexOf(`data-testid="evidence-${pinned}"`)).toBeLessThan(list.indexOf(`data-testid="evidence-${evidence[0]!.id}"`));
    expect(list).toContain(`data-testid="pin-${pinned}" aria-pressed="true"`);
    expect(list).toContain('data-testid="pin-hint"');
    expect(list).toContain('data-testid="evidence-body"'); // the pinned report is open
    expect(html.match(/data-testid="evidence-panel"/g)).toHaveLength(1); // the column is collapsed while the overlay is up
  });
});

describe('tier meaning (M02)', () => {
  it('the tier word carries its meaning as a title, the ⓘ key opens the paper strip, and only the tiers an outcome uses can be shown', () => {
    const labels = content().mission.resolution_presentation!;
    for (const [prep, tier] of [[['contact', 'recovery'], 'SUCCESS'], [['recovery'], 'MIXED'], [[], 'COSTLY']] as const) {
      const run = play(newRun(), script({ prep: [...prep], route: 'earlier' }));
      const meaning = labels.tiers.find((t) => t.id === tier)!.meaning;
      expect(describeResolution(content(), run)!.meaning).toBe(meaning);
      const closed = render(store(run, { screen: 'resolution' }));
      expect(closed).toContain(`<div class="res-tier" data-testid="resolution-tier" title="${esc(meaning)}">${tier}</div>`);
      expect(closed).toMatch(/class="k k-arrow tier-info" data-action="tier-info-toggle" data-focus="tier-info-toggle" data-testid="tier-info-toggle" aria-expanded="false" aria-label="What [A-Z]+ means"/);
      expect(closed).not.toContain('data-testid="tier-meaning"');
      const open = render(store(run, { screen: 'resolution', tierInfo: true }));
      expect(open).toContain(`<div class="tier-meaning paper" id="tier-meaning" role="status" data-testid="tier-meaning">${esc(meaning)}</div>`);
      expect(open).toMatch(/data-testid="tier-info-toggle" aria-expanded="true" aria-describedby="tier-meaning"/);
      expect(open.indexOf('data-testid="resolution-tier"')).toBeLessThan(open.indexOf('data-testid="tier-meaning"'));
      expect(open.indexOf('data-testid="tier-meaning"')).toBeLessThan(open.indexOf('data-testid="resolution-title"'));
      // Nothing else on the card changes.
      for (const s of ['data-testid="resolution-heading"', 'data-testid="resolution-title"', 'data-testid="resolution-line"', 'data-testid="resolution-next"']) { expect(open).toContain(s); expect(closed).toContain(s); }
      expect(render(store(run, { screen: 'resolution', resolution: 'relationships', tierInfo: true }))).not.toContain('data-testid="tier-meaning"');
    }
    for (const reserved of ['FAILURE', 'LOSS']) {
      const meaning = labels.tiers.find((t) => t.id === reserved)!.meaning;
      const run = play(newRun(), script({ prep: ['recovery'], route: 'later' }));
      expect(render(store(run, { screen: 'resolution', tierInfo: true }))).not.toContain(esc(meaning));
    }
  });
});

describe('small items (M02)', () => {
  it('the Save / Load panel says the new campaign plays the mission briefing', () => {
    const html = render(store(null, { stage: 'menu', overlay: 'saveload' }));
    expect(html).toMatch(/data-testid="new-campaign" aria-describedby="new-campaign-hint">START A NEW CAMPAIGN<\/button><span class="muted key-hint" id="new-campaign-hint" data-testid="new-campaign-hint">\(plays the mission briefing\)<\/span>/);
  });
});
