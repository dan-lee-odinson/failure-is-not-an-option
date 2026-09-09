/**
 * FNO-DEMO-END — the demo-complete screen after the committed Gemini IX-A plan, on every route: the campaign-complete
 * flag (derived from the run, nothing added to a save), the menu's CONTINUE refusing a completed campaign with a visible
 * reason while NEW CAMPAIGN and LOAD stay available, the planning screen's CONTINUE only once the plan is committed, the
 * screen's copy and keys (FOLLOW ON ITCH.IO in a new tab, EXIT TO FINAOGAME.COM the primary key, PLAY AGAIN), the
 * itch.io link in About and in the home page's coming-soon block (registry.site unchanged), the sheet's demo-end stage.
 * Presentation only: nothing of it enters the log, and the replay is unchanged.
 */
import { describe, expect, it } from 'vitest';
import { SAVE_FORMAT, createSave, replay, verifySave, type Run } from '../../core';
import { DEMO_END, render } from '../../app/render';
import { ITCH_URL, SITE_HOME_URL } from '../../app/links';
import { CAMPAIGN_COMPLETE_REASON, NO_SAVE_REASON, campaignComplete, continueState, exportFilename } from '../../app/storage';
import { defaultUi, type Store, type UiState } from '../../app/ui-state';
import { FOLLOW_LINK, renderSite } from '../../scripts/lib/site';
import { buildSheet, extractRuns } from '../../scripts/lib/dialogue-sheet';
import { PREP_SETS, ROOT, confirm, content, newRun, play, playScript, script, type Route, type Stance } from './helpers';

function store(run: Run | null, ui: Partial<UiState> = {}): Store {
  return { content: content(), run, ui: defaultUi({ screen: 'console', hasBrowserSave: true, ...ui }) };
}

const routes: Route[] = ['earlier', 'later'];
const stances: Stance[] = ['blame', 'ground'];

/** The first plan the follow-on enables for this run (every route enables at least one). */
function enabledPlan(run: Run): string {
  const entry = run.log.find((e) => e.type === 'followon') as { enabled: string[] } | undefined;
  expect(entry?.enabled.length).toBeGreaterThan(0);
  return entry!.enabled[0]!;
}

describe('the campaign-complete flag (FNO-DEMO-END, item 3)', () => {
  it('is set once the mission is closed and the plan is committed, on every route, and adds nothing to a save', () => {
    for (const prep of PREP_SETS) for (const route of routes) for (const stance of stances) {
      const inputs = script({ prep, route, stance });
      const run = play(newRun(), inputs.slice(0, -1));
      expect(campaignComplete(run), 'mid-mission').toBe(false);
      play(run, inputs.slice(-1));
      expect(run.state.mission.completed).not.toBeNull();
      expect(campaignComplete(run), 'closed, no plan yet').toBe(false);
      expect(exportFilename(run)).toMatch(/-complete\.json$/);
      const plan = enabledPlan(run);
      play(run, [confirm(plan)]);
      expect(campaignComplete(run), `committed ${plan}`).toBe(true);
      // The flag is derived: the save carries the same five fields as ever, and its replay agrees with the flag.
      const save = createSave(run);
      expect(Object.keys(save).sort()).toEqual(['format', 'identity', 'log_hash', 'save_version', 'snapshot']);
      expect(save.format).toBe(SAVE_FORMAT);
      const back = verifySave(content(), JSON.parse(JSON.stringify(save)));
      expect(back.ok).toBe(true);
      if (back.ok) {
        expect(campaignComplete(back.run)).toBe(true);
        expect(back.run.canonicalLog()).toBe(run.canonicalLog());
      }
    }
  });

  it("decides the menu's CONTINUE: an empty slot, a save that fails, a live run, a completed campaign", () => {
    expect(continueState(null)).toEqual({ ok: false, reason: NO_SAVE_REASON });
    const failed = continueState({ ok: false, code: 'snapshot-mismatch', message: 'The save was rejected.' });
    expect(failed.ok).toBe(false);
    if (!failed.ok) { expect(failed.reason).toBe('The saved campaign cannot be resumed: The save was rejected.'); expect(failed.complete).toBeUndefined(); }
    const live = playScript({ upTo: 6 });
    expect(continueState({ ok: true, run: live })).toEqual({ ok: true });
    const closed = playScript({ prep: ['recovery'], route: 'earlier' });
    expect(continueState({ ok: true, run: closed })).toEqual({ ok: true }); // the debrief and the planning are still to come
    play(closed, [confirm('g9-plan-recovery-contact')]);
    expect(continueState({ ok: true, run: closed })).toEqual({ ok: false, reason: CAMPAIGN_COMPLETE_REASON, complete: true });
    expect(CAMPAIGN_COMPLETE_REASON).toMatch(/complete/i);
    expect(CAMPAIGN_COMPLETE_REASON).toMatch(/New Campaign/);
    expect(CAMPAIGN_COMPLETE_REASON).toMatch(/Load/);
  });

  it('the menu says the campaign is complete and offers New Campaign / Load; CONTINUE is disabled with that reason', () => {
    const html = render(store(null, { screen: 'opening', stage: 'menu', continueSave: { ok: false, reason: CAMPAIGN_COMPLETE_REASON, complete: true } }));
    expect(html).toMatch(/data-testid="start-load" disabled aria-describedby="continue-reason"/);
    expect(html).toContain(`data-testid="continue-reason">${CAMPAIGN_COMPLETE_REASON}</p>`);
    expect(html).not.toMatch(/data-testid="start-new" disabled/);
    expect(html).not.toMatch(/data-testid="menu-load" disabled/);
    expect(html).toContain('data-testid="start-new" data-focus-default');
  });
});

