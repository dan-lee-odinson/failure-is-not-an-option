/**
 * FNO-M00b presentation contract (docs 16 §3, 17 §1/§5, 18, 19 §6, the handoff):
 *  - the opening stages render in order with Begin, Skip, Pause/Continue,
 *    the hero title at the study-A coordinates, and the menu's four keys;
 *  - no evidence chips on cards or lines; pinning lives in the Evidence
 *    panel only, with the once-only hint;
 *  - decision cards lead with intent and risk; Details is open by default at
 *    the return fork only; a committed decision stays on screen stamped
 *    ORDERED / CHOSEN with the other card greyed and no Choose key;
 *  - no fiction call-outs or provenance in play text;
 *  - the theme is a token set: every Apollo face resolves and the Modern
 *    switch is hidden.
 */
import { describe, expect, it } from 'vitest';
import { type Run } from '../../core';
import { esc, render } from '../../app/render';
import { STAGES, defaultUi, type Store, type UiState } from '../../app/ui-state';
import { FACE_FAMILIES, FACE_STATES, MODERN_UI_AVAILABLE, themeVariables } from '../../app/theme';
import titleLayout from '../../app/title-layout.json';
import { content, newRun, play, script } from './helpers';

function store(run: Run | null, u: Partial<UiState> = {}): Store {
  return { content: content(), run, ui: defaultUi({ screen: run ? 'console' : 'opening', ...u }) };
}

function upTo(node: string, route: 'earlier' | 'later' = 'earlier', stance: 'blame' | 'ground' = 'ground'): Run {
  const inputs = script({ prep: ['recovery'], route, stance });
  const cut = inputs.findIndex((i) => 'node' in i && i.node === node);
  return play(newRun(), inputs.slice(0, cut));
}

