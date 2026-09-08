# Content 0.5.4 — validation

All work ran in a separate archive of M02 `50ba5be5bb76500dce20dba2bc8742fffb93a85c`. The live game repository was not edited.

| Check | Result |
|---|---|
| Full unit/regression suite | PASS — 149 tests in 17 files; 0 failures |
| Typecheck | PASS |
| Content/schema/asset validation | PASS |
| Mission sweep | 56 complete routes, 6 distinct outcomes, 112 plan commits, 0 draws |
| Regenerated sheet equality | PASS — fresh generation equals supplied Markdown/CSV |
| Review sheet | 864 rows; 225 branch-only; 114 site rows from 113 named items |
| Archive parity | PASS — 13 source lines + terms verbatim, then unchanged non-affiliation line |
| Site coverage | PASS — HTML text runs, accessibility attributes, preliminary copy and dynamic viewer strings covered |
| Canonical notice reuse | PASS — three disclosures referenced once each; dedication array referenced once |
| Schema failures | Correctly rejects missing/unknown/duplicate/reordered block IDs, duplicate item IDs, empty/whitespace text, bad item IDs, unsafe href schemes and malformed/mixed notice payloads |
| Optional compatibility | Registry without `site` still passes |
| Mechanics comparison | PASS — outside version, Archive and site fields, all six content objects and manifest compare exactly to M02 |
| Engine / app / art | Unchanged |
| Patch check and application | PASS against frozen M02 files; all 23 applied files match delivered bytes, LF preserved |
| Earlier annotations | CSV and XLSX each contain matching 30 note entries; no additional XLSX comment parts |

Fingerprint: `a39484d5d060ba28a16522f3c95d24e9d683fa390ade60e23dbc08c4f0a9d6fb`.

The six new tests cover credit parity, optional-site compatibility, block/item identity validation, invalid text/links/references, complete reference-copy coverage, and occurrence-by-occurrence sheet inclusion. Existing gameplay, presentation, relay, save and replay tests remain active. Existing assertions were updated for version 0.5.4; the save rejection test now explicitly includes 0.5.3.

The source review-sheet exporter initially concatenated three gallery caption boundaries without spaces. Coverage normalizes only whitespace for that preliminary source; the actual HTML text runs and stored strings are checked separately. No copy is dropped to satisfy the test. Site entries are not passed through the game sheet's digit-collapsing/global deduplication, so each named occurrence remains clearable.

Game-generated sheet rows continue to be checked against the M02 renderer. Site and Archive entries are labeled as authored content for deployment integration; this is not a browser-rendering claim. Nine unreachable legacy/reserved strings remain as in M02, including the reserved tier meanings. No browser end-to-end run, film rebuild, website deployment or new art verification is claimed.

The existing content-version/fingerprint save boundary remains in force. No migration is introduced. File checksums and ZIP verification are generated after the final documentation is packaged.
