/**
 * In-page checks for the art integration (FNO-M00a):
 *  - the plate is a fixed cover-fit <img>; the emblem sits on Glen's vest at the
 *    plate's native coordinates scaled with the rendered plate rectangle;
 *  - no opaque element covers Glen's head region of the plate;
 *  - panel text keeps ≥ 4.5:1 contrast against its actual backdrop (panel tint
 *    composited over the plate pixels behind it);
 *  - every <img> and the plate come from the asset manifest.
 */
import { expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const manifest = JSON.parse(readFileSync(resolve(fileURLToPath(new URL('.', import.meta.url)), '..', '..', 'assets', 'manifest.json'), 'utf8')) as { assets: { filename: string }[] };
export const MANIFEST_FILES = new Set(manifest.assets.map((a) => a.filename));

/** Strip Vite's content hash: name-XXXXXXXX.ext -> name.ext */
export function unhash(basename: string): string {
  return basename.replace(/-[A-Za-z0-9_-]{8}(\.[a-z0-9]+)$/i, '$1');
}

interface Geometry {
  scale: number; left: number; top: number; width: number; height: number;
}

const GEOMETRY_JS = `
  (() => {
    const plate = document.getElementById('plate');
    if (!plate) return null;
    const box = plate.getBoundingClientRect();
    const scale = Math.max(box.width / 1920, box.height / 1080);
    const width = 1920 * scale, height = 1080 * scale;
    return { scale, width, height, left: box.left + (box.width - width) / 2, top: box.top + (box.height - height) / 2 };
  })()
`;

export async function plateGeometry(page: Page): Promise<Geometry | null> {
  return page.evaluate(GEOMETRY_JS) as Promise<Geometry | null>;
}

/** Emblem rectangle equals the Codex coordinates (x 180, y 628, 30×40 at 1920×1080) mapped through the plate's rendered rect. */
export async function assertEmblemPlaced(page: Page): Promise<void> {
  const g = await plateGeometry(page);
  expect(g, 'plate present').not.toBeNull();
  const r = await page.evaluate(() => {
    const e = document.getElementById('emblem') as HTMLImageElement | null;
    if (!e) return null;
    const b = e.getBoundingClientRect();
    const cs = getComputedStyle(e);
    return { left: b.left, top: b.top, width: b.width, height: b.height, pe: cs.pointerEvents, hidden: e.getAttribute('aria-hidden'), src: e.getAttribute('src') ?? '', z: Number(cs.zIndex) };
  });
  expect(r, 'emblem present').not.toBeNull();
  const s = g!.scale;
  expect(Math.abs(r!.left - (g!.left + 180 * s))).toBeLessThanOrEqual(1);
  expect(Math.abs(r!.top - (g!.top + 628 * s))).toBeLessThanOrEqual(1);
  expect(Math.abs(r!.width - 30 * s)).toBeLessThanOrEqual(1);
  expect(Math.abs(r!.height - 40 * s)).toBeLessThanOrEqual(1);
  expect(r!.pe).toBe('none');
  expect(r!.hidden).toBe('true');
  expect(unhash(r!.src.split('/').pop() ?? '')).toBe('flight-operations-v005.svg');
  const plateZ = await page.evaluate(() => Number(getComputedStyle(document.getElementById('plate')!).zIndex));
  const shellZ = await page.evaluate(() => Number(getComputedStyle(document.querySelector('.console-shell')!).zIndex));
  expect(r!.z).toBeGreaterThan(plateZ);
  expect(r!.z).toBeLessThan(shellZ);
}

/** No element with a (near-)opaque background or an image intersects Glen's head region (plate x 5–25 %, y 30–60 %). */
export async function assertGlenUncovered(page: Page): Promise<void> {
  const offenders = await page.evaluate(() => {
    const plate = document.getElementById('plate');
    if (!plate) return ['no plate'];
    const box = plate.getBoundingClientRect();
    const scale = Math.max(box.width / 1920, box.height / 1080);
    const w = 1920 * scale, h = 1080 * scale;
    const ox = box.left + (box.width - w) / 2, oy = box.top + (box.height - h) / 2;
    const region = { x0: ox + 0.05 * w, y0: oy + 0.30 * h, x1: ox + 0.25 * w, y1: oy + 0.60 * h };
    const alphaOf = (color: string): number => {
      const m = /rgba?\(([^)]+)\)/.exec(color);
      if (!m) return 0;
      const parts = m[1]!.split(',').map((p) => parseFloat(p));
      return parts.length >= 4 ? parts[3]! : 1;
    };
    const bad: string[] = [];
    for (const el of Array.from(document.querySelectorAll<HTMLElement>('body *'))) {
      if (el.id === 'plate' || el.id === 'emblem' || el.id === 'live') continue;
      if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE') continue;
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden') continue;
      const b = el.getBoundingClientRect();
      if (b.width === 0 || b.height === 0) continue;
      const intersects = b.left < region.x1 && b.right > region.x0 && b.top < region.y1 && b.bottom > region.y0;
      if (!intersects) continue;
      const opacity = parseFloat(cs.opacity || '1');
      const isImage = el.tagName === 'IMG';
      const bgAlpha = alphaOf(cs.backgroundColor) * opacity;
      if (isImage || bgAlpha >= 0.9) {
        bad.push(`${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${el.className ? '.' + String(el.className).split(' ').join('.') : ''} [${Math.round(b.left)},${Math.round(b.top)} ${Math.round(b.width)}×${Math.round(b.height)}] bg=${cs.backgroundColor} opacity=${opacity}`);
      }
    }
    return bad;
  });
  expect(offenders, 'opaque elements over Glen\'s head region').toEqual([]);
}

