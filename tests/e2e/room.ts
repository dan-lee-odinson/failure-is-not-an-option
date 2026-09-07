/**
 * In-page checks for the art and interface integration (FNO-M00a, M00b):
 *  - the plate is a fixed cover-fit <img>; the emblem sits on Glen's vest at the
 *    plate's native coordinates scaled with the rendered plate rectangle;
 *  - no opaque element covers Glen's head region of the plate;
 *  - panel and paper text keeps ≥ 4.5:1 contrast against its actual backdrop
 *    (ancestor tints composited over the plate pixels behind it);
 *  - every kit key and lamp keeps ≥ 4.5:1 between its live text and the face
 *    it sits on (the SVG face rasterised at the control's rendered size);
 *  - every <img>, the plate, and every control face come from the asset manifest.
 */
import { expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const manifest = JSON.parse(readFileSync(resolve(fileURLToPath(new URL('.', import.meta.url)), '..', '..', 'assets', 'manifest.json'), 'utf8')) as { assets: { filename: string; kind?: string }[] };
export const MANIFEST_FILES = new Set(manifest.assets.filter((a) => a.kind !== 'audio').map((a) => a.filename));

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
  // M00c: the emblem is part of the room composite — inside the room layer, which sits beneath every panel, card region and status bar.
  const layering = await page.evaluate(() => {
    const emblem = document.getElementById('emblem')!;
    const layer = emblem.closest('.room-layer') as HTMLElement | null;
    if (!layer) return { inLayer: false, layerZ: NaN, minUiZ: NaN, covered: false, topIsEmblem: false };
    const layerZ = Number(getComputedStyle(layer).zIndex);
    const ui = Array.from(document.querySelectorAll<HTMLElement>('.status-bar, .stage, .evidence, .strip, .hero-overlay'));
    const minUiZ = Math.min(...ui.map((el) => Number(getComputedStyle(el).zIndex) || 0));
    const e = emblem.getBoundingClientRect();
    const cx = e.left + e.width / 2, cy = e.top + e.height / 2;
    const covered = ui.some((el) => { const b = el.getBoundingClientRect(); return b.left <= cx && cx <= b.right && b.top <= cy && cy <= b.bottom; });
    const top = document.elementFromPoint(cx, cy);
    return { inLayer: true, layerZ, minUiZ, covered, topIsEmblem: top === emblem };
  });
  expect(layering.inLayer, 'emblem inside the room layer').toBe(true);
  expect(layering.layerZ).toBeLessThan(layering.minUiZ);
  if (layering.covered) expect(layering.topIsEmblem, 'a panel over the emblem paints above it').toBe(false);
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

export interface ContrastResult { selector: string; ratio: number; worst: string }

/** WCAG contrast of an element's text against its real backdrop (ancestor tints composited over the plate pixels behind it, or the page ground when there is no plate). */
export async function measureTextContrast(page: Page, selectors: string[]): Promise<ContrastResult[]> {
  return page.evaluate(({ selectors }) => {
    const plate = document.getElementById('plate') as HTMLImageElement | null;
    const box = plate?.getBoundingClientRect();
    const scale = box ? Math.max(box.width / 1920, box.height / 1080) : 1;
    const w = 1920 * scale, h = 1080 * scale;
    const ox = box ? box.left + (box.width - w) / 2 : 0, oy = box ? box.top + (box.height - h) / 2 : 0;
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
    const ground = parse(getComputedStyle(document.querySelector('.screen-opening') ?? document.body).backgroundColor);
    const out: { selector: string; ratio: number; worst: string }[] = [];
    for (const selector of selectors) {
      const el = document.querySelector<HTMLElement>(selector);
      if (!el) continue;
      const b = el.getBoundingClientRect();
      if (b.width === 0 || b.height === 0) continue;
      const x0 = Math.max(0, b.left), y0 = Math.max(0, b.top);
      const x1 = Math.min(innerWidth, b.right), y1 = Math.min(innerHeight, b.bottom);
      if (x1 <= x0 || y1 <= y0) continue;
      ctx.clearRect(0, 0, 48, 48);
      if (plate) {
        const sx = (x0 - ox) / scale, sy = (y0 - oy) / scale, sw = (x1 - x0) / scale, sh = (y1 - y0) / scale;
        ctx.drawImage(plate, sx, sy, sw, sh, 0, 0, 48, 48);
      } else {
        ctx.fillStyle = `rgb(${ground[0]},${ground[1]},${ground[2]})`;
        ctx.fillRect(0, 0, 48, 48);
      }
      const data = ctx.getImageData(0, 0, 48, 48).data;
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
      out.push({ selector, ratio: Math.round(worstRatio * 100) / 100, worst });
    }
    return out;
  }, { selectors });
}

export async function assertTextContrast(page: Page, selectors: string[], minimum = 4.5): Promise<ContrastResult[]> {
  const results = await measureTextContrast(page, selectors);
  for (const r of results) expect(r.ratio, `${r.selector} against ${r.worst}`).toBeGreaterThanOrEqual(minimum);
  expect(results.length, 'at least one text sample measured').toBeGreaterThan(0);
  return results;
}

export const TEXT_SAMPLES = [
  '[data-testid="conversation"] .what',
  '[data-testid="narration"]',
  '[data-testid="conversation"] .scene-title',
  '[data-testid="conversation"] .who',
  '[data-testid="conversation"] .header-label',
  '[data-testid="questions"] .question',
  '[data-testid="evidence-panel"] h2',
  '[data-testid="evidence-panel"] .ev-title',
  '[data-testid="evidence-panel"] .ev-body',
  '[data-testid="evidence-panel"] .ev-meta span',
  '[data-testid="evidence-panel"] .badge.cur',
  '[data-testid="evidence-panel"] .badge.ref',
  '[data-testid="evidence-panel"] .badge.prev',
  '[data-testid="pin-hint"] span',
  '[data-testid="strip"] .prompt',
  '[data-testid="strip"] .hint',
  '[data-testid="strip"] .card .field',
  '[data-testid="strip"] .card .field b',
  '[data-testid="strip"] .card .subtitle',
  '[data-testid="strip"] .card .reason',
  '[data-testid="strip"] .card-details summary',
  '[data-testid="strip"] .card .support .ready',
  '[data-testid="strip"] .card .support .not-ready',
  '[data-testid="strip"] .stamp',
  '[data-testid="strip"] .readout span',
  '[data-testid="status-panel"] .lamp-op',
  '[data-testid="status-bar"] .phase',
  '[data-testid="contact"]',
  '[data-testid="applied"] li',
  '[data-testid="event-text"]',
  '.menu-reason',
  '.menu-subtitle',
  '.hero-continue',
  '.op-prose p',
];

export interface KitContrast { element: string; text: string; ratio: number; worst: string }

/** Every visible kit key and lamp: its live text against the face it sits on (face rasterised at the rendered size, central band sampled). */
export async function measureKitContrast(page: Page): Promise<KitContrast[]> {
  return page.evaluate(async () => {
    const parse = (color: string): [number, number, number] => {
      const m = /rgba?\(([^)]+)\)/.exec(color);
      if (!m) return [0, 0, 0];
      const p = m[1]!.split(',').map((x) => parseFloat(x));
      return [p[0]!, p[1]!, p[2]!];
    };
    const lum = (r: number, g: number, b: number): number => {
      const f = (c: number) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
    };
    const cache = new Map<string, HTMLImageElement>();
    const load = async (url: string): Promise<HTMLImageElement> => {
      let img = cache.get(url);
      if (img) return img;
      img = new Image();
      img.src = url;
      await img.decode();
      cache.set(url, img);
      return img;
    };
    const out: { element: string; text: string; ratio: number; worst: string }[] = [];
    const els = Array.from(document.querySelectorAll<HTMLElement>('.k, .lamp'));
    for (const el of els) {
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden') continue;
      const b = el.getBoundingClientRect();
      if (b.width < 4 || b.height < 4) continue;
      const m = /url\("?([^")]+)"?\)/.exec(cs.backgroundImage);
      if (!m) continue;
      const img = await load(m[1]!);
      const w = Math.max(8, Math.round(b.width)), h = Math.max(8, Math.round(b.height));
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      // Sample exactly where the legend sits: the bounding box of the control's own text (or its glyph), inset by a pixel.
      const range = document.createRange();
      range.selectNodeContents(el);
      let t = range.getBoundingClientRect();
      if (t.width < 2 || t.height < 2) { const g = el.querySelector('svg'); if (g) t = g.getBoundingClientRect(); }
      if (t.width < 2 || t.height < 2) continue;
      // Glyph ink occupies the middle of a line box (cap height); the top and bottom 15 % of the box carry no legend ink.
      const inset = t.height * 0.15;
      const x0 = Math.max(0, Math.round(t.left - b.left) + 1), x1 = Math.min(w, Math.round(t.right - b.left) - 1);
      const y0 = Math.max(0, Math.round(t.top - b.top + inset)), y1 = Math.min(h, Math.round(t.bottom - b.top - inset));
      if (x1 <= x0 || y1 <= y0) continue;
      const data = ctx.getImageData(x0, y0, x1 - x0, y1 - y0).data;
      const [tr, tg, tb] = parse(cs.color);
      const textL = lum(tr, tg, tb);
      let worstRatio = Infinity; let worst = '';
      for (let i = 0; i < data.length; i += 4) {
        const L = lum(data[i]!, data[i + 1]!, data[i + 2]!);
        const ratio = (Math.max(textL, L) + 0.05) / (Math.min(textL, L) + 0.05);
        if (ratio < worstRatio) { worstRatio = ratio; worst = `rgb(${data[i]},${data[i + 1]},${data[i + 2]})`; }
      }
      const id = el.getAttribute('data-testid') ?? el.getAttribute('data-action') ?? el.className;
      out.push({ element: `${id}${el.hasAttribute('disabled') ? ' [disabled]' : ''}${el.getAttribute('aria-pressed') === 'true' ? ' [selected]' : ''}`, text: (el.textContent ?? '').trim().slice(0, 30), ratio: Math.round(worstRatio * 100) / 100, worst });
    }
    return out;
  });
}

