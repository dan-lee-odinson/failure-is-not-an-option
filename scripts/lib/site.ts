/**
 * The home page (finaogame.com/), rendered from `registry.site` (content 0.5.4, doc 41) with the notices resolved from
 * `registry.notices`. The layout, classes, styles and assets are Codex's homepage v001 (docs/deploy-inputs/homepage-v001/,
 * doc 39); every visible string, alternative text, accessibility label and metadata value comes from the registry by
 * (block id, item id), so the dialogue sheet's site section is exactly what the page shows. Text is plain text, escaped;
 * only the presentation (line breaks inside a heading, a link's destination) is decided here.
 *
 * Used by vite.config.ts (the root index.html is generated at dev and build time) and by the tests.
 */
import type { Registry, SiteBlockId, SiteItem } from '../../core/types';
import { ITCH_URL } from '../../app/links';

export const SITE_ORIGIN = 'https://finaogame.com';
export const DEMO_HREF = './demo/';
/** Link destinations the presentation supplies for two paragraphs that are links in v001 (the registry carries their text). */
const PRESENTATION_LINKS: Record<string, string> = {
  'nasa_marks/paragraph-03': 'https://www.nasa.gov/nasa-brand-center/images-and-media/',
  'open_source/paragraph-02': 'https://github.com/dan-lee-odinson',
};
/** The coming-soon block's second link (FNO-DEMO-END): the game's itch.io page, text and destination both presentation constants, so registry.site is unchanged; on the sheet's site section as app copy. */
export const FOLLOW_LINK = { text: 'Follow on itch.io ↗', href: ITCH_URL } as const;
/** The screenshots of the gallery in order, with the 960-px inline versions (public/site-assets/, from homepage v001). */
const SHOTS = [
  { full: '/site-assets/screenshot-program.webp', small: '/site-assets/screenshot-program-960.webp' },
  { full: '/site-assets/screenshot-crisis.webp', small: '/site-assets/screenshot-crisis-960.webp' },
  { full: '/site-assets/screenshot-return.webp', small: '/site-assets/screenshot-return-960.webp' },
] as const;

export function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export class SiteText {
  private readonly items = new Map<string, SiteItem>();
  readonly used = new Set<string>();
  constructor(readonly registry: Registry) {
    for (const b of registry.site?.blocks ?? []) for (const it of b.items) this.items.set(`${b.id}/${it.id}`, it);
  }
  has(block: SiteBlockId, id: string): boolean {
    return this.items.has(`${block}/${id}`);
  }
  /** The item's text (a notice item resolves through registry.notices; the dedication joins its paragraphs with a newline). */
  text(block: SiteBlockId, id: string): string {
    const key = `${block}/${id}`;
    const it = this.items.get(key);
    if (!it) throw new Error(`registry.site: no item ${key}`);
    this.used.add(key);
    if ('notice_id' in it && it.notice_id) {
      const n = this.registry.notices[it.notice_id as keyof Registry['notices']];
      return Array.isArray(n) ? n.join('\n') : String(n);
    }
    return (it as { text?: string }).text ?? '';
  }
  /** The notice paragraphs of a notice item (the dedication is two). */
  notice(block: SiteBlockId, id: string): string[] {
    return this.text(block, id).split('\n');
  }
  href(block: SiteBlockId, id: string): string {
    const it = this.items.get(`${block}/${id}`);
    const h = (it as { href?: string } | undefined)?.href ?? PRESENTATION_LINKS[`${block}/${id}`];
    if (!h) throw new Error(`registry.site: item ${block}/${id} has no link destination`);
    return h;
  }
  /** Every (block/item) key the renderer never read: the test proves this is empty. */
  unused(): string[] {
    return [...this.items.keys()].filter((k) => !this.used.has(k));
  }
}

/** A heading split for the layout: the part after `prefix` goes into a block-level span, the text content unchanged. */
function split(text: string, prefix: string, cls = ''): string {
  if (!text.startsWith(prefix) || text.length === prefix.length) return esc(text);
  const rest = text.slice(prefix.length).trim();
  return `${esc(prefix.trim())} <span${cls ? ` class="${cls}"` : ''}>${esc(rest)}</span>`;
}

