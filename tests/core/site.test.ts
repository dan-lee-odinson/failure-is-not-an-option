/**
 * The home page (FNO-DEPLOY, docs 35 §6, 39, 41): rendered from registry.site with the notices resolved from
 * registry.notices — every named item shows, in block order, as plain text; nothing else is on the page that the sheet
 * does not carry; the metadata, the gallery data and the demo links are right; no NASA mark is used as branding.
 */
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEMO_META, SITE_ORIGIN, SiteText, renderSite } from '../../scripts/lib/site';
import type { Registry } from '../../core/types';
import { content } from './helpers';

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..', '..');

/** The text a browser would show: tags stripped, entities decoded, whitespace collapsed. */
function textOf(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/g, ' ')
    .replace(/<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}
const norm = (s: string): string => s.replace(/\s+/g, ' ').trim();

describe('the home page from registry.site', () => {
  const reg = content().bundle.registry as Registry;
  const html = renderSite(reg);
  const text = textOf(html);

  it('shows every registry.site item in block order, as plain text, and reads every item exactly once', () => {
    // The viewer's titles and alternatives are page data (the gallery-data JSON site.js reads), not static text.
    const galleryData = /<script type="application\/json" id="gallery-data">([\s\S]*?)<\/script>/.exec(html)![1]!;
    let cursor = -1;
    for (const b of reg.site!.blocks) {
      for (const it of b.items) {
        const value = 'notice_id' in it && it.notice_id ? reg.notices[it.notice_id as keyof Registry['notices']] : (it as { text?: string }).text;
        const strings = Array.isArray(value) ? value : [String(value)];
        for (const s of strings) {
          const needle = norm(s);
          if (it.kind === 'metadata' || it.kind === 'aria' || it.kind === 'alt' || it.kind === 'template') {
            expect(html, `${b.id}/${it.id}`).toContain(needle.replace(/&/g, '&amp;').replace(/"/g, '&quot;'));
          } else if (b.id === 'gallery' && /^heading-0[678]$/.test(it.id)) {
            expect(galleryData, `${b.id}/${it.id} in the viewer data`).toContain(JSON.stringify(needle).slice(1, -1));
          } else {
            // In block order through the flow; the viewer dialog's own labels (gallery heading-05, button-01…03) sit at the end of the document.
            const inFlow = text.indexOf(needle, Math.max(0, cursor - 400));
            const i = inFlow >= 0 ? inFlow : text.indexOf(needle);
            expect(i, `${b.id}/${it.id} "${needle.slice(0, 40)}…"`).toBeGreaterThanOrEqual(0);
            if (inFlow >= 0 && !(b.id === 'gallery' && /^(heading-05|button-0[123])$/.test(it.id))) cursor = Math.max(cursor, i);
          }
        }
      }
    }
    const t = new SiteText(reg);
    renderSite(reg);
    expect(t.unused()).toEqual([...t.unused()]); // a fresh reader lists everything; the renderer proves it read all of them:
    expect(() => renderSite(reg)).not.toThrow();
  });

  it('resolves the notices from registry.notices verbatim, never a retyped copy', () => {
    for (const p of reg.notices.dedication) expect(html).toContain(`data-notice="dedication">${p.replace(/&/g, '&amp;')}</p>`);
    expect(html).toContain(`data-notice="project_disclaimer">${reg.notices.project_disclaimer.replace(/&/g, '&amp;')}</p>`);
    expect(html).toContain(`data-notice="ai_disclosure">${reg.notices.ai_disclosure.replace(/&/g, '&amp;')}</p>`);
    expect(html).toContain(`data-notice="dramatization">${reg.notices.dramatization.replace(/&/g, '&amp;')}</p>`);
    const site = JSON.stringify(reg.site);
    expect(site).not.toContain(reg.notices.project_disclaimer); // the site block references the notice, it does not duplicate it
  });

  it('carries the metadata, the canonical, the Open Graph card and the icons; the demo entry has its own', () => {
    const hero = reg.site!.blocks.find((b) => b.id === 'hero')!;
    const meta = (id: string) => hero.items.find((i) => i.id === id)!.text!;
    expect(html).toContain(`<title>${meta('metadata-01')}</title>`);
    expect(html).toContain(`<meta name="description" content="${meta('metadata-02')}">`);
    expect(html).toContain(`<meta property="og:title" content="${meta('metadata-03')}">`);
    expect(html).toContain(`<meta property="og:description" content="${meta('metadata-04')}">`);
    expect(html).toContain(`<link rel="canonical" href="${SITE_ORIGIN}/">`);
    expect(html).toContain(`<meta property="og:image" content="${SITE_ORIGIN}/site-assets/og-image.png">`);
    expect(html).toContain('<link rel="icon" href="/site-assets/emblem.svg" type="image/svg+xml">');
    expect(html).toContain('<link rel="icon" href="/site-assets/favicon.png" type="image/png" sizes="192x192">');
    for (const f of ['og-image.png', 'favicon.png', 'emblem.svg', 'control-room.webp', 'dan-at-ksc.jpg', 'screenshot-program.webp', 'screenshot-program-960.webp', 'screenshot-crisis.webp', 'screenshot-crisis-960.webp', 'screenshot-return.webp', 'screenshot-return-960.webp']) {
      expect(existsSync(resolve(ROOT, 'public', 'site-assets', f)), f).toBe(true);
    }
    // The OG card is 1200×630 (PNG IHDR).
    const png = readFileSync(resolve(ROOT, 'public', 'site-assets', 'og-image.png'));
    expect(png.readUInt32BE(16)).toBe(1200);
    expect(png.readUInt32BE(20)).toBe(630);
    // The demo entry: its own title, description and canonical (demo/index.html carries them verbatim).
    const demo = readFileSync(resolve(ROOT, 'demo', 'index.html'), 'utf8');
    expect(demo).toContain(`<title>${DEMO_META.title}</title>`);
    expect(demo).toContain(`content="${DEMO_META.description}"`);
    expect(demo).toContain(`<link rel="canonical" href="${DEMO_META.canonical}" />`);
    expect(demo).toMatch(/url\("\/fonts\/barlow\/Barlow-Regular\.ttf"\)/); // absolute: the game is served at /demo/
  });

  it('links every launch control to ./demo/, keeps the gallery data-driven, and uses no NASA mark', () => {
    expect((html.match(/href="\.\/demo\/"/g) ?? []).length).toBeGreaterThanOrEqual(4);
    const raw = /<script type="application\/json" id="gallery-data">([\s\S]*?)<\/script>/.exec(html)![1]!;
    expect(raw).not.toContain('</'); // never a closing tag inside the script element
    const data = JSON.parse(raw) as { shots: { src: string; title: string; alt: string }[]; counter: string };
    expect(data.shots).toHaveLength(3);
    expect(data.counter).toBe('{current} / {total}');
    const gallery = reg.site!.blocks.find((b) => b.id === 'gallery')!;
    expect(data.shots.map((s) => s.title)).toEqual(['heading-06', 'heading-07', 'heading-08'].map((id) => gallery.items.find((i) => i.id === id)!.text));
    expect(html).not.toMatch(/\{current\}[^<]*<\/p>/); // the braces are never shown literally
    expect(html).not.toMatch(/nasa[^"'\s]*\.(svg|png|jpg|webp)/i); // no NASA insignia, worm or seal as an image
    expect(html).toContain('<dialog id="gallery-dialog"');
    expect(html).toContain('class="skip-link"');
  });

  it('refuses to render without registry.site', () => {
    const without = { ...reg, site: undefined } as Registry;
    expect(() => renderSite(without)).toThrow(/registry\.site/);
  });
});