/** WCAG contrast of an element's text against its real backdrop (ancestor tints composited over the plate pixels behind it). */
export async function assertTextContrast(page: Page, selectors: string[], minimum = 4.5): Promise<void> {
  const results = await page.evaluate(({ selectors }) => {
    const plate = document.getElementById('plate') as HTMLImageElement | null;
    if (!plate) return [];
    const box = plate.getBoundingClientRect();
    const scale = Math.max(box.width / 1920, box.height / 1080);
    const w = 1920 * scale, h = 1080 * scale;
    const ox = box.left + (box.width - w) / 2, oy = box.top + (box.height - h) / 2;
    const parse = (color: string): [number, number, number, number] => {
      const m = /rgba?\(([^)]+)\)/.exec(color);
      if (!m) return [0, 0, 0, 0];
      const p = m[1]!.split(',').map((x) => parseFloat(x));
      return [p[0]!, p[1]!, p[2]!, p.length >= 4 ? p[3]! : 1];
    };
    const lum = (r: number, g: number, b: number): number => {
      const f = (c: number) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
    };
    const canvas = document.createElement('canvas');
    canvas.width = 48; canvas.height = 48;
    const ctx = canvas.getContext('2d')!;
    const out: { selector: string; ratio: number; worst: string }[] = [];
    for (const selector of selectors) {
      const el = document.querySelector<HTMLElement>(selector);
      if (!el) continue;
      const b = el.getBoundingClientRect();
      if (b.width === 0 || b.height === 0) continue;
      // Plate pixels under the element (clamped to the viewport), sampled at 48×48.
      const x0 = Math.max(0, b.left), y0 = Math.max(0, b.top);
      const x1 = Math.min(innerWidth, b.right), y1 = Math.min(innerHeight, b.bottom);
      const sx = (x0 - ox) / scale, sy = (y0 - oy) / scale, sw = (x1 - x0) / scale, sh = (y1 - y0) / scale;
      ctx.clearRect(0, 0, 48, 48);
      ctx.drawImage(plate, sx, sy, sw, sh, 0, 0, 48, 48);
      const data = ctx.getImageData(0, 0, 48, 48).data;
      // Ancestor tints, outermost first.
      const tints: [number, number, number, number][] = [];
      for (let node: HTMLElement | null = el; node && node !== document.body; node = node.parentElement) {
        const [r, g, bb, a] = parse(getComputedStyle(node).backgroundColor);
        if (a > 0) tints.unshift([r, g, bb, a]);
      }
      const [tr, tg, tb] = parse(getComputedStyle(el).color);
      const textL = lum(tr, tg, tb);
      let worstRatio = Infinity; let worst = '';
      for (let i = 0; i < data.length; i += 4) {
        let r = data[i]!, g = data[i + 1]!, bl = data[i + 2]!;
        for (const [cr, cg, cb, ca] of tints) { r = cr * ca + r * (1 - ca); g = cg * ca + g * (1 - ca); bl = cb * ca + bl * (1 - ca); }
        const L = lum(r, g, bl);
        const ratio = (Math.max(textL, L) + 0.05) / (Math.min(textL, L) + 0.05);
        if (ratio < worstRatio) { worstRatio = ratio; worst = `rgb(${Math.round(r)},${Math.round(g)},${Math.round(bl)})`; }
      }
      out.push({ selector, ratio: worstRatio, worst });
    }
    return out;
  }, { selectors });
  for (const r of results) expect(r.ratio, `${r.selector} against ${r.worst}`).toBeGreaterThanOrEqual(minimum);
  expect(results.length, 'at least one text sample measured').toBeGreaterThan(0);
}