describe('the demo-complete screen (FNO-DEMO-END, items 1, 2, 5, 6)', () => {
  const finished = (): Run => {
    const run = playScript({ prep: ['recovery'], route: 'earlier', stance: 'ground' });
    play(run, [confirm('g9-plan-recovery-contact')]);
    return run;
  };

  it('the planning screen carries CONTINUE only once the plan is committed, as the focus default in place of the commit key', () => {
    const run = playScript({ prep: ['recovery'], route: 'earlier' });
    const before = render(store(run, { screen: 'planning', highlightPlan: 'g9-plan-recovery-contact' }));
    expect(before).not.toContain('data-testid="to-demo-end"');
    expect(before).toMatch(/data-testid="confirm-plan" data-focus-default/);
    play(run, [confirm('g9-plan-recovery-contact')]);
    const after = render(store(run, { screen: 'planning' }));
    expect(after).toMatch(/data-action="demo-end" data-focus="demo-end" data-testid="to-demo-end" data-focus-default>CONTINUE</);
    expect(after).toMatch(/data-testid="confirm-plan" disabled/);
    expect(after).not.toMatch(/data-testid="confirm-plan" data-focus-default/);
    expect(after.indexOf('data-testid="committed-text"')).toBeLessThan(after.indexOf('data-testid="to-demo-end"'));
  });

  it('shows the heading, the three lines and the three keys in order, with the right targets; the run and its log are untouched', () => {
    const run = finished();
    const logBefore = run.canonicalLog();
    const stateBefore = run.canonicalState();
    const html = render(store(run, { screen: 'demo-end' }));
    expect(html).toContain('data-testid="screen-demo-end"');
    expect(html).toContain(`data-testid="demo-end-heading">${DEMO_END.heading}</h1>`);
    expect(DEMO_END.heading).toBe('DEMO COMPLETE');
    expect([...DEMO_END.lines]).toEqual(['Thank you for flying Gemini VIII with us.', 'Failure is Not an Option is in development. The full game is coming.', 'Follow the game on itch.io for updates.']);
    DEMO_END.lines.forEach((l, i) => expect(html).toContain(`data-testid="demo-end-line-${i + 1}">${l}</p>`));
    // The keys: FOLLOW (new tab, noopener noreferrer), EXIT (the primary raised key, the same tab), PLAY AGAIN (the menu); keyboard order = DOM order.
    const follow = /<a class="k k-selector k-link" href="([^"]+)" target="_blank" rel="noopener noreferrer" data-focus="follow-itch" data-testid="follow-itch">FOLLOW ON ITCH\.IO<\/a>/.exec(html);
    expect(follow?.[1]).toBe(ITCH_URL);
    expect(ITCH_URL).toBe('https://danleeodinson.itch.io/failure-is-not-an-option');
    const exit = /<a class="k k-key k-link" href="([^"]+)" data-focus="exit-home" data-focus-default data-testid="exit-home">EXIT TO FINAOGAME\.COM<\/a>/.exec(html);
    expect(exit?.[1]).toBe(SITE_HOME_URL);
    expect(SITE_HOME_URL).toBe('https://finaogame.com/');
    expect(html).toMatch(/<button type="button" class="k k-selector" data-action="play-again" data-focus="play-again" data-testid="play-again">PLAY AGAIN<\/button>/);
    expect(html.indexOf('data-testid="follow-itch"')).toBeLessThan(html.indexOf('data-testid="exit-home"'));
    expect(html.indexOf('data-testid="exit-home"')).toBeLessThan(html.indexOf('data-testid="play-again"'));
    expect((html.match(/data-focus-default/g) ?? []).length).toBe(1);
    // The room plate dimmed beneath one paper card; the sound control as elsewhere; the fade class (none under reduced motion).
    expect(html).toContain('data-testid="demo-end-plate"');
    expect(html).toContain('<div class="de-dim" aria-hidden="true"></div>');
    expect(html).toMatch(/<section class="de-card paper" data-testid="demo-end-card"/);
    expect(html).toContain('data-testid="sound-demo-end"');
    expect(html).toContain('class="screen-demo-end de-fade"');
    expect(render(store(run, { screen: 'demo-end', reducedMotion: true }))).toContain('class="screen-demo-end"');
    // Nothing of it in the run: the log and the state are byte for byte what they were, and neither mentions the screen.
    expect(run.canonicalLog()).toBe(logBefore);
    expect(run.canonicalState()).toBe(stateBefore);
    expect(logBefore).not.toMatch(/demo/i);
    expect(replay(content(), run.identity).canonicalLog()).toBe(logBefore);
  });

  it('is reached on every route: the committed plan renders CONTINUE and the screen on all 56 routes', () => {
    for (const prep of PREP_SETS) for (const route of routes) for (const stance of stances) {
      const run = playScript({ prep, route, stance });
      play(run, [confirm(enabledPlan(run))]);
      expect(render(store(run, { screen: 'planning' }))).toContain('data-testid="to-demo-end"');
      expect(render(store(run, { screen: 'demo-end' }))).toContain('data-testid="demo-end-heading">DEMO COMPLETE</h1>');
    }
  });

  it('About carries the itch.io key under HOME, and the home page carries the link in the coming-soon block with registry.site unchanged', () => {
    const about = render(store(null, { screen: 'opening', stage: 'menu', overlay: 'about' }));
    const home = about.indexOf('data-testid="home-link">HOME</a>');
    expect(home).toBeGreaterThan(0);
    const itch = about.indexOf(`<a class="k k-selector k-link" href="${ITCH_URL}" target="_blank" rel="noopener noreferrer" data-testid="about-itch">FOLLOW ON ITCH.IO</a>`);
    expect(itch).toBeGreaterThan(home);
    const reg = content().bundle.registry;
    const block = reg.site!.blocks.find((b) => b.id === 'coming_soon')!;
    expect(block.items.map((i) => i.id)).toEqual(['paragraph-01', 'heading-01', 'paragraph-02', 'link-01']); // no new registry item
    const html = renderSite(reg);
    const section = html.slice(html.indexOf('<section class="coming-soon"'), html.indexOf('</section>', html.indexOf('<section class="coming-soon"')));
    expect(section).toContain(`<a class="text-link" href="${FOLLOW_LINK.href}" data-follow="itch">Follow on itch.io <span aria-hidden="true">↗</span></a>`);
    expect(FOLLOW_LINK.href).toBe(ITCH_URL);
    expect(section).toContain('href="./demo/"'); // the block's own link stays
    expect(section.indexOf('href="./demo/"')).toBeLessThan(section.indexOf('data-follow="itch"'));
    // The text runs of the block (the arrow glyph is its own decorative span): the registry's four items and the link, nothing else.
    const runs = extractRuns(section.replace(/(<\/a>)\s*(<a\b)/g, '$1<hr>$2')).map((r) => r.text);
    const bare = (s: string): string => s.replace(/\s*↗$/, '').replace(/\s+/g, ' ');
    expect(runs).toContain(bare(FOLLOW_LINK.text));
    expect(runs).toContain(bare(block.items.find((it) => it.id === 'link-01')!.text!));
    expect(runs.filter((run) => !block.items.some((it) => bare(it.text!).includes(run)))).toEqual([bare(FOLLOW_LINK.text)]); // the one text the registry does not carry
  });

  it('the sheet carries the screen under its own demo-end stage after planning, on every route, and the home-page link on the site section', { timeout: 30000 }, () => {
    const sheet = buildSheet(ROOT);
    const rows = sheet.rows.filter((r) => r.node === 'demo-end');
    expect(rows.map((r) => r.text)).toEqual([DEMO_END.heading, ...DEMO_END.lines, DEMO_END.follow, DEMO_END.exit, DEMO_END.again]);
    expect(rows.every((r) => r.phase === 'demo-end' && r.source === 'app' && r.branch === '')).toBe(true);
    expect(rows.map((r) => r.kind)).toEqual(['ui.heading', 'ui.text', 'ui.text', 'ui.text', 'ui.button', 'ui.button', 'ui.button']);
    const first = (node: string) => sheet.rows.findIndex((r) => r.node === node);
    expect(first('demo-end')).toBeGreaterThan(first('g9-plan-decision'));
    expect(first('demo-end')).toBeLessThan(first('overlay-binder'));
    const menuReason = sheet.rows.find((r) => r.text === CAMPAIGN_COMPLETE_REASON);
    expect(menuReason?.node).toBe('opening-menu');
    const site = sheet.rows.filter((r) => r.phase === 'site' && r.source === 'app');
    expect(site.map((r) => ({ node: r.node, kind: r.kind, text: r.text }))).toEqual([{ node: 'site-coming_soon', kind: 'site.link', text: FOLLOW_LINK.text }]);
    expect(sheet.rows.some((r) => r.node === 'overlay-about' && r.text === DEMO_END.follow)).toBe(false); // owned by the demo-end stage, met first in play
  });
});
