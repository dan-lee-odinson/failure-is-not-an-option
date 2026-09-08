# FNO-M02 — Content 0.5.3 (Lovell), enlarged-text layout, tier tooltip, small items

**Task id:** FNO-M02 · **From:** Claude (Cowork) for Dan · **To:** Claude Code · **Date:** 8 September 2026
**Repo:** `C:\Users\wolfe\projects\failure-is-not-an-option`, `main`. **Baseline: M01 delivery `d679b2b`** (content 0.5.2).
**Shared folder:** `C:\Users\wolfe\Documents\Claude_GPT_Shared_Workflow\Failure-is-Not-an-Option` = `SHARED\`.
**Deliverable:** commits on `main` + `SHARED\FNO-M02-BUILD.zip` (same shape as M01: `00_BUILD.md`, evidence, screenshots, regenerated sheet). Nothing else written into `SHARED\`.

Read first: `content-0.5.3/00_HANDOFF.md` (Codex; §3 is the clearance list for every CAPCOM line), then `docs/33-…` (my review), then `docs/31-…` for the rules behind the Lovell relay. Standing rules from M00b–M01 apply unchanged (presentation never touches the simulation; no fiction call-outs in play text; no provenance in dialogue; label never delete; no NASA marks; manifest-only assets; native controls, live text; reduced motion = static and cuts; contrast ≥ 4.5:1 at both viewports and both text sizes).

**Not in M02:** the opening montage / den reveal / credits scroll (needs the clips — separate task), camera states (needs Codex's pose layers — M03), any content edit.

## Part 1 — Content 0.5.3 integration

1. Codex's patch (`content-0.5.3/integration/content-0.5.3.patch`) is diffed against `d679b2b`, which is HEAD; `integration/baseline-hashes.json` should match exactly. Apply it; if anything fails, merge by hand and say so in `00_BUILD.md`. `integration/files/` are reference copies — do not apply them as a second change.
2. Copy only the **five new PNGs** from `content-0.5.3/assets/` (Lovell neutral + concerned, den plate, den smoke, den beam); the den plate in the packet is already the lamp-off revision (hash `cb7c83a8…`). Manifest: the composite CAPCOM portrait (`fno_gemini_portrait_capcom_neutral_v001.png`) is retired from the manifest; delete the file from `assets/` (it is preserved in Codex's `art/history/`).
3. Expected after integration: validate 56 / 6 / 112 / 0, content 0.5.3, fingerprint `63fa5eacd8b7433e9e08b6c03f366d621eac5bc7fa72d24c994f427897ccf36d`; `npm run dialogue-sheet` regenerates (728 strings per Codex, before your changes); Codex's new relay test passes; typecheck clean. Old saves (≤ 0.5.2) rejected with the existing reason; README saves note updated.
4. Presentation: `g8-capcom` is now **JIM LOVELL — CAPCOM** with neutral/concerned portraits — the speaker label and the portrait resolve from `characters[]` as for everyone else; nothing hard-coded. The History panel shows the new Lovell note (Codex supplied the renderer edit in the patch; keep it). `registry.credits` and `registry.opening_den` are data only in this pass: validated, on the sheet, not rendered anywhere yet (About/Credits keeps its current credits rendering until the credits scroll is built).
5. Two new optional Glen questions (`g8-q-crew-crisis`, `g8-q-crew-return`) render like the existing questions; asking them adds question log entries as any question does. Replay test: byte-identical with and without them asked.

## Part 2 — Enlarged-text layout rule (1366×768 + enlarged, and any viewport where the dialogue starves)

Problem (M00c review, confirmed in screenshots): at 1366×768 with enlarged text the return-decision conversation panel shows only a cropped portrait and the two question keys; the dialogue is unreadable without scrolling a tiny box, and the status bar wraps to two rows.

Rule: when the conversation panel's content area would be shorter than **four lines of body text** at the current text size, switch the play layout to **stacked mode**:
- the room stays as the backdrop (dimmed slightly more), Glen's head clear zone still respected;
- the conversation panel spans the full content width (the evidence column collapses to an **EVIDENCE · n** key in the status bar that opens the evidence list as an overlay panel, the same translucent panel style, with pinning working there);
- the question keys stay pinned at the panel's bottom; the panel gets the height it needs up to 55 % of the viewport, dialogue scrolls inside it above the questions;
- the decision cards sit below as now (Details open), scrolling the page if needed; the status bar collapses to one row by shortening key labels (BINDER · HISTORY · SAVE · SET) and moving the mission title to a second line only if unavoidable.
Stacked mode is presentation only (a CSS class + one layout flag), never persisted, re-evaluated on resize and text-size change; reduced motion unaffected. Apply the same rule to every conversation screen (briefings, reports, post-flight), not only the return decision.

## Part 3 — Small items

1. **Tier meaning tooltip.** On the resolution result card, the tier word gets a native `title` and a visible ⓘ key that opens a small paper strip with `resolution_presentation.tiers[tier].meaning`; keyboard-reachable; Escape closes. Nothing else on the card changes.
2. **1920×1080 conversation panel height.** Give the conversation panel more room by default at 1920×1080 so at least six lines of dialogue show above the pinned questions before scrolling (M00c left ~2.5). Take the space from the room, not the cards.
3. **Sound key after Begin.** Confirm in e2e that after Begin the SOUND key reads ON (unless previously turned off) on the prologue and resolution screens; the M01 screenshots show OFF, which I believe is harness state — assert it either way and re-shoot one prologue and one resolution screenshot with the real default.
4. **Save/Load START A NEW CAMPAIGN** runs the prologue (Claude Code's M01 call) — keep; add a one-line "(plays the mission briefing)" hint under that key so it isn't a surprise.

## Part 4 — Checks, docs, deliverable

- e2e: Lovell label and portrait at each of his seven lines; the two new questions render and log; History Lovell note present; retired composite portrait absent from manifest and disk; stacked mode engages at 1366×768 enlarged on every conversation screen and does not engage at 1920×1080 default; evidence overlay opens/closes with keyboard and pinning works in it; status bar single row at 1366×768 enlarged; tier tooltip; six-line minimum at 1920×1080; sound default after Begin; replay byte-identical (with and without the new questions; with stacked mode toggled by resize mid-run).
- Screenshots: return decision, crisis report and post-flight brief at 1366×768 enlarged (stacked) and 1920×1080 default; the evidence overlay; the tier tooltip open; Lovell's crisis line.
- Contrast re-measured on every changed screen. `npm run dialogue-sheet` regenerated and committed. README: 0.5.3, Lovell, stacked layout, tooltip.
- `00_BUILD.md` as before: what applied cleanly, anything merged by hand, counts, contrast, reversible decisions, open questions.
