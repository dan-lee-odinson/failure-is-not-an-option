# Hosting plan — finaogame.com on GitHub Pages

**From:** Claude · **For:** Dan (registrar and GitHub settings), Claude Code (deploy task) · **Date:** 8 September 2026 · **Dan's direction:** host the game as a launchable website on GitHub Pages at the domain he has bought, **finaogame.com**.

## 1. Fit

The game is a static Vite build (`npm run build` → `dist/`: one HTML page, hashed JS/CSS, the manifest, images, fonts, audio). That is exactly what GitHub Pages serves. No server, no database; saves are browser-local per origin, audio is gated behind Begin, and the manifest loader uses relative URLs, so the build runs unchanged at the root of a custom domain. Size today is well inside Pages' limits (a few tens of MB with audio; the montage will add one video file).

## 2. The one gate

GitHub Pages serves **public** repositories on the Free plan; private repositories need GitHub Pro (or Team/Enterprise). So the site goes live when the repo goes public — which was always the plan — and that is gated on the two items already on file: confirm the licences (MIT for code, CC BY 4.0 for content; the game's About text says "pending confirmation") and the H5 primary-source check. Alternatively, GitHub Pro lets a private repo publish a public site, which would allow a soft launch before the source is public; Dan's call.

## 3. Dan's steps (once)

1. **Verify the domain on GitHub first** (Settings → Pages → Verified domains, add `finaogame.com`, add the TXT record GitHub gives you at the registrar). This prevents anyone else's Pages site from claiming the domain.
2. **DNS at the registrar** — apex `finaogame.com`: four A records `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153` and four AAAA records `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153`; `www.finaogame.com`: one CNAME to `dan-lee-odinson.github.io`. Remove any registrar parking records on the apex.
3. **Repo → Settings → Pages**: Source = GitHub Actions; Custom domain = `finaogame.com`; tick **Enforce HTTPS** once the certificate is issued (can take up to a day after DNS propagates).
4. Make the repository public when §2 is satisfied. The first push to `main` after that deploys.

## 4. Claude Code's task — `FNO-DEPLOY` (small, after M02)

1. `.github/workflows/pages.yml`: on push to `main` (and manual dispatch): checkout → Node 24 → `npm ci` → `npm run validate` → `npm test` → `npm run build` → `actions/upload-pages-artifact` (`dist/`) → `actions/deploy-pages`. Tests gate the deploy; a red build never publishes.
2. Vite `base: '/'` (custom domain at root). `public/404.html` that redirects to `/` (single-page app; deep links aren't used, but a 404 page keeps the site from showing GitHub's). `public/robots.txt` allowing all.
3. `index.html` head: title "Failure is Not an Option", meta description (one sentence from the registry's start notice), Open Graph title/description/image (the hero title over the room, 1200×630, exported from the existing plate under the manifest rules — no NASA marks), favicon and app icon from the approved emblem SVG, `<link rel="canonical" href="https://finaogame.com/">`.
4. The About/Credits text already carries the non-affiliation notice; the page `<meta>` description must not imply NASA endorsement either.
5. README: "Play it at https://finaogame.com" and the deploy description. Nothing else changes in the game.

## 5. Later

- The montage video (one MP4/WebM of ~2:18) lands in `public/video/`; Pages serves it fine. Keep it under ~50 MB.
- If traffic ever matters, the Pages soft limits are generous for a text game; nothing to plan for now.
- The domain name carries no NASA marks; the site header is the game's own title and emblem.

Next number in `00-Index.md` is 36.

## 6. Site shape at launch (Dan's direction, 8 September)

> When the first playable scenario is finished, we create a home page with a description of the game and screenshots, and then branch a /demo page and have it as a playable demo, the full game "Coming Soon".

- **`finaogame.com/`** — a home page: the game's name in the hero face over the room, a short description (from the registry's start notice and dedication tone, no NASA endorsement implied), a row of screenshots (re-shot from the real build at 1920×1080 with sound on and the default text size — not the test harness frames), a PLAY THE DEMO key, and a "Full game — coming soon" block. Same hand as the game: Apollo kit faces, Barlow/Chakra Petch, the emblem. Credits and notices linked (they already exist in-game under About).
- **`finaogame.com/demo/`** — the game as built, Gemini VIII as the playable scenario. One build, two entry points (Vite multi-page: `index.html` for the home page, `demo/index.html` for the game), one deploy — not a git branch, so the demo is always the same commit as the home page. The game's own menu gains a small DEMO tag under the title and a "Home" link in About; nothing else changes.
- "Coming soon" names nothing that isn't decided: no scenario list until Dan rules on the next mission.
- Screenshots and the description are content Dan clears like everything else; the home page copy goes in `registry.site` (0.5.4) so it lives with the dialogue sheet.

This folds into FNO-DEPLOY: the workflow, the home page, the `/demo/` entry, meta/OG for both pages.
