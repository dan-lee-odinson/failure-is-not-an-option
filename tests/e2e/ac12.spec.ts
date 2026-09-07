/**
 * AC-12 — Presentation and access, plus the M00b screenshot set (handoff §7.1):
 * the opening (each chapter), the hero title, the menu with CONTINUE disabled
 * and enabled, prep cards at rest / chosen / unavailable, loss of contact,
 * crisis, the return decision (Details open, both lamp states), an execution
 * beat, the post-flight decision, the debrief with "Departures from the
 * record", IX-A planning, About/Credits — at 1920×1080 and 1366×768, default
 * and enlarged text. Every room shot re-runs the Glen clear-zone, contrast and
 * manifest checks; every kit control's contrast is recorded to
 * artifacts/contrast.json. Drives the real UI by clicking; nothing here
 * reaches into the engine.
 */
import { expect, test, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertGlenUncovered, assertKitContrast, assertManifestImagesOnly, assertRoomVisible, assertTextContrast, kitFaceTable, TEXT_SAMPLES, type ContrastResult, type KitContrast } from './room';

const HERE = fileURLToPath(new URL('.', import.meta.url));
// Outside Playwright's outputDir, which is cleaned on every run.
const ARTIFACTS = resolve(HERE, '..', '..', 'artifacts');
const SHOTS = resolve(ARTIFACTS, 'screenshots');
const VIEWPORTS = [{ name: '1920x1080', width: 1920, height: 1080 }, { name: '1366x768', width: 1366, height: 768 }];
const TEXT = ['default', 'large'] as const;
type TextSize = (typeof TEXT)[number];

const contrastLog: Record<string, { text: ContrastResult[]; kit: KitContrast[] }> = {};
function flushContrast(): void {
  mkdirSync(ARTIFACTS, { recursive: true });
  writeFileSync(resolve(ARTIFACTS, 'contrast.json'), JSON.stringify(contrastLog, null, 1));
}

async function click(page: Page, testId: string): Promise<void> {
  await page.getByTestId(testId).click();
}

async function node(page: Page): Promise<string> {
  return (await page.getByTestId('screen-console').getAttribute('data-node')) ?? '';
}

async function stage(page: Page): Promise<string> {
  return (await page.getByTestId('screen-opening').getAttribute('data-stage')) ?? '';
}

async function assertNoHorizontalOverflow(page: Page): Promise<void> {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  expect(overflow, 'page must not scroll horizontally').toBe(false);
}

async function assertVisibleWithinViewport(page: Page, testId: string): Promise<void> {
  const el = page.getByTestId(testId);
  await expect(el).toBeVisible();
  const box = await el.boundingBox();
  const vw = page.viewportSize()!.width;
  expect(box, testId).not.toBeNull();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(vw + 1);
}

function shotPath(vp: string, text: string, name: string): string {
  const dir = resolve(SHOTS, `${vp}-${text}`);
  mkdirSync(dir, { recursive: true });
  return resolve(dir, `${name}.png`);
}

/** Screenshot plus, wherever the room is on screen, the M00a/M00b room checks; kit contrast is checked on every screen. */
async function shot(page: Page, vp: string, text: string, name: string): Promise<void> {
  const key = `${vp}-${text}/${name}`;
  if (await page.getByTestId('plate').count()) {
    contrastLog[key] = await assertRoomVisible(page);
  } else {
    const kit = await assertKitContrast(page);
    const measured = await assertTextContrast(page, TEXT_SAMPLES).catch(() => [] as ContrastResult[]);
    contrastLog[key] = { text: measured, kit };
  }
  await assertNoHorizontalOverflow(page);
  await page.screenshot({ path: shotPath(vp, text, name), fullPage: false });
  flushContrast();
}

/** A fresh browser: cleared storage; `seen` marks the opening as already viewed so the app opens on the menu. */
async function fresh(page: Page, seen: boolean): Promise<void> {
  await page.goto('/');
  await page.evaluate((s) => { try { localStorage.clear(); if (s) localStorage.setItem('fno.openingSeen', '1'); } catch { /* ignore */ } }, seen);
  await page.reload();
  await expect(page.getByTestId('screen-opening')).toBeVisible();
}

async function toMenu(page: Page): Promise<void> {
  if ((await stage(page)) !== 'menu') await click(page, 'skip-to-menu');
  await expect(page.getByTestId('menu')).toBeVisible();
}

