/**
 * Shared Playwright helpers: the screenshot points with the room / plate checks and the contrast log
 * (artifacts/contrast.json, merged across spec files), and the navigation steps every case uses
 * (a fresh browser, the menu, the text size, a new campaign through the prologue).
 */
import { expect, type Page } from '@playwright/test';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertKitContrast, assertPlateScreen, assertRoomVisible, assertTextContrast, MANIFEST_FILES, TEXT_SAMPLES, unhash, type ContrastResult, type KitContrast } from './room';

const HERE = fileURLToPath(new URL('.', import.meta.url));
// Outside Playwright's outputDir, which is cleaned on every run.
export const ARTIFACTS = resolve(HERE, '..', '..', 'artifacts');
export const SHOTS = resolve(ARTIFACTS, 'screenshots');
export const VIEWPORTS = [{ name: '1920x1080', width: 1920, height: 1080 }, { name: '1366x768', width: 1366, height: 768 }];
export const TEXT = ['default', 'large'] as const;
export type TextSize = (typeof TEXT)[number];

const contrastLog: Record<string, { text: ContrastResult[]; kit: KitContrast[] }> = {};
export function flushContrast(): void {
  mkdirSync(ARTIFACTS, { recursive: true });
  const path = resolve(ARTIFACTS, 'contrast.json');
  let existing: Record<string, unknown> = {};
  if (existsSync(path)) { try { existing = JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>; } catch { existing = {}; } }
  writeFileSync(path, JSON.stringify({ ...existing, ...contrastLog }, null, 1));
}

export async function click(page: Page, testId: string): Promise<void> {
  await page.getByTestId(testId).click();
}

export async function node(page: Page): Promise<string> {
  return (await page.getByTestId('screen-console').getAttribute('data-node')) ?? '';
}

export async function stage(page: Page): Promise<string> {
  return (await page.getByTestId('screen-opening').getAttribute('data-stage')) ?? '';
}

export async function assertNoHorizontalOverflow(page: Page): Promise<void> {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  expect(overflow, 'page must not scroll horizontally').toBe(false);
}

export async function assertVisibleWithinViewport(page: Page, testId: string): Promise<void> {
  const el = page.getByTestId(testId);
  await expect(el).toBeVisible();
  const box = await el.boundingBox();
  const vw = page.viewportSize()!.width;
  expect(box, testId).not.toBeNull();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(vw + 1);
}

export function shotPath(vp: string, text: string, name: string): string {
  const dir = resolve(SHOTS, `${vp}-${text}`);
  mkdirSync(dir, { recursive: true });
  return resolve(dir, `${name}.png`);
}

