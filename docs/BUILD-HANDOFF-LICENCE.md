# FNO-LICENCE — build handoff

**Status:** DONE. The MIT and CC BY 4.0 licences are in force with the third-party carve-outs, every string that mirrored the proposed state is updated, the release check requires the in-force state, and the repository is public. Custom domain, HTTPS and DNS untouched (Dan's steps, doc 35 §3 / doc 44 §4).

| | |
|---|---|
| Task | FNO-LICENCE (`FNO-LICENCE-INPUTS.zip`, sha256 `18f9f9ba…`; Dan's rulings `44-Direction-Licences-Confirmed-H5-Check.md`, binding) |
| Baseline | `acca7fe` (FNO-DEPLOY, content 0.5.4) |
| Licence commit | `938ee47` — "Licences in force: MIT code, CC BY 4.0 original content with third-party carve-outs; release check requires in-force state" |
| Delivery commit | *(filled in the zip copy)* |
| Content | **0.5.4**, new fingerprint `972c425aa13fb98ce282c0a13f9ea0d1b23721e741fa48ad7dc0d6b493a130bf` (was `a39484d5…`); validate 56 routes / 6 outcomes / 112 plan commits / 0 draws; no version bump needed (the validator and the save policy key on the fingerprint, which the sheet and validate record) |
| Unit tests | 154 in 18 files; typecheck clean; fail-on-purpose 9 of 9 |
| Browser tests | 58 Playwright cases pass on the licence commit (`evidence/playwright.txt`) |
| Release check | OK on the built `dist/`: licences in force, 23 files scanned for proposed-state phrases, 0 hits — and the negative proof in `evidence/release-check-negative.txt` (a planted "not yet in force" in `dist/index.html` fails the check with exit code 1) |
| Repository | **PUBLIC** since 8 September 2026, minutes after the licence push (14:41 UTC) (`evidence/gh-repo-view.txt`); GitHub Pages enabled with `build_type: workflow` (`evidence/gh-pages.txt`); no custom domain, no HTTPS setting, no DNS |

## A. `LICENSE`

The PROPOSED / NOT YET IN FORCE line is gone. The scope lines ("This file covers the code in this repository (core/, schema/, app/, scripts/, tests/). Content under content/ and assets/ is covered by LICENSE-CONTENT.") and the MIT text are unchanged.

## B. `LICENSE-CONTENT`

Replaced with `LICENSE-CONTENT.final.txt` byte for byte (3,816 bytes, LF, no BOM): CC BY 4.0, copyright Dan Lee-Odinson 2026, "What this licence covers", "What this licence does NOT cover" (NASA photographs, film and audio under NASA's media usage guidelines with the no-endorsement line; the National Archives film via Public.Resource.Org, public domain / CC0; the Freesound sounds, CC0 except "Beep 8 count (loopable)" by JonNicholas under CC BY 3.0 in `LICENSES/CC-BY-3.0.txt`; the typefaces Barlow, Barlow Condensed and Chakra Petch under SIL OFL 1.1; real people by name and NASA portrait under the NASA terms), the AI-assisted works paragraph, the attribution line and the notices. Every path the file names exists in the repository: `docs/codex-content-0.5.4/` (the current packet with its source register), `LICENSES/CC-BY-3.0.txt`, and `OFL.txt` beside each font under `public/fonts/`.

## C. The strings that mirrored the proposed state

`git grep -n -i -e "pending confirmation" -e "proposed licen" -e "not yet in force" -e "to be chosen before publication" -e "proposed MIT"` outside `docs/` now matches only the release check's own phrase list. Changed (doc 44's replacement strings used exactly where it gives them; the full old/new record is `docs/licence-string-changes.md`, committed for the next Codex packet):

- `content/registry.json` — the "Made by" credits line → `MIT (code) · CC BY 4.0 (original content) — see LICENSE and LICENSE-CONTENT.`; `site.blocks[open_source]/paragraph-01` → the doc 44 statement ("The project is open source. The code is released under the MIT License and the original game content under Creative Commons Attribution 4.0 International; … Third-party materials — NASA and National Archives imagery and film, the Freesound sounds and the typefaces — are not covered by those licences and remain under their own credits and terms.").
- `assets/manifest.json` — the six music entries: `rights` → "released with the game under CC BY 4.0 (LICENSE-CONTENT), to the extent of the rights held"; `license` → "Dan Lee-Odinson (Suno Pro plan); CC BY 4.0 with the game content (LICENSE-CONTENT), to the extent of the rights held" (doc 44 gave the rights wording; the `license` field follows it). The two project-owned kit faces → "Project-owned (MIT with the code)". The opening film's `license` → "… project-owned art and music under CC BY 4.0 (LICENSE-CONTENT)".
- `app/render.ts` — the About / Credits licence sentence → "Code under the MIT License; original content under CC BY 4.0; third-party material keeps its own terms and credits (LICENSE and LICENSE-CONTENT in the repository)." (on the sheet as `ui.text`).
- `README.md` — the music table's rights cell, and the "Licenses (proposed)" section rewritten as "Licences" (in force, the carve-outs, the release check's rule).
- `tests/core/content-053-relay.test.ts` — pins the new credits line instead of "pending confirmation"; `tests/fixtures/content-054/site-copy.proposed.json` and `homepage.html` — the open-source paragraph updated so the 0.5.4 site test still proves the registry covers Codex's copy.
- `docs/dialogue-sheet.md` / `.csv` regenerated (861 strings, 9 unreachable as before).

Historical documents under `docs/` (handoffs, packets, the v001 homepage notes) keep their wording; the release check does not scan them.

## D. `scripts/release-check.ts`

Check 3 now **requires** the in-force state instead of agreement: no PROPOSED / NOT YET IN FORCE header in either licence file; `LICENSE` is the MIT text naming the holder; `LICENSE-CONTENT` is CC BY 4.0 naming the holder with the "What this licence does NOT cover" section mentioning NASA, the National Archives, freesound.org and the SIL Open Font License; the site's open-source statement names "MIT License", "Creative Commons Attribution 4.0 International" and `LICENSE-CONTENT`; the credits "Made by" line names the in-force terms; and none of "PROPOSED LICENSE", "not yet in force", "pending confirmation", "to be chosen before publication", "to be confirmed before publication", "proposed licence/license", "proposed MIT" appears in `content/*.json`, `assets/manifest.json`, `README.md`, the licence files or any `.html/.js/.css/.json/.txt` under the built `dist/` (the game bundle carries the content JSON, so a stale packet fails the check before Pages publishes it). Every hit is listed with its context.

## E. Checks

`npm run dialogue-sheet` → `npm run validate` → `npm run typecheck` → `npm test` → `npm run build` → `npm run release-check`, plus `npm run test:e2e` (58 cases) and `npm run validate:fail`. Transcripts under `evidence/`.

## F. Public, and the Pages runs

- `gh repo edit dan-lee-odinson/failure-is-not-an-option --visibility public --accept-visibility-change-consequences`, then `gh repo view --json visibility` → `PUBLIC`, `isPrivate: false`. Before the flip: no secret-shaped string in the tracked tree, no Epidemic Sound file ever committed, the largest blobs in history are the film (27 MB) and three CC0 room-tone WAVs.
- `POST /repos/dan-lee-odinson/failure-is-not-an-option/pages` with `build_type: workflow` → the site record exists (`html_url` `https://dan-lee-odinson.github.io/failure-is-not-an-option/`, `cname: null`). Nothing else set.
- `pages.yml` runs: the DEPLOY push (`acca7fe`, run 34234554332) and the licence push (`938ee47`, run 34239840228, started 14:41:03 UTC, two seconds after the push and before Pages was enabled) both failed at `actions/configure-pages` — the expected "Pages not enabled" failure, harmless. The push of this record (the delivery commit) triggers the next run with Pages enabled; its URL and result are in `evidence/gh-runs.txt`.
- Until the custom domain is attached, a successful deploy lands at the `github.io` project path, where the build's root-absolute URLs (`base: '/'`, doc 35 §4) do not resolve — that is expected: the site is built for `finaogame.com`, and the domain is Dan's step.

## Dan's steps now (doc 44 §4, doc 35 §3)

1. Verify `finaogame.com` under the account's Pages settings (TXT record at the registrar).
2. DNS: the four A and four AAAA records on the apex, `www` CNAME to `dan-lee-odinson.github.io`.
3. Repository → Settings → Pages: custom domain `finaogame.com`; Enforce HTTPS once the certificate is issued.
4. Re-run `pages.yml` if needed, then playtest 3 on the live `/demo/`.

## Not changed

Mechanics, the film, the site layout, the content beyond the licence and notice strings above. Content version stays 0.5.4.