export const TEXT_SAMPLES = [
  '[data-testid="conversation"] .what',
  '[data-testid="narration"]',
  '[data-testid="conversation"] .scene-title',
  '[data-testid="evidence-panel"] .ev-title',
  '[data-testid="evidence-panel"] .ev-body',
  '[data-testid="strip"] .prompt',
  '[data-testid="strip"] .hint',
  '[data-testid="strip"] .card .field',
  '[data-testid="strip"] .readout span',
  '[data-testid="status-panel"] .lamp',
  '[data-testid="status-bar"] .phase',
  '[data-testid="evidence-panel"] .ev-meta span',
  '[data-testid="strip"] .card .field b',
  '[data-testid="conversation"] .who',
  '[data-testid="contact"]',
  '[data-testid="evidence-panel"] .badge.cur',
  '[data-testid="evidence-panel"] .badge.sim',
  '[data-testid="evidence-panel"] .badge.prev',
  '[data-testid="badge-alt-history"]',
];

/** Every image on the page, and the plate, is a manifest file (hash-stripped basename). */
export async function assertManifestImagesOnly(page: Page): Promise<void> {
  const srcs = await page.locator('img').evaluateAll((imgs) => imgs.map((i) => (i as HTMLImageElement).getAttribute('src') ?? ''));
  expect(srcs.length).toBeGreaterThan(0);
  for (const s of srcs) {
    const base = unhash(decodeURIComponent(s.split('/').pop() ?? ''));
    expect(MANIFEST_FILES.has(base), `image ${s} is not in assets/manifest.json`).toBe(true);
  }
  const plateSrc = await page.getByTestId('plate').getAttribute('src');
  expect(unhash((plateSrc ?? '').split('/').pop() ?? '')).toBe('fno_gemini_room_console_forward_v001.png');
}

/** All of the above at a console screenshot point. */
export async function assertRoomVisible(page: Page): Promise<void> {
  await page.getByTestId('plate').waitFor({ state: 'attached' });
  await page.evaluate(() => (document.getElementById('plate') as HTMLImageElement).decode().catch(() => undefined));
  await assertEmblemPlaced(page);
  await assertGlenUncovered(page);
  await assertTextContrast(page, TEXT_SAMPLES);
  await assertManifestImagesOnly(page);
}
