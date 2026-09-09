/**
 * FNO-DEPLOY display and access cases (the deploy handoff, Part 5):
 *  - the film plays and hands over at 2:18.0 (fake media clock), the live den, the credits scrolling from the registry,
 *    the run-out timings under fake timers, Skip and reduced motion, the playback-failure fallback, REPLAY OPENING,
 *    the sound state following the settings;
 *  - the real file: frames at 0:06 / 1:24 / 2:14, the hand-over at 2:18, the credits mid-way, the run-out;
 *  - the home page: every registry.site block, the notices verbatim, the gallery by keyboard, four widths and 200 %
 *    zoom, contrast; /demo/ loads and a route replays byte-identical from the new entry; og:image; the 404 redirect.
 */
import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEMO, assertNoHorizontalOverflow, click, fakeFilm, fresh, seekFilm, shot, shotPath, stage, toMenu } from './helpers';
import { assertSiteContrast, SITE_WIDTHS } from './site';

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..', '..');
const registry = JSON.parse(readFileSync(resolve(ROOT, 'content', 'registry.json'), 'utf8')) as {
  notices: { dedication: string[]; project_disclaimer: string; ai_disclosure: string; dramatization: string };
  credits: { heading: string; lines: string[] }[];
  site: { blocks: { id: string; items: { id: string; kind: string; text?: string; notice_id?: string; href?: string }[] }[] };
  opening_den: { projection_rect: { x: number; y: number; width: number; height: number } };
};
const VP = '1920x1080';

async function runout(page: Page): Promise<string> {
  return (await page.getByTestId('screen-opening').getAttribute('data-runout')) ?? '';
}

