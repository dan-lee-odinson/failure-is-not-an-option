/**
 * AC-12 — Presentation and access, plus the screenshot set the handoff asks for.
 * Drives the real UI by clicking; nothing here reaches into the engine.
 */
import { expect, test, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertRoomVisible, assertManifestImagesOnly } from './room';

const HERE = fileURLToPath(new URL('.', import.meta.url));
// Outside Playwright's outputDir, which is cleaned on every run.
const SHOTS = resolve(HERE, '..', '..', 'artifacts', 'screenshots');
const VIEWPORTS = [{ name: '1920x1080', width: 1920, height: 1080 }, { name: '1366x768', width: 1366, height: 768 }];
const TEXT = ['default', 'large'] as const;

interface Route {
  name: string;
  prep: string[];
  route: 'earlier' | 'later';
  lesson: 'provenance' | 'recovery';
  stance: 'blame' | 'ground';
  plan: string;
  disabledPlan: string;
}

const ROUTES: Route[] = [
  { name: 'earlier', prep: ['recovery', 'contact'], route: 'earlier', lesson: 'provenance', stance: 'ground', plan: 'g9-plan-recovery-contact', disabledPlan: 'g9-plan-systems-contact' },
  { name: 'later', prep: ['systems', 'contact'], route: 'later', lesson: 'recovery', stance: 'blame', plan: 'g9-plan-systems-contact', disabledPlan: 'g9-plan-recovery-contact' },
];

async function click(page: Page, testId: string): Promise<void> {
  await page.getByTestId(testId).click();
}

