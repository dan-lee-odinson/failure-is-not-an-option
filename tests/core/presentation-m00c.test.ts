/**
 * FNO-M00c presentation contract (playtest 2, docs/m00c-inputs/26-Playtest-2-Findings.md):
 *  - one continuous opening scroll (dedication, gap, notices) with the fade
 *    classes; two static pages under reduced motion;
 *  - the hero title at 0.75 of study A, scaled about the block's centre;
 *  - the full-screen line and key on the menu;
 *  - the emblem inside the room layer;
 *  - Details open by default on every card; the readout shown once;
 *  - History trimmed to the explanation, the lamp sentence and the sources;
 *  - the idle highlight and the hint strip (a no-op until content carries a hint);
 *  - the HINTS setting; the crisis cue's per-cue gain.
 */
import { describe, expect, it } from 'vitest';
import { indexContent, Run, type ContentBundle, type Run as RunType } from '../../core';
import { FULLSCREEN_LINE, esc, render } from '../../app/render';
import { defaultUi, type Store, type UiState } from '../../app/ui-state';
import titleLayout from '../../app/title-layout.json';
import { validateContent } from '../../scripts/lib/validator';
import { CONTENT_FILES, readJson } from '../../scripts/lib/load-content';
import { content, newRun, play, ROOT, script } from './helpers';
import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';

function store(run: RunType | null, u: Partial<UiState> = {}): Store {
  return { content: content(), run, ui: defaultUi({ screen: run ? 'console' : 'opening', ...u }) };
}

function upTo(node: string, route: 'earlier' | 'later' = 'earlier'): RunType {
  const inputs = script({ prep: ['recovery'], route });
  const cut = inputs.findIndex((i) => 'node' in i && i.node === node);
  return play(newRun(), inputs.slice(0, cut));
}

describe('opening: the credits on the den wall (FNO-DEPLOY; the M00c scroll retired)', () => {
  it('one column inside the projection rectangle: the dedication, the three notices, then every credit section in order', () => {
    const reg = content().bundle.registry;
    const html = render(store(null, { stage: 'credits' }));
    const texts = [...reg.notices.dedication, reg.notices.project_disclaimer, reg.notices.ai_disclosure, reg.notices.dramatization, ...(reg.credits ?? []).flatMap((s) => [s.heading, ...s.lines])];
    let last = -1;
    for (const t of texts) { const i = html.indexOf(esc(t)); expect(i, t).toBeGreaterThan(last); last = i; }
    expect(html).toContain('aria-label="Credits"');
    // The box is registry.opening_den.projection_rect (830, 115, 928×522) as percentages of the 1920×1080 design frame.
    expect(html).toMatch(/id="op-scroll"[^>]*style="left:43\.229%;top:10\.648%;width:48\.333%;height:48\.333%"/);
    // The den layers at their registry placements: the beam at (144, −101, 1920×1080) at 0.32, the smoke at (390, 315, 1152×648) at 0.16.
    expect(html).toMatch(/class="pl-layer den-beam"[^>]*style="left:7\.5%;top:-9\.352%;width:100%;height:100%;opacity:0\.32"/);
    expect(html).toMatch(/class="pl-layer den-smoke" data-smoke="a"[^>]*style="left:20\.313%;top:29\.167%;width:60%;height:60%;opacity:0\.16"[^>]*data-seconds="12"[^>]*data-rise="-55"[^>]*data-loop="12"[^>]*data-crossfade="3"/);
    // Composite order: the plate, the credits, the beam, the smoke, the run-out darkening.
    const order = ['den-plate', 'op-scroll', 'den-beam', 'den-smoke-a', 'den-smoke-b', 'den-dark'].map((id) => html.indexOf(`data-testid="${id}"`));
    for (let i = 1; i < order.length; i++) expect(order[i]!).toBeGreaterThan(order[i - 1]!);
    expect(html).toContain('data-runout="none"');
    expect(render(store(null, { stage: 'credits', runout: 'dark' }))).toContain('data-runout="dark"');
  });

  it('fade states are classes and a data attribute on the stage', () => {
    expect(render(store(null, { stage: 'credits', fade: 'out' }))).toMatch(/class="screen-opening screen-plate op-credits fade-out" [^>]*data-fade="out"/);
    expect(render(store(null, { stage: 'credits', fade: 'out', fadeQuick: true }))).toContain('op-credits fade-out quick"');
    expect(render(store(null, { stage: 'title', fade: 'in' }))).toMatch(/class="screen-opening op-hero stage-title fade-in" [^>]*data-fade="in"/);
    expect(render(store(null, { stage: 'title', fade: 'in', fadeQuick: true }))).toContain('stage-title fade-in quick"');
    expect(render(store(null, { stage: 'title', fade: 'in', fadeDen: true }))).toContain('stage-title fade-in den"'); // the 700 ms dissolve out of the black den
    expect(render(store(null, { stage: 'title' }))).not.toContain('data-fade');
  });
});

