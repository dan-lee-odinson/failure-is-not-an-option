# Content 0.5.4 — Archive credits and homepage copy

**To:** Dan and Claude · **From:** Codex · **Request:** 41 · **Baseline:** content 0.5.3 integrated in M02, `50ba5be5bb76500dce20dba2bc8742fffb93a85c`.

One incremental content drop. Six content JSON files, the full manifest, regenerated Markdown/CSV review sheets, integration patch and supporting files, approved input references, notes inventory, validation results and file hashes are included. No new art or mechanics change.

**Result:** 149 tests pass in 17 files. Validator passes 56 complete routes, six outcomes and 112 follow-on plan commits, with zero random draws. Typecheck and patch application checks pass.

**Fingerprint:** `a39484d5d060ba28a16522f3c95d24e9d683fa390ade60e23dbc08c4f0a9d6fb`.

## Archive — count clarification

The approved `video/film-v002/provenance/archive-lines.json` contains **13 source strings plus one terms string: 14 approved lines total**. Documents 40/41 call this “fourteen source lines + the terms line,” but the file itself is authoritative under Dan's direction. All thirteen entries and `terms_line` were copied verbatim, in order, without inventing another credit. The existing non-affiliation line is retained afterward, making **15 lines in the Archive section**.

Only Archive changes in `registry.credits`. Sources, Music, Sound, Type and Made by remain identical to M02. This content change does not rebuild or alter the approved film or its playback timing.

## Homepage contract

`registry.site` is optional. When present, it contains `blocks`, an ordered array with exactly these IDs:

`hero`, `about`, `demo`, `gallery`, `coming_soon`, `bio`, `notices`, `nasa_marks`, `open_source`, `footer`.

Each block has `items`; each item has a stable ID within its block, a `kind`, and either non-empty `text` or a canonical `notice_id`, never both. Links may carry `href`. Use the `(block.id, item.id)` pair as the clearance/rendering key. Item IDs are frozen for this drop; preserve them when revising text. See `docs/ARCHIVE-AND-SITE-REVIEW.md` for the rendering and sheet contract.

- The three shared disclosures reference `project_disclaimer`, `ai_disclosure` and `dramatization`, once each; their text is not duplicated in `site`. The two dedication paragraphs likewise resolve from the existing `dedication` array.
- The homepage's NASA marks disclosure is included in `nasa_marks`, as Dan explicitly requested after the first homepage delivery. Existing canonical game notices remain unchanged.
- All homepage wording from `site-copy.proposed.json` is covered. Header/nav, controls, image alternatives, accessibility labels, metadata, gallery viewer captions and its counter template were added from the authoritative v001 HTML/JS because the preliminary extraction did not include them all. Three flattened figcaption heading/paragraph boundaries receive their correct whitespace from the HTML; wording is unchanged.
- There are **113 named site items**, producing **114 sheet rows** because the dedication reference resolves to two paragraphs. These occurrences retain their own IDs even when text repeats elsewhere. The game section retains its existing deduplication rules; the site clearance section does not collapse numbers or cross-block repetitions.
- The complete sheet has **864 rows, 225 branch-only**, across the unchanged 56 game routes. The separate site section is authored copy for Claude's deployment renderer, not a claim that M02 already renders it.
- The HTML/CSS/JS in `FNO-Homepage-v001/site/` remain the presentation reference. This drop does not rewrite that page, integrate the homepage renderer, deploy GitHub Pages, or change the live repository.

## Dan's sheet notes

The shared CSV and XLSX each contain the same **30 earlier notes**; the spreadsheet has no additional comment parts. They are the 0.5.0 wording review already addressed in that packet's handoff (ground drills, evidence wording, pin help, return risk wording and source context). No new 0.5.2/0.5.3 annotations were found. No mission dialogue was changed or stale text restored. The read-only inventory is `docs/site-notes-audit.json`; it preserves both note sources for traceability.

## Integration

1. Start with M02 commit `50ba5be5bb76500dce20dba2bc8742fffb93a85c`. Check `integration/baseline-hashes.json` first. If the checkout has advanced, merge these scoped changes into it; do not overwrite newer work wholesale.
2. Apply `integration/content-0.5.4.patch` from the repo root. It covers all 23 changed/new paths: six content files, manifest, types, registry schema, validator, sheet generator, generated sheet, version assertions, six new contract tests and their reference fixtures. `integration/files/` contains supporting snapshots for review, not a second patch to apply afterward. LF line endings are preserved; the verification used `git -c core.autocrlf=false apply`.
3. No runtime images, audio or film files need copying. The manifest's content version alone changes; all entries and other metadata remain M02-identical. `assets/manifest.json` is included in full for integration parity.
4. Run validate, tests, typecheck and sheet regeneration after merging. Expected fingerprint is above. The existing save policy rejects 0.5.3 and earlier content versions; no migration is introduced. Keep an older build for older saves when needed.
5. During the deploy task, render the homepage's labels and copy from `registry.site`, resolve notices from `registry.notices`, and retain the v001 presentation/assets and `/demo/` destination. Keep the gallery `{current} / {total}` template dynamic. Text is plain text; do not render it as untrusted HTML. This schema does not introduce domain state or any gameplay input.

## Review / verification files

- `docs/dialogue-sheet.md` and `.csv`: generated clearance sheet, including the new site section.
- `docs/ARCHIVE-AND-SITE-REVIEW.md`: exact Archive lines, block counts and renderer notes.
- `VALIDATION.md`, `mechanics-audit.json`, `docs/test-results-054.json`: evidence and limits.
- `references/`: request 41, direction 40, homepage handoff 39, approved credit file and homepage copy/HTML/JS references, plus M02 handoff documents present in the baseline.
- `FILES.sha256`: every packet file except itself. Adjacent ZIP hash and verification JSON cover the archive.

The public site’s proposed license wording remains unchanged. This packet does not enact licenses or imply NASA approval. Browser end-to-end and final homepage rendering checks remain with the integrated deploy task; none are claimed here.
