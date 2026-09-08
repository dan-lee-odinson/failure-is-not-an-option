/**
 * FNO-M01 browser cases (the M01 handoff, Part 6):
 *  - the prologue: five beats and the scenario card with their captions, the layer moving from → to and holding,
 *    the crossfades, the dissolve into the room; Skip Prologue → the card → the console once under rapid clicks;
 *    no prologue on Continue / Load; reduced motion is in ac12;
 *  - the resolution cards on all six outcomes and both accountability stances: the tier, the plate, the result
 *    line; the relationship row's faces and labels per delta; zero-change characters absent; the lamp's state;
 *    revisiting from the debrief; nothing touches the run;
 *  - the hint strip after 30 s under fake timers, and absent under HINTS: HIDE;
 *  - the replay is byte-identical across a full route with every presentation stage exercised.
 * Screenshots at 1920×1080 and 1366×768, default and enlarged text; every new screen runs the plate checks and
 * the contrast measurements (artifacts/contrast.json).
 */
import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertRoomVisible, unhash } from './room';
import { TEXT, VIEWPORTS, assertVisibleWithinViewport, awaitRoom, click, fresh, node, setText, shot, skipPrologue, start, toMenu, type TextSize } from './helpers';

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..', '..');
interface Motion { asset: string; placement: { x: number; y: number; width: number; height: number; opacity: number }; motion: { seconds: number; from: { x: number; y: number }; to: { x: number; y: number } } }
interface Plate { id: string; title: string; background: string; moving_element: Motion; caption: string }
const mission = JSON.parse(readFileSync(resolve(ROOT, 'content', 'mission-gemini-8.json'), 'utf8')) as {
  prologue: { plates: Plate[]; scenario_card: { id: string; background: string; facility: string; date: string; mission: string; scenario: string; context: string; moving_element: Motion }; history_note: string };
  outcomes: { id: string; title: string; tier: string; result_line: string; plate: string }[];
  resolution_presentation: { heading: string; relationships_heading: string; trust_up: string; trust_down: string };
  debrief_layout: { controllers: string[]; astronauts: string[] };
  phases: { nodes: { id: string; type: string; hint?: string }[] }[];
};
const characters = (JSON.parse(readFileSync(resolve(ROOT, 'content', 'characters.json'), 'utf8')) as { characters: { id: string; name: string; portraits?: { neutral: string; concerned: string } }[] }).characters;
const manifest = JSON.parse(readFileSync(resolve(ROOT, 'assets', 'manifest.json'), 'utf8')) as { assets: { id: string; filename: string }[] };
const file = (id: string): string => manifest.assets.find((a) => a.id === id)!.filename;
const basename = (src: string | null): string => unhash(decodeURIComponent((src ?? '').split('/').pop() ?? ''));
const PEOPLE_ORDER = [...mission.debrief_layout.controllers, ...mission.debrief_layout.astronauts];

type Prep = 'contact' | 'recovery' | 'systems';
interface RouteSpec { prep: Prep[]; route: 'earlier' | 'later'; stance: 'blame' | 'ground' }

/** From the mission briefing to the outcome record, by clicking. */
async function playRoute(page: Page, r: RouteSpec): Promise<void> {
  expect(await node(page)).toBe('g8-brief');
  await click(page, 'continue-g8-brief-continue');
  for (const p of r.prep) await click(page, `option-g8-prep-${p}`);
  await click(page, 'continue-g8-prep-finish');
  await click(page, 'continue-g8-docking-report-continue');
  await click(page, 'continue-g8-loss-of-contact-continue');
  await click(page, 'continue-g8-gap-note-continue');
  await click(page, 'continue-g8-crisis-report-continue');
  await click(page, 'continue-g8-stabilization-report-continue');
  await click(page, 'option-g8-order-return');
  await click(page, `option-g8-return-${r.route}`);
  await click(page, 'continue-g8-execute-return');
  await click(page, 'continue-g8-ground-execution-continue');
  await click(page, 'continue-g8-return-beat-1-continue');
  await click(page, 'continue-g8-return-beat-2-continue');
  await click(page, 'continue-g8-pickup-report-continue');
  await click(page, 'continue-g8-relationship-response-continue');
  await click(page, 'option-g8-adopt-provenance');
  await click(page, 'continue-g8-accountability-brief-continue');
  await click(page, r.stance === 'blame' ? 'option-g8-back-crew-criticism' : 'option-g8-own-ground-contingencies');
  await click(page, 'continue-g8-resolve-accountability');
  await click(page, 'continue-g8-finish');
  await expect(page.getByTestId('screen-resolution')).toBeVisible();
}