async function setText(page: Page, text: TextSize): Promise<void> {
  const current = await page.getByTestId('text-size').textContent();
  if (text === 'large' && !/ENLARGED/.test(current ?? '')) await click(page, 'text-size');
  if (text === 'default' && /ENLARGED/.test(current ?? '')) await click(page, 'text-size');
}

/** Menu → new campaign at the requested text size. */
async function start(page: Page, text: TextSize): Promise<void> {
  await fresh(page, true);
  await toMenu(page);
  await setText(page, text);
  await click(page, 'start-new');
  await expect(page.getByTestId('screen-console')).toBeVisible();
}

// ---------------------------------------------------------------------------
// Opening, menu, About
// ---------------------------------------------------------------------------

for (const vp of VIEWPORTS) for (const text of TEXT) {
  test(`opening, menu and About screenshots: ${vp.name} ${text} text`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await fresh(page, false);
    expect(await stage(page)).toBe('start');
    // Text size is a per-player setting; set it once on the menu, then replay the opening at that size.
    if (text === 'large') {
      await click(page, 'skip-to-menu');
      await setText(page, 'large');
      await click(page, 'menu-about');
      await click(page, 'replay-opening');
      expect(await stage(page)).toBe('start');
    }
    await shot(page, vp.name, text, '00-opening-start');
    await expect(page.getByTestId('begin')).toBeVisible();
    await expect(page.getByTestId('skip-to-menu')).toBeVisible();
    await expect(page.getByTestId('sound-toggle')).toHaveAttribute('aria-pressed', 'false');

    await click(page, 'begin');
    expect(await stage(page)).toBe('dedication');
    await click(page, 'scroll-toggle'); // pause so the shot is repeatable
    await expect(page.getByTestId('scroll-toggle')).toHaveText('RESUME');
    const prose = page.getByTestId('op-prose');
    await expect(prose).toBeVisible();
    const fontSize = await prose.locator('p').first().evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
    expect(fontSize).toBeGreaterThanOrEqual(20);
    await prose.locator('p').first().evaluate((el) => el.scrollIntoView({ block: 'center' }));
    await shot(page, vp.name, text, '01-opening-dedication');
    // Manual scrolling while paused reaches every word: the last paragraph can be brought fully into the scroll box.
    await prose.locator('p').last().evaluate((el) => el.scrollIntoView({ block: 'center' }));
    const lastVisible = await prose.locator('p').last().evaluate((el) => { const r = el.getBoundingClientRect(); const box = el.closest('#op-scroll')!.getBoundingClientRect(); return r.top >= box.top && r.bottom <= box.bottom; });
    expect(lastVisible).toBe(true);
    await page.getByTestId('op-scroll').evaluate((el) => { el.scrollTop = 0; });

    await click(page, 'stage-next');
    expect(await stage(page)).toBe('notices');
    await click(page, 'scroll-toggle');
    await prose.locator('p').first().evaluate((el) => el.scrollIntoView({ block: 'start' }));
    await shot(page, vp.name, text, '02-opening-notices');

    await click(page, 'stage-next');
    expect(await stage(page)).toBe('title');
    await expect(page.getByTestId('hero-title')).toBeVisible();
    const continueSize = await page.getByTestId('hero-continue').evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
    expect(continueSize).toBeGreaterThanOrEqual(18);
    await assertGlenUncovered(page);
    await shot(page, vp.name, text, '03-hero-title');

    await click(page, 'hero-continue');
    expect(await stage(page)).toBe('menu');
    await expect(page.getByTestId('start-load')).toBeDisabled();
    await expect(page.getByTestId('continue-reason')).toBeVisible();
    for (const id of ['start-new', 'start-load', 'menu-load', 'menu-about']) await assertVisibleWithinViewport(page, id);
    await shot(page, vp.name, text, '04-menu-continue-disabled');

    await click(page, 'menu-about');
    await expect(page.getByTestId('overlay-about')).toBeVisible();
    await expect(page.getByTestId('replay-opening')).toBeVisible();
    await expect(page.getByTestId('soundscape-credits')).toContainText('Beep 8 count (loopable) by JonNicholas, freesound.org, CC BY 3.0');
    await expect(page.getByTestId('ost-list')).toContainText('Orbit of Hope');
    await shot(page, vp.name, text, '05-about-credits');
    await click(page, 'close-overlay');

    // A valid save enables CONTINUE on the next launch.
    await click(page, 'start-new');
    await expect(page.getByTestId('screen-console')).toBeVisible();
    await click(page, 'continue-g8-brief-continue');
    await click(page, 'open-saveload');
    await click(page, 'save-browser');
    await expect(page.getByTestId('save-message')).toHaveText('Saved to this browser.');
    await page.reload();
    await expect(page.getByTestId('screen-opening')).toHaveAttribute('data-stage', 'menu');
    await expect(page.getByTestId('start-load')).toBeEnabled();
    await expect(page.getByTestId('continue-reason')).toHaveCount(0);
    await shot(page, vp.name, text, '06-menu-continue-enabled');
    await click(page, 'start-load');
    await expect(page.getByTestId('screen-console')).toBeVisible();
    expect(await node(page)).toBe('g8-prep-select');
  });
}

