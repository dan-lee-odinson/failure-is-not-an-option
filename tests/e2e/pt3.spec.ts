/**
 * FNO-PT3 — playtest 3 (doc 49; content 0.5.5; rulings R1 and R2):
 *  - R2: nothing appears in the Evidence list, the Binder or the History panel before the player has met it in play, and
 *    every addition is cued (the EVIDENCE · n tick, the strip, the live region); a save reloads to the same lists with no
 *    cue; the log never changes;
 *  - R1: sound on by default, off only by the player's persisted choice; the first gesture arms the audio;
 *  - the start screen's full-screen line and key; the film → credits hand-over without a flash (frame capture on the real
 *    file); a resize or full screen in / out during the credits keeps the same line; the prologue plates decoded before
 *    they are revealed; an asked question greyed with an ASKED stamp, out of the focus order, the row gone when every
 *    question is asked.
 */
import { expect, test, type Page } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { inflateSync } from 'node:zlib';
import { DEMO, click, fakeFilm, fresh, node, seekFilm, shot, shotPath, skipPrologue, stage, start, toMenu } from './helpers';
import { assertTextContrast } from './room';

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..', '..');
const evidence = JSON.parse(readFileSync(resolve(ROOT, 'content', 'evidence.json'), 'utf8')) as { evidence: { id: string; title: string; kind: string }[] };
const procedures = JSON.parse(readFileSync(resolve(ROOT, 'content', 'procedures.json'), 'utf8')) as { procedures: { id: string; title: string }[] };
const title = (id: string): string => evidence.evidence.find((e) => e.id === id)?.title ?? procedures.procedures.find((p) => p.id === id)?.title ?? id;
const VP = '1920x1080';

interface Unlocks { evidence: string[]; binder: string[]; history: { explanation: boolean; prologueNote: boolean; capcomNote: boolean; sources: { id: string; title: boolean; note: boolean }[] } }
const unlocks = (page: Page): Promise<Unlocks> => page.evaluate(() => window.__fno!.unlocks() as Unlocks);
const strip = (page: Page) => page.getByTestId('unlock-strip');
const live = (page: Page): Promise<string> => page.evaluate(() => document.getElementById('live')?.textContent ?? '');

