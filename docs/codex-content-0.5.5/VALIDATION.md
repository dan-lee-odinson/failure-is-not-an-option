# Content 0.5.5 verification

Verified on 8 September 2026 in an isolated copy of repository commit 423e1ec006315b1fdc3ec8b96d9fc00525b32490, using the already installed local dependencies. The public repository checkout was not edited.

| Check | Result |
|---|---|
| TypeScript typecheck | PASS |
| Content/schema/asset validator | PASS; 56 complete routes, six outcomes, 112 plan commits, zero draws |
| Full unit/contract suite | PASS; 299 tests in 19 files |
| New 0.5.5 tests | 145; schema rejection for each of 19 missing fields, malformed unions, bad references, duplicate line IDs, placement/conditions, baseline preservation, 112 mechanics comparisons |
| Dialogue sheet generation and equality/coverage | PASS; 861 rows, 225 branch-only |
| Production build | PASS |
| Release check | PASS; licences in force; 23 files scanned, zero proposed-state hits; 70 manifest assets; 15 Archive lines |
| Baseline fixtures | Parsed content and manifest equal exact baseline Git blobs |
| Patch application | See integration/patch-verification.json |

Candidate fingerprint: `4c22b8e7949ba84df3799d692dcec360391919b5b18936e9c141991883efff2d`. Tests compare full state and logs after every input across 112 routes; only the run header version/fingerprint differs. Existing source and dialogue strings are held equal after removal of the four explicitly permitted copied narration additions and ten optional line IDs. Evidence bodies and metadata other than unlock/timing notes are unchanged. Registry differs only by version and the exact H5 append; manifest differs only by version.

The initial sandbox blocked the build tool's parent-directory reads. The same local checks ran successfully with the approved permission escalation. No dependencies were downloaded.

Limits: no R2 browser test pass is claimed. Runtime hiding, announcement behavior, History filtering and final integrated sheet locations remain Claude Code's work. The baseline-generated sheet still observes the old renderer. No live site or GitHub change was made.