describe('hero title at 0.75', () => {
  it('every study-A row is 0.75 of the v003 size, the left edge stays at x 475, and the baselines are scaled about the block centre', () => {
    type Row = { text: string; x: number; baseline: number; font_size: number; source_font_size: number; source_baseline: number };
    const a = titleLayout.studies.find((s) => s.id === 'a') as unknown as { scale: number; rows: Row[] };
    expect(a.scale).toBe(0.75);
    const top = a.rows[0]!.source_baseline - 0.7 * a.rows[0]!.source_font_size;
    const c = (top + a.rows[a.rows.length - 1]!.source_baseline) / 2;
    for (const r of a.rows) {
      expect(r.font_size).toBeCloseTo(r.source_font_size * 0.75, 2);
      expect(r.x).toBe(475);
      expect(r.baseline).toBeCloseTo(c + 0.75 * (r.source_baseline - c), 0);
    }
    expect(a.rows.map((r) => Math.round(r.font_size * 10) / 10)).toEqual([240.6, 202.1, 270.6]);
    const html = render(store(null, { stage: 'title' }));
    for (const r of a.rows) expect(html).toContain(`<text x="${r.x}" y="${r.baseline}" font-size="${r.font_size}">${r.text}</text>`);
  });
});

describe('menu: full screen', () => {
  it('shows the line, and the key only when the API is available', () => {
    const off = render(store(null, { stage: 'menu' }));
    expect(off).toContain(esc(FULLSCREEN_LINE));
    expect(off).not.toContain('data-testid="fullscreen"');
    const on = render(store(null, { stage: 'menu', fullscreen: 'available' }));
    expect(on).toMatch(/data-testid="fullscreen"[^>]*>FULL SCREEN</);
    const active = render(store(null, { stage: 'menu', fullscreen: 'active' }));
    expect(active).toMatch(/data-testid="fullscreen" aria-pressed="true">EXIT FULL SCREEN</);
  });
});

describe('room layer', () => {
  it('the plate and the emblem sit inside the room layer on the console and the hero', () => {
    for (const html of [render(store(upTo('g8-return-brief'))), render(store(null, { stage: 'title' }))]) {
      const layer = /<div class="room-layer"[^>]*>([\s\S]*?)<\/div>/.exec(html)![1]!;
      expect(layer).toContain('id="plate"');
      expect(layer).toContain('id="emblem"');
      expect(html.indexOf('class="room-layer"')).toBeLessThan(html.indexOf('class="status-bar"') === -1 ? html.indexOf('class="hero-overlay"') : html.indexOf('class="status-bar"'));
    }
  });
});

describe('cards and the conversation panel', () => {
  it('Details opens by default on every card, the readout shows once, the questions sit in the panel footer', () => {
    const run = upTo('g8-return-brief');
    const html = render(store(run));
    for (const id of ['g8-return-earlier', 'g8-return-later']) expect(html).toMatch(new RegExp(`<details class="card-details" data-details="${id}" open>`));
    expect(html).not.toContain('data-testid="readout"');
    expect(html).toContain('<b>Supported by</b>');
    expect(html).toContain('Unrehearsed does not mean untrained or incapable.');
    const body = html.indexOf('<div class="conv-body');
    const foot = html.indexOf('<div class="conv-questions">');
    expect(foot).toBeGreaterThan(body);
    expect(html.slice(foot)).toContain('data-testid="question-g8-q-recovery-risk"');
    expect(html.slice(body, foot)).not.toContain('data-testid="questions"');
    // A player's explicit toggle still wins.
    expect(render(store(run, { details: { 'g8-return-earlier': false } }))).toMatch(/<details class="card-details" data-details="g8-return-earlier">/);
    // Committed cards keep Details open too.
    const receipt = render(store(upTo('g8-order-receipt')));
    expect(receipt).toMatch(/data-details="g8-return-earlier" open>/);
  });
});

describe('History panel trim', () => {
  it('renders the explanation, the lamp sentence and the sources; no provenance lines, fiction register, people or anchors', () => {
    // R2 (FNO-PT3): mid-mission the panel names only the sources play has cited, without their notes, and the
    // alternate-history explanation waits for the record to be left; after the mission everything is there.
    const mid = render(store(upTo('g8-return-brief'), { overlay: 'history' }));
    const reg = content().bundle.registry;
    expect(mid).toContain('data-testid="lamp-explanation"');
    expect(mid).not.toContain('data-testid="alt-history-explanation"');
    expect(mid).toContain('data-testid="history-source-H7"'); // Lovell's relay lines
    expect(mid).not.toContain('data-testid="history-source-H5"'); // the post-flight account, not yet
    for (const s of reg.sources) expect(mid).not.toContain(esc(s.note));
    const run = play(newRun(), script({ prep: ['recovery'], route: 'earlier' }));
    const html = render(store(run, { overlay: 'history' }));
    expect(html).toContain('data-testid="alt-history-explanation"');
    expect(html).toContain('data-testid="lamp-explanation"');
    for (const s of reg.sources) expect(html).toContain(esc(s.title));
    for (const s of reg.sources) expect(html).toContain(esc(s.note));
    expect(html).not.toContain('Fiction register');
    expect(html).not.toContain('Report, procedure');
    expect(html).not.toContain('People in this scenario');
    expect(html).not.toContain('Mission anchors');
    for (const f of reg.fiction) expect(html).not.toContain(esc(f.text));
    for (const c of content().bundle.characters) expect(html).not.toContain(esc(c.portrayal));
  });
});

