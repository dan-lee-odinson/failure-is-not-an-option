/**
 * Home-page helpers (FNO-DEPLOY): the widths the page is checked at, the text samples, and a contrast sampler that
 * composites the hero art with the page's own gradients (the same way room.ts composites the room plate) so the text
 * over the picture is measured against what is really behind it.
 */
import { expect, type Page } from '@playwright/test';

export const SITE_WIDTHS = [
  { name: 'desktop-1920', width: 1920, height: 1080 },
  { name: 'laptop-1366', width: 1366, height: 768 },
  { name: 'tablet-1024', width: 1024, height: 1366 },
  { name: 'phone-390', width: 390, height: 844 },
] as const;

/** One element of every text style on the page. */
export const SITE_TEXT_SAMPLES = [
  '.masthead .brand > span', '.masthead .brand-sub', '.masthead nav a', '.masthead .nav-demo',
  '.hero .eyebrow', '.hero h1', '.hero h1 .title-middle', '.hero-deck', '.hero .launch span', '.hero .text-link', '.hero-note', '.hero-footer span',
  '.game-section .eyebrow', '.game-section h2', '.game-section h2 span', '.game-copy .lead', '.game-copy p:not(.lead)', '.principles .number', '.principles h3', '.principles p',
  '.demo-copy .eyebrow', '.demo-copy h2', '.demo-copy h2 span', '.demo-copy > p', '.demo-copy .launch span', '.demo-copy .small', '.demo-figure figcaption span',
  '.gallery-heading .eyebrow', '.gallery-heading h2', '.gallery-heading > p', '.gallery-grid h3', '.gallery-grid figcaption p', '.gallery-grid .number',
  '.coming-inner .eyebrow', '.coming-inner h2', '.coming-inner h2 span', '.coming-inner p:not(.eyebrow)', '.coming-inner .text-link',
  '.dev-copy .eyebrow', '.dev-copy h2', '.dev-intro', '.dev-copy p:not(.dev-intro):not(.tribute)', '.tribute', '.dev-photo figcaption', '.social-links a',
  '.notices-section .eyebrow', '.notices-section h2', '.dedication', '.notices-section > div > p:last-child', 'summary', 'details p', 'details a',
  '.footer-title', '.footer span', '.footer a:not(.footer-title)',
];

export interface SiteContrast { selector: string; ratio: number; worst: string; color: string; /** WCAG large text: >= 24 px, or >= 18.66 px bold */ large: boolean }

