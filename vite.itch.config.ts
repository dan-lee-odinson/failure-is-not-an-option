/**
 * `npm run build:itch` → dist-itch/: the Gemini VIII demo as an itch.io HTML5 upload (FNO-ITCH). itch serves an upload
 * from a subfolder of its CDN inside an iframe, so: every URL is relative (`base: './'` — the bundled images, the
 * audio and the film resolved through import.meta.env.BASE_URL, the fonts and icons of the entry); the demo entry is
 * the root index.html and the home page is not part of the upload; the off-site links are absolute and open in a new
 * tab (the game runs inside itch's iframe); every storage key carries the build's prefix (itch HTML games share an
 * origin). Nothing here touches the finaogame.com build (vite.config.ts): the app sources are unchanged, and this
 * config's plugin rewrites them at build time for this target only. The build fails if a root-absolute reference is
 * left anywhere in the output, if a rewrite does not find exactly what it expects, or if a storage key is unknown.
 */
import { existsSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';

const ROOT = resolve(__dirname);
export const ITCH_OUT_DIR = 'dist-itch';
/** Every localStorage key of the game carries this prefix in the itch build. */
export const ITCH_STORAGE_PREFIX = 'fno.';
/** The site's home page: EXIT TO FINAOGAME.COM and HOME in About, absolute in this build. */
export const ITCH_HOME_URL = 'https://finaogame.com/';
/** The game's itch.io page: FOLLOW ON ITCH.IO (already absolute in the app). */
export const ITCH_PAGE_URL = 'https://danleeodinson.itch.io/failure-is-not-an-option';
const NEW_TAB = 'target="_blank" rel="noopener noreferrer"';
/** The storage keys the app declares — app/storage.ts SLOT_KEY and app/ui-state.ts PREF_KEYS — without their prefix. */
export const STORAGE_KEYS = ['save.v1', 'textSize', 'openingSeen', 'pinHintSeen', 'audio', 'hints', 'prologueSeen'] as const;
/** Files of public/ that belong to the site, not the upload; under site-assets only the two icons the demo entry names stay. */
const PRUNE = ['404.html', 'robots.txt', 'sitemap.txt'];
const KEEP_SITE_ASSETS = new Set(['emblem.svg', 'favicon.png']);
/** A root-absolute reference in the output: a quoted path, a CSS url(), or the site's home as a bare slash. */
const ROOT_ABSOLUTE = /(["'])\/[A-Za-z0-9_][^"'\s)]*|url\(\s*\/|href="\/"/g;
const SCAN_EXT = ['.html', '.js', '.css', '.json', '.svg', '.txt'];

/** Replace exactly one occurrence, or fail the build: a rewrite that no longer matches the source is a bug, never silently skipped. */
function must(code: string, from: string, to: string, where: string): string {
  const n = code.split(from).length - 1;
  if (n !== 1) throw new Error(`itch build: ${where}: expected exactly one occurrence of ${JSON.stringify(from)}, found ${n}`);
  return code.replace(from, to);
}

function walk(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir)) {
    const p = resolve(dir, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

function itchPlugin(): Plugin {
  const demoHtml = readFileSync(resolve(ROOT, 'demo', 'index.html'), 'utf8');
  const seenKeys = new Set<string>();
  return {
    name: 'fno-itch',
    enforce: 'pre',
    apply: 'build',
    // The root entry is the demo in this build: the stub index.html takes demo/index.html's markup, whose root-relative
    // script and stylesheet resolve from the project root as they do for the site's /demo/ entry.
    transformIndexHtml: {
      order: 'pre',
      handler(_html, ctx) {
        const file = ctx.filename.replace(/\\/g, '/');
        return file.endsWith('/index.html') && !file.endsWith('/demo/index.html') ? demoHtml : undefined;
      },
    },
    transform(code, id) {
      const file = id.replace(/\\/g, '/').split('?')[0]!;
      if (file.endsWith('/app/render.ts')) {
        code = must(code, "export const HOME_HREF = '/';", `export const HOME_HREF = '${ITCH_HOME_URL}';`, 'app/render.ts HOME_HREF');
        code = must(code, 'href="${HOME_HREF}" data-testid="home-link"', `href="\${HOME_HREF}" ${NEW_TAB} data-testid="home-link"`, 'app/render.ts HOME key');
        code = must(code, 'href="${SITE_HOME_URL}" data-focus="exit-home"', `href="\${SITE_HOME_URL}" ${NEW_TAB} data-focus="exit-home"`, 'app/render.ts EXIT key');
        code = must(code, 'href="${ITCH_URL}" target="_blank" rel="noopener noreferrer" data-focus="follow-itch"', 'href="${ITCH_URL}" target="_blank" rel="noopener noreferrer" data-focus="follow-itch"', 'app/render.ts FOLLOW key (already a new tab)');
        return { code, map: null };
      }
      if (file.endsWith('/app/links.ts')) {
        code = must(code, `export const SITE_HOME_URL = '${ITCH_HOME_URL}';`, `export const SITE_HOME_URL = '${ITCH_HOME_URL}';`, 'app/links.ts SITE_HOME_URL');
        code = must(code, `export const ITCH_URL = '${ITCH_PAGE_URL}';`, `export const ITCH_URL = '${ITCH_PAGE_URL}';`, 'app/links.ts ITCH_URL');
        return { code, map: null };
      }
      if (file.endsWith('/app/storage.ts') || file.endsWith('/app/ui-state.ts')) {
        // The storage keys, each rewritten to the build's prefix; an unknown key fails the build so none can slip past unprefixed.
        code = code.replace(/'fno\.([A-Za-z0-9.]+)'/g, (_m, key: string) => {
          if (!(STORAGE_KEYS as readonly string[]).includes(key)) throw new Error(`itch build: unknown storage key fno.${key} in ${file}`);
          seenKeys.add(key);
          return `'${ITCH_STORAGE_PREFIX}${key}'`;
        });
        return { code, map: null };
      }
      return undefined;
    },
    closeBundle() {
      const missing = STORAGE_KEYS.filter((k) => !seenKeys.has(k));
      if (missing.length) throw new Error(`itch build: storage keys not seen in the sources: ${missing.join(', ')}`);
      const out = resolve(ROOT, ITCH_OUT_DIR);
      for (const f of PRUNE) if (existsSync(resolve(out, f))) rmSync(resolve(out, f));
      const siteAssets = resolve(out, 'site-assets');
      if (existsSync(siteAssets)) for (const f of readdirSync(siteAssets)) if (!KEEP_SITE_ASSETS.has(f)) rmSync(resolve(siteAssets, f), { recursive: true });
      if (existsSync(resolve(out, 'demo'))) rmSync(resolve(out, 'demo'), { recursive: true });
      // The gate: no root-absolute reference anywhere in the output.
      const hits: string[] = [];
      for (const p of walk(out)) {
        if (!SCAN_EXT.some((x) => p.endsWith(x))) continue;
        const text = readFileSync(p, 'utf8');
        for (const m of text.matchAll(ROOT_ABSOLUTE)) hits.push(`${relative(out, p).replace(/\\/g, '/')}: ${m[0].slice(0, 80)}`);
      }
      if (hits.length) throw new Error(`itch build: root-absolute references left in ${ITCH_OUT_DIR}/ (they would resolve against itch's CDN root, not the upload):\n  ${hits.slice(0, 30).join('\n  ')}${hits.length > 30 ? `\n  … ${hits.length - 30} more` : ''}`);
      if (!existsSync(resolve(out, 'index.html'))) throw new Error('itch build: dist-itch/index.html is missing');
      const files = walk(out);
      const bytes = files.reduce((n, p) => n + statSync(p).size, 0);
      console.log(`itch build: ${files.length} files, ${(bytes / 1e6).toFixed(1)} MB, no root-absolute references, storage keys prefixed "${ITCH_STORAGE_PREFIX}"`);
    },
  };
}

export default defineConfig({
  base: './',
  publicDir: 'public',
  plugins: [itchPlugin()],
  build: {
    outDir: ITCH_OUT_DIR,
    emptyOutDir: true,
    target: 'es2022',
    sourcemap: false,
    assetsInlineLimit: 0,
    rollupOptions: { input: { index: resolve(ROOT, 'index.html') } },
  },
});