async function node(page: Page): Promise<string> {
  return (await page.getByTestId('screen-console').getAttribute('data-node')) ?? '';
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

function shotPath(vp: string, text: string, route: string, name: string): string {
  const dir = resolve(SHOTS, `${vp}-${text}`);
  mkdirSync(dir, { recursive: true });
  return resolve(dir, `${route}-${name}.png`);
}

async function shot(page: Page, vp: string, text: string, route: string, name: string): Promise<void> {
  if (await page.getByTestId('screen-console').count()) await assertRoomVisible(page);
  await page.screenshot({ path: shotPath(vp, text, route, name), fullPage: false });
}

async function start(page: Page, text: 'default' | 'large'): Promise<void> {
  await page.goto('/');
  await page.evaluate(() => { try { localStorage.clear(); } catch { /* ignore */ } });
  await page.reload();
  await expect(page.getByTestId('screen-notices')).toBeVisible();
  const current = await page.getByTestId('text-size').textContent();
  if (text === 'large' && !/enlarged/.test(current ?? '')) await click(page, 'text-size');
  if (text === 'default' && /enlarged/.test(current ?? '')) await click(page, 'text-size');
  await click(page, 'start-new');
  await expect(page.getByTestId('screen-console')).toBeVisible();
}

async function playRoute(page: Page, r: Route, vp: string, text: string): Promise<void> {
  const tag = r.name;
  // Preparation
  expect(await node(page)).toBe('g8-brief');
  await click(page, 'continue-g8-brief-continue');
  expect(await node(page)).toBe('g8-prep-select');
  await click(page, `option-g8-prep-${r.prep[0]}`);
  await shot(page, vp, text, tag, '01-preparation');
  for (const p of r.prep.slice(1)) await click(page, `option-g8-prep-${p}`);
  // Zero is exhausted: the remaining option is greyed with the reason text.
  const remaining = ['contact', 'recovery', 'systems'].find((p) => !r.prep.includes(p))!;
  await expect(page.getByTestId(`option-g8-prep-${remaining}`)).toBeDisabled();
  await expect(page.getByTestId(`reason-g8-prep-${remaining}`)).toHaveText('No preparation opportunities remaining.');
  await click(page, 'continue-g8-prep-finish');
  // Docking
  expect(await node(page)).toBe('g8-docking-report');
  await expect(page.getByTestId('display-time')).toHaveText('MET approximately 06:33');
  await click(page, 'continue-g8-docking-report-continue');
  // Gap
  expect(await node(page)).toBe('g8-loss-of-contact');
  await expect(page.getByTestId('contact')).toHaveText('CONTACT: NONE');
  await click(page, 'continue-g8-loss-of-contact-continue');
  await expect(page.getByTestId('evidence-g8-ev-docked')).toHaveAttribute('data-badge', 'PREVIOUS CONTACT');
  await click(page, 'question-g8-q-gap');
  await expect(page.getByTestId('conversation')).toContainText('Docking was reported.');
  await shot(page, vp, text, tag, '02-contact-gap');
  await expect(page.getByTestId('badge-alt-history')).toHaveCount(0);
  await click(page, 'continue-g8-gap-note-continue');
  // Crisis
  expect(await node(page)).toBe('g8-crisis-report');
  await expect(page.getByTestId('evidence-g8-ev-crisis')).toBeVisible();
  await shot(page, vp, text, tag, '03-crisis-report');
  await click(page, 'continue-g8-crisis-report-continue');
  await click(page, 'continue-g8-stabilization-report-continue');
  await click(page, 'option-g8-order-return');
  // Return decision
  expect(await node(page)).toBe('g8-return-brief');
  await expect(page.getByTestId('active-portrait')).toBeVisible();
  const activeH = (await page.getByTestId('active-portrait').locator('img').boundingBox())!.height;
  const thumbH = (await page.locator('[data-testid="conversation"] .line img.portrait').first().boundingBox())!.height;
  expect(activeH).toBeGreaterThan(thumbH * 1.5);
  if (vp === '1920x1080') { expect(activeH).toBeGreaterThanOrEqual(200); expect(activeH).toBeLessThanOrEqual(260); }
  await expect(page.getByTestId('badge-alt-history')).toBeVisible();
  await expect(page.getByTestId('readout')).toBeVisible();
  await expect(page.getByTestId('simulated-label').first()).toBeVisible();
  for (const id of ['option-g8-return-earlier', 'option-g8-return-later', 'card-g8-return-earlier', 'card-g8-return-later']) await assertVisibleWithinViewport(page, id);
  await expect(page.getByTestId('card-g8-return-earlier')).toContainText('Attraction');
  await expect(page.getByTestId('card-g8-return-earlier')).toContainText('Cost');
  await expect(page.getByTestId('card-g8-return-later')).toContainText('Attraction');
  await expect(page.getByTestId('card-g8-return-later')).toContainText('Cost');
  await assertNoHorizontalOverflow(page);
  // Pinning is UI-only: pin a report, verify the node does not change.
  await click(page, 'pin-g8-ev-reserve');
  expect(await node(page)).toBe('g8-return-brief');
  await shot(page, vp, text, tag, '04-return-decision');
  await click(page, `option-g8-return-${r.route}`);
  expect(await node(page)).toBe('g8-order-receipt');
  await click(page, 'continue-g8-execute-return');
  expect(await node(page)).toBe('g8-ground-execution');
  await expect(page.getByTestId('applied')).toBeVisible();
  await click(page, 'continue-g8-ground-execution-continue');
  // Beats
  expect(await node(page)).toBe('g8-return-beat-1');
  await expect(page.getByTestId('status-panel')).toBeVisible();
  await shot(page, vp, text, tag, '05-return-beat-1');
  await click(page, 'continue-g8-return-beat-1-continue');
  expect(await node(page)).toBe('g8-return-beat-2');
  await expect(page.getByTestId('event-text')).toBeVisible();
  await shot(page, vp, text, tag, '06-return-beat-2');
  await click(page, 'continue-g8-return-beat-2-continue');
  await click(page, 'continue-g8-pickup-report-continue');
  // Aftermath
  expect(await node(page)).toBe('g8-relationship-response');
  await expect(page.getByTestId('applied')).toContainText('trust');
  await shot(page, vp, text, tag, '07-aftermath-reactions');
  await click(page, 'continue-g8-relationship-response-continue');
  await click(page, `option-g8-adopt-${r.lesson}`);
  // Post-flight
  expect(await node(page)).toBe('g8-accountability-brief');
  await expect(page.getByTestId('header-label')).toHaveText('Historical disagreement; fictional player stance and relationship effects.');
  await expect(page.getByTestId('evidence-g8-ev-postflight-context')).toBeVisible();
  await click(page, 'continue-g8-accountability-brief-continue');
  expect(await node(page)).toBe('g8-accountability-decision');
  await shot(page, vp, text, tag, '08-postflight-stance');
  await click(page, r.stance === 'blame' ? 'option-g8-back-crew-criticism' : 'option-g8-own-ground-contingencies');
  await expect(page.getByTestId('narration')).toContainText('Response pending.');
  await click(page, 'continue-g8-resolve-accountability');
  expect(await node(page)).toBe('g8-accountability-response');
  await expect(page.getByTestId('event-text')).toBeVisible();
  await shot(page, vp, text, tag, '09-postflight-response');
  await click(page, 'continue-g8-finish');
  // Debrief
  await expect(page.getByTestId('screen-debrief')).toBeVisible();
  await expect(page.getByTestId('outcome-title')).toContainText('Crew recovered');
  await expect(page.getByTestId('postflight-panel')).toContainText('cleared Armstrong and Scott');
  await page.getByTestId('event-record-toggle').click();
  await expect(page.getByTestId('event-record')).toBeVisible();
  await shot(page, vp, text, tag, '10-debrief');
  await assertNoHorizontalOverflow(page);
  await click(page, 'to-planning');
  // Planning
  await expect(page.getByTestId('screen-planning')).toBeVisible();
  await expect(page.getByTestId(`plan-${r.disabledPlan}`)).toHaveAttribute('data-enabled', 'false');
  await expect(page.getByTestId(`select-${r.disabledPlan}`)).toBeDisabled();
  await expect(page.getByTestId(`plan-reason-${r.disabledPlan}`)).toContainText('This mission must include');
  const describedBy = await page.getByTestId(`select-${r.disabledPlan}`).getAttribute('aria-describedby');
  expect(describedBy).toBe(`plan-reason-${r.disabledPlan}`);
  await expect(page.getByTestId('confirm-plan')).toBeDisabled();
  await click(page, `select-${r.plan}`);
  await expect(page.getByTestId('confirm-plan')).toBeEnabled();
  await shot(page, vp, text, tag, '11-gemini-9a-planning');
  await click(page, 'confirm-plan');
  await expect(page.getByTestId('committed-text')).toHaveText('Preparation plan committed. Flight simulation continues in a later build.');
  await expect(page.getByTestId('confirm-plan')).toBeDisabled();
  await assertNoHorizontalOverflow(page);
}

for (const vp of VIEWPORTS) for (const text of TEXT) for (const r of ROUTES) {
  test(`screenshots and layout: ${vp.name} ${text} text, ${r.name} route`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await start(page, text);
    await playRoute(page, r, vp.name, text);
  });
}