// ---------------------------------------------------------------------------
// Console screenshots, earlier route (alternate history from execution on)
// ---------------------------------------------------------------------------

for (const vp of VIEWPORTS) for (const text of TEXT) {
  test(`console screenshots and layout, earlier route: ${vp.name} ${text} text`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await start(page, text);
    const v = vp.name;
    // Preparation: rest, chosen, unavailable.
    expect(await node(page)).toBe('g8-brief');
    await click(page, 'continue-g8-brief-continue');
    expect(await node(page)).toBe('g8-prep-select');
    await expect(page.getByTestId('badge-historical-choice')).toHaveCount(0);
    await shot(page, v, text, '10-prep-rest');
    await click(page, 'option-g8-prep-recovery');
    await expect(page.getByTestId('stamp-g8-prep-recovery')).toHaveText('CHOSEN');
    await expect(page.getByTestId('option-g8-prep-recovery')).toHaveCount(0);
    // Focus moved to the next valid continuation, not to the removed key.
    expect(await page.evaluate(() => document.activeElement?.getAttribute('data-testid'))).toBe('continue-g8-prep-finish');
    await shot(page, v, text, '11-prep-chosen');
    await click(page, 'option-g8-prep-contact');
    await expect(page.getByTestId('card-g8-prep-systems')).toHaveAttribute('data-state', 'unavailable');
    await expect(page.getByTestId('reason-g8-prep-systems')).toHaveText('No preparation opportunities remaining.');
    await expect(page.getByTestId('option-g8-prep-systems')).toHaveCount(0);
    await shot(page, v, text, '12-prep-unavailable');
    await click(page, 'continue-g8-prep-finish');
    // Docking
    expect(await node(page)).toBe('g8-docking-report');
    await expect(page.getByTestId('display-time')).toHaveText('MET approximately 06:33');
    await click(page, 'continue-g8-docking-report-continue');
    // Gap
    expect(await node(page)).toBe('g8-loss-of-contact');
    await expect(page.getByTestId('contact')).toHaveText('CONTACT: NONE');
    await shot(page, v, text, '13-loss-of-contact');
    await click(page, 'continue-g8-loss-of-contact-continue');
    await expect(page.getByTestId('evidence-g8-ev-docked')).toHaveAttribute('data-badge', 'PREVIOUS CONTACT');
    await click(page, 'question-g8-q-gap');
    await expect(page.getByTestId('conversation')).toContainText("We'll have to wait for contact");
    await expect(page.getByTestId('badge-alt-history')).toHaveCount(0);
    await click(page, 'continue-g8-gap-note-continue');
    // Crisis
    expect(await node(page)).toBe('g8-crisis-report');
    await expect(page.getByTestId('evidence-g8-ev-crisis')).toBeVisible();
    await shot(page, v, text, '14-crisis-report');
    await click(page, 'continue-g8-crisis-report-continue');
    await click(page, 'continue-g8-stabilization-report-continue');
    expect(await node(page)).toBe('g8-rule-decision');
    await expect(page.getByTestId('badge-historical-choice')).toBeVisible();
    // Details closed by default away from the return fork.
    expect(await page.getByTestId('card-g8-order-return').locator('details').evaluate((d) => (d as HTMLDetailsElement).open)).toBe(false);
    await click(page, 'option-g8-order-return');
    // Return decision: HISTORICAL CHOICE lamp, Details open, no chips, pinning in the Evidence panel only.
    expect(await node(page)).toBe('g8-return-brief');
    await expect(page.getByTestId('badge-historical-choice')).toBeVisible();
    await expect(page.getByTestId('badge-alt-history')).toHaveCount(0);
    await expect(page.getByTestId('active-portrait')).toBeVisible();
    const activeH = (await page.getByTestId('active-portrait').locator('img').boundingBox())!.height;
    const thumbH = (await page.locator('[data-testid="conversation"] .line img.portrait').first().boundingBox())!.height;
    expect(activeH).toBeGreaterThan(thumbH * 1.5);
    if (v === '1920x1080') { expect(activeH).toBeGreaterThanOrEqual(200); expect(activeH).toBeLessThanOrEqual(260); }
    await expect(page.getByTestId('readout')).toBeVisible();
    for (const id of ['option-g8-return-earlier', 'option-g8-return-later', 'card-g8-return-earlier', 'card-g8-return-later']) await assertVisibleWithinViewport(page, id);
    for (const id of ['g8-return-earlier', 'g8-return-later']) {
      expect(await page.getByTestId(`card-${id}`).locator('details').evaluate((d) => (d as HTMLDetailsElement).open)).toBe(true);
      await expect(page.getByTestId(`card-${id}`)).toContainText('Risk');
      await expect(page.getByTestId(`card-${id}`)).toContainText('Attraction');
    }
    expect(await page.locator('[data-testid="strip"] [data-action^="pin:"]').count()).toBe(0);
    expect(await page.locator('[data-testid="conversation"] [data-action^="pin:"]').count()).toBe(0);
    // The once-only pin hint appears on first hover, dismisses, and stays dismissed.
    await page.getByTestId('pin-g8-ev-reserve').hover();
    await expect(page.getByTestId('pin-hint')).toBeVisible();
    await click(page, 'pin-hint-dismiss');
    await expect(page.getByTestId('pin-hint')).toHaveCount(0);
    await page.getByTestId('pin-g8-ev-reserve').hover();
    await expect(page.getByTestId('pin-hint')).toHaveCount(0);
    // Pinning is UI-only: pin a report, verify the node does not change.
    await click(page, 'pin-g8-ev-reserve');
    await expect(page.getByTestId('pin-g8-ev-reserve')).toHaveAttribute('aria-pressed', 'true');
    expect(await node(page)).toBe('g8-return-brief');
    await shot(page, v, text, '15-return-decision');
    await click(page, 'option-g8-return-earlier');
    // Receipt: the committed cards stay on screen, stamped ORDERED and greyed; focus on Execute.
    expect(await node(page)).toBe('g8-order-receipt');
    await expect(page.getByTestId('committed-cards')).toBeVisible();
    await expect(page.getByTestId('stamp-g8-return-earlier')).toHaveText('ORDERED');
    await expect(page.getByTestId('card-g8-return-later')).toHaveAttribute('data-state', 'closed');
    expect(await page.locator('[data-action^="option:"]').count()).toBe(0);
    await expect(page.getByTestId('badge-alt-history')).toHaveCount(0);
    await expect(page.getByTestId('badge-historical-choice')).toHaveCount(0);
    expect(await page.evaluate(() => document.activeElement?.getAttribute('data-testid'))).toBe('continue-g8-execute-return');
    await shot(page, v, text, '16-order-receipt');
    await click(page, 'continue-g8-execute-return');
    // Execution: ALTERNATE HISTORY from here on the earlier route.
    expect(await node(page)).toBe('g8-ground-execution');
    await expect(page.getByTestId('badge-alt-history')).toBeVisible();
    await expect(page.getByTestId('applied')).toBeVisible();
    await shot(page, v, text, '17-execution-alternate');
    await click(page, 'continue-g8-ground-execution-continue');
    expect(await node(page)).toBe('g8-return-beat-1');
    await expect(page.getByTestId('status-panel')).toBeVisible();
    await shot(page, v, text, '18-return-beat-1');
    await click(page, 'continue-g8-return-beat-1-continue');
    await expect(page.getByTestId('event-text')).toBeVisible();
    await click(page, 'continue-g8-return-beat-2-continue');
    await click(page, 'continue-g8-pickup-report-continue');
    expect(await node(page)).toBe('g8-relationship-response');
    await expect(page.getByTestId('applied')).toContainText('trust');
    await click(page, 'continue-g8-relationship-response-continue');
    await click(page, 'option-g8-adopt-provenance');
    // Post-flight: the earlier route keeps ALTERNATE HISTORY over the historical stance.
    expect(await node(page)).toBe('g8-accountability-brief');
    await expect(page.getByTestId('evidence-g8-ev-postflight-context')).toBeVisible();
    await click(page, 'continue-g8-accountability-brief-continue');
    expect(await node(page)).toBe('g8-accountability-decision');
    await expect(page.getByTestId('badge-alt-history')).toBeVisible();
    await expect(page.getByTestId('badge-historical-choice')).toHaveCount(0);
    await shot(page, v, text, '19-postflight-decision');
    await click(page, 'option-g8-own-ground-contingencies');
    await expect(page.getByTestId('stamp-g8-own-ground-contingencies')).toHaveText('CHOSEN');
    await expect(page.getByTestId('narration')).toContainText('Response pending.');
    await click(page, 'continue-g8-resolve-accountability');
    await expect(page.getByTestId('event-text')).toBeVisible();
    await click(page, 'continue-g8-finish');
    // Debrief
    await expect(page.getByTestId('screen-debrief')).toBeVisible();
    await expect(page.getByTestId('outcome-title')).toContainText('Crew recovered');
    await expect(page.getByTestId('badge-alt-history')).toBeVisible();
    await expect(page.getByTestId('departures-from-record')).toBeVisible();
    await expect(page.getByTestId('departures-from-record')).toContainText('Return timing');
    await expect(page.getByTestId('postflight-panel')).toContainText('cleared Armstrong and Scott');
    await expect(page.getByTestId('event-record-toggle')).toHaveCount(0);
    expect(await page.locator('[data-testid="screen-debrief"] .notes').evaluateAll((els) => els.map((e) => e.textContent ?? '').join(' '))).not.toMatch(/g[89]-/);
    await shot(page, v, text, '20-debrief-departures');
    await click(page, 'to-planning');
    // Planning
    await expect(page.getByTestId('screen-planning')).toBeVisible();
    await expect(page.getByTestId('badge-alt-history')).toBeVisible();
    await expect(page.getByTestId('plan-g9-plan-systems-contact')).toHaveAttribute('data-enabled', 'false');
    await expect(page.getByTestId('select-g9-plan-systems-contact')).toBeDisabled();
    await expect(page.getByTestId('plan-reason-g9-plan-systems-contact')).toContainText('This mission must include');
    expect(await page.getByTestId('select-g9-plan-systems-contact').getAttribute('aria-describedby')).toBe('plan-reason-g9-plan-systems-contact');
    await expect(page.getByTestId('confirm-plan')).toBeDisabled();
    await click(page, 'select-g9-plan-recovery-contact');
    await expect(page.getByTestId('confirm-plan')).toBeEnabled();
    await shot(page, v, text, '21-gemini-9a-planning');
    await click(page, 'confirm-plan');
    await expect(page.getByTestId('committed-text')).toContainText('Preparation plan committed.');
    await expect(page.getByTestId('stamp-g9-plan-recovery-contact')).toHaveText('CHOSEN');
    await expect(page.getByTestId('plan-g9-plan-recovery-systems')).toHaveAttribute('data-state', 'closed');
    await expect(page.getByTestId('confirm-plan')).toBeDisabled();
    await assertNoHorizontalOverflow(page);
  });
}

