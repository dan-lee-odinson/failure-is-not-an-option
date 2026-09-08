# FNO-DEPLOY — the film in the opening, the home page, and GitHub Pages

**Task id:** FNO-DEPLOY · **From:** Claude (Cowork) for Dan · **To:** Claude Code · **Date:** 8 September 2026
**Repo:** `C:\Users\wolfe\projects\failure-is-not-an-option`, `main`. **Baseline: M02 delivery `50ba5be`** (content 0.5.3).
**Shared folder:** `C:\Users\wolfe\Documents\Claude_GPT_Shared_Workflow\Failure-is-Not-an-Option` = `SHARED\`.
**Deliverable:** commits on `main` + `SHARED\FNO-DEPLOY-BUILD.zip` (`00_BUILD.md`, evidence, screenshots incl. the home page at desktop/tablet/phone widths, regenerated sheet). Nothing else written into `SHARED\`. **Do not flip the repository public and do not touch DNS** — those are Dan's steps (35 §3); the workflow simply runs when they are done.

Read: `docs/40-…` (Dan's rulings on the film — binding), `docs/38-…` §2–§3 (how the film was assembled; the 2:18 hand-over), `docs/OPENING-DEN.md` (den layers), `docs/39-…` + `homepage-v001/handoff/CLAUDE-INTEGRATION.md` (the home page), `docs/35-…` §4 and §6 (Pages and site shape), `docs/30-…` §7–§8 (opening order). Standing rules unchanged (presentation never touches the simulation; manifest-only assets; native controls, live text; reduced motion = static and cuts; contrast; no NASA marks in our own art).

## Part 1 — Content 0.5.4 (if present) and the release check

- If `SHARED\FNO-M00-Codex-Content-v0.5.4.zip` exists when you start, integrate it first (it adds the Archive credit lines to `registry.credits` and `registry.site` for the home page; doc 41). Patch is against `50ba5be`.
- If it does not exist, build on 0.5.3 and add a **release check** to the deploy workflow (Part 4) that fails while `registry.credits` still carries the Archive placeholder line and while `registry.site` is absent: the site must not go live with the film's sources uncredited or the home-page copy off the sheet. Say in `00_BUILD.md` which case applied.

## Part 2 — The film in the opening (docs 30 §7–8, 38 §2, 40)

The opening order becomes, on first launch: Start (Begin) → **the film** → the credits on the den wall → hero title → menu. The M00c scroll (dedication + notices) is retired as a stage: those texts now appear as the first sections of the wall credits (the credits scroll = dedication, the three notices, then `registry.credits` in order). On later launches: straight to the menu; About keeps REPLAY OPENING, which replays the whole sequence.

1. **Assets — the deployed cut.** The game only plays the film to 2:18 (doc 40 item 4), so the deployed asset is a **2:18 trim**, not the 3:22 file: re-encode from `SHARED\video\film-v002\` with the packet's own pipeline (`provenance/assemble.py` / ffmpeg 7.1) as `public/video/opening-film.mp4` — H.264 High, CRF ≈ 23, `-movflags +faststart`, AAC 160 kbps, 1920×1080/30, 0:00 → 2:18.0 exactly (the last frame = the wide den at rest) — target 20–25 MB. Provide a WebM (VP9 CRF ≈ 32) only if the MP4 fails to play in Firefox during the e2e run; H.264 MP4 plays in every current browser, so one file is the default. Manifest entries `kind: video` (credit/rights: "Assembled from NASA archive footage and the project's own art; see credits", `duration_s` 138.0, sha256). Schema: a `video` kind with `duration_s`. The full 3:22 standalone film stays in the shared folder and can be linked from the home page later; it is not part of the build.
2. **Playback.** The montage slot plays the deployed cut in a `<video>` (MP4; WebM fallback only if provided; `playsinline`, `preload="auto"`, no controls, muted attribute off — the film carries *Orbit of Hope*; the director's music bus stays silent while the video plays and the video element's volume follows the master/music setting). Play **only to 2:18.0** (doc 40 item 4): at that timestamp pause and hide the video; the last frame is the wide den at rest. If the file fails to load or play, skip to the wide den composition (Part 2.3) with the credits — never block the menu.
3. **Live den from 2:18.** Composite `registry.opening_den`: the den plate (`opening-den`), the smoke layer (`placement`, `motion` 12 s rise, looped with the 3 s crossfade the treatment specifies), the beam layer (`placement`, opacity 0.32, a light flicker: opacity modulation ±8 % at 8–12 Hz with a seeded pattern; none under reduced motion). Design frame 1920×1080 letterboxed as the prologue does.
4. **Credits on the wall.** Inside `projection_rect` (830, 115, 928×522 design px), dark ink on the lit field (doc 40 item 2): the dedication, the three notices, then `registry.credits` sections in order, scrolled at the treatment's pace (≈150 design px/s; each line on the wall about seven seconds), Barlow / Barlow Condensed headings, the game's real fonts. *Orbit of Hope (refrain)* plays under it via the director from its start (music-map cue `credits`, trigger `screen:opening-credits`, fade 2 s on run-out) — doc 40 item 1. Pause/Resume, Continue (skips to the title with a quick fade) and Skip to menu stay outside the wall, keyboard-reachable, as in M00c. Manual scrolling while paused.
5. **Run-out.** When the last credit line has cleared: 1.2 s hold → the beam dies (two stutters, 0.6 s), the den darkens over 1.5 s → 0.5 s black → the existing 700 ms dissolve to the console under the hero title (M00c's title fade).
6. **Skip and reduced motion.** Skip during the film → cut to the wide den with the credits static (a paged, keyboard-scrollable block), Continue → title. Reduced motion → no video at all: the wide den, static credits pages, cuts.
7. **Sound.** The M00c rule holds: on after Begin unless previously off; Begin is the interaction that permits the video's audio.
8. **The sheet** gains the credits sections (they are content already) and the new app strings (PAUSE/RESUME/CONTINUE/SKIP as before).

## Part 3 — The home page and `/demo/` (docs 35 §6, 39, homepage-v001)

1. **Vite multi-page.** Root `index.html` = the home page; `demo/index.html` = the game entry (move the current entry; fix its imports; `base: '/'`). Verify every game asset, audio, font and video URL from `/demo/`.
2. **Home page from content.** Render the page from `registry.site` when 0.5.4 is present (Part 1); until then, from `homepage-v001/handoff/site-copy.proposed.json` with the same block ids so the switch is a data-source change only. The HTML/CSS/JS in `homepage-v001/site/` is the presentation reference — reuse its structure, styles and `site-assets/` (fonts with OFL, emblem, control-room plate, the three screenshots and their 960-px versions, Dan's photo) under `public/site-assets/`; keep it free of the game's stylesheet. Native dialog gallery with keyboard control and JS-off fallback, as delivered.
3. **Notices verbatim** from the registry (`notices.*`), never retyped. The "NASA marks & generated artwork" block and the open-source statement as in v001 (the latter must keep saying the licences are proposed and not yet in force until Dan confirms them — then it changes with the LICENSE files, not before).
4. **Metadata:** title, description, canonical `https://finaogame.com/`, Open Graph title/description and an **`og:image`** (1200×630: the hero title over the room, no NASA marks, generated from the same live-text lockup at build time or exported once and committed), SVG favicon from the emblem plus a PNG fallback. `/demo/` gets its own title/description/canonical (`https://finaogame.com/demo/`).
5. **Game side:** a small DEMO tag under the menu title; a HOME key in About linking to `/`; a "(plays the mission briefing)" hint stays.
6. `public/404.html` redirecting to `/`; `public/robots.txt` allow all; **no `CNAME` file needed** (publishing via Actions ignores it) — leave v001's out of the build.
7. Responsive: test the home page at 1920, 1366, ~1024 (tablet) and 360–390 px widths and at 200 % zoom — no horizontal overflow, title wraps sanely, gallery usable; contrast ≥ 4.5:1 on every text sample.

