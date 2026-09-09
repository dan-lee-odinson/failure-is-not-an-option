/**
 * FNO-ITCH — the itch.io HTML5 upload (`npm run build:itch` → dist-itch/). itch serves an upload from a subfolder of
 * its CDN inside an iframe, so the build is served here from a nested path on its own static server and loaded inside
 * an iframe on a wrapper page; the case plays through the opening (Skip film), the prologue, one route to the DEMO
 * COMPLETE screen, and asserts zero failed network requests (every relative URL — scripts, styles, fonts, icons, the
 * bundled images, the audio and the film — resolved inside the subfolder), the three keys' hrefs (the off-site ones
 * absolute and opening in a new tab), HOME in About the same, every storage key prefixed, the Fullscreen API available
 * to the frame and the F11 line in place. A second case loads the build at a phone width inside the frame.
 */
import { expect, test, type Frame, type FrameLocator, type Page } from '@playwright/test';
import { execSync } from 'node:child_process';
import { createReadStream, existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import { extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { shotPath } from './helpers';

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..', '..');
const OUT = resolve(ROOT, 'dist-itch');
const PORT = 4174;
/** The upload's subfolder on the test server: nothing may resolve against the server root. */
const NEST = '/some/deep/path/';
const ORIGIN = `http://localhost:${PORT}`;
const ITCH = 'https://danleeodinson.itch.io/failure-is-not-an-option';
const HOME = 'https://finaogame.com/';
const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.txt': 'text/plain',
  '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.ico': 'image/x-icon',
  '.ttf': 'font/ttf', '.mp3': 'audio/mpeg', '.mp4': 'video/mp4',
};

let server: Server;

/** itch's page, reduced to what matters here: the upload in an iframe (allowfullscreen, as itch's "Fullscreen button" setting gives it) that fills the viewport. */
const WRAPPER = `<!doctype html><html><head><meta charset="utf-8"><title>wrapper</title><style>html,body{margin:0;height:100%;background:#222}iframe{display:block;width:100vw;height:100vh;border:0}</style></head><body><iframe id="game" name="game" src="${NEST}index.html" allowfullscreen allow="fullscreen; autoplay"></iframe></body></html>`;

test.beforeAll(() => {
  // A fresh build of the upload, then a static server that serves it from the nested path only (Range requests honoured for the film).
  execSync('npx vite build --config vite.itch.config.ts', { cwd: ROOT, stdio: 'pipe' });
  expect(existsSync(resolve(OUT, 'index.html'))).toBe(true);
  server = createServer((req, res) => {
    const url = new URL(req.url ?? '/', ORIGIN);
    if (url.pathname === '/wrapper.html') { res.writeHead(200, { 'content-type': MIME['.html']! }); res.end(WRAPPER); return; }
    if (!url.pathname.startsWith(NEST)) { res.writeHead(404); res.end('outside the upload'); return; }
    const rel = decodeURIComponent(url.pathname.slice(NEST.length)) || 'index.html';
    const file = resolve(OUT, rel);
    if (!file.startsWith(OUT) || !existsSync(file) || statSync(file).isDirectory()) { res.writeHead(404); res.end('not in the upload'); return; }
    const size = statSync(file).size;
    const type = MIME[extname(file).toLowerCase()] ?? 'application/octet-stream';
    const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range ?? '');
    if (range) {
      const start = range[1] ? Number(range[1]) : Math.max(0, size - Number(range[2]));
      const end = range[2] && range[1] ? Math.min(size - 1, Number(range[2])) : size - 1;
      if (start > end || start >= size) { res.writeHead(416, { 'content-range': `bytes */${size}` }); res.end(); return; }
      res.writeHead(206, { 'content-type': type, 'content-length': end - start + 1, 'content-range': `bytes ${start}-${end}/${size}`, 'accept-ranges': 'bytes' });
      if (req.method === 'HEAD') { res.end(); return; }
      createReadStream(file, { start, end }).pipe(res);
      return;
    }
    res.writeHead(200, { 'content-type': type, 'content-length': size, 'accept-ranges': 'bytes' });
    if (req.method === 'HEAD') { res.end(); return; }
    createReadStream(file).pipe(res);
  });
  return new Promise<void>((ok) => server.listen(PORT, ok));
});