// ---------------------------------------------------------------------------
// Later route: the historical timing keeps HISTORICAL CHOICE and never lights ALTERNATE HISTORY
// ---------------------------------------------------------------------------

for (const vp of VIEWPORTS) {
  test(`marker precedence on the later route: ${vp.name}`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await start(page, 'default');
    await click(page, 'continue-g8-brief-continue');
    await click(page, 'option-g8-prep-systems');
    await click(page, 'option-g8-prep-contact');
    await click(page, 'continue-g8-prep-finish');
    await click(page, 'continue-g8-docking-report-continue');
    await click(page, 'continue-g8-loss-of-contact-continue');
    await click(page, 'continue-g8-gap-note-continue');
    await click(page, 'continue-g8-crisis-report-continue');
    await click(page, 'continue-g8-stabilization-report-continue');
    await expect(page.getByTestId('badge-historical-choice')).toBeVisible();
    await click(page, 'option-g8-order-return');
    await expect(page.getByTestId('badge-historical-choice')).toBeVisible();
    await click(page, 'option-g8-return-later');
    expect(await node(page)).toBe('g8-order-receipt');
    await expect(page.getByTestId('stamp-g8-return-later')).toHaveText('ORDERED');
    await expect(page.getByTestId('badge-alt-history')).toHaveCount(0);
    await expect(page.getByTestId('badge-historical-choice')).toHaveCount(0);
    await click(page, 'continue-g8-execute-return');
    expect(await node(page)).toBe('g8-ground-execution');
    await expect(page.getByTestId('badge-alt-history')).toHaveCount(0);
    await shot(page, vp.name, 'default', '17b-execution-historical-timing');
    await click(page, 'continue-g8-ground-execution-continue');
    await click(page, 'continue-g8-return-beat-1-continue');
    await click(page, 'continue-g8-return-beat-2-continue');
    await click(page, 'continue-g8-pickup-report-continue');
    await click(page, 'continue-g8-relationship-response-continue');
    await click(page, 'option-g8-adopt-recovery');
    await click(page, 'continue-g8-accountability-brief-continue');
    expect(await node(page)).toBe('g8-accountability-decision');
    await expect(page.getByTestId('badge-historical-choice')).toBeVisible();
    await expect(page.getByTestId('badge-alt-history')).toHaveCount(0);
    await shot(page, vp.name, 'default', '19b-postflight-historical-choice');
    await click(page, 'option-g8-back-crew-criticism');
    await click(page, 'continue-g8-resolve-accountability');
    await click(page, 'continue-g8-finish');
    await expect(page.getByTestId('screen-debrief')).toBeVisible();
    await expect(page.getByTestId('badge-alt-history')).toHaveCount(0);
    await expect(page.getByTestId('departures-from-record')).toContainText('as history did');
    await click(page, 'to-planning');
    await expect(page.getByTestId('badge-alt-history')).toHaveCount(0);
  });
}

