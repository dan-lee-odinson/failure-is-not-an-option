# FNO-ITCH — build handoff

**Status:** DONE. `npm run build:itch` builds the Gemini VIII demo as an itch.io HTML5 upload (`dist-itch/`, every URL relative, the demo entry at the root, the off-site links absolute and in a new tab, every storage key prefixed), a browser case proves it runs from a nested path inside an iframe with no failed request, and the finaogame.com build is byte-identical. The upload zip and its note are in the shared folder; the build target is committed on `main`.

| | |
|---|---|
| Task | FNO-ITCH (Dan's direction: a zip of the demo that runs as an itch.io HTML5 upload; the finaogame.com build unchanged) |
| Baseline | `8d5b81b` (DEMO-END, live) |
| Delivery commit | *(the build target commit on `main`)* |
| Changed | `vite.itch.config.ts` (new), `package.json` (`build:itch`), `.gitignore` (`dist-itch/`), `tsconfig.json` (the config typechecked), `tests/e2e/itch.spec.ts` (new), README, this record. No app source, no content, no `vite.config.ts`: `dist/` is byte-identical (103 files, digests compared before and after). |
| Output | `FNO-itch-8d5b81b.zip` (the contents of `dist-itch/`, `index.html` at the zip root) and `ITCH-UPLOAD.md` in the shared folder root |
| Unit tests | 314 in 21 files (unchanged); typecheck clean |
| Browser tests | 81 Playwright cases (the 78 existing unchanged, plus `itch.spec.ts`: 3) |

## 1. The build (items 1–3)

`vite.itch.config.ts`: `base: './'`, `outDir: 'dist-itch'`, the root stub entry only, no sourcemaps, the public folder copied. Its plugin (`fno-itch`, build only):

- **The entry.** The root `index.html` takes `demo/index.html`'s markup (the mirror of the site's home-page plugin), so the demo is `dist-itch/index.html` and there is no home page in the upload; Vite then resolves the entry's script, stylesheet, icons and inline `@font-face` URLs relative to it (`./assets/…`, `./site-assets/…`, `fonts/…`).
- **Relative URLs everywhere.** The bundled images are `?url` imports, which Vite emits as `new URL(name, import.meta.url)` under a relative base; the audio and the film are formed at runtime from `import.meta.env.BASE_URL` (`./audio/…`, `./video/…`) — the app already did this, so no source changed. `closeBundle` scans every `.html/.js/.css/.json/.svg/.txt` in the output for a quoted root-absolute path, a `url(/…)` or a bare `href="/"` and fails the build on a hit.
- **Absolute off-site links, new tab (item 2).** A `transform` on `app/render.ts` rewrites `HOME_HREF` from `/` to `https://finaogame.com/` and adds `target="_blank" rel="noopener noreferrer"` to the HOME key and the EXIT key (FOLLOW ON ITCH.IO already opens a new tab; the History and About source links already did). Each rewrite must match exactly once or the build fails, so a later change to the markup cannot be silently missed.
- **Storage prefix (item 3).** `ITCH_STORAGE_PREFIX = 'fno.'` is applied to the seven declared keys (`app/storage.ts` SLOT_KEY, `app/ui-state.ts` PREF_KEYS) by the same `transform`; an unknown key literal or a key not seen fails the build. On finaogame.com the keys already carried `fno.`, so the prefix is the same string on both origins — what changes is that it is now a build constant applied and verified for this target.
- **Fullscreen (item 3).** The game's FULL SCREEN key already calls `requestFullscreen` on the document root, which inside itch's iframe (`allowfullscreen`, given by the "Fullscreen button" setting) is the frame's root; the browser case proves `document.fullscreenEnabled` inside the frame and the key rendered. The F11 line stays.
- **Pruned.** `404.html` (it redirects to `/`), `robots.txt`, `sitemap.txt`, and every `site-assets/` file but the two icons the entry names.

## 2. Page settings (item 4)

Viewport 1920 × 1080; Fullscreen button on; Mobile friendly on (the phone layout exists); SharedArrayBuffer not needed; automatic start off (the game opens on its Start screen; sound is armed by the first click); scrollbars off. Recorded with the upload steps in `ITCH-UPLOAD.md`.

## 3. The check (item 5)

`tests/e2e/itch.spec.ts` builds `dist-itch/` and starts its own static server (port 4174) that serves the build from `/some/deep/path/` only, with Range requests honoured for the film, and a wrapper page with the upload in an `allowfullscreen` iframe. The case plays the opening (Begin, Skip film, the static credits with the den plate decoded, Skip to menu), the prologue (every plate with Continue, each plate decoded, the scenario card), one route to DEMO COMPLETE, and asserts: zero failed network requests (every response under 400, no failed request but the skipped film's aborted load), every image loaded at each stage, the three keys' hrefs and targets, HOME in About absolute and in a new tab, no off-site link opening in the same tab, every localStorage key prefixed `fno.`, the film, a track, a font, an icon and the stylesheet resolving under the nested path, the Fullscreen API available to the frame and the F11 line. A second case loads the build at 390 px inside the frame (the menu fits). A third checks the output itself (the root entry, no `demo/`, the pruned files, no root-absolute reference). The existing 78 cases are unchanged.

## 4. The finaogame.com build

No app source changed: `dist/` built before and after is byte-identical (103 files, the sha256 list `dist-baseline-8d5b81b.sha256` equals `dist-after-itch.sha256`), so the deploy that follows the build-target commit serves the same bundle (`demo-0OAd3Jr0.js`, `demo-CQg_eqFU.css`, `home-cvuDe_0W.js`, `home-TzmVeZuP.css`).

## Decisions taken here (reversible)

1. **All itch adaptation lives in the build config**, not in the app: the rewrites are source-level, exact-match, build-only transforms. A `define`-driven branch in the app would have changed the site bundle's bytes, which Dan ruled out.
2. **The storage keys stay `fno.<key>`** on both origins: they already carried the prefix Dan asked for, and different origins never share storage. A distinct itch namespace would add nothing.
3. **The zip is named after the game commit** (`8d5b81b`, as directed), built from the build-target commit whose only additions are the config and the test; `ITCH-UPLOAD.md` records both.
4. **Sourcemaps are off** in the upload (they would add 380 KB and reveal nothing the public repository does not).

## Not changed

The app, the content, the film, `vite.config.ts`, the home page, `registry.site`; `dist/` byte-identical.
