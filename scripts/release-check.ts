/**
 * `npm run release-check` — run after `npm run build`, before anything is published (the Pages workflow's gate).
 *
 * The site must not go live with the film's sources uncredited, the home-page copy off the sheet, a licence statement
 * that contradicts the LICENSE files, a manifest asset missing from the build, or a video Pages would serve slowly:
 *   1. registry.credits has an Archive section without the 0.5.3 placeholder line;
 *   2. registry.site is present with the ten ordered blocks (doc 41), so the home page renders from content;
 *   3. the licences are in force (doc 44): neither LICENSE file carries the PROPOSED / NOT YET IN FORCE header,
 *      LICENSE-CONTENT carries the third-party carve-out, the site's open-source statement names the in-force terms,
 *      and no proposed-state phrase ("pending confirmation", "not yet in force", "to be chosen before publication",
 *      "proposed licence", "proposed MIT") is left anywhere in content/, assets/manifest.json, README, the licence
 *      files or the built dist/ — a stale content packet cannot regress the site to "proposed";
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

// 3. licences in force (doc 44 §3 D)
const PROPOSED_PHRASES: [RegExp, string][] = [
  [/PROPOSED LICENSE/, 'PROPOSED LICENSE'], [/NOT YET IN FORCE/i, 'not yet in force'], [/pending confirmation/i, 'pending confirmation'],
  [/to be chosen before publication/i, 'to be chosen before publication'], [/to be confirmed before publication/i, 'to be confirmed before publication'],
  [/proposed licen[cs]e/i, 'proposed licence'], [/proposed MIT/i, 'proposed MIT'],
];
const license = readFileSync(resolve(root, 'LICENSE'), 'utf8');
const licenseContent = readFileSync(resolve(root, 'LICENSE-CONTENT'), 'utf8');
if (!/^MIT License$/m.test(license)) fail('LICENSE is not the MIT License text');
if (!/Copyright \(c\) 2026 Dan Lee-Odinson/.test(license)) fail('LICENSE does not name the copyright holder');
if (!/Creative Commons Attribution 4\.0 International \(CC BY 4\.0\)/.test(licenseContent)) fail('LICENSE-CONTENT is not CC BY 4.0');
if (!/Copyright \(c\) 2026 Dan Lee-Odinson/.test(licenseContent)) fail('LICENSE-CONTENT does not name the copyright holder');
if (!/What this licence does NOT cover/.test(licenseContent)) fail('LICENSE-CONTENT has no third-party carve-out section (doc 44 §1.2)');
for (const need of ['NASA', 'National Archives', 'freesound.org', 'SIL Open Font License']) if (!licenseContent.includes(need)) fail(`LICENSE-CONTENT's carve-out does not mention ${need}`);
const openSource = registry.site?.blocks.find((b) => b.id === 'open_source')?.items.map((i) => i.text ?? '').join(' ') ?? '';
if (!/MIT License/.test(openSource) || !/Creative Commons Attribution 4\.0 International/.test(openSource) || !/LICENSE-CONTENT/.test(openSource)) fail("the site's open-source statement does not name the in-force licences (MIT License, Creative Commons Attribution 4.0 International, LICENSE-CONTENT)");
const madeBy = (registry.credits ?? []).find((s) => s.heading === 'Made by');
if (!madeBy || !madeBy.lines.some((l) => /MIT \(code\)/.test(l) && /CC BY 4\.0/.test(l) && /LICENSE-CONTENT/.test(l))) fail('registry.credits "Made by" has no line naming the in-force licences');
/** Every text file under a directory (recursively), by extension. */
const walk = (dir: string, exts: string[], out: string[] = []): string[] => {
  if (!existsSync(dir)) return out;
  for (const e of readdirSync(dir)) {
    const p = resolve(dir, e);
    if (statSync(p).isDirectory()) walk(p, exts, out);
    else if (exts.some((x) => e.endsWith(x))) out.push(p);
  }
  return out;
};
const scanned = [resolve(root, 'LICENSE'), resolve(root, 'LICENSE-CONTENT'), resolve(root, 'README.md'), resolve(root, 'assets', 'manifest.json'), ...walk(resolve(root, 'content'), ['.json']), ...walk(dist, ['.html', '.js', '.css', '.json', '.txt'])];
let proposedHits = 0;
for (const f of scanned) {
  const text = readFileSync(f, 'utf8');
  for (const [re, label] of PROPOSED_PHRASES) {
    const m = re.exec(text);
    if (m) { proposedHits += 1; fail(`${f.slice(root.length + 1).replace(/\\/g, '/')}: still says "${label}" (at "…${text.slice(Math.max(0, m.index - 40), m.index + label.length + 20).replace(/\s+/g, ' ')}…"); the licences are in force (doc 44)`); }
  }
}
notes.push(`licences: in force (MIT code, CC BY 4.0 original content with the third-party carve-out); ${scanned.length} files scanned for proposed-state phrases, ${proposedHits} hit(s)`);

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