// ---------------------------------------------------------------------------
// Access, motion, launches, audio, saves
// ---------------------------------------------------------------------------

test('keyboard reaches every stage of the opening, the menu, every card and lamp; focus never lands on a removed key', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await fresh(page, false);
  await page.keyboard.press('Tab');
  await expect(page.getByTestId('begin')).toBeFocused();
  await page.keyboard.press('Enter');
  expect(await stage(page)).toBe('dedication');
  await expect(page.getByTestId('stage-next')).toBeFocused();
  await page.keyboard.press('Enter');
  expect(await stage(page)).toBe('notices');
  await page.keyboard.press('Enter');
  expect(await stage(page)).toBe('title');
  await expect(page.getByTestId('hero-continue')).toBeFocused();
  await page.keyboard.press('Enter');
  expect(await stage(page)).toBe('menu');
  await expect(page.getByTestId('start-new')).toBeFocused();
  // Tab order on the menu skips the disabled CONTINUE and reaches LOAD and ABOUT.
  await page.keyboard.press('Tab');
  await expect(page.getByTestId('menu-load')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByTestId('menu-about')).toBeFocused();
  await page.getByTestId('start-new').focus();
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('screen-console')).toBeVisible();
  // Tab from the top reaches the Continue key and reveals focus.
  let reached = false;
  for (let i = 0; i < 40; i++) {
    await page.keyboard.press('Tab');
    const id = await page.evaluate(() => document.activeElement?.getAttribute('data-testid') ?? '');
    if (id === 'continue-g8-brief-continue') { reached = true; break; }
  }
  expect(reached).toBe(true);
  expect(await page.evaluate(() => document.activeElement?.matches(':focus-visible') ?? false)).toBe(true);
  expect(await page.evaluate(() => getComputedStyle(document.activeElement as Element).outlineStyle)).not.toBe('none');
  await page.keyboard.press('Enter');
  expect(await node(page)).toBe('g8-prep-select');
  // Open an overlay from the keyboard, close with Escape, focus returns to the opener.
  await page.getByTestId('open-history').focus();
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('overlay-history')).toBeVisible();
  await expect(page.getByTestId('alt-history-explanation')).toContainText('H6');
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('overlay-history')).toHaveCount(0);
  await expect(page.getByTestId('open-history')).toBeFocused();
  // A card's Choose key from the keyboard: the key goes away and focus moves to the next continuation.
  await page.getByTestId('option-g8-prep-contact').focus();
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('option-g8-prep-contact')).toHaveCount(0);
  await expect(page.getByTestId('continue-g8-prep-finish')).toBeFocused();
  // Details disclosure and the pin glyph are keyboard-reachable.
  await page.getByTestId('details-g8-prep-recovery').focus();
  await page.keyboard.press('Enter');
  expect(await page.getByTestId('card-g8-prep-recovery').locator('details').evaluate((d) => (d as HTMLDetailsElement).open)).toBe(true);
  await page.getByTestId('pin-g8-ev-contact-worksheet').focus();
  await expect(page.getByTestId('pin-hint')).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('pin-g8-ev-contact-worksheet')).toHaveAttribute('aria-pressed', 'true');
  // The lamp is a button that opens History.
  await click(page, 'continue-g8-prep-finish');
  await click(page, 'continue-g8-docking-report-continue');
  await click(page, 'continue-g8-loss-of-contact-continue');
  await click(page, 'continue-g8-gap-note-continue');
  await click(page, 'continue-g8-crisis-report-continue');
  await click(page, 'continue-g8-stabilization-report-continue');
  // Keyboard focus (Shift+Tab from the first key after the lamp) shows the focus outline on the lamp.
  await page.getByTestId('open-binder').focus();
  await page.keyboard.press('Shift+Tab');
  await expect(page.getByTestId('badge-historical-choice')).toBeFocused();
  expect(await page.evaluate(() => getComputedStyle(document.activeElement as Element).outlineStyle)).not.toBe('none');
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('overlay-history')).toBeVisible();
  await expect(page.getByTestId('lamp-explanation')).toContainText('HISTORICAL CHOICE');
});