test.afterAll(() => new Promise<void>((ok) => server.close(() => ok())));

/** Every response of 400 or more, and every request that failed for a reason other than being aborted (a skipped film's load is aborted by design). */
function watchNetwork(page: Page): string[] {
  const failed: string[] = [];
  page.on('response', (r) => { if (r.status() >= 400) failed.push(`${r.status()} ${r.url()}`); });
  page.on('requestfailed', (r) => { const why = r.failure()?.errorText ?? ''; if (!/ERR_ABORTED/.test(why)) failed.push(`${why} ${r.url()}`); });
  return failed;
}

/** The wrapper with the game in its iframe, the frame's storage cleared (a reload, so the frame handle is the live one). */
async function openGame(page: Page): Promise<{ game: FrameLocator; frame: Frame }> {
  await page.goto(`${ORIGIN}/wrapper.html`);
  const game = page.frameLocator('#game');
  await expect(game.getByTestId('screen-opening')).toBeVisible();
  await page.frame({ name: 'game' })!.evaluate(() => { try { localStorage.clear(); } catch { /* ignore */ } });
  await page.reload();
  await expect(game.getByTestId('screen-opening')).toBeVisible();
  const frame = page.frame({ name: 'game' })!;
  expect(frame).not.toBeNull();
  expect(frame.url()).toBe(`${ORIGIN}${NEST}index.html`);
  return { game, frame };
}

const click = async (game: FrameLocator, id: string): Promise<void> => { await game.getByTestId(id).click(); };

/** Every image the frame shows has loaded (a relative URL that resolved against the CDN root would be a broken image). */
async function assertImagesLoaded(frame: Frame): Promise<void> {
  const broken = await frame.evaluate(() => Array.from(document.images).filter((i) => i.getAttribute('src') && !(i.complete && i.naturalWidth > 0)).map((i) => i.src));
  expect(broken).toEqual([]);
}