test('keyboard reaches every control; focus is revealed; overlays close on Escape and return focus', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto('/');
  await page.evaluate(() => { try { localStorage.clear(); } catch { /* ignore */ } });
  await page.reload();
  await page.keyboard.press('Tab');
  await expect(page.getByTestId('start-new')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('screen-console')).toBeVisible();
  // Tab from the top reaches the Continue button and reveals focus.
  let reached = false;
  for (let i = 0; i < 40; i++) {
    await page.keyboard.press('Tab');
    const id = await page.evaluate(() => document.activeElement?.getAttribute('data-testid') ?? '');
    if (id === 'continue-g8-brief-continue') { reached = true; break; }
  }
  expect(reached).toBe(true);
  const focusVisible = await page.evaluate(() => document.activeElement?.matches(':focus-visible') ?? false);
  expect(focusVisible).toBe(true);
  const outline = await page.evaluate(() => getComputedStyle(document.activeElement as Element).outlineStyle);
  expect(outline).not.toBe('none');
  await page.keyboard.press('Enter');
  expect(await node(page)).toBe('g8-prep-select');
  // Open an overlay from the keyboard, close with Escape, focus returns to the opener.
  await page.getByTestId('open-history').focus();
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('overlay-history')).toBeVisible();
  await expect(page.getByTestId('alt-history-explanation')).toContainText('F7');
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('overlay-history')).toHaveCount(0);
  await expect(page.getByTestId('open-history')).toBeFocused();
  // Evidence links and option buttons are focusable.
  await page.getByTestId('link-g8-ev-contact-primer').first().focus();
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('evidence-g8-ev-contact-primer')).toHaveClass(/pinned/);
  await page.getByTestId('option-g8-prep-contact').focus();
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('option-g8-prep-contact')).toBeDisabled();
});

test('no voice, no timers, no forced flashing, no art outside the manifest', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await start(page, 'default');
  const media = await page.locator('audio, video').count();
  expect(media).toBe(0);
  const before = await node(page);
  await page.waitForTimeout(2500);
  expect(await node(page)).toBe(before);
  const animations = await page.evaluate(() => document.getAnimations().length);
  expect(animations).toBe(0);
  await assertManifestImagesOnly(page);
  await expect(page.getByTestId('emblem')).toHaveAttribute('aria-hidden', 'true');
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
  // Corrupt import: wrong content version.
  const text = await (await import('node:fs/promises')).readFile(path!, 'utf8');
  const bad = JSON.parse(text) as { identity: { content_version: string } };
  bad.identity.content_version = '0.3.0';
  await page.getByTestId('import-file').setInputFiles({ name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(bad)) });
  await expect(page.getByTestId('save-message')).toContainText('Import rejected');
  await expect(page.getByTestId('save-message')).toContainText('0.3.0');
  await click(page, 'close-overlay');
  expect(await node(page)).toBe('g8-prep-select');
  await expect(page.getByTestId('option-g8-prep-recovery')).toBeDisabled();
  // Good import after playing further: state returns to the saved point.
  await click(page, 'option-g8-prep-contact');
  await click(page, 'continue-g8-prep-finish');
  expect(await node(page)).toBe('g8-docking-report');
  await click(page, 'open-saveload');
  await page.getByTestId('import-file').setInputFiles({ name: 'good.json', mimeType: 'application/json', buffer: Buffer.from(text) });
  // A verified import closes the overlay; wait for that before reading the node.
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