describe('opening screens', () => {
  it('renders every stage in order with the required controls', () => {
    const start = render(store(null, { stage: 'start' }));
    expect(start).toContain('data-testid="begin"');
    expect(start).toContain('data-testid="skip-to-menu"');
    expect(start).toContain('data-testid="sound-toggle"');
    for (const stage of ['dedication', 'notices'] as const) {
      const html = render(store(null, { stage }));
      expect(html).toContain('data-testid="op-scroll"');
      expect(html).toContain('data-testid="scroll-toggle"');
      expect(html).toContain('data-testid="stage-next"');
      expect(html).toContain('data-testid="skip-to-menu"');
      expect(html).not.toMatch(/class="notice|<h2/); // prose, not boxes
      const reduced = render(store(null, { stage, reducedMotion: true }));
      expect(reduced).toContain('op-scroll static');
      expect(reduced).not.toContain('data-testid="scroll-toggle"');
    }
    const dedication = render(store(null, { stage: 'dedication' }));
    for (const p of content().bundle.registry.notices.dedication) expect(dedication).toContain(esc(p));
    // Since M00c the dedication and the notices share one scroll; only the reduced-motion page keeps them apart.
    expect(render(store(null, { stage: 'dedication', reducedMotion: true }))).not.toContain(esc(content().bundle.registry.notices.project_disclaimer));
    const notices = render(store(null, { stage: 'notices' }));
    for (const p of [content().bundle.registry.notices.project_disclaimer, content().bundle.registry.notices.ai_disclosure, content().bundle.registry.notices.dramatization]) expect(notices).toContain(esc(p));
    expect(render(store(null, { stage: 'montage' }))).toContain('data-stage="montage"');
    expect(STAGES.indexOf('montage')).toBe(STAGES.indexOf('title') - 1);
  });

  it('the hero title is live text at the study-A coordinates and Continue is keyboard-reachable', () => {
    const html = render(store(null, { stage: 'title' }));
    const study = titleLayout.studies.find((s) => s.id === 'a')!;
    for (const row of study.rows) expect(html).toContain(`<text x="${row.x}" y="${row.baseline}" font-size="${row.font_size}">${row.text}</text>`);
    expect(html).toContain('<button type="button" class="hero-continue"');
    expect(html).toContain('data-testid="plate"');
    expect(html).not.toContain('data-testid="menu"');
  });

  it('the menu has the four keys; CONTINUE is disabled with a visible reason when no valid save exists', () => {
    const off = render(store(null, { stage: 'menu' }));
    for (const id of ['start-new', 'start-load', 'menu-load', 'menu-about']) expect(off).toContain(`data-testid="${id}"`);
    expect(off).toMatch(/data-testid="start-load" disabled aria-describedby="continue-reason"/);
    expect(off).toContain('data-testid="continue-reason"');
    const on = render(store(null, { stage: 'menu', continueSave: { ok: true } }));
    expect(on).not.toMatch(/data-testid="start-load" disabled/);
    expect(on).not.toContain('data-testid="continue-reason"');
    const about = render(store(null, { stage: 'menu', overlay: 'about' }));
    expect(about).toContain('data-testid="replay-opening"');
    for (const s of content().bundle.registry.sources) expect(about).toContain(esc(s.title));
    expect(about).toContain('Beep 8 count (loopable) by JonNicholas, freesound.org, CC BY 3.0');
    expect(about).toContain('Music: Dan Lee-Odinson, produced with Suno Pro, instrumental.');
    expect(about).toContain('SIL Open Font License 1.1');
  });
});

describe('cards, pins and stamps', () => {
  it('cards lead with intent and risk; attraction, uncertainty and support sit behind Details; no chips anywhere', () => {
    const run = upTo('g8-return-brief');
    const html = render(store(run));
    expect(html).not.toContain('ev-link');
    expect(html).not.toContain('link-g8-ev');
    expect(html).toMatch(/<div class="field intent"><b>Intent<\/b>/);
    expect(html).toMatch(/<div class="field cost"><b>Risk<\/b>/);
    // Details holds attraction, uncertainty and the supported-by readout, open by default at the return fork.
    const card = /<article class="card paper" data-state="rest" data-testid="card-g8-return-earlier">([\s\S]*?)<\/article>/.exec(html)![1]!;
    expect(card).toMatch(/<details class="card-details" data-details="g8-return-earlier" open>/);
    const details = /<details[\s\S]*<\/details>/.exec(card)![0];
    expect(details).toContain('<b>Attraction</b>');
    expect(details).toContain('<b>Uncertainty</b>');
    expect(details).toContain('<b>Supported by</b>');
    expect(card.indexOf('<b>Intent</b>')).toBeLessThan(card.indexOf('<details'));
    expect(card.indexOf('<b>Risk</b>')).toBeLessThan(card.indexOf('<details'));
    // Open by default everywhere since M00c (playtest 2, note 12), the termination decision included.
    const rule = render(store(upTo('g8-rule-decision')));
    expect(rule).toMatch(/<details class="card-details" data-details="g8-order-return" open>/);
    // A player's explicit toggle wins.
    expect(render(store(run, { details: { 'g8-return-earlier': false } }))).toMatch(/<details class="card-details" data-details="g8-return-earlier">/);
  });

  it('pinning lives in the Evidence panel only, with a glyph, a tooltip and a once-only hint', () => {
    const run = upTo('g8-return-brief');
    const html = render(store(run));
    const pins = html.match(/data-action="pin:/g) ?? [];
    expect(pins.length).toBeGreaterThan(0);
    const panel = html.slice(html.indexOf('data-testid="evidence-panel"'), html.indexOf('<section class="strip"'));
    expect((panel.match(/data-action="pin:/g) ?? []).length).toBe(pins.length);
    expect(html).toContain('title="Pin to keep this report in view. Pinning changes nothing in the mission."');
    expect(html).not.toContain('data-testid="pin-hint"');
    expect(render(store(run, { pinHintOpen: true }))).toContain('data-testid="pin-hint"');
    expect(render(store(run, { pinHintOpen: true, pinHintSeen: true }))).not.toContain('data-testid="pin-hint"');
    // Pinning is presentation only: the same run renders the pinned item first and its Choose keys unchanged.
    const pinned = render(store(run, { pinned: ['g8-ev-reserve'] }));
    expect(pinned).toContain('data-testid="evidence-g8-ev-reserve"');
    expect(pinned.indexOf('evidence-g8-ev-reserve')).toBeLessThan(pinned.indexOf('evidence-g8-ev-crisis'));
    expect(pinned).toContain('data-testid="option-g8-return-earlier"');
  });

  it('a committed decision stays on screen at the receipt: the chosen card stamped, the other greyed, no Choose key', () => {
    for (const route of ['earlier', 'later'] as const) {
      const run = upTo('g8-order-receipt', route);
      const html = render(store(run));
      expect(html).toContain('data-testid="committed-cards"');
      expect(html).toContain(`data-testid="stamp-g8-return-${route}">ORDERED<`);
      const other = route === 'earlier' ? 'later' : 'earlier';
      expect(html).toMatch(new RegExp(`data-state="closed" data-testid="card-g8-return-${other}"`));
      expect(html).not.toContain('data-action="option:');
      expect(html).toContain('data-testid="continue-g8-execute-return"');
      expect(html).toContain('data-focus-default');
    }
    // The stance is a statement, not an order: CHOSEN.
    for (const stance of ['blame', 'ground'] as const) {
      const html = render(store(upTo('g8-accountability-receipt', 'later', stance)));
      expect(html).toMatch(/data-testid="stamp-g8-(back-crew-criticism|own-ground-contingencies)">CHOSEN</);
      expect(html).not.toContain('data-action="option:');
    }
  });

  it('a rehearsal stamps its card CHOSEN and removes its key; exhausted cards grey with the reason', () => {
    const run = play(newRun(), script({ prep: ['recovery'], upTo: 2 }));
    const html = render(store(run));
    expect(html).toContain('data-testid="stamp-g8-prep-recovery">CHOSEN<');
    expect(html).not.toContain('data-testid="option-g8-prep-recovery"');
    expect(html).toContain('data-testid="option-g8-prep-contact"');
    const done = play(newRun(), script({ prep: ['recovery', 'contact'], upTo: 3 }));
    const html2 = render(store(done));
    expect(html2).toMatch(/data-state="unavailable" data-testid="card-g8-prep-systems"/);
    expect(html2).toContain('data-testid="reason-g8-prep-systems"');
    expect(html2).not.toContain('data-testid="option-g8-prep-systems"');
  });

  it('the plan screen stamps the committed plan and greys the others', () => {
    const run = play(newRun(), script({ prep: ['recovery', 'contact'], route: 'earlier' }));
    const before = render(store(run, { screen: 'planning', highlightPlan: 'g9-plan-recovery-contact' }));
    expect(before).toMatch(/data-testid="select-g9-plan-recovery-contact" aria-pressed="true"/);
    play(run, [{ kind: 'confirm_plan', id: 'g9-confirm-plan', plan: 'g9-plan-recovery-contact' }]);
    const after = render(store(run, { screen: 'planning' }));
    expect(after).toContain('data-testid="stamp-g9-plan-recovery-contact">CHOSEN<');
    expect(after).toMatch(/data-state="closed" data-testid="plan-g9-plan-recovery-systems"/);
    expect(after).not.toContain('data-action="highlight-plan:');
  });
});

describe('play text carries no fiction call-outs or provenance', () => {
  it('on every stop of both routes, the console shows neither register labels nor sources', () => {
    for (const route of ['earlier', 'later'] as const) {
      const inputs = script({ prep: ['contact', 'systems'], route, questions: true });
      const run = newRun();
      const check = (): void => {
        if (!run.currentNode()) return;
        const html = render(store(run, { open: Object.keys(run.state.mission.evidence) }));
        const visible = html.replace(/<[^>]*>/g, ' ');
        expect(visible).not.toMatch(/Simulated report|Fiction register|AmericaSpace|\(F\d+\)|Sources: H/i);
        expect(html).not.toContain('badge sim');
        expect(html).not.toContain('event-record');
      };
      check();
      for (const inp of inputs) { play(run, [inp]); check(); }
      const history = render(store(run, { screen: 'debrief', overlay: 'history' }));
      expect(history).not.toContain('Fiction register'); // M00c: game mechanics are not shown in History
      expect(history).toContain('Historical sources');
      expect(history).not.toMatch(/Sources: \.|Fiction register: \./);
      const debrief = render(store(run, { screen: 'debrief' }));
      expect(debrief).not.toContain('data-testid="event-record-toggle"');
      expect(render(store(run, { screen: 'debrief', debug: true }))).toContain('data-testid="event-record-toggle"');
    }
  });
});

describe('theme', () => {
  it('every Apollo face and lamp resolves through the manifest; the Modern switch is hidden', () => {
    const vars = themeVariables('apollo');
    expect(Object.keys(vars)).toHaveLength(FACE_FAMILIES.length * FACE_STATES.length + 2);
    // Under vitest small SVGs come back inlined; the production build emits them as files (assetsInlineLimit: 0).
    for (const [name, value] of Object.entries(vars)) expect(value, name).toMatch(/^url\("(data:image\/svg\+xml|.*apollo-.*\.svg)/);
    expect(MODERN_UI_AVAILABLE).toBe(false);
    const settings = render(store(null, { stage: 'menu', overlay: 'settings' }));
    expect(settings).not.toContain('data-testid="ui-mode"');
    expect(settings).toContain('data-testid="text-size"');
    expect(settings).toContain('data-testid="volume-master"');
  });
});