test('reduced motion: static chapters with Continue, immediate cuts, no animations', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await fresh(page, false);
  await click(page, 'begin');
  expect(await stage(page)).toBe('dedication');
  await expect(page.getByTestId('op-scroll')).toHaveClass(/static/);
  await expect(page.getByTestId('scroll-toggle')).toHaveCount(0);
  const top = await page.getByTestId('op-scroll').evaluate((el) => el.scrollTop);
  await page.waitForTimeout(1500);
  expect(await page.getByTestId('op-scroll').evaluate((el) => el.scrollTop)).toBe(top);
  await click(page, 'stage-next');
  expect(await stage(page)).toBe('notices');
  await expect(page.getByTestId('op-scroll')).toHaveClass(/static/);
  await click(page, 'stage-next');
  expect(await stage(page)).toBe('title');
  await click(page, 'hero-continue');
  expect(await stage(page)).toBe('menu');
  expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
  await click(page, 'start-new');
  await expect(page.getByTestId('screen-console')).toBeVisible();
  expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
});

test('a second launch goes straight to the menu; Replay opening starts it again', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await fresh(page, false);
  expect(await stage(page)).toBe('start');
  await click(page, 'skip-to-menu');
  expect(await stage(page)).toBe('menu');
  await page.reload();
  await expect(page.getByTestId('screen-opening')).toHaveAttribute('data-stage', 'menu');
  await click(page, 'menu-about');
  await click(page, 'replay-opening');
  expect(await stage(page)).toBe('start');
  await click(page, 'begin');
  expect(await stage(page)).toBe('dedication');
  await click(page, 'skip-to-menu');
  expect(await stage(page)).toBe('menu');
});

