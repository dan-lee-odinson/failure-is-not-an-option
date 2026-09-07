# Review — Content 0.5.0, Apollo v002, Hero title v003

**From:** Claude · **To:** Dan and Codex · **Date:** 7 September 2026 · **Reviews:** `20-Codex-Content-and-Interface-Response.md`, `FNO-M00-Codex-Content-v0.5.0.zip`, `FNO-Apollo-Navigation-v002.zip`, `21-Direction-Engineering-Hero-Title.md` / `FNO-Title-Hero-v003.zip`, revised `07` and `08`.

## 1. Verdict

Content 0.5.0 is accepted as the M00b content baseline, subject to Dan clearing the regenerated sheet. Apollo v002 and hero v003 are accepted as the presentation references for the M00b build. One content decision (§4) and one title choice (§5) are Dan's before I write the FNO-M00b handoff.

## 2. Integrity

| Packet | Check | Result |
|---|---|---|
| Content 0.5.0 | `FILES.sha256` (40 entries, CRLF stripped) | all OK |
| Apollo v002 | `FILES-v002.sha256` (516 entries) | all OK; 73 additions + 3 titles + 4 support = 80 new pairs as claimed; v001 files unchanged |
| Hero v003 | `FILES.sha256` (20 entries) | all OK; Chakra Petch Bold with OFL 1.1; `assets/room.png` is the approved room |
| `08` dedication/disclaimers | diff against `discard/08-…pre-M00b` | approved copy unchanged; only the three presentation bullets were rewritten for direction 18 |

Codex's validation claims (56 routes, 6 outcomes, 112 plan commits, 0 random draws, 75 tests) are reported, not re-run here; Claude Code re-runs them at integration. New fingerprint `bca3210f…d6e8`.

## 3. Dialogue and standing rules

The regenerated sheet has 557 strings (201 branch-only). All 30 of Dan's notes are mapped in `03-Markup-Resolution.md`, and the mapped rows read as intended: the rehearsal options name desks, message and readback; the return fork is now "Bring them down now and leave them waiting at sea, or keep them in orbit with less propellant for entry?"; Glen's questions use "What are the risks…"; the six consequence reports run call → delay → entry/pickup → crew condition; contractions are in.

Standing-rule sweep of the sheet: fiction call-outs (F-labels, "invented", "not a reconstruction", "simulated") appear only in `evidence.provenance` rows, the History panel text, and the four debrief "Departures from the record" paragraphs — nowhere in briefing, line, option, reaction or consequence rows. No "cost them". No source provenance in dialogue. Rule and lesson cards carry no fiction sentence. This satisfies 17 §3 and 16 §3.

Small items for the build, none blocking:

1. **Empty provenance fields in History.** Rows 483–495 render "Sources: . Fiction register: ." when a field is empty. Claude Code suppresses empty fields in the History panel formatter.
2. **Row 100** (narration under contact rehearsal): "CAPCOM has left the next report's receipt blank. Nothing new has come through." reads stiff. Suggested for Dan's sheet pass: "No receipt yet. CAPCOM leaves the line blank until something comes through." Dan's call.
3. **Row 8** (menu subtitle) "A historical mission with fictional return decisions and alternate outcomes." is outside play and acceptable; it is the one place a fiction sentence is visible before play. Keep, or drop in favour of the About screen — Dan's call.
4. **0.4.0 saves do not load in 0.5.0** (fingerprint policy; no migration supplied). Acceptable for a prototype; the build notes and README say so. Keep the M00a build folder if the playtest-1 save is worth replaying.
5. **Integration patch scope.** The adapter touches `core/types.ts` and `core/views.ts` as well as `app/render.ts`, both schemas and six test files. Claude Code checks `integration/baseline-sha256.json` against HEAD `2524c16` before applying; on any mismatch it merges by hand rather than overwriting. The seven unreachable strings are unavailable-option reasons and are expected.

## 4. Decision for Dan — which return option is the historical one?

Codex's 0.5.0 keeps both return options as alternate history: the lamp goes ALTERNATE HISTORY at return planning whatever you choose, and `historical_option` is set only on the termination decision and the accountability decision. Codex's reason: the game's propellant/recovery tradeoff and the crew-condition sequences are invented, so neither route is "the historical return".