test.describe('R2 — encounter-based Evidence, Binder and History', () => {
  test('nothing shows before its scene; every addition is cued once and dismissed by the next click; a reload shows the same lists silently; the log never changes', async ({ page }) => {
    test.setTimeout(180_000);
    await page.setViewportSize({ width: 1920, height: 1080 });
    await start(page, 'default');
    expect(await node(page)).toBe('g8-brief');
    // Fresh start: no cards, an empty Binder, a bare History; the rule and the primer are acquired but locked.
    expect((await unlocks(page)).evidence).toEqual([]);
    await expect(page.getByTestId('evidence-panel')).toContainText('Evidence · 0');
    await expect(page.getByTestId('evidence-panel')).toContainText('No evidence acquired yet.');
    await expect(strip(page)).toHaveCount(0);
    expect(await page.evaluate(() => document.body.innerHTML)).not.toContain(title('g8-ev-rule'));
    await click(page, 'open-binder');
    await expect(page.getByTestId('overlay-binder')).toContainText('Nothing adopted yet. Reference pages appear as the mission gives you them.');
    for (const id of ['g8-ev-rule', 'g8-ev-contact-primer', 'g8-ev-contact-worksheet']) expect(await page.getByTestId('overlay-binder').textContent()).not.toContain(title(id));
    await shot(page, VP, 'default', '30-binder-empty');
    await click(page, 'close-overlay');
    await click(page, 'open-history');
    await expect(page.getByTestId('history-empty')).toBeVisible();
    await expect(page.getByTestId('alt-history-explanation')).toHaveCount(0);
    await expect(page.getByTestId('capcom-history-note')).toHaveCount(0);
    await expect(page.getByTestId('history-note')).toHaveCount(0); // the prologue was skipped
    await expect(page.locator('[data-testid^="history-source-"]')).toHaveCount(0);
    await shot(page, VP, 'default', '31-history-bare');
    await click(page, 'close-overlay');

    // A rehearsal chosen: its worksheet arrives with a cue; the unchosen drill stays absent.
    await click(page, 'continue-g8-brief-continue');
    await click(page, 'option-g8-prep-contact');
    await expect(strip(page)).toContainText(`Added to the binder: ${title('g8-ev-contact-worksheet')}`);
    await expect(page.getByTestId('evidence-panel')).toContainText('Evidence · 1');
    await expect(page.locator('[data-testid="evidence-panel"] h2.tick')).toHaveCount(1);
    expect(await live(page)).toContain(`Added to the binder: ${title('g8-ev-contact-worksheet')}`);
    await shot(page, VP, 'default', '32-unlock-cue-worksheet');
    await click(page, 'option-g8-prep-recovery');
    await expect(strip(page)).toContainText(title('g8-ev-recovery-worksheet'));
    await expect(page.getByTestId('evidence-g8-ev-systems-worksheet')).toHaveCount(0);
    expect((await unlocks(page)).evidence.sort()).toEqual(['g8-ev-contact-worksheet', 'g8-ev-recovery-worksheet']);
    // The next click dismisses the cue (an overlay open: nothing new arrives).
    await click(page, 'open-binder');
    await expect(strip(page)).toHaveCount(0);
    await expect(page.locator('[data-testid="evidence-panel"] h2.tick')).toHaveCount(0);
    await expect(page.getByTestId('overlay-binder')).toContainText(title('g8-ev-contact-worksheet'));
    await click(page, 'close-overlay');
    await click(page, 'continue-g8-prep-finish');
    // Lovell's docking relay: the report arrives as evidence, and History gains the CAPCOM note and H7.
    await expect(strip(page)).toContainText(`Added to evidence: ${title('g8-ev-docked')}`);
    await expect(strip(page)).toContainText('Added to History');
    await click(page, 'open-history');
    await expect(page.getByTestId('capcom-history-note')).toBeVisible();
    await expect(page.getByTestId('history-source-H7')).toBeVisible();
    await expect(page.getByTestId('history-source-H5')).toHaveCount(0);
    await expect(page.getByTestId('alt-history-explanation')).toHaveCount(0);
    await click(page, 'close-overlay');
    // Loss of contact: the primer; the crisis relay; Mara's report: the rule and the stabilization receipt together.
    await click(page, 'continue-g8-docking-report-continue');
    await expect(strip(page)).toContainText(`Added to the binder: ${title('g8-ev-contact-primer')}`);
    await click(page, 'continue-g8-loss-of-contact-continue');
    await click(page, 'continue-g8-gap-note-continue');
    await expect(strip(page)).toContainText(`Added to evidence: ${title('g8-ev-crisis')}`);
    expect((await unlocks(page)).evidence).not.toContain('g8-ev-rule');
    await click(page, 'continue-g8-crisis-report-continue');
    await expect(strip(page)).toContainText(title('g8-ev-stabilized'));
    await expect(strip(page)).toContainText(`Added to the binder: ${title('g8-ev-rule')}`);
    await shot(page, VP, 'default', '33-unlock-cue-rule');
    // Return Planning: the planning report and the two readbacks; the air and reserve cards wait for their own questions.
    await click(page, 'continue-g8-stabilization-report-continue');
    await click(page, 'option-g8-order-return');
    await expect(strip(page)).toContainText(title('g8-ev-return'));
    await expect(strip(page)).toContainText(title('g8-ev-contact-readback'));
    await expect(strip(page)).toContainText(title('g8-ev-recovery-readback'));
    let u = await unlocks(page);
    expect(u.evidence).not.toContain('g8-ev-systems-readback');
    expect(u.evidence).not.toContain('g8-ev-air');
    expect(u.evidence).not.toContain('g8-ev-reserve');
    await click(page, 'question-g8-q-reserve-risk');
    await expect(strip(page)).toContainText(`Added to evidence: ${title('g8-ev-reserve')}`);
    expect((await unlocks(page)).evidence).not.toContain('g8-ev-air');

    // Save, reload, Continue: the same lists, no cue, the log byte-identical.
    const before = { unlocks: await unlocks(page), log: await page.evaluate(() => window.__fno!.store.run!.canonicalLog()) };
    await click(page, 'open-saveload');
    await click(page, 'save-browser');
    await click(page, 'close-overlay');
    await page.reload();
    await expect(page.getByTestId('screen-opening')).toHaveAttribute('data-stage', 'menu');
    await click(page, 'start-load');
    await expect(page.getByTestId('screen-console')).toBeVisible();
    expect(await node(page)).toBe('g8-return-brief');
    expect(await unlocks(page)).toEqual(before.unlocks);
    expect(await page.evaluate(() => window.__fno!.store.run!.canonicalLog())).toBe(before.log); // the canonical log: the replayed save is byte-identical
    await expect(strip(page)).toHaveCount(0);
    await expect(page.locator('[data-testid="evidence-panel"] h2.tick')).toHaveCount(0);

    // The rest of the route: the pickup, the lesson (only the adopted procedure), the post-flight context with H5, the commissioned task.
    await click(page, 'option-g8-return-earlier');
    await click(page, 'continue-g8-execute-return');
    await expect(strip(page)).toContainText('Added to History: the alternate-history explanation'); // the earlier return leaves the record
    await click(page, 'continue-g8-ground-execution-continue');
    await click(page, 'continue-g8-return-beat-1-continue');
    await click(page, 'continue-g8-return-beat-2-continue');
    await expect(strip(page)).toContainText(`Added to evidence: ${title('g8-ev-recovered')}`);
    await click(page, 'continue-g8-pickup-report-continue');
    await click(page, 'continue-g8-relationship-response-continue');
    expect(await node(page)).toBe('g8-lesson-decision');
    expect((await unlocks(page)).binder).toEqual([]);
    await click(page, 'option-g8-adopt-provenance');
    // The post-flight context is a reference page: it arrives under the binder with the adopted procedure; H5 joins History.
    await expect(strip(page)).toContainText(title('proc-report-provenance'));
    await expect(strip(page)).toContainText(`Added to the binder: ${title('g8-ev-postflight-context')}`);
    await expect(strip(page)).toContainText('source H5');
    u = await unlocks(page);
    expect(u.binder).toEqual(['proc-report-provenance']);
    await click(page, 'open-binder');
    await expect(page.getByTestId('binder-proc-report-provenance')).toBeVisible();
    await expect(page.getByTestId('binder-proc-recovery-crosscheck')).toHaveCount(0);
    await click(page, 'close-overlay');
    await click(page, 'continue-g8-accountability-brief-continue');
    await click(page, 'option-g8-own-ground-contingencies');
    expect((await unlocks(page)).binder).toEqual(['proc-report-provenance']); // the receipt: the task is commissioned by the response scene, not yet presented
    await click(page, 'continue-g8-resolve-accountability');
    await expect(strip(page)).toContainText(`Added to the binder: ${title('proc-docked-contingencies')}`); // the ground-accountability response presented
    await click(page, 'continue-g8-finish');
    await expect(page.getByTestId('screen-resolution')).toBeVisible();
    await click(page, 'resolution-skip');
    await expect(page.getByTestId('screen-debrief')).toBeVisible();
    // After the mission: History carries every source with its note.
    await click(page, 'open-history');
    await expect(page.locator('[data-testid^="history-source-"]')).toHaveCount(10);
    await expect(page.getByTestId('history-source-H5')).toContainText('secondary account');
    await expect(page.getByTestId('alt-history-explanation')).toBeVisible();
    await shot(page, VP, 'default', '34-history-after-mission');
    await click(page, 'close-overlay');
    const finalUnlocks = await unlocks(page);
    expect(finalUnlocks.evidence).not.toContain('g8-ev-air'); // the recovery-risk question was never asked: hidden to the end
    expect(finalUnlocks.evidence).not.toContain('g8-ev-systems-worksheet');
    expect(finalUnlocks.binder).toEqual(['proc-report-provenance', 'proc-docked-contingencies']);
  });

  test('the stacked layout: the EVIDENCE · n key ticks on an addition and counts the visible list', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await start(page, 'large');
    await expect(page.getByTestId('open-evidence')).toHaveText('EVIDENCE · 0');
    await click(page, 'continue-g8-brief-continue');
    await click(page, 'option-g8-prep-systems');
    await expect(page.getByTestId('open-evidence')).toHaveText('EVIDENCE · 1');
    await expect(page.getByTestId('open-evidence')).toHaveClass(/k-tick/);
    await expect(strip(page)).toContainText(title('g8-ev-systems-worksheet'));
    await shot(page, '1366x768', 'large', '35-unlock-cue-stacked');
    await click(page, 'open-evidence');
    await expect(page.getByTestId('overlay-evidence').locator('.ev-item')).toHaveCount(1);
    await expect(page.getByTestId('evidence-g8-ev-systems-worksheet')).toBeVisible();
    await expect(page.getByTestId('open-evidence')).not.toHaveClass(/k-tick/);
  });
});