/** The net trust change per person, read from the run's state (the same arithmetic the card uses; nothing is written). */
async function expectedDeltas(page: Page): Promise<{ id: string; delta: number }[]> {
  return page.evaluate((order) => {
    const r = window.__fno!.store.run!;
    return order.map((id) => ({ id, delta: (r.state.ledger.people[id]?.trust ?? 0) - (r.identity.initial_ledger.people[id]?.trust ?? 0) })).filter((p) => p.delta !== 0);
  }, PEOPLE_ORDER);
}

async function canonical(page: Page): Promise<{ log: string; state: string }> {
  return page.evaluate(() => { const r = window.__fno!.store.run!; return { log: r.canonicalLog(), state: r.canonicalState() }; });
}

/** Both cards for the run on screen: card 1's content against the outcome, card 2's row against the state; then the debrief; read-only throughout. */
async function assertResolution(page: Page, vp: string, text: TextSize, expected: { tier: string; outcome: string; lamp: boolean }, shotPrefix: string | null): Promise<void> {
  const before = await canonical(page);
  const screen = page.getByTestId('screen-resolution');
  await expect(screen).toHaveAttribute('data-card', 'result');
  await expect(screen).toHaveAttribute('data-tier', expected.tier);
  await expect(screen).toHaveAttribute('data-outcome', expected.outcome);
  const o = mission.outcomes.find((x) => x.id === expected.outcome)!;
  expect(o.tier).toBe(expected.tier);
  expect(basename(await page.getByTestId('resolution-plate').getAttribute('src'))).toBe(file(o.plate));
  expect(file(o.plate)).toContain(`resolution_${expected.tier.toLowerCase()}`);
  await expect(page.getByTestId('resolution-heading')).toHaveText(mission.resolution_presentation.heading);
  await expect(page.getByTestId('resolution-tier')).toHaveText(expected.tier);
  await expect(page.getByTestId('resolution-title')).toHaveText(o.title);
  await expect(page.getByTestId('resolution-line')).toHaveText(o.result_line);
  await expect(page.getByTestId('badge-alt-history')).toHaveCount(expected.lamp ? 1 : 0);
  // The tier is the hero face at the title scale: FAILURE's 240.594 design px, scaled with the frame.
  const tier = await page.getByTestId('resolution-tier').evaluate((el) => { const cs = getComputedStyle(el); return { size: parseFloat(cs.fontSize), family: cs.fontFamily, frame: el.closest('.pl-frame')!.getBoundingClientRect().width }; });
  expect(tier.family).toMatch(/Chakra Petch/);
  expect(Math.abs(tier.size - 240.594 * tier.frame / 1920)).toBeLessThan(1.5);
  await assertVisibleWithinViewport(page, 'resolution-next');
  if (shotPrefix) await shot(page, vp, text, `${shotPrefix}-result`);
  const people = await expectedDeltas(page);
  await expect(page.getByTestId('resolution-skip')).toHaveCount(people.length ? 1 : 0);
  await click(page, 'resolution-next');
  if (people.length) {
    await expect(screen).toHaveAttribute('data-card', 'relationships');
    await expect(page.getByTestId('resolution-heading')).toHaveText(mission.resolution_presentation.relationships_heading);
    const figures = page.locator('.res-person');
    await expect(figures).toHaveCount(people.length);
    expect(await figures.evaluateAll((els) => els.map((e) => e.getAttribute('data-testid')))).toEqual(people.map((p) => `res-person-${p.id}`));
    for (const p of people) {
      const fig = page.getByTestId(`res-person-${p.id}`);
      const c = characters.find((x) => x.id === p.id)!;
      const expression = p.delta > 0 ? 'neutral' : 'concerned';
      await expect(fig).toHaveAttribute('data-expression', expression);
      expect(basename(await fig.locator('img').getAttribute('src'))).toBe(file(c.portraits![expression]));
      await expect(fig.locator('.res-name')).toHaveText(c.name);
      await expect(fig.locator('.res-change')).toHaveText(p.delta > 0 ? mission.resolution_presentation.trust_up : mission.resolution_presentation.trust_down);
      await expect(fig).toBeInViewport();
    }
    for (const id of PEOPLE_ORDER) if (!people.some((p) => p.id === id)) await expect(page.getByTestId(`res-person-${id}`)).toHaveCount(0);
    await assertVisibleWithinViewport(page, 'resolution-next');
    if (shotPrefix) await shot(page, vp, text, `${shotPrefix}-relationships`);
    await click(page, 'resolution-next');
  }
  await expect(page.getByTestId('screen-debrief')).toBeVisible();
  // Revisiting from the debrief shows the same card and changes nothing; Skip returns to the debrief.
  await click(page, 'to-resolution');
  await expect(screen).toHaveAttribute('data-card', 'result');
  await expect(page.getByTestId('resolution-tier')).toHaveText(expected.tier);
  await click(page, people.length ? 'resolution-skip' : 'resolution-next');
  await expect(page.getByTestId('screen-debrief')).toBeVisible();
  const after = await canonical(page);
  expect(after).toEqual(before);
}