describe('idle help and hints', () => {
  it('highlights the continuation key when idle, never on a decision, never with hints hidden or reduced motion', () => {
    const brief = newRun();
    expect(render(store(brief))).not.toContain('idle-hint');
    expect(render(store(brief, { idle: true }))).toMatch(/class="k k-key idle-hint" data-action="continue:g8-brief-continue"/);
    expect(render(store(brief, { idle: true, hints: false }))).not.toContain('idle-hint');
    expect(render(store(brief, { idle: true, reducedMotion: true }))).not.toContain('idle-hint');
    expect(render(store(brief, { idle: true, overlay: 'settings' }))).not.toContain('idle-hint');
    const decision = upTo('g8-return-brief');
    const idle = render(store(decision, { idle: true }));
    expect(idle).not.toContain('idle-hint');
    expect(idle).toContain('data-testid="hint-strip"'); // content 0.5.2 carries a hint on every decision (M01)
    expect(render(store(decision, { idle: false }))).not.toContain('data-testid="hint-strip"');
    // A choice screen with a continuation (preparation's Finish, the plan screen's Commit) highlights nothing either.
    expect(render(store(play(newRun(), script({ upTo: 1 })), { idle: true }))).not.toContain('idle-hint');
    const done = play(newRun(), script({ prep: ['recovery'], route: 'earlier' }));
    expect(render(store(done, { screen: 'planning', idle: true }))).not.toContain('idle-hint');
    expect(render(store(done, { screen: 'debrief', idle: true }))).toContain('idle-hint');
    // The menu and the debrief have a continuation too.
    expect(render(store(null, { stage: 'menu', idle: true }))).toMatch(/data-testid="start-new"/);
    expect(render(store(null, { stage: 'menu', idle: true }))).toContain('k k-title idle-hint"');
  });

  it('a decision hint (content 0.5.2) renders in a paper strip above the cards when idle; the validator accepts the field; the engine ignores it', () => {
    const bundle = structuredClone(content().bundle) as ContentBundle;
    const node = bundle.mission.phases.flatMap((p) => p.nodes).find((n) => n.id === 'g8-return-brief');
    if (node?.type === 'decision') node.hint = "Ask Glen's questions and read each card's risk before you choose.";
    const withHint = indexContent(bundle);
    expect(withHint.fingerprint).not.toBe(content().fingerprint); // a content change is a content change
    const run = new Run(withHint, { seed: 1 });
    const inputs = script({ prep: ['recovery'], route: 'earlier' });
    play(run, inputs.slice(0, inputs.findIndex((i) => 'node' in i && i.node === 'g8-return-brief')));
    const s: Store = { content: withHint, run, ui: defaultUi({ screen: 'console', idle: true }) };
    const html = render(s);
    expect(html).toContain('data-testid="hint-strip"');
    expect(html.indexOf('data-testid="hint-strip"')).toBeLessThan(html.indexOf('<div class="cards"'));
    expect(render({ ...s, ui: defaultUi({ screen: 'console', idle: false }) })).not.toContain('data-testid="hint-strip"');
    expect(render({ ...s, ui: defaultUi({ screen: 'console', idle: true, hints: false }) })).not.toContain('data-testid="hint-strip"');
    // Same route, same log: the hint changes nothing in play.
    const plain = play(newRun(), inputs.slice(0, inputs.findIndex((i) => 'node' in i && i.node === 'g8-return-brief')));
    // (The run header carries the content fingerprint, which differs by construction; every other entry is identical.)
    expect(JSON.stringify(run.log.filter((e) => e.type !== 'run'))).toBe(JSON.stringify(plain.log.filter((e) => e.type !== 'run')));
    // The schema accepts the field on a raw copy of the content.
    const raw = Object.fromEntries(Object.entries(CONTENT_FILES).map(([k, rel]) => [k, readJson(ROOT, rel)])) as Parameters<typeof validateContent>[0]['raw'];
    const mission = raw.mission as { phases: { nodes: { id: string; hint?: string }[] }[] };
    mission.phases.flatMap((p) => p.nodes).find((n) => n.id === 'g8-return-brief')!.hint = 'A hint.';
    const report = validateContent({ root: ROOT, schemaDir: resolve(ROOT, 'schema'), raw, manifest: JSON.parse(readFileSync(resolve(ROOT, 'assets', 'manifest.json'), 'utf8')), assetsDir: resolve(ROOT, 'assets'), skipFiles: true, bundle: () => bundle });
    expect(report.errors).toEqual([]);
  });

  it('Settings carries HINTS: SHOW / HIDE', () => {
    expect(render(store(null, { stage: 'menu', overlay: 'settings' }))).toMatch(/data-testid="hints-toggle" aria-pressed="true">HINTS: SHOW</);
    expect(render(store(null, { stage: 'menu', overlay: 'settings', hints: false }))).toMatch(/data-testid="hints-toggle" aria-pressed="false">HINTS: HIDE</);
  });
});