export async function assertKitContrast(page: Page, minimum = 4.5): Promise<KitContrast[]> {
  const results = await measureKitContrast(page);
  for (const r of results) expect(r.ratio, `kit control ${r.element} "${r.text}" against ${r.worst}`).toBeGreaterThanOrEqual(minimum);
  return results;
}

/** The full face × ink table for the theme (every family and state, both lamps), independent of what is on screen. */
export async function kitFaceTable(page: Page): Promise<{ face: string; ink: string; ratio: number; worst: string }[]> {
  return page.evaluate(async () => {
    const root = getComputedStyle(document.documentElement);
    const parseColor = (v: string): [number, number, number] => {
      const s = v.trim();
      const m = /^#([0-9a-f]{6})$/i.exec(s);
      if (m) return [parseInt(m[1]!.slice(0, 2), 16), parseInt(m[1]!.slice(2, 4), 16), parseInt(m[1]!.slice(4, 6), 16)];
      const r = /rgba?\(([^)]+)\)/.exec(s);
      if (r) { const p = r[1]!.split(',').map((x) => parseFloat(x)); return [p[0]!, p[1]!, p[2]!]; }
      return [0, 0, 0];
    };
    const lum = (r: number, g: number, b: number): number => {
      const f = (c: number) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
    };
    const inks: Record<string, string> = { key: '--key-ink', arrow: '--key-ink', action: '--action-ink', selector: '--action-ink' };
    const combos: { face: string; ink: string; w: number; h: number; band: [number, number] }[] = [];
    for (const fam of ['key', 'action', 'selector', 'arrow']) for (const st of ['default', 'hover', 'pressed', 'selected', 'disabled']) {
      const dark = fam === 'key' || fam === 'arrow';
      const ink = st === 'selected' ? '--selected-ink' : st === 'disabled' ? (dark ? '--disabled-ink-dark' : '--disabled-ink') : inks[fam]!;
      // The legend band: inside the face, clear of the bevel highlight at the top and the shadow line at the bottom.
      combos.push({ face: `--face-${fam}-${st}`, ink, w: fam === 'arrow' ? 88 : fam === 'action' ? 320 : 240, h: 88, band: [0.27, 0.65] });
    }
    for (const lamp of ['historical', 'alternate']) combos.push({ face: `--lamp-${lamp}`, ink: '--mode-ink', w: 360, h: 60, band: [0.25, 0.75] });
    const out: { face: string; ink: string; ratio: number; worst: string }[] = [];
    for (const c of combos) {
      const url = /url\("?([^")]+)"?\)/.exec(root.getPropertyValue(c.face))?.[1];
      if (!url) { out.push({ face: c.face, ink: c.ink, ratio: 0, worst: 'no face' }); continue; }
      const img = new Image();
      img.src = url;
      await img.decode();
      const canvas = document.createElement('canvas');
      canvas.width = c.w; canvas.height = c.h;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, c.w, c.h);
      ctx.drawImage(img, 0, 0, c.w, c.h);
      const arrow = c.face.includes('arrow');
      const lamp = c.face.includes('lamp'); // the legend sits to the right of the lamp's etched mark
      const x0 = Math.round(c.w * (arrow ? 0.25 : lamp ? 0.16 : 0.12)), x1 = Math.round(c.w * (arrow ? 0.75 : 0.88)), y0 = Math.round(c.h * c.band[0]), y1 = Math.round(c.h * c.band[1]);
      const data = ctx.getImageData(x0, y0, x1 - x0, y1 - y0).data;
      const [tr, tg, tb] = parseColor(root.getPropertyValue(c.ink));
      const textL = lum(tr, tg, tb);
      let worstRatio = Infinity; let worst = '';
      for (let i = 0; i < data.length; i += 4) {
        const L = lum(data[i]!, data[i + 1]!, data[i + 2]!);
        const ratio = (Math.max(textL, L) + 0.05) / (Math.min(textL, L) + 0.05);
        if (ratio < worstRatio) { worstRatio = ratio; worst = `rgb(${data[i]},${data[i + 1]},${data[i + 2]})`; }
      }
      out.push({ face: c.face, ink: c.ink, ratio: Math.round(worstRatio * 100) / 100, worst });
    }
    return out;
  });
}

