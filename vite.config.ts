import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import { renderSite } from './scripts/lib/site';
import type { Registry } from './core/types';

const ROOT = resolve(__dirname);

/**
 * The home page is content: the root index.html is rendered from content/registry.json (registry.site, the notices) by
 * scripts/lib/site.ts on every request in dev and once at build time, so the page shows exactly the strings on the
 * dialogue sheet. The stub index.html in the repository is only the entry Vite needs.
 */
function homePagePlugin(): Plugin {
  return {
    name: 'fno-home-page',
    transformIndexHtml: {
      order: 'pre',
      handler(_html, ctx) {
        const file = ctx.filename.replace(/\\/g, '/');
        if (!file.endsWith('/index.html') || file.endsWith('/demo/index.html')) return undefined;
        const registry = JSON.parse(readFileSync(resolve(ROOT, 'content', 'registry.json'), 'utf8')) as Registry;
        return renderSite(registry);
      },
    },
  };
}

export default defineConfig({
  // The site lives at the root of its own domain (finaogame.com); the game is the second entry at /demo/ (doc 35 §6).
  base: '/',
  plugins: [homePagePlugin()],
  // Never inline assets as data URIs: every image must be a manifest file the tests can name.
  build: {
    outDir: 'dist',
    target: 'es2022',
    sourcemap: true,
    assetsInlineLimit: 0,
    rollupOptions: { input: { home: resolve(ROOT, 'index.html'), demo: resolve(ROOT, 'demo', 'index.html') } },
  },
  server: { port: 5173, strictPort: true },
  preview: { port: 4173, strictPort: true },
});