Codex's own new source reading cuts the other way. The mission report (H6, p. 6-9) records that recovery zone 3 was available on revolutions 6 and 7 and that revolution 7 — the later one — was selected. In timing terms, history took the game's **later** option: another orbit, then reentry to the western Pacific with the recovery force closer. Playtest 1's complaint was "I tried to choose the historical route but I still wasn't clear where I deviated." Under the 0.5.0 mapping, a player who chooses the later opportunity is told ALTERNATE HISTORY for doing what history did, which is the same confusion in a new coat.

Two options:

- **(a) Keep 0.5.0 as delivered.** Both return choices are alternate history. Simple, cautious, but does not answer the playtest complaint at the return fork.
- **(b) Mark the later opportunity as the historical timing (recommended).** `historical_option: g8-return-later` on the return decision; `alternate_history` triggered only by `g8-return-earlier`; the "later" departure paragraph reworded to say the timing matches the record while the warning sequence and crew condition are dramatized. Nothing is deleted — the departure paragraph keeps its caution; the lamp just tells the truth about the timing. This is a 0.5.1 patch for Codex: two metadata changes, one paragraph, regenerate the sheet.

Under (b) the label semantics stay exactly what 19 §6 set: HISTORICAL CHOICE = this decision matches the record; ALTERNATE HISTORY = you have left it. Dramatized consequences under a historical choice are still the historical path — the whole game is dramatized.

## 5. Title choice for Dan — hero A or B

Both v003 studies honour direction 21: Chakra Petch Bold, live text, room under a dark overlay, Glen's head clear, Continue small and keyboard-reachable, menu keys only after Continue.

I recommend **A — Engineering block**. The three lines share a left edge and read as one stencilled block; the block sits right of Glen with air around it; the same lockup shrinks cleanly into the menu continuation (`menu-continuation.png`). B pushes FAILURE to full width, which is dramatic, but the two offset lower lines read as a stagger rather than a lockup, and the F sits over the top of Glen's clear zone at smaller aspect ratios.

Build notes for either: the title is live text sized from `title-layout.json` at 1920×1080 and scaled proportionally; at 1366×768 the Continue label falls to ~16 px, so hold it at 18 px minimum. Chakra Petch is scoped to the hero and menu title only; Barlow stays for everything else. The bracket corners in the hero frame are a study motif, optional in the build.

## 6. Apollo v002 — accepted, with build notes

Cards (rest / chosen with ORDERED stamp / unavailable with reason), the two steady mode lamps, translucent panels and dividers, title-scale keys with six states, blank reflow templates, Barlow fonts with OFL — all as asked in 19. Theme mechanics match the ruling: `data-ui-mode="apollo"` on the root, per-mode custom properties, geometry shared, `MODERN_UI_AVAILABLE = false` as the single constant, no Modern skin. The demo's relative CSS URLs are a preview convenience; the build resolves faces through the manifest loader.

## 7. Document numbering

Codex's `20-Codex-Content-and-Interface-Response.md` and `21-Direction-Engineering-Hero-Title.md` share numbers with Claude's `20-Music-Scene-Entries.md` and `21-Soundscape-Entries-and-Rights.md`. Nothing is lost — refer to these four by full filename. From here the next number is **24**; `00-Index.md` (new) is the ledger, and whoever writes a doc adds its line there first.

## 8. Next

1. Dan: review the 0.5.0 sheet (`FNO-M00-Codex-Content-v0.5.0/docs/dialogue-sheet.csv`, annotate a copy), choose §4 (a)/(b), choose hero A/B.
2. Codex: if (b), ship 0.5.1 (metadata + paragraph + regenerated sheet); otherwise nothing.
3. Claude: write the FNO-M00b Claude Code handoff — presentation pass per 16 §3 and 17 §5, opening screens per 18 / revised 07 / hero v003, kit as theme per 19 §6, music cues per 20 §5, soundscape per 21 §3 with Dan's chosen files, `room_bed_gain` 0.3, Quindar generator and CC BY credit, History provenance formatter fix, 0.4.0-save note.
4. Playtest 2 → Codex review → M01.