test.describe('R1 — sound on by default', () => {
  test('the unset state reads ON on the start screen, the film, the credits and the menu; the toggle turns it off and persists; only that reads OFF', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await fakeFilm(page);
    await fresh(page, false);
    expect(await page.evaluate(() => localStorage.getItem('fno.audio'))).toBeNull();
    await expect(page.getByTestId('sound-toggle')).toHaveText('SOUND: ON');
    await expect(page.getByTestId('sound-toggle')).toHaveAttribute('aria-pressed', 'true');
    await shot(page, VP, 'default', '36-start-screen');
    await click(page, 'begin');
    await expect(page.getByTestId('sound-toggle')).toHaveText('SOUND: ON');
    expect(await page.evaluate(() => window.__fno!.audio.unlocked())).toBe(true); // armed by the first gesture
    expect(await page.getByTestId('film').evaluate((v: HTMLVideoElement) => v.muted)).toBe(false);
    await seekFilm(page, 138);
    await expect(page.getByTestId('screen-opening')).toHaveAttribute('data-stage', 'credits');
    await expect(page.getByTestId('sound-toggle')).toHaveText('SOUND: ON');
    await click(page, 'skip-to-menu');
    await expect(page.getByTestId('sound-toggle')).toHaveText('SOUND: ON');
    // Off by the player's choice, persisted; a reload keeps it off everywhere.
    await click(page, 'sound-toggle');
    await expect(page.getByTestId('sound-toggle')).toHaveText('SOUND: OFF');
    expect(await page.evaluate(() => (JSON.parse(localStorage.getItem('fno.audio') ?? '{}') as { enabled?: boolean }).enabled)).toBe(false);
    await page.reload();
    await expect(page.getByTestId('sound-toggle')).toHaveText('SOUND: OFF');
    await click(page, 'menu-about');
    await click(page, 'replay-opening');
    await expect(page.getByTestId('sound-toggle')).toHaveText('SOUND: OFF');
    await click(page, 'begin');
    expect(await page.getByTestId('film').evaluate((v: HTMLVideoElement) => v.muted)).toBe(true);
    // Back on: persisted on.
    await click(page, 'sound-toggle');
    await expect(page.getByTestId('sound-toggle')).toHaveText('SOUND: ON');
    expect(await page.evaluate(() => (JSON.parse(localStorage.getItem('fno.audio') ?? '{}') as { enabled?: boolean }).enabled)).toBe(true);
  });
});