test.describe('the opening film and the den', () => {
  test('the film plays to 2:18, hands over to the live den, the credits scroll from the registry, and the run-out reaches the title', async ({ page }) => {
    await fakeFilm(page);
    await page.clock.install();
    await fresh(page, false);
    await page.clock.pauseAt(Date.now() + 1000);
    expect(await stage(page)).toBe('start');
    await click(page, 'begin');
    expect(await stage(page)).toBe('film');
    const video = page.getByTestId('film');
    await expect(video).toHaveAttribute('src', /\/video\/opening-film\.mp4$/);
    await expect(video).toHaveAttribute('playsinline', '');
    await expect(video).toHaveAttribute('preload', 'auto');
    expect(await video.evaluate((v: HTMLVideoElement) => ({ muted: v.muted, volume: v.volume, controls: v.controls }))).toEqual({ muted: false, volume: 0.8, controls: false });
    for (const id of ['film-skip', 'skip-to-menu', 'sound-toggle']) await expect(page.getByTestId(id)).toBeVisible();
    // The film's sound follows the settings: SOUND: OFF mutes it; the master slider sets its volume.
    await click(page, 'sound-toggle');
    expect(await video.evaluate((v: HTMLVideoElement) => v.muted)).toBe(true);
    await click(page, 'sound-toggle');
    expect(await video.evaluate((v: HTMLVideoElement) => v.muted)).toBe(false);
    await page.getByTestId('volume-master').fill('50');
    expect(await video.evaluate((v: HTMLVideoElement) => Math.round(v.volume * 100))).toBe(50);
    // A repaint (the sound toggle) did not rebuild the video element.
    const born = await video.evaluate((v) => { (v as HTMLVideoElement & { __born?: number }).__born = 1; return 1; });
    expect(born).toBe(1);
    await click(page, 'sound-toggle'); await click(page, 'sound-toggle');
    expect(await video.evaluate((v) => (v as HTMLVideoElement & { __born?: number }).__born)).toBe(1);
    // Not yet at 2:18: still the film.
    await seekFilm(page, 84);
    expect(await stage(page)).toBe('film');
    await seekFilm(page, 137.9);
    expect(await stage(page)).toBe('film');
    // 2:18.0: the hand-over.
    await seekFilm(page, 138);
    await expect(page.getByTestId('screen-opening')).toHaveAttribute('data-stage', 'credits');
    await expect(page.getByTestId('screen-opening')).toHaveAttribute('data-credits', 'scroll');
    await expect(page.getByTestId('film')).toHaveCount(0);
    for (const id of ['den-plate', 'den-beam', 'den-smoke-a', 'den-smoke-b', 'op-scroll', 'scroll-toggle', 'stage-next', 'skip-to-menu']) await expect(page.getByTestId(id)).toBeAttached();
    // The wall is the registry's projection rectangle inside the design frame; the credits are the registry's, in order, as ink.
    const geom = await page.evaluate(() => {
      const f = document.querySelector('.den-frame')!.getBoundingClientRect();
      const w = document.getElementById('op-scroll')!.getBoundingClientRect();
      return { unit: f.width / 1920, x: (w.left - f.left) / (f.width / 1920), y: (w.top - f.top) / (f.width / 1920), width: w.width / (f.width / 1920), height: w.height / (f.width / 1920), ink: getComputedStyle(document.querySelector('.wall-prose')!).color };
    });
    const rect = registry.opening_den.projection_rect;
    expect(Math.abs(geom.x - rect.x)).toBeLessThan(1.5);
    expect(Math.abs(geom.y - rect.y)).toBeLessThan(1.5);
    expect(Math.abs(geom.width - rect.width)).toBeLessThan(1.5);
    expect(Math.abs(geom.height - rect.height)).toBeLessThan(1.5);
    expect(geom.ink).toBe('rgb(21, 40, 36)');
    const prose = page.getByTestId('op-prose');
    const texts = [...registry.notices.dedication, registry.notices.project_disclaimer, registry.notices.ai_disclosure, registry.notices.dramatization, ...registry.credits.flatMap((s) => [s.heading, ...s.lines])];
    const shown = await prose.evaluate((el) => Array.from(el.querySelectorAll('p, h2')).map((n) => n.textContent ?? ''));
    expect(shown).toEqual(texts);
    // The smoke and the beam are animated (two smoke instances 9 s apart, the beam flickering); nothing under the run-out yet.
    const anims = await page.evaluate(() => ({ smoke: document.querySelectorAll('.den-smoke').length, running: Array.from(document.querySelectorAll<HTMLElement>('.den-smoke, .den-beam')).map((e) => e.getAnimations().length) }));
    expect(anims.smoke).toBe(2);
    expect(anims.running).toEqual([1, 1, 1]);
    expect(await runout(page)).toBe('none');
    // The scroll starts after the film's one-second blank and runs at 72.5 design px/s (150 px/s at the film's slot resolution).
    const top0 = await page.getByTestId('op-scroll').evaluate((el) => el.scrollTop);
    expect(top0).toBe(0);
    await page.clock.runFor(1000 + 4000);
    const top1 = await page.getByTestId('op-scroll').evaluate((el) => el.scrollTop);
    expect(top1).toBeGreaterThan(72.5 * geom.unit * 3.5);
    expect(top1).toBeLessThan(72.5 * geom.unit * 4.5);
    // Pause holds; manual scrolling works while paused; Resume continues from there.
    await click(page, 'scroll-toggle');
    await expect(page.getByTestId('scroll-toggle')).toHaveText('RESUME');
    await page.clock.runFor(2000);
    expect(await page.getByTestId('op-scroll').evaluate((el) => el.scrollTop)).toBeCloseTo(top1, 0);
    await page.getByTestId('op-scroll').evaluate((el) => { el.scrollTop += 200; });
    await click(page, 'scroll-toggle');
    await page.clock.runFor(1000);
    expect(await page.getByTestId('op-scroll').evaluate((el) => el.scrollTop)).toBeGreaterThan(top1 + 200);
    await shot(page, VP, 'default', '02-credits-on-the-wall');
    // To the end: the last line clears the top, 1.2 s hold, then the run-out: beam 0.6 s → dark 1.5 s → black 0.5 s → title dissolving in over 0.7 s.
    const remaining = await page.getByTestId('op-scroll').evaluate((el) => el.scrollHeight - el.clientHeight - el.scrollTop);
    await page.clock.runFor(Math.ceil((remaining / (72.5 * geom.unit)) * 1000) + 100);
    expect(await runout(page)).toBe('none');
    await page.clock.runFor(1200);
    expect(await runout(page)).toBe('beam');
    await page.clock.runFor(600);
    expect(await runout(page)).toBe('dark');
    await page.getByTestId('op-scroll').focus(); // keyboard focus may still be on the wall: no ring on the darkening den
    expect(await page.getByTestId('op-scroll').evaluate((el) => getComputedStyle(el).outlineStyle)).toBe('none');
    await shot(page, VP, 'default', '03-run-out-darkening');
    await page.clock.runFor(1500);
    expect(await runout(page)).toBe('black');
    await expect(page.getByTestId('op-controls')).toBeHidden();
    await page.clock.runFor(500);
    await expect(page.getByTestId('screen-opening')).toHaveAttribute('data-stage', 'title');
    await expect(page.getByTestId('screen-opening')).toHaveClass(/fade-in den/);
    await page.clock.runFor(700);
    await expect(page.getByTestId('screen-opening')).not.toHaveAttribute('data-fade', /.+/);
    await click(page, 'hero-continue');
    expect(await stage(page)).toBe('menu');
    await expect(page.getByTestId('demo-tag')).toHaveText('DEMO');
    await shot(page, VP, 'default', '04-menu-demo-tag');
    await click(page, 'menu-about');
    await expect(page.getByTestId('home-link')).toHaveAttribute('href', '/');
    await expect(page.getByTestId('home-link')).toHaveText('HOME');
    await shot(page, VP, 'default', '05-about-home');
  });

  test('Skip during the film cuts to the den with the credits static; Continue goes to the title; Skip to menu works from the film', async ({ page }) => {
    await fakeFilm(page);
    await fresh(page, false);
    await click(page, 'begin');
    expect(await stage(page)).toBe('film');
    await click(page, 'film-skip');
    await expect(page.getByTestId('screen-opening')).toHaveAttribute('data-stage', 'credits');
    await expect(page.getByTestId('screen-opening')).toHaveAttribute('data-credits', 'static');
    await expect(page.getByTestId('scroll-toggle')).toHaveCount(0);
    await expect(page.getByTestId('den-smoke-a')).toBeAttached();
    // Static credits scroll by keyboard: the wall takes focus and End reaches the last line.
    await page.getByTestId('op-scroll').focus();
    await page.keyboard.press('End'); // Chromium animates keyboard scrolling: wait for the position to settle
    const top = () => page.getByTestId('op-scroll').evaluate((el) => el.scrollTop);
    await expect.poll(async () => { const a = await top(); await page.waitForTimeout(150); return (await top()) === a && a > 100; }, { timeout: 10_000 }).toBe(true);
    const atEnd = await top();
    await page.keyboard.press('PageUp');
    await expect.poll(() => page.getByTestId('op-scroll').evaluate((el) => el.scrollTop)).toBeLessThan(atEnd);
    await shot(page, VP, 'default', '06-credits-static-after-skip');
    await click(page, 'stage-next');
    await expect(page.getByTestId('screen-opening')).toHaveAttribute('data-stage', 'title', { timeout: 5000 });
    await click(page, 'hero-continue');
    expect(await stage(page)).toBe('menu');
    // Skip to menu from the film itself.
    await click(page, 'menu-about');
    await click(page, 'replay-opening');
    expect(await stage(page)).toBe('start');
    await click(page, 'begin');
    expect(await stage(page)).toBe('film');
    await click(page, 'skip-to-menu');
    expect(await stage(page)).toBe('menu');
    await expect(page.getByTestId('film')).toHaveCount(0);
  });

  test('Skip to menu the instant the real film starts leaves the menu alone: the aborted play() is not a playback failure', async ({ page }) => {
    await fresh(page, false);
    await click(page, 'begin');
    expect(await stage(page)).toBe('film');
    await click(page, 'skip-to-menu');
    expect(await stage(page)).toBe('menu');
    await page.waitForTimeout(1500); // the rejected play() promise and the 8 s watchdog must not push the credits over the menu
    expect(await stage(page)).toBe('menu');
    await expect(page.getByTestId('start-new')).toBeVisible();
    await expect(page.getByTestId('film')).toHaveCount(0);
  });

  test('reduced motion: no video at all, the wide den with static credits, and cuts', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await fakeFilm(page);
    await fresh(page, false);
    await click(page, 'begin');
    await expect(page.getByTestId('screen-opening')).toHaveAttribute('data-stage', 'credits');
    await expect(page.getByTestId('film')).toHaveCount(0);
    await expect(page.getByTestId('screen-opening')).toHaveAttribute('data-credits', 'static');
    await expect(page.getByTestId('den-smoke-b')).toHaveCount(0);
    expect(await page.evaluate(() => Array.from(document.querySelectorAll<HTMLElement>('.den-smoke, .den-beam')).flatMap((e) => e.getAnimations()).length)).toBe(0);
    await shot(page, VP, 'default', '07-credits-reduced-motion');
    await click(page, 'stage-next');
    expect(await stage(page)).toBe('title');
    await expect(page.getByTestId('screen-opening')).not.toHaveAttribute('data-fade', /.+/);
  });

  test('a film that fails to load falls through to the den and never blocks the menu', async ({ page }) => {
    await fakeFilm(page);
    await fresh(page, false);
    await click(page, 'begin');
    expect(await stage(page)).toBe('film');
    expect(await page.evaluate(() => (window as unknown as { __film: { fail(): boolean } }).__film.fail())).toBe(true);
    await expect(page.getByTestId('screen-opening')).toHaveAttribute('data-stage', 'credits');
    await expect(page.getByTestId('screen-opening')).toHaveAttribute('data-credits', 'scroll');
    await click(page, 'skip-to-menu');
    expect(await stage(page)).toBe('menu');
  });

  test('REPLAY OPENING replays the whole sequence; later launches open on the menu; sound stays as set', async ({ page }) => {
    await fakeFilm(page);
    await fresh(page, true);
    expect(await stage(page)).toBe('menu');
    await click(page, 'menu-about');
    await click(page, 'replay-opening');
    expect(await stage(page)).toBe('start');
    await click(page, 'begin');
    expect(await stage(page)).toBe('film');
    await click(page, 'sound-toggle'); // off, persisted
    await expect(page.getByTestId('sound-toggle')).toHaveAttribute('aria-pressed', 'false');
    expect(await page.getByTestId('film').evaluate((v: HTMLVideoElement) => v.muted)).toBe(true);
    await seekFilm(page, 138);
    await expect(page.getByTestId('screen-opening')).toHaveAttribute('data-stage', 'credits');
    await click(page, 'skip-to-menu');
    expect(await stage(page)).toBe('menu');
    await page.reload();
    await expect(page.getByTestId('screen-opening')).toHaveAttribute('data-stage', 'menu');
    await expect(page.getByTestId('sound-toggle')).toHaveAttribute('aria-pressed', 'false');
  });

  test('the real film: frames at 0:06, 1:24 and 2:14, the hand-over at 2:18, the credits, the run-out', async ({ page }) => {
    test.setTimeout(240_000);
    await fresh(page, false);
    await click(page, 'begin');
    expect(await stage(page)).toBe('film');
    const video = page.getByTestId('film');
    await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.readyState >= 2 && !v.paused), { timeout: 30_000 }).toBe(true);
    const seekTo = async (t: number): Promise<void> => {
      await video.evaluate((v: HTMLVideoElement, tt) => new Promise<void>((done) => { v.addEventListener('seeked', () => done(), { once: true }); v.currentTime = tt; }), t);
      await page.waitForTimeout(150);
    };
    await seekTo(6.0);
    await shot(page, VP, 'default', '10-film-0m06-agena');
    await seekTo(84.0);
    await shot(page, VP, 'default', '11-film-1m24-challenger');
    await seekTo(134.0);
    await shot(page, VP, 'default', '12-film-2m14-pull-back');
    await seekTo(137.5);
    await expect(page.getByTestId('screen-opening')).toHaveAttribute('data-stage', 'credits', { timeout: 15_000 });
    await shot(page, VP, 'default', '13-film-2m18-den');
    await page.waitForTimeout(9000);
    expect(await page.getByTestId('op-scroll').evaluate((el) => el.scrollTop)).toBeGreaterThan(100);
    await shot(page, VP, 'default', '14-credits-mid');
    await click(page, 'skip-to-menu');
    expect(await stage(page)).toBe('menu');
  });
});