/** Every image on the page, the plate, and every control face is a manifest file (hash-stripped basename). */
export async function assertManifestImagesOnly(page: Page): Promise<void> {
  const srcs = await page.locator('img').evaluateAll((imgs) => imgs.map((i) => (i as HTMLImageElement).getAttribute('src') ?? ''));
  expect(srcs.length).toBeGreaterThan(0);
  for (const s of srcs) {
    const base = unhash(decodeURIComponent(s.split('/').pop() ?? ''));
    expect(MANIFEST_FILES.has(base), `image ${s} is not in assets/manifest.json`).toBe(true);
  }
  const plateSrc = await page.getByTestId('plate').getAttribute('src');
  expect(unhash((plateSrc ?? '').split('/').pop() ?? '')).toBe('fno_gemini_room_console_forward_v001.png');
  const faces = await page.locator('.k, .lamp').evaluateAll((els) => els.map((el) => /url\("?([^")]+)"?\)/.exec(getComputedStyle(el).backgroundImage)?.[1] ?? ''));
  for (const f of faces) {
    if (!f) continue;
    const base = unhash(decodeURIComponent(f.split('/').pop() ?? ''));
    expect(MANIFEST_FILES.has(base), `control face ${f} is not in assets/manifest.json`).toBe(true);
  }
}

/** All of the above at a room screenshot point (console or hero). */
export async function assertRoomVisible(page: Page): Promise<{ text: ContrastResult[]; kit: KitContrast[] }> {
  await page.getByTestId('plate').waitFor({ state: 'attached' });
  await page.evaluate(() => (document.getElementById('plate') as HTMLImageElement).decode().catch(() => undefined));
  await assertEmblemPlaced(page);
  // A modal overlay (About, History, Binder, Save / Load, Settings) legitimately covers the room; the clear-zone rule is for the play layout.
  if ((await page.locator('.overlay-backdrop').count()) === 0) await assertGlenUncovered(page);
  const text = await assertTextContrast(page, TEXT_SAMPLES);
  const kit = await assertKitContrast(page);
  await assertManifestImagesOnly(page);
  return { text, kit };
}