/** Screenshot plus, wherever the room is on screen, the M00a/M00b room checks; on a full-screen plate the M01 plate checks; kit contrast everywhere. */
export async function shot(page: Page, vp: string, text: string, name: string): Promise<void> {
  const key = `${vp}-${text}/${name}`;
  if (await page.getByTestId('plate').count()) {
    contrastLog[key] = await assertRoomVisible(page);
  } else if (await page.locator('.pl-frame:not(.film-den)').count()) { // the den beneath the film (FNO-PT3) is not a plate with text
    contrastLog[key] = await assertPlateScreen(page);
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
export async function fresh(page: Page, seen: boolean): Promise<void> {
  await page.goto(DEMO);
  await page.evaluate((s) => { try { localStorage.clear(); if (s) localStorage.setItem('fno.openingSeen', '1'); } catch { /* ignore */ } }, seen);
  await page.reload();
  await expect(page.getByTestId('screen-opening')).toBeVisible();
}

/** The game's entry on the site (FNO-DEPLOY, doc 35 §6): the home page is at /, the game at /demo/. */
export const DEMO = '/demo/';

/**
 * A fake media clock for the opening film (the deploy handoff, Part 5): installed before navigation, it makes every
 * media element "play" at once without decoding, keeps a settable currentTime, and exposes window.__film to the test:
 * seek(t) moves the clock and fires timeupdate (and ended at the film's length); fail() fires error. The app's own
 * hand-over, fallback and volume code run unchanged; only the decoder is out of the loop.
 */
export async function fakeFilm(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const proto = HTMLMediaElement.prototype;
    const times = new WeakMap<HTMLMediaElement, number>();
    const playing = new WeakSet<HTMLMediaElement>();
    Object.defineProperty(proto, 'currentTime', { configurable: true, get() { return times.get(this) ?? 0; }, set(v: number) { times.set(this, Number(v)); } });
    Object.defineProperty(proto, 'duration', { configurable: true, get() { return 138; } });
    Object.defineProperty(proto, 'readyState', { configurable: true, get() { return 4; } });
    Object.defineProperty(proto, 'paused', { configurable: true, get() { return !playing.has(this); } });
    proto.play = function () { playing.add(this); setTimeout(() => this.dispatchEvent(new Event('playing')), 0); return Promise.resolve(); };
    proto.pause = function () { playing.delete(this); };
    proto.load = function () { /* nothing to load */ };
    (window as unknown as { __film: unknown }).__film = {
      seek(t: number): boolean {
        const v = document.getElementById('film') as HTMLMediaElement | null;
        if (!v) return false;
        times.set(v, t);
        v.dispatchEvent(new Event('timeupdate'));
        if (t >= 138) v.dispatchEvent(new Event('ended'));
        return true;
      },
      fail(): boolean {
        const v = document.getElementById('film') as HTMLMediaElement | null;
        if (!v) return false;
        v.dispatchEvent(new Event('error'));
        return true;
      },
    };
  });
}

/** Move the fake film to `t` seconds; under a fake clock, run one frame so the hand-over's one-frame swap (FNO-PT3) completes. */
export async function seekFilm(page: Page, t: number): Promise<void> {
  expect(await page.evaluate((s) => (window as unknown as { __film: { seek(t: number): boolean } }).__film.seek(s), t)).toBe(true);
  await page.clock.runFor(40).catch(() => undefined); // no fake clock installed: real frames run on their own
}

export async function toMenu(page: Page): Promise<void> {
  if ((await stage(page)) !== 'menu') await click(page, 'skip-to-menu');
  await expect(page.getByTestId('menu')).toBeVisible();
}

export async function setText(page: Page, text: TextSize): Promise<void> {
  const current = await page.getByTestId('text-size').textContent();
  if (text === 'large' && !/ENLARGED/.test(current ?? '')) await click(page, 'text-size');
  if (text === 'default' && /ENLARGED/.test(current ?? '')) await click(page, 'text-size');
}

/** The scenario card's Continue has been pressed: the room is up, the dissolve is over and the input guard has lapsed (fake clocks advance it). */
export async function awaitRoom(page: Page, fake = false): Promise<void> {
  await expect(page.getByTestId('screen-console')).toBeVisible();
  if (fake) await page.clock.runFor(800);
  await expect(page.getByTestId('room-dissolve')).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => window.__fno!.guarded())).toBe(false);
}

/** From the prologue's first plate: Skip Prologue → the scenario card → Continue → the first console screen. */
export async function skipPrologue(page: Page, fake = false): Promise<void> {
  await expect(page.getByTestId('screen-prologue')).toBeVisible();
  await click(page, 'prologue-skip');
  await expect(page.getByTestId('screen-prologue')).toHaveAttribute('data-card', 'scenario');
  await click(page, 'prologue-enter');
  await awaitRoom(page, fake);
}

/**
 * The four astronauts at the accountability scene (M01): a figure each inside the conversation panel, the neutral
 * portrait from the manifest, the content's name-and-role label as the caption, and nothing that reads as speech.
 */