/** WCAG contrast of each sample's text against its real backdrop: the page ground, the hero art under `object-fit: cover`, the hero's two gradients, then the ancestors' backgrounds. */
export async function measureSiteContrast(page: Page, selectors: string[]): Promise<SiteContrast[]> {
  return page.evaluate(({ selectors }) => {
    const parse = (color: string): [number, number, number, number] => {
      const m = /rgba?\(([^)]+)\)/.exec(color);
      if (!m) return [0, 0, 0, 0];
      const p = m[1]!.split(/[\s,\/]+/).map((x) => parseFloat(x));
      return [p[0]!, p[1]!, p[2]!, p.length >= 4 && !Number.isNaN(p[3]!) ? p[3]! : 1];
    };
    const lum = (r: number, g: number, b: number): number => {
      const f = (c: number) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
    };
    const N = 48;
    const canvas = document.createElement('canvas');
    canvas.width = N; canvas.height = N;
    const ctx = canvas.getContext('2d')!;
    const ground = parse(getComputedStyle(document.body).backgroundColor);
    const hero = document.querySelector<HTMLElement>('.hero');
    const art = document.querySelector<HTMLImageElement>('.hero-art');
    const out: { selector: string; ratio: number; worst: string; color: string; large: boolean }[] = [];
    for (const selector of selectors) {
      const el = document.querySelector<HTMLElement>(selector);
      if (!el) continue;
      // The text's own line boxes, not the block box: a flex eyebrow or a heading spans the hero while its words sit on the scrim.
      const range = document.createRange();
      range.selectNodeContents(el);
      const rr = range.getBoundingClientRect();
      const b = rr.width > 0 && rr.height > 0 ? rr : el.getBoundingClientRect();
      if (b.width === 0 || b.height === 0) continue;
      const x0 = b.left, y0 = b.top, x1 = b.right, y1 = b.bottom;
      ctx.globalAlpha = 1;
      ctx.fillStyle = `rgb(${ground[0]},${ground[1]},${ground[2]})`;
      ctx.fillRect(0, 0, N, N);
      const inHero = hero && el.closest('.hero') === hero;
      if (inHero && art && art.naturalWidth) {
        // The art under object-fit: cover at object-position (62% or 45%) center, then the hero's gradients.
        const hb = hero.getBoundingClientRect();
        const scale = Math.max(hb.width / art.naturalWidth, hb.height / art.naturalHeight);
        const w = art.naturalWidth * scale, h = art.naturalHeight * scale;
        const pos = getComputedStyle(art).objectPosition.split(' ');
        const px = parseFloat(pos[0] ?? '50%') / 100, py = parseFloat(pos[1] ?? '50%') / 100;
        const left = hb.left + (hb.width - w) * px, top = hb.top + (hb.height - h) * (Number.isNaN(py) ? 0.5 : py);
        const sx = (x0 - left) / w * art.naturalWidth, sy = (y0 - top) / h * art.naturalHeight, sw = (x1 - x0) / w * art.naturalWidth, sh = (y1 - y0) / h * art.naturalHeight;
        ctx.drawImage(art, sx, sy, sw, sh, 0, 0, N, N);
        // The ::before gradients (styles.css): horizontal dark-to-clear, then vertical ground fade; drawn for this box's slice of the hero.
        const before = getComputedStyle(hero, '::before').backgroundImage;
        const narrow = hb.width <= 760;
        const hg = ctx.createLinearGradient(hb.left - x0, 0, hb.left - x0 + hb.width, 0);
        const scaleX = N / (x1 - x0);
        const hg2 = ctx.createLinearGradient((hb.left - x0) * scaleX, 0, (hb.left - x0 + hb.width) * scaleX, 0);
        const vg = ctx.createLinearGradient(0, (hb.bottom - y0) * (N / (y1 - y0)), 0, (hb.top - y0) * (N / (y1 - y0)));
        if (narrow) {
          hg2.addColorStop(0, 'rgba(3,16,20,0.93)'); hg2.addColorStop(0.63, 'rgba(3,16,20,0.68)'); hg2.addColorStop(1, 'rgba(3,16,20,0.44)');
          vg.addColorStop(0, '#05171b'); vg.addColorStop(0.7, 'rgba(5,23,27,0)'); vg.addColorStop(1, 'rgba(5,23,27,0)');
        } else {
          hg2.addColorStop(0, 'rgba(3,16,20,0.97)'); hg2.addColorStop(0.36, 'rgba(3,16,20,0.82)'); hg2.addColorStop(0.82, 'rgba(3,16,20,0.12)'); hg2.addColorStop(1, 'rgba(3,16,20,0.12)');
          vg.addColorStop(0, '#05171b'); vg.addColorStop(0.27, 'rgba(5,23,27,0)'); vg.addColorStop(0.85, 'rgba(3,16,20,0.1)'); vg.addColorStop(1, 'rgba(3,16,20,0.1)');
        }
        void hg; void before;
        ctx.fillStyle = vg; ctx.fillRect(0, 0, N, N);
        ctx.fillStyle = hg2; ctx.fillRect(0, 0, N, N);
      }
      const data = ctx.getImageData(0, 0, N, N).data;
      const tints: [number, number, number, number][] = [];
      for (let node: HTMLElement | null = el; node && node !== document.body; node = node.parentElement) {
        if (node.classList.contains('hero')) continue; // the hero's own colour is under the art
        const [r, g, bb, a] = parse(getComputedStyle(node).backgroundColor);
        if (a > 0) tints.unshift([r, g, bb, a]);
        const bg = getComputedStyle(node).backgroundImage;
        const gm = /linear-gradient\((#[0-9a-f]{6}|rgba?\([^)]*\)), ?(#[0-9a-f]{6}|rgba?\([^)]*\))\)/.exec(bg);
        if (gm && node.classList.contains('launch')) {
          // The amber key face: a two-stop gradient; take the darker stop as the worst case.
          const hex = (s: string): [number, number, number, number] => s.startsWith('#') ? [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16), 1] : parse(s);
          const a1 = hex(gm[1]!), a2 = hex(gm[2]!);
          tints.unshift(lum(a1[0], a1[1], a1[2]) < lum(a2[0], a2[1], a2[2]) ? a1 : a2);
        }
        if (node.classList.contains('launch') && bg.includes('apollo-action')) tints.unshift([225, 190, 105, 1]); // the kit's action face (SVG): its darkest field
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
      const cs = getComputedStyle(el);
      const px = parseFloat(cs.fontSize), bold = parseInt(cs.fontWeight, 10) >= 700;
      out.push({ selector, ratio: Math.round(worstRatio * 100) / 100, worst, color: `rgb(${tr},${tg},${tb})`, large: px >= 24 || (bold && px >= 18.66) });
    }
    return out;
  }, { selectors });
}

export async function assertSiteContrast(page: Page, minimum = 4.5): Promise<SiteContrast[]> {
  const results = await measureSiteContrast(page, SITE_TEXT_SAMPLES);
  expect(results.length, 'site text samples found').toBeGreaterThan(30);
  // Body text and controls at `minimum` (4.5:1); the display title over the hero art at WCAG AA's large-text 3:1.
  for (const r of results) expect(r.ratio, `${r.selector} ${r.color} on ${r.worst}${r.large ? ' (large text)' : ''}`).toBeGreaterThanOrEqual(r.large ? Math.min(minimum, 3) : minimum);
  return results;
}
