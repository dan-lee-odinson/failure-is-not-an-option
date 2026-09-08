# Codex content 0.5.2 — packet record

The packet `FNO-M00-Codex-Content-v0.5.2` as received for FNO-M01 (7 September 2026), minus the generated PNGs: the
22 runtime PNGs are in `assets/` and the manifest; the 16 original source renders and the two review contact sheets
(`art/sources/`, `art/plate-review.png`, `art/portrait-review.png`, about 33 MB) stay in the shared folder with the
packet, as the M00a art sources did. `integration/content-0.5.2.patch` is Codex's diff against M00b `223a6cb`; it was
merged over M00c by hand where the two overlapped (see `docs/BUILD-HANDOFF-M01.md` §2). `integration/files/` (Codex's
reference snapshots of the patched files) is not copied: the repository is the single source of truth.
