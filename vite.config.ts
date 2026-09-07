import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  // Never inline assets as data URIs: every image must be a manifest file the tests can name.
  build: { outDir: 'dist', target: 'es2022', sourcemap: true, assetsInlineLimit: 0 },
  server: { port: 5173, strictPort: true },
  preview: { port: 4173, strictPort: true },
});