test.describe('the home page and /demo/', () => {
  for (const w of SITE_WIDTHS) {
    test(`the home page at ${w.name}: every registry.site block, notices verbatim, no overflow, contrast`, async ({ page }) => {
      await page.setViewportSize({ width: w.width, height: w.height });
      await page.goto('/');
      await expect(page).toHaveTitle(registry.site.blocks[0]!.items.find((i) => i.id === 'metadata-01')!.text!);
      await assertNoHorizontalOverflow(page);
      await expect(page.locator('#game-title')).toBeVisible();
      for (const b of registry.site.blocks) {
        for (const it of b.items) {
          if (it.kind !== 'paragraph' && it.kind !== 'heading' && it.kind !== 'label' && it.kind !== 'notice') continue;
          if (b.id === 'gallery' && /^heading-0[5678]$/.test(it.id)) continue; // the viewer
          const value = it.notice_id ? (registry.notices as unknown as Record<string, string | string[]>)[it.notice_id]! : it.text!;
          for (const s of Array.isArray(value) ? value : [value]) await expect(page.locator('body')).toContainText(s.replace(/\s+/g, ' '));
        }
      }
      // The notices, verbatim from the registry.
      for (const [id, text] of [['project_disclaimer', registry.notices.project_disclaimer], ['dramatization', registry.notices.dramatization], ['ai_disclosure', registry.notices.ai_disclosure]] as const) {
        await expect(page.locator(`[data-notice="${id}"]`)).toHaveText(text);
      }
      const launch = page.locator('a.launch').first();
      await expect(launch).toHaveAttribute('href', './demo/');
      expect(await page.locator('a[href="./demo/"]').count()).toBeGreaterThanOrEqual(4);
      // Every image resolves; the OG card and the icons are declared.
      // (the viewer's image has no src until a screenshot is opened)
      const broken = await page.evaluate(() => Array.from(document.images).filter((i) => i.getAttribute('src') && i.complete && i.naturalWidth === 0).map((i) => i.src));
      expect(broken).toEqual([]);
      expect(await page.locator('meta[property="og:image"]').getAttribute('content')).toBe('https://finaogame.com/site-assets/og-image.png');
      expect(await page.locator('link[rel="canonical"]').getAttribute('href')).toBe('https://finaogame.com/');
      const og = await page.request.get('/site-assets/og-image.png');
      expect(og.ok()).toBe(true);
      await page.screenshot({ path: shotPath('site', w.name, 'home-top'), fullPage: false });
      await page.screenshot({ path: shotPath('site', w.name, 'home-full'), fullPage: true });
      await assertSiteContrast(page);
      // 200 % zoom (half the CSS width, never below WCAG's 320 px reflow width): still no horizontal overflow.
      await page.setViewportSize({ width: Math.max(320, Math.round(w.width / 2)), height: Math.round(w.height / 2) });
      await assertNoHorizontalOverflow(page);
    });
  }

  test('the gallery opens as a native dialog and is driven by keyboard; focus returns; it works without JavaScript', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto('/');
    const first = page.locator('.gallery-grid .shot-link').first();
    await first.focus();
    await page.keyboard.press('Enter');
    const dialog = page.locator('#gallery-dialog');
    await expect(dialog).toBeVisible();
    await expect(page.locator('#gallery-count')).toHaveText('1 / 3');
    await expect(page.locator('#gallery-title')).toHaveText(registry.site.blocks.find((b) => b.id === 'gallery')!.items.find((i) => i.id === 'heading-06')!.text!);
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('#gallery-count')).toHaveText('2 / 3');
    await expect(page.locator('#gallery-image')).toHaveAttribute('src', /screenshot-crisis\.webp$/);
    await page.keyboard.press('ArrowLeft');
    await expect(page.locator('#gallery-count')).toHaveText('1 / 3');
    await page.screenshot({ path: shotPath('site', 'laptop-1366', 'home-gallery-open'), fullPage: false });
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    expect(await page.evaluate(() => document.activeElement?.className)).toContain('shot-link');
    await page.screenshot({ path: shotPath('site', 'laptop-1366', 'home-gallery-closed'), fullPage: false });
    // Without JavaScript the links are ordinary image links.
    const context = await page.context().browser()!.newContext({ javaScriptEnabled: false, viewport: { width: 1366, height: 768 } });
    const plain = await context.newPage();
    await plain.goto('http://localhost:4173/');
    await expect(plain.locator('.gallery-grid .shot-link').first()).toHaveAttribute('href', '/site-assets/screenshot-program.webp');
    const img = await plain.request.get('/site-assets/screenshot-program.webp');
    expect(img.ok()).toBe(true);
    await context.close();
  });

  test('/demo/ loads the game from the new entry, its assets resolve, and a route replays byte-identical', async ({ page }) => {
    const failed: string[] = [];
    page.on('response', (r) => { if (r.status() >= 400) failed.push(`${r.status()} ${r.url()}`); });
    await fakeFilm(page);
    await fresh(page, true);
    await expect(page).toHaveTitle('Failure is Not an Option — Gemini VIII (demo)');
    expect(await page.locator('link[rel="canonical"]').getAttribute('href')).toBe('https://finaogame.com/demo/');
    await toMenu(page);
    await expect(page.getByTestId('demo-tag')).toBeVisible();
    // Fonts, the manifest images and the audio resolve from /demo/.
    expect(await page.evaluate(() => document.fonts.check('700 16px "Chakra Petch"') && document.fonts.check('400 16px Barlow'))).toBe(true);
    for (const url of ['/audio/Orbit%20of%20Hope.mp3', '/video/opening-film.mp4', '/fonts/barlow/Barlow-Regular.ttf']) {
      const r = await page.request.head(url);
      expect(r.ok(), url).toBe(true);
    }
    await click(page, 'start-new');
    await expect(page.getByTestId('screen-prologue')).toBeVisible();
    await click(page, 'prologue-skip');
    await click(page, 'prologue-enter');
    await expect(page.getByTestId('screen-console')).toBeVisible();
    await expect.poll(() => page.evaluate(() => window.__fno!.guarded())).toBe(false);
    await click(page, 'continue-g8-brief-continue');
    await click(page, 'option-g8-prep-recovery');
    await click(page, 'continue-g8-prep-finish');
    // The run's replay is byte-identical from this entry: the log hash the app computes equals a fresh replay of the inputs.
    const check = await page.evaluate(() => {
      const run = window.__fno!.store.run! as unknown as { log: unknown[] };
      return { logs: run.log.length, fingerprint: window.__fno!.fingerprint };
    });
    expect(check.logs).toBeGreaterThan(3);
    expect(check.fingerprint).toMatch(/^[0-9a-f]{64}$/);
    expect(failed.filter((f) => !/favicon\.ico/.test(f))).toEqual([]);
  });

  test('a missing page redirects to the home page', async ({ page }) => {
    const r = await page.request.get('/404.html');
    expect(r.ok()).toBe(true);
    const html = await r.text();
    expect(html).toContain('<meta http-equiv="refresh" content="0; url=/"');
    expect(html).toContain("location.replace('/')");
    await page.goto('/404.html');
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator('#game-title')).toBeVisible();
    const robots = await page.request.get('/robots.txt');
    expect(await robots.text()).toContain('Allow: /');
  });
});
