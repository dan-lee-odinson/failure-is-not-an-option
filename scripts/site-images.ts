/**
 * `npm run site-images`
 *
 * Exports the two site images that are not authored art: the Open Graph card (1200×630, the hero title lockup in
 * Chakra Petch over the control-room plate under the home page's own gradients — live text at export time, no NASA
 * marks) and the PNG favicon (192×192) rasterised from the approved emblem SVG. Rendered with the repository's
 * Playwright Chromium and written under public/site-assets/. Deterministic inputs; re-run after the plate, the emblem
 * or the title text change. The manifest rules hold: the plate is the room asset the game uses.
 */
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const root = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const out = resolve(root, 'public', 'site-assets');
mkdirSync(out, { recursive: true });
const registry = JSON.parse(readFileSync(resolve(root, 'content', 'registry.json'), 'utf8')) as { site?: { blocks: { id: string; items: { id: string; text?: string }[] }[] } };
const hero = registry.site?.blocks.find((b) => b.id === 'hero');
const title = hero?.items.find((i) => i.id === 'heading-01')?.text ?? 'FAILURE IS NOT AN OPTION';
const deck = hero?.items.find((i) => i.id === 'paragraph-02')?.text ?? '';
const note = hero?.items.find((i) => i.id === 'paragraph-03')?.text ?? '';
// The pages are written next to the assets and opened as files, so their file: resources load (an about:blank page may not read them).
const font = (f: string) => `../fonts/${f}`;
const asset = (f: string) => `./${f}`;
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const m = /^(FAILURE)\s+(IS NOT AN)\s+(OPTION)$/.exec(title);
const lockup = m ? `${m[1]}<span>${m[2]}</span>${m[3]}` : esc(title);

const og = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face { font-family: 'Chakra Petch'; src: url('${font('chakrapetch/ChakraPetch-Bold.ttf')}'); font-weight: 700; }
@font-face { font-family: 'Barlow'; src: url('${font('barlow/Barlow-Regular.ttf')}'); font-weight: 400; }
@font-face { font-family: 'Barlow Condensed'; src: url('${font('barlowcondensed/BarlowCondensed-Bold.ttf')}'); font-weight: 700; }
html, body { margin: 0; width: 1200px; height: 630px; overflow: hidden; background: #05171b; color: #f2edda; }
.card { position: relative; width: 1200px; height: 630px; isolation: isolate; }
.art { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: 62% center; z-index: -2; }
.card::before { content: ''; position: absolute; inset: 0; z-index: -1; background: linear-gradient(90deg, rgba(3,16,20,.97), rgba(3,16,20,.82) 40%, rgba(3,16,20,.15) 85%), linear-gradient(0deg, #05171b 0%, transparent 30%); }
.copy { position: absolute; left: 72px; top: 56px; right: 320px; }
.eyebrow { font: 700 22px/1.3 'Barlow Condensed'; letter-spacing: .16em; color: #e0a63a; margin: 0 0 22px; }
h1 { margin: 0; font: 700 122px/.86 'Chakra Petch'; letter-spacing: -.055em; max-width: 700px; }
h1 span { display: block; font-size: .61em; letter-spacing: .055em; line-height: 1.24; color: #e0a63a; }
.deck { margin: 26px 0 0; font: 400 28px/1.35 'Barlow'; max-width: 640px; }
.note { position: absolute; left: 72px; bottom: 40px; font: 700 20px/1.4 'Barlow Condensed'; letter-spacing: .12em; color: #bbc6bd; }
.emblem { position: absolute; right: 64px; bottom: 44px; width: 96px; height: 128px; }
</style></head><body><div class="card"><img class="art" src="${asset('control-room.webp')}" alt=""><div class="copy"><p class="eyebrow">MISSION CONTROL IS YOURS</p><h1>${lockup}</h1><p class="deck">${esc(deck)}</p></div><p class="note">${esc(note.toUpperCase())}</p><img class="emblem" src="${asset('emblem.svg')}" alt=""></div></body></html>`;

const favicon = `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;background:transparent}body{width:192px;height:192px;display:grid;place-items:center}img{width:144px;height:192px;object-fit:contain}</style></head><body><img src="${asset('emblem.svg')}" alt=""></body></html>`;

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  const ogFile = resolve(out, '.og-image.html');
  const favFile = resolve(out, '.favicon.html');
  writeFileSync(ogFile, og);
  writeFileSync(favFile, favicon);
  try {
    await page.goto(pathToFileURL(ogFile).href, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForFunction(() => Array.from(document.images).every((i) => i.complete && i.naturalWidth > 0));
    writeFileSync(resolve(out, 'og-image.png'), await page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: 1200, height: 630 } }));
    await page.setViewportSize({ width: 192, height: 192 });
    await page.goto(pathToFileURL(favFile).href, { waitUntil: 'load' });
    await page.waitForFunction(() => Array.from(document.images).every((i) => i.complete && i.naturalWidth > 0));
    writeFileSync(resolve(out, 'favicon.png'), await page.screenshot({ type: 'png', omitBackground: true, clip: { x: 0, y: 0, width: 192, height: 192 } }));
  } finally {
    rmSync(ogFile, { force: true });
    rmSync(favFile, { force: true });
  }
  console.log('site-images: wrote public/site-assets/og-image.png (1200×630) and favicon.png (192×192)');
} finally {
  await browser.close();
}
