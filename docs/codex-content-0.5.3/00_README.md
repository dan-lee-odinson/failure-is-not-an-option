# Codex content 0.5.3 — packet record

The packet `FNO-M00-Codex-Content-v0.5.3` as received for FNO-M02 (8 September 2026), minus the images: the five runtime
PNGs are in `assets/` and the manifest; the Lovell and den previews, the five H7 page scans (`research/H7-pdf-*.png`),
and the art sources and history (`art/sources/`, `art/history/`, including the retired composite CAPCOM portrait)
stay in the shared folder with the packet, as the M00a and M01 sources did. `integration/content-0.5.3.patch` is
Codex's diff against M01 `d679b2b`; it applied cleanly (see `docs/BUILD-HANDOFF-M02.md` §2). `integration/files/`
(Codex's reference snapshots of the patched files) is not copied: the repository is the single source of truth.
`research/CAPCOM-PROVENANCE.md` is the clearance list of all seven CAPCOM lines with their H7 pages.