// ---------------------------------------------------------------------------
// Prologue
// ---------------------------------------------------------------------------

for (const vp of VIEWPORTS) for (const text of TEXT) {
  test(`prologue: five beats, the scenario card and the dissolve into the room: ${vp.name} ${text} text`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await fresh(page, true);
    await toMenu(page);
    await setText(page, text);
    await click(page, 'start-new');
    const screen = page.getByTestId('screen-prologue');
    const plates = mission.prologue.plates;
    for (let i = 0; i < plates.length; i++) {
      const plate = plates[i]!;
      await expect(screen).toHaveAttribute('data-plate', plate.id);
      await expect(screen).toHaveAttribute('data-index', String(i));
      await expect(page.getByTestId('plate-heading')).toHaveText(plate.title);
      await expect(page.getByTestId('plate-caption')).toHaveText(plate.caption);
      expect(basename(await page.getByTestId('prologue-plate').getAttribute('src'))).toBe(file(plate.background));
      await expect(page.locator('.pl-prev')).toHaveCount(0, { timeout: 3000 }); // the crossfade is over
      await expect(page.getByTestId('prologue-next')).toBeFocused();
      // The one moving layer: placed at its from composition in design pixels, moved once and linearly by (to − from) over its seconds, then held.
      const layer = page.getByTestId('prologue-layer');
      expect(basename(await layer.getAttribute('src'))).toBe(file(plate.moving_element.asset));
      const m = plate.moving_element;
      const motion = await layer.evaluate((el) => {
        const anim = el.getAnimations()[0]!;
        const frame = el.closest<HTMLElement>('.pl-frame')!;
        const f = frame.getBoundingClientRect();
        const scale = frame.clientWidth / 1920;
        const timing = anim.effect!.getTiming();
        const running = anim.playState;
        anim.currentTime = 0;
        const r0 = el.getBoundingClientRect();
        anim.finish();
        const r1 = el.getBoundingClientRect();
        return { duration: timing.duration, easing: timing.easing, fill: timing.fill, running, held: anim.playState, scale, dx: r1.left - r0.left, dy: r1.top - r0.top, left: (r0.left - f.left) / scale, top: (r0.top - f.top) / scale, width: r0.width / scale, height: r0.height / scale, opacity: parseFloat(getComputedStyle(el).opacity) };
      });
      expect(motion.duration).toBe(m.motion.seconds * 1000);
      expect(motion.easing).toBe('linear');
      expect(motion.fill).toBe('forwards');
      expect(['running', 'finished']).toContain(motion.running);
      expect(motion.held).toBe('finished');
      expect(motion.dx).toBeCloseTo((m.motion.to.x - m.motion.from.x) * motion.scale, 0);
      expect(motion.dy).toBeCloseTo((m.motion.to.y - m.motion.from.y) * motion.scale, 0);
      expect(motion.left).toBeCloseTo(m.placement.x + m.motion.from.x, 0);
      expect(motion.top).toBeCloseTo(m.placement.y + m.motion.from.y, 0);
      expect(motion.width).toBeCloseTo(m.placement.width, 0);
      expect(motion.height).toBeCloseTo(m.placement.height, 0);
      expect(motion.opacity).toBeCloseTo(m.placement.opacity, 2);
      await shot(page, vp.name, text, `3${i}-prologue-${plate.id.replace('g8-prologue-', '')}`);
      await click(page, 'prologue-next');
      await expect(screen).toHaveAttribute('data-index', String(i + 1));
    }
    // The scenario card: the facility, the date, the mission — scenario, and the return to preparation beneath.
    const card = mission.prologue.scenario_card;
    await expect(screen).toHaveAttribute('data-card', 'scenario');
    await expect(screen).toHaveAttribute('data-plate', card.id);
    await expect(page.getByTestId('scenario-facility')).toHaveText('Manned Spacecraft Center, Houston');
    await expect(page.getByTestId('scenario-date')).toHaveText(card.date);
    await expect(page.getByTestId('scenario-mission')).toHaveText(`${card.mission} — ${card.scenario}`);
    await expect(page.getByTestId('scenario-context')).toHaveText(card.context);
    expect(basename(await page.getByTestId('prologue-plate').getAttribute('src'))).toBe(file(card.background));
    await expect(page.getByTestId('prologue-skip')).toHaveCount(0);
    await expect(page.locator('.pl-prev')).toHaveCount(0, { timeout: 3000 });
    await expect(page.getByTestId('prologue-enter')).toBeFocused();
    await shot(page, vp.name, text, '35-scenario-card');
    // Continue dissolves the card into the room; the first console screen is beneath it at once, and every room check holds once it has cleared.
    await click(page, 'prologue-enter');
    await expect(page.getByTestId('screen-console')).toBeVisible();
    const dissolve = await page.getByTestId('room-dissolve').evaluate((el) => ({ pe: getComputedStyle(el).pointerEvents, hidden: el.getAttribute('aria-hidden'), src: el.querySelector('img')?.getAttribute('src') ?? '' })).catch(() => null);
    if (dissolve) { expect(dissolve.pe).toBe('none'); expect(dissolve.hidden).toBe('true'); expect(basename(dissolve.src)).toBe(file(card.background)); }
    await awaitRoom(page);
    expect(await node(page)).toBe('g8-brief');
    await assertRoomVisible(page);
    // History carries the facility note once the run exists; About lists the new sources.
    await click(page, 'open-history');
    await expect(page.getByTestId('history-note')).toContainText(mission.prologue.history_note);
    await expect(page.getByTestId('history-note')).toContainText('H10');
    await expect(page.getByTestId('overlay-history')).toContainText('50 Years Ago: The Manned Spacecraft Center Renamed');
    await expect(page.getByTestId('overlay-history')).toContainText('Gemini: Bridge to the Moon');
    if (vp.name === '1920x1080' && text === 'default') await shot(page, vp.name, text, '07b-history-note');
    await click(page, 'close-overlay');
  });
}