test('the upload runs from a nested path inside an iframe: the opening, the prologue, a route to DEMO COMPLETE, no failed request, the keys, the storage keys, fullscreen', async ({ page }) => {
  test.setTimeout(240_000);
  await page.setViewportSize({ width: 1920, height: 1080 });
  const failed = watchNetwork(page);
  const { game, frame } = await openGame(page);
  await expect(game.getByTestId('screen-opening')).toHaveAttribute('data-stage', 'start');
  // The frame may go full screen (itch's iframe carries allowfullscreen); the key and the F11 line are there.
  expect(await frame.evaluate(() => document.fullscreenEnabled)).toBe(true);
  await expect(game.getByTestId('fullscreen')).toHaveText('FULL SCREEN');
  await expect(game.getByTestId('fullscreen-line')).toContainText('press F11 on Windows');
  await expect(game.getByTestId('sound-toggle')).toHaveAttribute('aria-pressed', 'true');
  // The opening: Begin, the film skipped, the static credits on the den, the menu.
  await click(game, 'begin');
  await expect(game.getByTestId('screen-opening')).toHaveAttribute('data-stage', 'film');
  await click(game, 'film-skip');
  await expect(game.getByTestId('screen-opening')).toHaveAttribute('data-credits', 'static');
  await expect.poll(() => game.getByTestId('den-plate').evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
  await assertImagesLoaded(frame);
  await click(game, 'skip-to-menu');
  await expect(game.getByTestId('menu')).toBeVisible();
  await expect(game.getByTestId('demo-tag')).toBeVisible();
  await assertImagesLoaded(frame);
  // The prologue, every plate with Continue, the scenario card, the room.
  await click(game, 'start-new');
  await expect(game.getByTestId('screen-prologue')).toBeVisible();
  for (let i = 1; i <= 5; i += 1) {
    await expect(game.getByTestId('prologue-next')).toBeVisible();
    await expect.poll(() => game.getByTestId('prologue-plate').evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
    await click(game, 'prologue-next');
  }
  await expect(game.getByTestId('screen-prologue')).toHaveAttribute('data-card', 'scenario');
  await click(game, 'prologue-enter');
  await expect(game.getByTestId('screen-console')).toBeVisible();
  await expect.poll(() => frame.evaluate(() => window.__fno!.guarded())).toBe(false);
  await assertImagesLoaded(frame);
  // One route: the earlier return with the recovery rehearsal, the ground-accountability stance.
  const route = [
    'continue-g8-brief-continue', 'option-g8-prep-recovery', 'continue-g8-prep-finish', 'continue-g8-docking-report-continue',
    'continue-g8-loss-of-contact-continue', 'continue-g8-gap-note-continue', 'continue-g8-crisis-report-continue',
    'continue-g8-stabilization-report-continue', 'option-g8-order-return', 'option-g8-return-earlier', 'continue-g8-execute-return',
    'continue-g8-ground-execution-continue', 'continue-g8-return-beat-1-continue', 'continue-g8-return-beat-2-continue',
    'continue-g8-pickup-report-continue', 'continue-g8-relationship-response-continue', 'option-g8-adopt-provenance',
    'continue-g8-accountability-brief-continue', 'option-g8-own-ground-contingencies', 'continue-g8-resolve-accountability', 'continue-g8-finish',
  ];
  for (const id of route) await click(game, id);
  await expect(game.getByTestId('screen-resolution')).toBeVisible();
  await expect.poll(() => game.getByTestId('resolution-plate').evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
  for (let i = 0; i < 4 && (await game.getByTestId('screen-resolution').count()); i += 1) await click(game, 'resolution-next');
  await expect(game.getByTestId('screen-debrief')).toBeVisible();
  await click(game, 'to-planning');
  await expect(game.getByTestId('screen-planning')).toBeVisible();
  const plan = (await game.locator('[data-testid^="plan-g9"][data-enabled="true"]').first().getAttribute('data-testid'))!.replace(/^plan-/, '');
  await click(game, `select-${plan}`);
  await click(game, 'confirm-plan');
  await expect(game.getByTestId('committed-text')).toBeVisible();
  await click(game, 'to-demo-end');
  // DEMO COMPLETE: the three keys — the off-site ones absolute and in a new tab (the game runs inside itch's iframe).
  await expect(game.getByTestId('screen-demo-end')).toBeVisible();
  await expect(game.getByTestId('demo-end-heading')).toHaveText('DEMO COMPLETE');
  const follow = game.getByTestId('follow-itch');
  await expect(follow).toHaveAttribute('href', ITCH);
  await expect(follow).toHaveAttribute('target', '_blank');
  await expect(follow).toHaveAttribute('rel', 'noopener noreferrer');
  const exit = game.getByTestId('exit-home');
  await expect(exit).toHaveAttribute('href', HOME);
  await expect(exit).toHaveAttribute('target', '_blank');
  await expect(exit).toHaveAttribute('rel', 'noopener noreferrer');
  await expect(game.getByTestId('play-again')).toHaveText('PLAY AGAIN');
  await assertImagesLoaded(frame);
  await frame.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished.catch(() => undefined))));
  await page.screenshot({ path: shotPath('itch-1920x1080', 'default', 'demo-complete-in-iframe'), fullPage: false });
  // Every storage key the game wrote carries the build's prefix (itch HTML games share an origin).
  const keys = await frame.evaluate(() => Object.keys(localStorage));
  expect(keys.length).toBeGreaterThanOrEqual(2); // the slot written on arrival and the opening-seen flag at least
  expect(keys.filter((k) => !k.startsWith('fno.'))).toEqual([]);
  expect(keys).toContain('fno.save.v1');
  // PLAY AGAIN, then About: HOME absolute and in a new tab; FOLLOW as before.
  await click(game, 'play-again');
  await expect(game.getByTestId('menu')).toBeVisible();
  await expect(game.getByTestId('start-load')).toBeDisabled();
  await click(game, 'menu-about');
  const home = game.getByTestId('home-link');
  await expect(home).toHaveAttribute('href', HOME);
  await expect(home).toHaveAttribute('target', '_blank');
  await expect(home).toHaveAttribute('rel', 'noopener noreferrer');
  await expect(game.getByTestId('about-itch')).toHaveAttribute('href', ITCH);
  // Every other off-site link in the game opens in a new tab too.
  const sameTab = await frame.evaluate(() => Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href^="http"]')).filter((a) => a.target !== '_blank').map((a) => a.href));
  expect(sameTab).toEqual([]);
  await click(game, 'close-overlay');
  // The film, a track, a font and an icon resolve relative to the upload's own folder.
  for (const rel of ['video/opening-film.mp4', 'audio/Orbit%20of%20Hope.mp3', 'fonts/barlow/Barlow-Regular.ttf', 'site-assets/emblem.svg', 'assets/index-CQg_eqFU.css']) {
    const r = await frame.evaluate(async (p) => { const res = await fetch(p, { method: 'HEAD' }); return { ok: res.ok, url: res.url }; }, rel);
    expect(r.ok, rel).toBe(true);
    expect(r.url).toBe(`${ORIGIN}${NEST}${rel}`);
  }
  expect(failed).toEqual([]);
});