/** A line break at a sentence boundary the v001 layout breaks at; plain text if the boundary is absent. */
function br(text: string, after: string): string {
  const i = text.indexOf(after);
  if (i < 0) return esc(text);
  const cut = i + after.length;
  return `${esc(text.slice(0, cut))} <br>${esc(text.slice(cut).trim())}`; // the space keeps the text content whole
}

/** "Play the demo ↗": the arrow glyph is decorative, hidden from assistive technology as in v001. */
function arrow(text: string): string {
  const m = /^(.*?)\s*([↗↓×←→])$/.exec(text);
  if (!m) return esc(text);
  return `${esc(m[1]!)} <span aria-hidden="true">${esc(m[2]!)}</span>`;
}
function arrowLead(text: string): string {
  const m = /^([←→])\s*(.*)$/.exec(text);
  if (!m) return esc(text);
  return `<span aria-hidden="true">${esc(m[1]!)}</span> ${esc(m[2]!)}`;
}

export interface SiteRenderOptions {
  /** `/site/styles.css` and `/site/site.js` in the source tree; Vite rewrites them at build time. */
  stylesheet?: string;
  script?: string;
}

/** The whole document for finaogame.com/. */
export function renderSite(registry: Registry, opts: SiteRenderOptions = {}): string {
  const t = new SiteText(registry);
  if (!registry.site) throw new Error('registry.site is absent: the home page cannot be rendered');
  const stylesheet = opts.stylesheet ?? '/site/styles.css';
  const script = opts.script ?? '/site/site.js';
  const galleryData = {
    shots: [
      { src: SHOTS[0].full, title: t.text('gallery', 'heading-06'), alt: t.text('gallery', 'alt-04') },
      { src: SHOTS[1].full, title: t.text('gallery', 'heading-07'), alt: t.text('gallery', 'alt-05') },
      { src: SHOTS[2].full, title: t.text('gallery', 'heading-08'), alt: t.text('gallery', 'alt-06') },
    ],
    counter: t.text('gallery', 'template-01'),
  };
  const figure = (n: 0 | 1 | 2, aria: string, link: string, alt: string, label: string, heading: string, para: string, klass = ''): string => `
        <figure${klass ? ` class="${klass}"` : ''}><a class="shot-link" href="${SHOTS[n].full}" data-gallery="${n}" aria-label="${esc(aria)}"><img src="${SHOTS[n].small}" width="960" height="540" loading="lazy" alt="${esc(alt)}"><span class="enlarge" aria-hidden="true">${arrow(link)}</span></a><figcaption><span class="number">${esc(label)}</span><div><h3>${esc(heading)}</h3><p>${esc(para)}</p></div></figcaption></figure>`;

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#05171b">
  <title>${esc(t.text('hero', 'metadata-01'))}</title>
  <meta name="description" content="${esc(t.text('hero', 'metadata-02'))}">
  <link rel="canonical" href="${SITE_ORIGIN}/">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${esc(t.text('hero', 'metadata-03'))}">
  <meta property="og:description" content="${esc(t.text('hero', 'metadata-04'))}">
  <meta property="og:url" content="${SITE_ORIGIN}/">
  <meta property="og:image" content="${SITE_ORIGIN}/site-assets/og-image.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${esc(t.text('hero', 'metadata-03'))}">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" href="/site-assets/emblem.svg" type="image/svg+xml">
  <link rel="icon" href="/site-assets/favicon.png" type="image/png" sizes="192x192">
  <link rel="apple-touch-icon" href="/site-assets/favicon.png">
  <link rel="preload" href="/fonts/chakrapetch/ChakraPetch-Bold.ttf" as="font" type="font/ttf" crossorigin>
  <link rel="preload" href="/site-assets/control-room.webp" as="image">
  <link rel="stylesheet" href="${stylesheet}">
  <script type="application/json" id="gallery-data">${JSON.stringify(galleryData).replace(/</g, '\\u003c')}</script>
  <script type="module" src="${script}"></script>
</head>
<body>
  <a class="skip-link" href="${esc(t.href('hero', 'link-01'))}">${esc(t.text('hero', 'link-01'))}</a>
  <header class="masthead">
    <a class="brand" href="${esc(t.href('hero', 'link-02'))}" aria-label="${esc(t.text('hero', 'aria-01'))}"><img src="/site-assets/emblem.svg" width="36" height="48" alt=""><span>${split(t.text('hero', 'link-02'), 'FAILURE IS NOT AN OPTION', 'brand-sub')}</span></a>
    <nav aria-label="${esc(t.text('hero', 'aria-02'))}"><a href="${esc(t.href('hero', 'link-03'))}">${esc(t.text('hero', 'link-03'))}</a><a href="${esc(t.href('hero', 'link-04'))}">${esc(t.text('hero', 'link-04'))}</a><a href="${esc(t.href('hero', 'link-05'))}">${esc(t.text('hero', 'link-05'))}</a><a class="nav-demo" href="${esc(t.href('hero', 'link-06'))}">${arrow(t.text('hero', 'link-06'))}</a></nav>
  </header>
  <main id="main">
    <section class="hero" id="top" aria-labelledby="game-title">
      <img class="hero-art" src="/site-assets/control-room.webp" width="1920" height="1080" alt="" fetchpriority="high">
      <div class="hero-content wrap">
        <p class="eyebrow"><span class="indicator" aria-hidden="true"></span> ${esc(t.text('hero', 'paragraph-01'))}</p>
        <h1 id="game-title">${(() => { const h = t.text('hero', 'heading-01'); const m = /^(FAILURE)\s+(IS NOT AN)\s+(OPTION)$/.exec(h); return m ? `${m[1]} <span class="title-middle">${m[2]}</span> ${m[3]}` : esc(h); })()}</h1>
        <p class="hero-deck">${br(t.text('hero', 'paragraph-02'), 'spacecraft.')}</p>
        <div class="hero-actions"><a class="launch" href="${esc(t.href('hero', 'link-07'))}"><span>${esc(t.text('hero', 'link-07').replace(/\s*↗$/, ''))}</span><span aria-hidden="true">↗</span></a><a class="text-link" href="${esc(t.href('hero', 'link-08'))}">${arrow(t.text('hero', 'link-08'))}</a></div>
        <p class="hero-note">${esc(t.text('hero', 'paragraph-03'))}</p>
      </div>
      <div class="hero-footer wrap"><span>${esc(t.text('hero', 'label-01'))}</span><span>${esc(t.text('hero', 'label-02'))}</span></div>
    </section>

    <section class="game-section wrap section" id="game" aria-labelledby="game-heading">
      <div class="section-intro"><p class="eyebrow">${esc(t.text('about', 'paragraph-01'))}</p><h2 id="game-heading">${split(t.text('about', 'heading-01'), 'History sets the scene.')}</h2></div>
      <div class="game-copy">
        <p class="lead">${esc(t.text('about', 'paragraph-02'))}</p>
        <p>${esc(t.text('about', 'paragraph-03'))}</p>
        <p>${esc(t.text('about', 'paragraph-04'))}</p>
      </div>
      <div class="principles"><div><span class="number">${esc(t.text('about', 'label-01'))}</span><h3>${esc(t.text('about', 'heading-02'))}</h3><p>${esc(t.text('about', 'paragraph-05'))}</p></div><div><span class="number">${esc(t.text('about', 'label-02'))}</span><h3>${esc(t.text('about', 'heading-03'))}</h3><p>${esc(t.text('about', 'paragraph-06'))}</p></div><div><span class="number">${esc(t.text('about', 'label-03'))}</span><h3>${esc(t.text('about', 'heading-04'))}</h3><p>${esc(t.text('about', 'paragraph-07'))}</p></div></div>
    </section>

    <section class="demo-section" aria-labelledby="demo-heading">
      <div class="wrap demo-grid">
        <div class="demo-copy"><p class="eyebrow">${esc(t.text('demo', 'paragraph-01'))}</p><h2 id="demo-heading">${split(t.text('demo', 'heading-01'), 'GEMINI VIII')}</h2><p>${esc(t.text('demo', 'paragraph-02'))}</p><p>${esc(t.text('demo', 'paragraph-03'))}</p><a class="launch" href="${esc(t.href('demo', 'link-01'))}"><span>${esc(t.text('demo', 'link-01').replace(/\s*↗$/, ''))}</span><span aria-hidden="true">↗</span></a><p class="small">${esc(t.text('demo', 'paragraph-04'))}</p></div>
        <figure class="demo-figure"><a class="shot-link" href="${esc(t.href('demo', 'link-02'))}" data-gallery="2" aria-label="${esc(t.text('demo', 'aria-01'))}"><img src="${SHOTS[2].small}" width="960" height="540" loading="lazy" alt="${esc(t.text('demo', 'alt-01'))}"><span class="enlarge" aria-hidden="true">${arrow(t.text('demo', 'link-02'))}</span></a><figcaption><span>${esc(t.text('demo', 'label-01'))}</span><span>${esc(t.text('demo', 'label-02'))}</span></figcaption></figure>
      </div>
    </section>

    <section class="wrap section gallery-section" id="screenshots" aria-labelledby="screenshots-heading">
      <div class="gallery-heading"><div><p class="eyebrow">${esc(t.text('gallery', 'paragraph-01'))}</p><h2 id="screenshots-heading">${esc(t.text('gallery', 'heading-01'))}</h2></div><p>${br(t.text('gallery', 'paragraph-02'), 'build.')}</p></div>
      <div class="gallery-grid">${figure(0, t.text('gallery', 'aria-01'), t.text('gallery', 'link-01'), t.text('gallery', 'alt-01'), t.text('gallery', 'label-01'), t.text('gallery', 'heading-02'), t.text('gallery', 'paragraph-03'))}${figure(1, t.text('gallery', 'aria-02'), t.text('gallery', 'link-02'), t.text('gallery', 'alt-02'), t.text('gallery', 'label-02'), t.text('gallery', 'heading-03'), t.text('gallery', 'paragraph-04'))}${figure(2, t.text('gallery', 'aria-03'), t.text('gallery', 'link-03'), t.text('gallery', 'alt-03'), t.text('gallery', 'label-03'), t.text('gallery', 'heading-04'), t.text('gallery', 'paragraph-05'))}
      </div>
    </section>

    <section class="coming-soon" aria-labelledby="coming-heading"><div class="wrap coming-inner"><img src="/site-assets/emblem.svg" alt="" width="68" height="90" loading="lazy"><div><p class="eyebrow">${esc(t.text('coming_soon', 'paragraph-01'))}</p><h2 id="coming-heading">${split(t.text('coming_soon', 'heading-01'), 'FULL GAME')}</h2><p>${esc(t.text('coming_soon', 'paragraph-02'))}</p></div><div class="coming-links"><a class="text-link" href="${esc(t.href('coming_soon', 'link-01'))}">${arrow(t.text('coming_soon', 'link-01'))}</a><a class="text-link" href="${FOLLOW_LINK.href}" data-follow="itch">${arrow(FOLLOW_LINK.text)}</a></div></div></section>

    <section class="developer-section" id="developer" aria-labelledby="developer-heading"><div class="wrap developer-grid">
      <figure class="dev-photo"><img src="/site-assets/dan-at-ksc.jpg" width="400" height="400" loading="lazy" alt="${esc(t.text('bio', 'alt-01'))}"><figcaption>${esc(t.text('bio', 'label-01'))}</figcaption></figure>
      <div class="dev-copy"><p class="eyebrow">${esc(t.text('bio', 'paragraph-01'))}</p><h2 id="developer-heading">${br(t.text('bio', 'heading-01'), 'dream.')}</h2><p class="dev-intro">${esc(t.text('bio', 'paragraph-02'))}</p><p>${esc(t.text('bio', 'paragraph-03'))}</p><p>${esc(t.text('bio', 'paragraph-04'))}</p><p>${esc(t.text('bio', 'paragraph-05'))}</p><p class="tribute">${esc(t.text('bio', 'paragraph-06'))}</p><nav class="social-links" aria-label="${esc(t.text('bio', 'aria-01'))}"><a href="${esc(t.href('bio', 'link-01'))}">${arrow(t.text('bio', 'link-01'))}</a><a href="${esc(t.href('bio', 'link-02'))}">${arrow(t.text('bio', 'link-02'))}</a><a href="${esc(t.href('bio', 'link-03'))}">${arrow(t.text('bio', 'link-03'))}</a></nav></div>
    </div></section>

    <section class="wrap section notices-section" id="notices" aria-labelledby="notices-heading"><div><p class="eyebrow">${esc(t.text('notices', 'paragraph-01'))}</p><h2 id="notices-heading">${esc(t.text('notices', 'heading-01'))}</h2>${t.notice('notices', 'notice-01').map((p, i) => `<p${i === 0 ? ' class="dedication"' : ''} data-notice="dedication">${esc(p)}</p>`).join('')}</div><div class="notices">
      <details open><summary>${esc(t.text('notices', 'heading-02'))}</summary><p data-notice="project_disclaimer">${esc(t.text('notices', 'notice-02'))}</p><p data-notice="dramatization">${esc(t.text('notices', 'notice-03'))}</p></details>
      <details open><summary>${esc(t.text('nasa_marks', 'heading-01'))}</summary><p>${esc(t.text('nasa_marks', 'paragraph-01'))}</p><p>${esc(t.text('nasa_marks', 'paragraph-02'))}</p><p><a href="${esc(t.href('nasa_marks', 'paragraph-03'))}">${arrow(t.text('nasa_marks', 'paragraph-03'))}</a></p></details>
      <details open><summary>${esc(t.text('notices', 'heading-03'))}</summary><p data-notice="ai_disclosure">${esc(t.text('notices', 'notice-04'))}</p></details>
      <details open><summary>${esc(t.text('open_source', 'heading-01'))}</summary><p data-notice="open-source">${esc(t.text('open_source', 'paragraph-01'))}</p><p><a href="${esc(t.href('open_source', 'paragraph-02'))}">${arrow(t.text('open_source', 'paragraph-02'))}</a></p></details>
    </div></section>
  </main>
  <footer class="footer wrap"><a class="footer-title" href="${esc(t.href('footer', 'link-01'))}">${esc(t.text('footer', 'link-01'))}</a><span>${esc(t.text('footer', 'label-01'))}</span><a href="${esc(t.href('footer', 'link-02'))}">${esc(t.text('footer', 'link-02'))}</a></footer>
  <dialog id="gallery-dialog" aria-labelledby="gallery-title"><div class="lightbox-head"><h2 id="gallery-title">${esc(t.text('gallery', 'heading-05'))}</h2><button type="button" class="close-gallery" aria-label="${esc(t.text('gallery', 'aria-04'))}">${arrow(t.text('gallery', 'button-01'))}</button></div><img id="gallery-image" alt="" width="1920" height="1080"><div class="lightbox-foot"><button type="button" id="previous-shot">${arrowLead(t.text('gallery', 'button-02'))}</button><p id="gallery-count" aria-live="polite"></p><button type="button" id="next-shot">${arrow(t.text('gallery', 'button-03'))}</button></div></dialog>
</body>
</html>
`;
  const unused = t.unused();
  if (unused.length) throw new Error(`registry.site items the home page never shows: ${unused.join(', ')}`);
  return html;
}

/** The demo entry's metadata (demo/index.html): its own title, description and canonical. */
export const DEMO_META = {
  title: 'Failure is Not an Option — Gemini VIII (demo)',
  description: 'The playable Gemini VIII demo of Failure is Not an Option: take the flight director’s seat, weigh the return, and carry the consequences. An independent tribute, not affiliated with NASA.',
  canonical: `${SITE_ORIGIN}/demo/`,
} as const;