test.describe('the opening', () => {
  test('the start screen carries the full-screen line and a FULL SCREEN key beside SOUND, the same action as the menu key', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await fakeFilm(page);
    await fresh(page, false);
    await expect(page.getByTestId('fullscreen-line')).toContainText('Best played full screen — press F11 on Windows');
    const enabled = await page.evaluate(() => document.fullscreenEnabled);
    if (enabled) {
      await expect(page.getByTestId('fullscreen')).toBeVisible();
      await expect(page.getByTestId('fullscreen')).toHaveAttribute('data-action', 'fullscreen-toggle');
      expect(await page.evaluate(() => document.querySelector('.op-tools [data-testid="fullscreen"]') !== null && document.querySelector('.op-tools [data-testid="sound-toggle"]') !== null)).toBe(true);
    }
    await click(page, 'skip-to-menu');
    if (enabled) await expect(page.getByTestId('fullscreen')).toHaveAttribute('data-action', 'fullscreen-toggle');
  });

  test('the film → credits hand-over on the real file: the den is beneath the video, no frame differs from both its neighbours, no black or white frame', async ({ page }) => {
    test.setTimeout(240_000);
    await page.setViewportSize({ width: 1920, height: 1080 });
    await fresh(page, false);
    await click(page, 'begin');
    await expect(page.getByTestId('film')).toBeAttached();
    await expect(page.getByTestId('film-den')).toBeAttached(); // the den painted beneath the film
    const canPlay = await page.getByTestId('film').evaluate((v: HTMLVideoElement) => v.canPlayType('video/mp4; codecs="avc1.640028"'));
    test.skip(!canPlay, 'this browser does not decode H.264');
    await expect.poll(() => page.getByTestId('film').evaluate((v: HTMLVideoElement) => v.readyState >= 3), { timeout: 60_000 }).toBe(true);
    await page.getByTestId('film').evaluate((v: HTMLVideoElement) => { v.currentTime = 137.3; });
    await expect.poll(() => page.getByTestId('film').evaluate((v: HTMLVideoElement) => v.currentTime >= 137.2 && v.readyState >= 3), { timeout: 30_000 }).toBe(true);
    // Capture frames across the hand-over at 138.0.
    const frames: { t: number; stage: string; png: Buffer }[] = [];
    const t0 = Date.now();
    while (Date.now() - t0 < 2200) {
      const png = await page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: 1920, height: 1080 } });
      frames.push({ t: Date.now() - t0, stage: await stage(page), png });
    }
    expect(frames.some((f) => f.stage === 'film')).toBe(true);
    expect(frames.some((f) => f.stage === 'credits')).toBe(true);
    const pixels = frames.map((f) => decodePng(f.png));
    const diffs: number[] = [];
    for (let i = 1; i < pixels.length; i += 1) diffs.push(meanDiff(pixels[i - 1]!, pixels[i]!));
    const T = 18;
    const flashes: string[] = [];
    for (let i = 1; i < pixels.length - 1; i += 1) {
      const before = diffs[i - 1]!, after = diffs[i]!;
      if (before > T && after > T) flashes.push(`frame ${i} at ${frames[i]!.t} ms (${frames[i]!.stage}) differs from both neighbours: ${before.toFixed(1)} / ${after.toFixed(1)}`);
      const lum = meanLuma(pixels[i]!);
      if (lum < 2 || lum > 250) flashes.push(`frame ${i} at ${frames[i]!.t} ms is a ${lum < 2 ? 'black' : 'white'} frame`);
    }
    expect(flashes, `${frames.length} frames captured; consecutive differences ${diffs.map((d) => d.toFixed(1)).join(', ')}`).toEqual([]);
    const first = frames.findIndex((f) => f.stage === 'credits');
    for (const [i, name] of [[Math.max(0, first - 2), '37-handover-before'], [first, '37-handover-at'], [Math.min(frames.length - 1, first + 2), '37-handover-after']] as const) {
      writeFileSync(shotPath(VP, 'default', name), frames[i]!.png);
    }
  });

  test('a resize or full screen in / out during the credits keeps the same line on the wall and the scroll running (1920 → 1200 → 1920)', async ({ page }) => {
    await fakeFilm(page);
    await page.clock.install();
    await page.setViewportSize({ width: 1920, height: 1080 });
    await fresh(page, false);
    await page.clock.pauseAt(Date.now() + 1000);
    await click(page, 'begin');
    await seekFilm(page, 138);
    await expect(page.getByTestId('screen-opening')).toHaveAttribute('data-credits', 'scroll');
    await page.clock.runFor(1000 + 3000);
    const measure = () => page.evaluate(() => {
      const el = document.getElementById('op-scroll')!;
      const frame = document.querySelector('.den-frame')!.getBoundingClientRect();
      const unit = frame.width / 1920;
      const box = el.getBoundingClientRect();
      const visibleLines = Array.from(el.querySelectorAll('p, h2')).filter((n) => { const r = n.getBoundingClientRect(); return r.bottom > box.top && r.top < box.bottom && r.height > 0; }).map((n) => n.textContent ?? '');
      return { top: el.scrollTop, unit, design: el.scrollTop / unit, visibleLines, paused: document.querySelector('[data-testid="scroll-toggle"]')?.textContent };
    });
    const a = await measure();
    expect(a.design).toBeGreaterThan(150);
    expect(a.visibleLines.length).toBeGreaterThan(0);
    const rescaled = async (unit: number): Promise<void> => { await expect.poll(() => page.evaluate(() => window.__fno!.credits().unit), { timeout: 5000 }).toBeCloseTo(unit, 3); };
    await page.setViewportSize({ width: 1200, height: 675 });
    await rescaled(1200 / 1920);
    const b = await measure();
    expect(b.unit).toBeCloseTo(1200 / 1920, 3);
    expect(Math.abs(b.design - a.design)).toBeLessThan(12); // the same line, in design pixels
    expect(b.visibleLines[0]).toBe(a.visibleLines[0]);
    expect(b.paused).toBe('PAUSE'); // still running
    await shot(page, '1200x675', 'default', '38-credits-resized');
    await page.clock.runFor(1000);
    const c = await measure();
    expect(c.design - b.design).toBeGreaterThan(50); // ~72.5 design px in a second: running at the new scale
    await page.setViewportSize({ width: 1920, height: 1080 });
    await rescaled(1);
    const d = await measure();
    expect(d.unit).toBeCloseTo(1, 3);
    expect(Math.abs(d.design - c.design)).toBeLessThan(12);
    expect(d.visibleLines.length).toBeGreaterThan(0);
    await page.clock.runFor(1000);
    expect((await measure()).design - d.design).toBeGreaterThan(50);
  });

  test('the prologue plates are preloaded from Begin and revealed only once decoded (fade from black), also on a slow network', async ({ page }) => {
    test.setTimeout(180_000);
    await page.setViewportSize({ width: 1920, height: 1080 });
    await fakeFilm(page);
    await fresh(page, false);
    await click(page, 'begin');
    await seekFilm(page, 138);
    await expect(page.getByTestId('screen-opening')).toHaveAttribute('data-stage', 'credits');
    // Every prologue plate and layer, the scenario card's plate and the room plate were requested at Begin and are decoded by now.
    const preloaded = () => page.evaluate(() => window.__fno!.credits().preloaded);
    expect((await preloaded()).map((p) => p.id)).toEqual(expect.arrayContaining(['g8-prologue-program', 'g8-prologue-crew', 'g8-prologue-launch', 'g8-prologue-orbit', 'g8-prologue-facility', 'room-gemini-console']));
    await expect.poll(async () => (await preloaded()).every((p) => p.complete), { timeout: 60_000 }).toBe(true);
    await click(page, 'skip-to-menu');
    // A slow network: the plate is held back (pl-pending) until decoded; it is never shown incomplete.
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Network.enable');
    await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
    await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 40, downloadThroughput: 600 * 1024, uploadThroughput: 600 * 1024 });
    await page.evaluate(() => {
      (window as unknown as { __plateWatch: string[] }).__plateWatch = [];
      const tick = (): void => {
        const scene = document.querySelector<HTMLElement>('.screen-prologue .pl-current');
        const img = scene?.querySelector<HTMLImageElement>('img.pl-bg');
        if (scene && img) {
          const pending = scene.classList.contains('pl-pending');
          const opacity = parseFloat(getComputedStyle(scene).opacity);
          if (!pending && opacity > 0.05 && !(img.complete && img.naturalWidth > 0)) (window as unknown as { __plateWatch: string[] }).__plateWatch.push(`shown incomplete at ${performance.now().toFixed(0)}`);
        }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    await click(page, 'start-new');
    await expect(page.getByTestId('screen-prologue')).toBeVisible();
    await expect.poll(() => page.evaluate(() => { const s = document.querySelector('.screen-prologue .pl-current'); const i = s?.querySelector<HTMLImageElement>('img.pl-bg'); return !!s && !s.classList.contains('pl-pending') && !!i && i.complete && i.naturalWidth > 0; }), { timeout: 60_000 }).toBe(true);
    expect(await page.evaluate(() => (window as unknown as { __plateWatch: string[] }).__plateWatch)).toEqual([]);
    await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
    await shot(page, VP, 'default', '39-prologue-decoded');
  });
});