test('Skip Prologue reaches the scenario card; Continue there enters the console once under rapid clicks; Continue and Load resume a run without the prologue', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.clock.install();
  await fresh(page, true);
  await page.clock.pauseAt(Date.now() + 1000);
  await toMenu(page);
  await click(page, 'start-new');
  const screen = page.getByTestId('screen-prologue');
  await expect(screen).toHaveAttribute('data-index', '0');
  expect(await page.evaluate(() => window.__fno!.store.run!.identity.inputs.length)).toBe(0);
  await click(page, 'prologue-skip');
  await expect(screen).toHaveAttribute('data-card', 'scenario');
  await expect(screen).toHaveAttribute('data-index', '5');
  await expect(page.getByTestId('scenario-facility')).toHaveText('Manned Spacecraft Center, Houston');
  // Three presses in a row where Continue sits: the first enters the room, the others land on the guarded console and do nothing.
  const box = (await page.getByTestId('prologue-enter').boundingBox())!;
  const x = box.x + box.width / 2, y = box.y + box.height / 2;
  for (let i = 0; i < 3; i++) await page.mouse.click(x, y);
  await expect(page.getByTestId('screen-console')).toBeVisible();
  await expect(page.getByTestId('room-dissolve')).toHaveCount(1);
  expect(await page.evaluate(() => window.__fno!.guarded())).toBe(true);
  await page.keyboard.press('Enter'); // the focused console key is guarded too
  expect(await page.evaluate(() => window.__fno!.store.run!.identity.inputs.length)).toBe(0);
  expect(await node(page)).toBe('g8-brief');
  await page.clock.runFor(750);
  await expect(page.getByTestId('room-dissolve')).toHaveCount(0);
  expect(await page.evaluate(() => window.__fno!.guarded())).toBe(false);
  expect(await page.evaluate(() => window.__fno!.store.run!.identity.inputs.length)).toBe(0);
  await click(page, 'continue-g8-brief-continue');
  expect(await node(page)).toBe('g8-prep-select');
  expect(await page.evaluate(() => window.__fno!.store.run!.identity.inputs.length)).toBe(1);
  expect(await page.evaluate(() => JSON.stringify(window.__fno!.store.run!.log))).not.toMatch(/prologue|dissolve|scenario|guard/i);
  // A saved run resumes straight into the console: CONTINUE on the menu, and LOAD FROM THIS BROWSER.
  await click(page, 'open-saveload');
  await click(page, 'save-browser');
  await expect(page.getByTestId('save-message')).toHaveText('Saved to this browser.');
  await page.reload();
  await expect(page.getByTestId('screen-opening')).toHaveAttribute('data-stage', 'menu');
  await click(page, 'start-load');
  await expect(page.getByTestId('screen-console')).toBeVisible();
  await expect(page.getByTestId('screen-prologue')).toHaveCount(0);
  expect(await node(page)).toBe('g8-prep-select');
  await click(page, 'open-saveload');
  await click(page, 'load-browser');
  await expect(page.getByTestId('screen-console')).toBeVisible();
  await expect(page.getByTestId('screen-prologue')).toHaveCount(0);
  // The Save / Load panel's new campaign is a new campaign: the prologue runs again from the first plate.
  await click(page, 'open-saveload');
  await click(page, 'new-campaign');
  await expect(screen).toBeVisible();
  await expect(screen).toHaveAttribute('data-index', '0');
});

