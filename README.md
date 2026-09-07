# Failure is Not an Option

*A 2D NASA flight-director simulator and narrative strategy game, framed from the director's first-person viewpoint.*

**This repository holds FNO-M00**, the first playable increment: one Gemini VIII chapter, *The Weight of the Call*, played from preparation through a fictional return decision, its aftermath, a post-flight accountability scene, a causal debrief, and a small playable Gemini IX-A preparation plan whose options depend on what you did.

Content package **0.5.1** (fingerprint printed by `npm run validate`). Simulation version 0.1.0.

## Notices

**A historical mission with fictional return decisions and alternate outcomes.**

**Project disclaimer.** Failure is Not an Option is an independent homage to NASA and the people of the space program, created for appreciation and exploration, not for profit. It is not affiliated with, authorized, sponsored, or endorsed by NASA.

**Generative AI disclosure.** This project was created using generative AI within a human-in-the-loop process, with human creative direction, review, and final decision-making.

**Historical dramatization.** Inspired by real missions and people, this game includes fictional dialogue, simplified systems, and alternate historical outcomes. These elements do not represent the actual words, beliefs, or actions of the people portrayed. NASA is not responsible for the game's interpretations, generated content, or accuracy.

No NASA insignia, worm logotype, or seal appears in any generated asset. The room plate and four controller portraits in `assets/` are Codex's art delivery v1.0.0 (AI-generated under Dan's art direction; provenance in `assets/manifest.json` and `docs/codex-art-1.0.0/`). The emblem on Glen's vest is the approved original Flight Operations emblem (version 5), rendered as a separate layer from `assets/flight-operations-v005.svg`. `npm run placeholders` only fills slots that are still waiting for art.

## Attribution

Dan Lee-Odinson directs and dispositions. Codex (GPT-6 Astra) designs, writes the content package, and reviews independently. Claude (Anthropic, Claude Code) engineers the schema, simulation core, application, and tests. The division of labor, the content specification, the source register (H1–H5), the fiction register (F1–F10), and the acceptance cases are in `docs/`.

Historical caution in this project means labeling, never deleting (`docs/codex-content-0.4.0/12-Direction-Historical-Caution.md`). Sourced criticism stays with its attribution; fictional consequences carry a fiction-register label on screen.

## Running it

Node LTS (24 tested).

```bash
npm install
```

```bash
npm run dev
```

Opens the game at http://localhost:5173. Play with the mouse or entirely from the keyboard (Tab / Shift+Tab, Enter, Escape closes overlays).

```bash
npm run validate
```

Checks every file under `content/` and `assets/manifest.json`: JSON Schema, id uniqueness, every reference resolves, outcomes provably mutually exclusive, an exhaustive route sweep (every preparation set × both orders × both lessons × both stances × every enabled plan), and manifest dimensions against the PNG files on disk. Prints the content fingerprint. `npm run validate -- --root <dir>` validates a copy elsewhere (used to demonstrate deliberate failures).

```bash
npm test
```

Vitest against the engine-free core: the replay test (written first, never deleted), acceptance cases AC-01…AC-16 where they are domain cases, save/import verification, and the validator's fail-on-purpose cases.

```bash
npm run test:e2e
```

Playwright display and access cases (AC-12) and the screenshot set at 1920×1080 and 1366×768, default and enlarged text, written to `artifacts/screenshots/` (ignored by git; shipped in the handoff zip). Requires `npx playwright install chromium` once.

Other scripts: `npm run placeholders` generates labeled placeholder PNGs for any manifest slot still marked to-generate or placeholder (none at present); `npm run fingerprint` prints the content fingerprint; `npm run build` type-checks and builds to `dist/`.

## Layout

```
core/      engine-free simulation (TypeScript; no DOM, no timers, no rendering)
schema/    JSON Schema for every content type
content/   the mission, characters, evidence, procedures, follow-on, and registry (data, never code)
assets/    assets/manifest.json and the generated placeholder PNGs
app/       presentation (HTML/CSS/TypeScript, Vite)
scripts/   validator, placeholder generator, fingerprint
tests/     core unit tests (Vitest) and browser tests with screenshots (Playwright)
docs/      the build handoff, Codex's content package 0.4.0, and the design record
```

## Saving

One browser-storage slot plus JSON export/import. An import is verified before anything is replaced: structure, content version and fingerprint, simulation version, every referenced id, and replay equivalence (the recorded inputs are replayed from the initial ledger and must reproduce the stored state and event-log hash byte for byte). A failed import leaves the existing save untouched and tells the player why. Saves from earlier content versions are rejected with an unsupported-version message; no migration is provided. Saves made with content 0.4.0 or 0.5.0 (the M00, M00a and playtest-1 builds) do not import into 0.5.1: the content fingerprint changed and this project does not migrate saves, so keep the older build if an old playthrough needs replaying.

## Licenses (proposed)

`LICENSE` (MIT) covers the code; `LICENSE-CONTENT` (CC BY 4.0) covers `content/` and `assets/`. Both are proposed and carry a header saying so; Dan confirms them before publication.