test('the opening scroll runs on its own, pauses, resumes, and advances when the text has cleared', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await fresh(page, false);
  await click(page, 'begin');
  const box = page.getByTestId('op-scroll');
  const t0 = await box.evaluate((el) => el.scrollTop);
  await page.waitForTimeout(1200);
  const t1 = await box.evaluate((el) => el.scrollTop);
  expect(t1).toBeGreaterThan(t0);
  await click(page, 'scroll-toggle');
  const p0 = await box.evaluate((el) => el.scrollTop);
  await page.waitForTimeout(800);
  expect(await box.evaluate((el) => el.scrollTop)).toBe(p0);
  await click(page, 'scroll-toggle');
  await page.waitForTimeout(800);
  expect(await box.evaluate((el) => el.scrollTop)).toBeGreaterThan(p0);
  // Jump near the end: the chapter clears and the next one follows on its own.
  await box.evaluate((el) => { el.scrollTop = el.scrollHeight; });
  await expect(page.getByTestId('screen-opening')).toHaveAttribute('data-stage', 'notices', { timeout: 5000 });
});

test('audio is off by default, starts only on a player interaction, and never enters the log', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await fresh(page, false);
  const audio = () => page.evaluate(() => ({ enabled: window.__fno!.audio.enabled(), unlocked: window.__fno!.audio.unlocked() }));
  expect(await audio()).toEqual({ enabled: false, unlocked: false });
  expect(await page.locator('audio, video').count()).toBe(0);
  await click(page, 'begin');
  expect(await audio()).toEqual({ enabled: false, unlocked: true }); // a context exists after Begin, the master is still off
  await click(page, 'skip-to-menu');
  await click(page, 'start-new');
  await click(page, 'continue-g8-brief-continue');
  await click(page, 'option-g8-prep-recovery');
  const before = await page.evaluate(() => JSON.stringify(window.__fno!.store.run!.log));
  await click(page, 'open-settings');
  await click(page, 'sound-toggle');
  await expect(page.getByTestId('sound-toggle')).toHaveAttribute('aria-pressed', 'true');
  expect((await audio()).enabled).toBe(true);
  await page.getByTestId('volume-master').fill('40');
  await click(page, 'close-overlay');
  await click(page, 'continue-g8-prep-finish');
  await click(page, 'continue-g8-docking-report-continue');
  await click(page, 'continue-g8-loss-of-contact-continue');
  await click(page, 'continue-g8-gap-note-continue');
  expect(await node(page)).toBe('g8-crisis-report'); // the crisis cue and alert fire here, presentation only
  const after = await page.evaluate(() => JSON.stringify(window.__fno!.store.run!.log));
  expect(after.startsWith(before.slice(0, -1))).toBe(true);
  expect(after).not.toMatch(/audio|music|sound|cue|volume/i);
  expect(await page.locator('audio, video').count()).toBe(0);
  const prefs = await page.evaluate(() => JSON.parse(localStorage.getItem('fno.audio') ?? '{}') as { enabled: boolean; master: number });
  expect(prefs.enabled).toBe(true);
  expect(prefs.master).toBe(0.4);
  await page.reload();
  await expect(page.getByTestId('screen-opening')).toHaveAttribute('data-stage', 'menu');
  await expect(page.getByTestId('sound-toggle')).toHaveAttribute('aria-pressed', 'true');
});