## Part 4 — GitHub Pages workflow (doc 35 §4)

`.github/workflows/pages.yml`: on push to `main` and manual dispatch → checkout → Node 24 → `npm ci` → `npm run validate` → `npm test` → `npm run build` → **release check** (Part 1: credits Archive present, `registry.site` present, no `PROPOSED` marker in the deployed licence text unless Dan's LICENSE files still say so — in which case the site text says so too; every manifest asset present in `dist/`; the video file under 30 MB) → `actions/upload-pages-artifact` (`dist/`) → `actions/deploy-pages`. A failing step publishes nothing. Permissions `pages: write`, `id-token: write`; concurrency group `pages`. The Playwright suite runs in a separate `ci.yml` on pull requests and pushes (it needs the browser install), not on the deploy path's critical section — document the choice.

## Part 5 — Checks, docs, deliverable

- e2e: film plays and pauses at 2:18.0 (fake the media clock), hand-over to live layers, credits scroll from the registry, run-out timings, Skip and reduced-motion paths, playback-failure fallback, REPLAY OPENING, sound state; home page renders every `registry.site` block, notices verbatim vs registry, gallery keyboard, `/demo/` loads and a full route replays byte-identical from the new entry; `og:image` present; 404 redirect.
- Screenshots: film at 0:06 / 1:24 / 2:14 / 2:18 (den) / credits mid / run-out; home page at the four widths; menu with the DEMO tag; About with HOME.
- `npm run dialogue-sheet` regenerated and committed. README: opening sequence, hosting, "Play it at https://finaogame.com" (say "when live" until Dan flips the repo), the deploy workflow and Dan's manual steps from 35 §3.
- `00_BUILD.md`: which content version was built, the release-check state, reversible decisions, open questions.

## Not in DEPLOY

Camera states (M03, waiting on Codex's layers per doc 34), any content edit, DNS/repo visibility (Dan), playtest-3 items.