test.describe('asked questions', () => {
  test('an asked question greys with an ASKED stamp and leaves the focus order; the row goes once every question is asked', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await start(page, 'default');
    await click(page, 'continue-g8-brief-continue');
    await click(page, 'option-g8-prep-recovery');
    await click(page, 'continue-g8-prep-finish');
    await click(page, 'continue-g8-docking-report-continue');
    await click(page, 'continue-g8-loss-of-contact-continue');
    await click(page, 'continue-g8-gap-note-continue');
    expect(await node(page)).toBe('g8-crisis-report');
    // One question: asked, the answer joins the body and the row is gone.
    await expect(page.getByTestId('question-g8-q-crew-crisis')).toBeEnabled();
    await click(page, 'question-g8-q-crew-crisis');
    await expect(page.getByTestId('answer-g8-q-crew-crisis')).toBeVisible();
    await expect(page.getByTestId('questions')).toHaveCount(0);
    await click(page, 'continue-g8-crisis-report-continue');
    await click(page, 'continue-g8-stabilization-report-continue');
    await click(page, 'option-g8-order-return');
    // Three questions: one asked → greyed, stamped, disabled, skipped by Tab; two live.
    await click(page, 'question-g8-q-reserve-risk');
    const asked = page.getByTestId('question-g8-q-reserve-risk');
    await expect(asked).toBeDisabled();
    await expect(asked).toHaveAttribute('data-asked', '');
    await expect(asked).toHaveClass(/asked/);
    await expect(asked.locator('.stamp')).toHaveText('ASKED');
    await expect(page.getByTestId('question-g8-q-recovery-risk')).toBeEnabled();
    await page.getByTestId('question-g8-q-recovery-risk').focus();
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => document.activeElement?.getAttribute('data-testid'))).toBe('question-g8-q-crew-return');
    await assertTextContrast(page, ['.question[data-asked]', '.question[data-asked] .stamp']);
    await shot(page, VP, 'default', '40-question-asked');
    await click(page, 'question-g8-q-recovery-risk');
    await click(page, 'question-g8-q-crew-return');
    await expect(page.getByTestId('questions')).toHaveCount(0);
    for (const q of ['g8-q-reserve-risk', 'g8-q-recovery-risk', 'g8-q-crew-return']) await expect(page.getByTestId(`answer-${q}`)).toBeVisible();
    await shot(page, VP, 'default', '41-questions-all-asked');
  });
});