test('no voice, no timers, no forced flashing, no art outside the manifest', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await start(page, 'default');
  expect(await page.locator('audio, video').count()).toBe(0);
  const before = await node(page);
  await page.waitForTimeout(2500);
  expect(await node(page)).toBe(before);
  expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
  await assertManifestImagesOnly(page);
  await expect(page.getByTestId('emblem')).toHaveAttribute('aria-hidden', 'true');
});

test('every kit face keeps 4.5:1 with its ink at both text sizes', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await fresh(page, true);
  const table: Record<string, unknown> = {};
  for (const text of TEXT) {
    await setText(page, text);
    const rows = await kitFaceTable(page);
    for (const r of rows) expect(r.ratio, `${r.face} with ${r.ink} against ${r.worst}`).toBeGreaterThanOrEqual(4.5);
    table[text] = rows;
  }
  mkdirSync(ARTIFACTS, { recursive: true });
  writeFileSync(resolve(ARTIFACTS, 'contrast-kit-faces.json'), JSON.stringify(table, null, 1));
});

test('save/export/import round trip through the UI; a bad import is rejected and the session survives', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await start(page, 'default');
  await click(page, 'continue-g8-brief-continue');
  await click(page, 'option-g8-prep-recovery');
  await click(page, 'open-saveload');
  await click(page, 'save-browser');
  await expect(page.getByTestId('save-message')).toHaveText('Saved to this browser.');
  const [download] = await Promise.all([page.waitForEvent('download'), click(page, 'export')]);
  const path = await download.path();
  expect(path).toBeTruthy();
  // Corrupt import: wrong content version (the M00a build's).
  const text = await (await import('node:fs/promises')).readFile(path!, 'utf8');
  const bad = JSON.parse(text) as { identity: { content_version: string } };
  bad.identity.content_version = '0.4.0';
  await page.getByTestId('import-file').setInputFiles({ name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(bad)) });
  await expect(page.getByTestId('save-message')).toContainText('Import rejected');
  await expect(page.getByTestId('save-message')).toContainText('0.4.0');
  await click(page, 'close-overlay');
  expect(await node(page)).toBe('g8-prep-select');
  await expect(page.getByTestId('option-g8-prep-recovery')).toHaveCount(0);
  // Good import after playing further: state returns to the saved point.
  await click(page, 'option-g8-prep-contact');
  await click(page, 'continue-g8-prep-finish');
  expect(await node(page)).toBe('g8-docking-report');
  await click(page, 'open-saveload');
  await page.getByTestId('import-file').setInputFiles({ name: 'good.json', mimeType: 'application/json', buffer: Buffer.from(text) });
  await expect(page.getByTestId('overlay-saveload')).toHaveCount(0);
  await expect(page.getByTestId('screen-console')).toBeVisible();
  expect(await node(page)).toBe('g8-prep-select');
  await expect(page.getByTestId('option-g8-prep-contact')).toBeEnabled();
  // Browser slot load.
  await click(page, 'open-saveload');
  await click(page, 'load-browser');
  await expect(page.getByTestId('overlay-saveload')).toHaveCount(0);
  expect(await node(page)).toBe('g8-prep-select');
});