// ---------------------------------------------------------------------------
// Resolution cards
// ---------------------------------------------------------------------------

const EARLIER: { prep: Prep[]; tier: string; outcome: string }[] = [
  { prep: ['contact', 'recovery'], tier: 'SUCCESS', outcome: 'g8-out-earlier-2' },
  { prep: ['recovery'], tier: 'MIXED', outcome: 'g8-out-earlier-1' },
  { prep: [], tier: 'COSTLY', outcome: 'g8-out-earlier-0' },
];
const LATER: { prep: Prep[]; tier: string; outcome: string }[] = [
  { prep: ['contact', 'systems'], tier: 'SUCCESS', outcome: 'g8-out-later-2' },
  { prep: ['contact'], tier: 'MIXED', outcome: 'g8-out-later-1' },
  { prep: ['recovery'], tier: 'COSTLY', outcome: 'g8-out-later-0' },
];

for (const vp of VIEWPORTS) for (const text of TEXT) {
  test(`resolution cards, earlier route, ground accountability: SUCCESS, MIXED and COSTLY: ${vp.name} ${text} text`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    for (const c of EARLIER) {
      await start(page, text);
      await playRoute(page, { prep: c.prep, route: 'earlier', stance: 'ground' });
      await assertResolution(page, vp.name, text, { tier: c.tier, outcome: c.outcome, lamp: true }, `4${c.tier === 'SUCCESS' ? 0 : c.tier === 'MIXED' ? 1 : 2}-resolution-${c.tier.toLowerCase()}`);
    }
  });
}

test('resolution cards, later route, crew-blame stance: SUCCESS, MIXED and COSTLY with all six relationships changed', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  for (const c of LATER) {
    await start(page, 'default');
    await playRoute(page, { prep: c.prep, route: 'later', stance: 'blame' });
    const people = await expectedDeltas(page);
    expect(people.map((p) => p.id)).toEqual(c.tier === 'SUCCESS' ? ['g8-recovery', 'armstrong', 'scott', 'cunningham', 'stafford'] : ['g8-systems', 'g8-recovery', 'armstrong', 'scott', 'cunningham', 'stafford']);
    expect(people.filter((p) => p.id === 'armstrong' || p.id === 'scott').map((p) => p.delta)).toEqual([-2, -2]);
    await assertResolution(page, '1920x1080', 'default', { tier: c.tier, outcome: c.outcome, lamp: false }, `43-resolution-later-${c.tier.toLowerCase()}`);
  }
});