// ---------------------------------------------------------------------------
// A small PNG reader for the hand-over frames (8-bit RGB / RGBA, non-interlaced, as Playwright writes them).
// ---------------------------------------------------------------------------
interface Pixels { width: number; height: number; data: Uint8Array; channels: number }

function decodePng(buf: Buffer): Pixels {
  let pos = 8;
  let width = 0, height = 0, colorType = 6;
  const idat: Buffer[] = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('ascii', pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === 'IHDR') { width = data.readUInt32BE(0); height = data.readUInt32BE(4); colorType = data[9]!; }
    else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
    pos += 12 + len;
  }
  const channels = colorType === 6 ? 4 : colorType === 2 ? 3 : colorType === 4 ? 2 : 1;
  const raw = inflateSync(Buffer.concat(idat));
  const stride = width * channels;
  const out = new Uint8Array(width * height * channels);
  let prev = new Uint8Array(stride);
  for (let y = 0; y < height; y += 1) {
    const filter = raw[y * (stride + 1)]!;
    const line = raw.subarray(y * (stride + 1) + 1, y * (stride + 1) + 1 + stride);
    const cur = new Uint8Array(stride);
    for (let i = 0; i < stride; i += 1) {
      const a = i >= channels ? cur[i - channels]! : 0;
      const b = prev[i]!;
      const c = i >= channels ? prev[i - channels]! : 0;
      let v = line[i]!;
      if (filter === 1) v += a;
      else if (filter === 2) v += b;
      else if (filter === 3) v += (a + b) >> 1;
      else if (filter === 4) { const p = a + b - c; const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }
      cur[i] = v & 255;
    }
    out.set(cur, y * stride);
    prev = cur;
  }
  return { width, height, data: out, channels };
}

/** Mean absolute difference of the RGB channels over a coarse grid (every 8th pixel each way). */
function meanDiff(a: Pixels, b: Pixels): number {
  let sum = 0, n = 0;
  for (let y = 0; y < a.height; y += 8) for (let x = 0; x < a.width; x += 8) {
    const i = (y * a.width + x) * a.channels, j = (y * b.width + x) * b.channels;
    sum += Math.abs(a.data[i]! - b.data[j]!) + Math.abs(a.data[i + 1]! - b.data[j + 1]!) + Math.abs(a.data[i + 2]! - b.data[j + 2]!);
    n += 3;
  }
  return sum / n;
}

function meanLuma(a: Pixels): number {
  let sum = 0, n = 0;
  for (let y = 0; y < a.height; y += 8) for (let x = 0; x < a.width; x += 8) {
    const i = (y * a.width + x) * a.channels;
    sum += 0.2126 * a.data[i]! + 0.7152 * a.data[i + 1]! + 0.0722 * a.data[i + 2]!;
    n += 1;
  }
  return sum / n;
}

// Unused-import guard for helpers the cases above may grow into.
void DEMO; void skipPrologue; void toMenu;
