/**
 * `npm run release-check` — run after `npm run build`, before anything is published (the Pages workflow's gate).
 *
 * The site must not go live with the film's sources uncredited, the home-page copy off the sheet, a licence statement
 * that contradicts the LICENSE files, a manifest asset missing from the build, or a video Pages would serve slowly:
 *   1. registry.credits has an Archive section without the 0.5.3 placeholder line;
 *   2. registry.site is present with the ten ordered blocks (doc 41), so the home page renders from content;
 *   3. the LICENSE files' "PROPOSED … NOT YET IN FORCE" header and the site's open-source statement agree: while the
 *      files say proposed, the page must say the licences are not yet in force, and once the header is gone the page
 *      must not still say so;
 *   4. every manifest asset is in dist/ (images by their hashed name, audio under dist/audio/, video under dist/video/);
 *   5. the video file is under 30 MB;
 *   6. dist/index.html and dist/demo/index.html exist with their canonical links and the og:image; no CNAME in dist/
 *      (publishing through Actions ignores it; the custom domain is a repository setting).
 * Exit code 1 on any failure, with every failure listed.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const dist = resolve(root, 'dist');
const failures: string[] = [];
const notes: string[] = [];
const fail = (s: string): void => { failures.push(s); };

const registry = JSON.parse(readFileSync(resolve(root, 'content', 'registry.json'), 'utf8')) as {
  content_version: string;
  credits?: { heading: string; lines: string[] }[];
  site?: { blocks: { id: string; items: { id: string; kind: string; text?: string; notice_id?: string }[] }[] };
};

// 1. Archive credits
const archive = (registry.credits ?? []).find((s) => s.heading === 'Archive');
if (!archive) fail('registry.credits has no Archive section: the film\'s sources are uncredited');
else if (archive.lines.some((l) => /will be added/i.test(l))) fail('registry.credits Archive still carries the placeholder line ("… will be added …"): the film\'s sources are uncredited');
else if (archive.lines.length < 3) fail(`registry.credits Archive has only ${archive.lines.length} line(s)`);
else notes.push(`Archive credits: ${archive.lines.length} lines`);

// 2. registry.site
const BLOCKS = ['hero', 'about', 'demo', 'gallery', 'coming_soon', 'bio', 'notices', 'nasa_marks', 'open_source', 'footer'];
if (!registry.site) fail('registry.site is absent: the home page has no content');
else {
  const ids = registry.site.blocks.map((b) => b.id);
  if (ids.join(',') !== BLOCKS.join(',')) fail(`registry.site blocks are [${ids.join(', ')}], expected [${BLOCKS.join(', ')}] in that order`);
  for (const b of registry.site.blocks) for (const it of b.items) if (!(it.text && it.text.trim()) && !it.notice_id) fail(`registry.site ${b.id}/${it.id} has no text`);
  notes.push(`registry.site: ${registry.site.blocks.reduce((n, b) => n + b.items.length, 0)} items`);
}

// 3. licences: the files and the page agree
const proposedHeader = /^PROPOSED LICENSE - NOT YET IN FORCE/;
const licenseProposed = ['LICENSE', 'LICENSE-CONTENT'].map((f) => ({ f, proposed: proposedHeader.test(readFileSync(resolve(root, f), 'utf8')) }));
const openSource = registry.site?.blocks.find((b) => b.id === 'open_source')?.items.map((i) => i.text ?? '').join(' ') ?? '';
const pageSaysProposed = /not yet in force/i.test(openSource) && /proposed/i.test(openSource);
for (const { f, proposed } of licenseProposed) {
  if (proposed && !pageSaysProposed) fail(`${f} is still marked PROPOSED / NOT YET IN FORCE but the site's open-source statement no longer says so`);
  if (!proposed && pageSaysProposed) fail(`${f} is in force but the site's open-source statement still says the licences are proposed and not yet in force`);
}
notes.push(`licences: files ${licenseProposed.every((l) => l.proposed) ? 'proposed' : licenseProposed.some((l) => l.proposed) ? 'MIXED' : 'in force'}, site says ${pageSaysProposed ? 'proposed' : 'in force'}`);
if (licenseProposed.some((l) => l.proposed) !== licenseProposed.every((l) => l.proposed)) fail('LICENSE and LICENSE-CONTENT disagree about being in force');

// 4. every manifest asset in dist/
if (!existsSync(dist)) fail('dist/ is missing: run npm run build first');
else {
  const manifest = JSON.parse(readFileSync(resolve(root, 'assets', 'manifest.json'), 'utf8')) as { assets: { id: string; filename: string; kind?: string }[] };
  const hashed = existsSync(resolve(dist, 'assets')) ? readdirSync(resolve(dist, 'assets')) : [];
  for (const a of manifest.assets) {
    if (a.kind === 'audio') { if (!existsSync(resolve(dist, 'audio', a.filename))) fail(`manifest audio ${a.id}: dist/audio/${a.filename} is missing`); continue; }
    if (a.kind === 'video') {
      const p = resolve(dist, 'video', a.filename);
      if (!existsSync(p)) { fail(`manifest video ${a.id}: dist/video/${a.filename} is missing`); continue; }
      const size = statSync(p).size;
      if (size >= 30_000_000) fail(`video ${a.filename} is ${size} bytes; it must stay under 30 MB`);
      else notes.push(`video ${a.filename}: ${(size / 1e6).toFixed(1)} MB`);
      continue;
    }
    const dot = a.filename.lastIndexOf('.');
    const stem = a.filename.slice(0, dot);
    const ext = a.filename.slice(dot);
    if (!hashed.some((h) => h.startsWith(stem + '-') && h.endsWith(ext))) fail(`manifest image ${a.id}: no ${stem}-<hash>${ext} under dist/assets/`);
  }
  notes.push(`manifest: ${manifest.assets.length} assets checked against dist/`);

  // 6. the two pages, their metadata, no CNAME
  for (const [page, canonical] of [['index.html', 'https://finaogame.com/'], ['demo/index.html', 'https://finaogame.com/demo/']] as const) {
    const p = resolve(dist, page);
    if (!existsSync(p)) { fail(`dist/${page} is missing`); continue; }
    const html = readFileSync(p, 'utf8');
    if (!html.includes(`<link rel="canonical" href="${canonical}"`)) fail(`dist/${page}: canonical link to ${canonical} is missing`);
    if (!/property="og:image" content="https:\/\/finaogame\.com\/site-assets\/og-image\.png"/.test(html)) fail(`dist/${page}: og:image is missing`);
    if (!/<meta name="description" content="[^"]+"/.test(html)) fail(`dist/${page}: meta description is missing`);
  }
  for (const f of ['site-assets/og-image.png', 'site-assets/favicon.png', 'site-assets/emblem.svg', '404.html', 'robots.txt']) if (!existsSync(resolve(dist, f))) fail(`dist/${f} is missing`);
  if (existsSync(resolve(dist, 'CNAME'))) fail('dist/CNAME is present; the custom domain is a repository setting, not a file (doc 35 §3)');
  const home = existsSync(resolve(dist, 'index.html')) ? readFileSync(resolve(dist, 'index.html'), 'utf8') : '';
  if (home && !/href="\.\/demo\/"/.test(home)) fail('dist/index.html has no link to ./demo/');
}

for (const n of notes) console.log(`  ${n}`);
if (failures.length) {
  for (const f of failures) console.error(`RELEASE CHECK FAILED: ${f}`);
  process.exit(1);
}
console.log(`release-check: OK (content ${registry.content_version})`);