test('the upload at a phone width inside the iframe: the menu fits, nothing fails', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const failed = watchNetwork(page);
  const { game, frame } = await openGame(page);
  await click(game, 'skip-to-menu');
  await expect(game.getByTestId('menu')).toBeVisible();
  await assertImagesLoaded(frame);
  expect(await frame.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)).toBe(false);
  for (const id of ['start-new', 'menu-load', 'menu-about']) {
    const box = (await game.getByTestId(id).boundingBox())!;
    expect(box.x + box.width).toBeLessThanOrEqual(391);
  }
  await page.screenshot({ path: shotPath('itch-phone-390', 'default', 'menu-in-iframe'), fullPage: false });
  expect(failed).toEqual([]);
});

/** The build itself: no root-absolute reference, index.html at the root, the site's own files pruned. */
test('dist-itch/ holds the demo at its root with relative URLs only and none of the site-only files', () => {
  expect(existsSync(resolve(OUT, 'index.html'))).toBe(true);
  expect(existsSync(resolve(OUT, 'demo'))).toBe(false);
  for (const f of ['404.html', 'robots.txt', 'sitemap.txt']) expect(existsSync(resolve(OUT, f)), f).toBe(false);
  expect(readdirSync(resolve(OUT, 'site-assets')).sort()).toEqual(['emblem.svg', 'favicon.png']);
  expect(existsSync(resolve(OUT, 'video', 'opening-film.mp4'))).toBe(true);
  const walk = (d: string, out: string[] = []): string[] => { for (const e of readdirSync(d)) { const p = resolve(d, e); if (statSync(p).isDirectory()) walk(p, out); else out.push(p); } return out; };
  const hits: string[] = [];
  for (const p of walk(OUT)) {
    if (!/\.(html|js|css|json|svg|txt)$/.test(p)) continue;
    const text = readFileSync(p, 'utf8');
    for (const m of text.matchAll(/(["'])\/[A-Za-z0-9_][^"'\s)]*|url\(\s*\/|href="\/"/g)) hits.push(`${p}: ${m[0]}`);
  }
  expect(hits).toEqual([]);
});