export async function assertParticipants(page: Page): Promise<void> {
  const block = page.getByTestId('participants');
  await expect(block).toBeVisible();
  const figures = block.locator('figure.participant');
  await expect(figures).toHaveCount(4);
  const ids = await figures.evaluateAll((els) => els.map((e) => e.getAttribute('data-character')));
  expect(ids).toEqual(['armstrong', 'scott', 'cunningham', 'stafford']);
  const labels = await figures.locator('figcaption').allTextContents();
  expect(labels).toEqual(['NEIL ARMSTRONG — COMMAND PILOT', 'DAVID SCOTT — PILOT', 'WALT CUNNINGHAM — ASTRONAUT OFFICE', 'TOM STAFFORD — ASTRONAUT OFFICE']);
  for (const src of await figures.locator('img').evaluateAll((imgs) => imgs.map((i) => (i as HTMLImageElement).getAttribute('src') ?? ''))) {
    const base = unhash(decodeURIComponent(src.split('/').pop() ?? ''));
    expect(base).toMatch(/^fno_gemini_portrait_(armstrong|scott|cunningham|stafford)_neutral_v001\.png$/);
    expect(MANIFEST_FILES.has(base), `portrait ${src} is not in assets/manifest.json`).toBe(true);
  }
  expect(await block.locator('.what, .line, .answer').count()).toBe(0);
  expect(await block.textContent()).not.toMatch(/[“”"]/);
  expect(await page.getByTestId('conversation').locator('[data-testid="participants"]').count()).toBe(1);
  await expect(page.getByTestId('active-portrait')).toHaveCount(0); // nobody speaks here
  // All four faces on one row, so the whole group is in view together at every viewport and text size.
  const tops = await figures.evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().top)));
  expect(new Set(tops).size, `participants on one row (tops ${tops.join(', ')})`).toBe(1);
}

/** Whether the console is in the stacked layout (M02). */
export async function isStacked(page: Page): Promise<boolean> {
  return (await page.getByTestId('screen-console').getAttribute('data-layout')) === 'stacked';
}

/** Run `fn` with the evidence list on screen: the column in the column layout, or the overlay opened from the status bar in the stacked layout (closed again afterwards). */
export async function withEvidence(page: Page, fn: () => Promise<void>): Promise<void> {
  const stacked = await isStacked(page);
  if (stacked) {
    await click(page, 'open-evidence');
    await expect(page.getByTestId('overlay-evidence')).toBeVisible();
  }
  await fn();
  if (stacked) {
    await click(page, 'close-overlay');
    await expect(page.getByTestId('overlay-evidence')).toHaveCount(0);
  }
}

export type Prep = 'contact' | 'recovery' | 'systems';
export interface RouteSpec { prep: Prep[]; route: 'earlier' | 'later'; stance: 'blame' | 'ground'; questions?: boolean }

/** From the mission briefing to the outcome record, by clicking; with `questions`, every one of Glen's questions is asked on the way. */
export async function playRoute(page: Page, r: RouteSpec): Promise<void> {
  expect(await node(page)).toBe('g8-brief');
  await click(page, 'continue-g8-brief-continue');
  for (const p of r.prep) await click(page, `option-g8-prep-${p}`);
  await click(page, 'continue-g8-prep-finish');
  await click(page, 'continue-g8-docking-report-continue');
  await click(page, 'continue-g8-loss-of-contact-continue');
  if (r.questions) await click(page, 'question-g8-q-gap');
  await click(page, 'continue-g8-gap-note-continue');
  if (r.questions) await click(page, 'question-g8-q-crew-crisis');
  await click(page, 'continue-g8-crisis-report-continue');
  await click(page, 'continue-g8-stabilization-report-continue');
  await click(page, 'option-g8-order-return');
  if (r.questions) for (const q of ['g8-q-recovery-risk', 'g8-q-reserve-risk', 'g8-q-crew-return']) await click(page, `question-${q}`);
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

/** Menu → new campaign at the requested text size, past the prologue. */
export async function start(page: Page, text: TextSize, fake = false): Promise<void> {
  await fresh(page, true);
  await toMenu(page);
  await setText(page, text);
  await click(page, 'start-new');
  await skipPrologue(page, fake);
  expect(await node(page)).toBe('g8-brief');
}