// ---------------------------------------------------------------------------
// Hints
// ---------------------------------------------------------------------------

for (const vp of VIEWPORTS) for (const text of TEXT) {
  test(`hint strip after 30 s on a decision, cleared by input, absent under HINTS: HIDE: ${vp.name} ${text} text`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.clock.install();
    await start(page, text, true);
    for (const id of ['continue-g8-brief-continue', 'continue-g8-prep-finish', 'continue-g8-docking-report-continue', 'continue-g8-loss-of-contact-continue', 'continue-g8-gap-note-continue', 'continue-g8-crisis-report-continue', 'continue-g8-stabilization-report-continue']) await click(page, id);
    expect(await node(page)).toBe('g8-rule-decision');
    const hint = mission.phases.flatMap((p) => p.nodes).find((n) => n.id === 'g8-rule-decision')!.hint!;
    await page.clock.runFor(29_000);
    await expect(page.getByTestId('hint-strip')).toHaveCount(0);
    await page.clock.runFor(1_100);
    await expect(page.getByTestId('hint-strip')).toHaveText(hint);
    await expect(page.locator('.idle-hint')).toHaveCount(0); // a decision highlights no key
    expect(hint).not.toMatch(/order the return|hold/i);
    await shot(page, vp.name, text, '23-hint-strip');
    await page.keyboard.press('Shift');
    await page.clock.runFor(50);
    await expect(page.getByTestId('hint-strip')).toHaveCount(0);
    expect(await page.evaluate(() => JSON.stringify(window.__fno!.store.run!.log))).not.toMatch(/hint|idle/i);
    await click(page, 'open-settings');
    await click(page, 'hints-toggle');
    await expect(page.getByTestId('hints-toggle')).toHaveText('HINTS: HIDE');
    await click(page, 'close-overlay');
    await page.clock.runFor(31_000);
    await expect(page.getByTestId('hint-strip')).toHaveCount(0);
    expect(await node(page)).toBe('g8-rule-decision');
  });
}

// ---------------------------------------------------------------------------
// Replay identity across every presentation stage
// ---------------------------------------------------------------------------

test('the replay is byte-identical whether every presentation stage is viewed or skipped', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  const route: RouteSpec = { prep: ['contact', 'recovery'], route: 'earlier', stance: 'blame' };
  const finish = async (): Promise<void> => {
    await click(page, 'to-planning');
    await click(page, 'select-g9-plan-recovery-contact');
    await click(page, 'confirm-plan');
    await expect(page.getByTestId('committed-text')).toContainText('Preparation plan committed.');
  };
  // A: every plate, both cards, the cards again from the debrief, then the plan.
  await fresh(page, true);
  await toMenu(page);
  await click(page, 'start-new');
  for (let i = 0; i < 5; i++) { await expect(page.getByTestId('screen-prologue')).toHaveAttribute('data-index', String(i)); await click(page, 'prologue-next'); }
  await expect(page.getByTestId('screen-prologue')).toHaveAttribute('data-card', 'scenario');
  await click(page, 'prologue-enter');
  await awaitRoom(page);
  await playRoute(page, route);
  await click(page, 'resolution-next');
  await expect(page.getByTestId('screen-resolution')).toHaveAttribute('data-card', 'relationships');
  await click(page, 'resolution-next');
  await expect(page.getByTestId('screen-debrief')).toBeVisible();
  await click(page, 'to-resolution');
  await click(page, 'resolution-skip');
  await expect(page.getByTestId('screen-debrief')).toBeVisible();
  await finish();
  const a = await canonical(page);
  // B: everything skipped.
  await fresh(page, true);
  await toMenu(page);
  await click(page, 'start-new');
  await skipPrologue(page);
  await playRoute(page, route);
  await click(page, 'resolution-skip');
  await expect(page.getByTestId('screen-debrief')).toBeVisible();
  await finish();
  const b = await canonical(page);
  expect(a.log).toBe(b.log);
  expect(a.state).toBe(b.state);
  // No presentation vocabulary in the log (the engine's own `resolution` entries are event resolutions, not the cards).
  expect(a.log).not.toMatch(/prologue|hint|idle|dissolve|portrait|scenario|crossfade|screen:|\btier\b|trust_up|trust_down/i);
});
