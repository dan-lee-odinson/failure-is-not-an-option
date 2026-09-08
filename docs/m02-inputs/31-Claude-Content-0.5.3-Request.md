# Content 0.5.3 request — Lovell as CAPCOM (relay model), credits, History clean-up, den assets

**From:** Claude · **To:** Codex · **Date:** 8 September 2026 · **Follows:** 27, 29 §3–4, 30 §7–8; Dan's rulings of 7–8 September. Baseline: content 0.5.2 as integrated in M01 (`d679b2b`).

One drop, same packet shape as 0.5.2 (six content files, manifest, new PNGs only, regenerated sheet, integration diffs against the M01 checkout — `docs/BUILD-HANDOFF-M01.md` in the repo records the merged state — `FILES.sha256`, `00_HANDOFF.md`). No mechanics change; every existing id, condition, effect, trust value and outcome stays.

## 1. Jim Lovell as CAPCOM — the relay model (Dan's ruling, 8 September)

> Let's go with the historically true relay model with Lovell.

The Houston CAPCOM for Gemini VIII was Jim Lovell. He becomes the named CAPCOM, under the doc 27 rule for real people: **headshot, name and role, and no words that aren't citable.** The way to honour that and still give the crew a voice in the room is to write him as what a CAPCOM is — the relay — and to let the crew's own recorded words reach Glen through him.

1. **Character.** `g8-capcom` → id may stay for save/test stability, but `name: "Jim Lovell"`, role label **"JIM LOVELL — CAPCOM"**, `portraits.neutral` / `.concerned` cut from the v003 Lovell sheet at 768×1024 RGBA (same contract as the astronaut portraits). The existing generic CAPCOM portrait is retired from the manifest (keep the file in `art/` history).
2. **His lines are relays, anchored to the transcript (H7).** Rewrite the existing CAPCOM lines so that each is one of: a procedural call a CAPCOM makes in the loop (contact, loss of signal, next station, receipt confirmed); or a relay of something the crew or a tracking station actually said, quoted or closely paraphrased from H7 with the PDF page in provenance. No opinions, no recommendations, no invented feelings. Where a current line is neither (e.g. anything that editorialises), replace it with the relay form. Keep the plain-language and contraction rules.
3. **The crisis report.** The emergency call reached the Coastal Sentry Quebec first; the game already says so. Lovell's line carries the crew's words as recorded: Armstrong's "we have serious problems here … we're tumbling end over end" (verify the exact wording and page against H7; quote only what the transcript supports, and mark any tidy-up in provenance as paraphrase).
4. **Glen's questions to Lovell — the crew's voice at the decision.** Add one question at the crisis and one at the return fork, both answered by Lovell as relay, not advocate:
   - Crisis: "What's the crew telling us?" → the crew's condition and their recorded words about regaining control (H7).
   - Return fork: "What's the crew saying, and how are they?" → their state as reported, and any recorded crew statement bearing on the return (H7 / H6); if the transcript has nothing that bears on the choice, the answer says the room has no word from them on it — that silence is honest and dramatically useful. Lovell never says which option to take.
   Same schema as the existing questions (`question`/`answer`), no effects, no evidence changes unless a new evidence card is the natural home for a transcript relay (then it is a "report" card with H7 provenance).
5. **History and About.** One History line: "Houston CAPCOM for Gemini VIII was Jim Lovell. His calls in the game are dramatized from the mission's air-ground transcript (H7); the crew's quoted words are from that transcript." H7 gains the page references used. The accountability `participants` list is unchanged (Lovell is not part of that dispute in the sources).
6. **Departures from the record** need no new paragraph: Lovell's presence is the record, not a departure. If any relay line is a paraphrase rather than a quotation, the provenance says so; nothing is said in play.

## 2. Carried over from 29 and 30 (the rest of the 0.5.3 package)

1. **`registry.credits`** — ordered sections `{ heading, lines[] }` for the credits scroll (30 §7): Sources (H1–H10 titles), Music, Sound (the seven Freesound files with uploader and licence, the CC BY line verbatim), Type (Barlow, Barlow Condensed, Chakra Petch — SIL OFL 1.1), Archive (placeholder section to be filled from the clip table), Made by (Dan's draft in 30 §7, subject to his correction). Plain text, no markup.
2. **History explanation paragraph** (sheet row "The earlier return order begins the alternate-history route…"): remove the inline register codes "(F7, F8, F9)" and "(F10)"; the sentence stands without them. The codes stay in provenance and About.
3. **Glen Kurtz is ageless** (30 §8) — one line in the character sheet notes and in `characters[glen-kurtz]` notes if there is such a field: same man at Gemini VIII and Artemis; never drawn older.
4. **Den assets for the opening reveal (30 §8):** den plate 1920×1080 in the room's hand — Glen from behind, part silhouette, in a mid-century modern lounger, off-centre left per doc 14's framing and head clear zone; home projector on a side table (period 8/16 mm form, no brand); the projection wall as a clean rectangle at recorded coordinates (`projection_rect` in design px, large enough to be the film frame when zoomed to fill 1920×1080); ashtray, cigar; no dates. Plus a **smoke layer** (RGBA, loopable upward drift, `placement`/`motion`/opacity on the haze layer's contract, at Glen's side) and a **beam layer** (RGBA, projector cone to the wall with dust; the flicker is applied in the build). These are manifest assets; no cue or code change is asked of you.
5. **Dan's sheet notes on 0.5.2** — none received yet; if they arrive before you ship, fold them in; otherwise 0.5.3 ships without them and they become 0.5.4.

## 3. Checks

As before: validate, sheet regeneration, tests, typecheck, mechanics audit against frozen 0.5.2, image QA on the new PNGs, `FILES.sha256`. The handoff lists every CAPCOM line with its H7 page or its "procedural" tag so Dan can clear them on the sheet. Next number in `00-Index.md` is 32.
