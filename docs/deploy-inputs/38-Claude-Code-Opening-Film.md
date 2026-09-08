# 38 — Opening film assembled (v002); archive selects v003

**From:** Claude Code · **To:** Dan, Claude, Codex · **Date:** 8 September 2026 · **Answers:** `37-Claude-Review-Archive-Selects.md` §5–§6 (recut) and §4 (assembly), `30-Opening-Montage-Shot-List.md` §3, §5, §8, and the 0.5.3 den treatment (`OPENING-DEN.md`).

**Delivered:** [`video/film-v002/`](video/film-v002/README.md) — the film as `FNO-Opening-Film-v002.mp4` (46.7 MB) and `FNO-Opening-Film-v002.webm` (47.2 MB), 3:21.9, 1920×1080, 30 fps, with the final EDL, review frames, provenance and hashes; [`video/selects-v003/`](video/selects-v003/README.md) — the recut selects packet that supersedes v001. Zips beside them for download: `FNO-Opening-Film-v002.zip` and `FNO-Opening-Archive-Selects-v003.zip`, each with a `.sha256`. Nothing in the repository changed; wiring the file into the montage slot is the next build task.

**Revision.** The first delivery of this morning (film v001, selects v002, 01:13) was withdrawn after Dan's note: at 1:25 the Challenger tribute cut to the Columbia crew photograph before the wreath. In the source the Challenger walkout ends at 00:43.13 and the next frame is the Columbia photograph; Codex's excerpt to 00:43.5 carried ten frames of it. Shot 9 now ends on the walkout's last clean frame and starts 0.7 s earlier, so the six seconds hold: walkout 3.8 s, wreath 2.2 s, Challenger → wreath with nothing between. Dan's other option (extend the memorial, drop the Columbia walkout at 1:44.5) was not taken: it would have removed the Columbia crew from the film, and 30 §7 rules both walkouts. The withdrawn files are in `discard/opening-film-first-delivery-2026-09-08/`, not overwritten.

## 1. The recut (37 §5, §6)

Shot 2 (Gemini video) and shot 10 (Hubble) are out, with their alternates; shot 2 is back as the S66-24482 still; the 20.5 s went where §5 and §6 said. Eight cuts are byte-identical to v001 (hashes unchanged). Fourteen primary cuts, 132 s; with the projector start, 2:18; the seams at 0:18.5, 0:42.5 and 2:03.6 land on cuts, and 0:24.5 lands on the Saturn V's first motion.

| # | Cut | Length | Source in → out | Change |
|---|---|---:|---|---|
| 2 | agena-launch-still | 6 s | still S66-24482, 4 % push-in | new (replaces the dropped Gemini video reference take) |
| 3 | suited-crew-walkout | 6.5 s | 3:53.5 → 4:00.0 | 6.0 s -> 6.5 s |
| 4 | apollo-saturn-v-launch | 24 s | 0:14.0 → 0:38.0 | 18.0 s -> 24.0 s |
| 9 | challenger-crew-and-memorial | 6 s | 0:39.3 → 0:43.1 | recut in v003: same length; the Columbia crew photograph trimmed from the Challenger excerpt |
| 11 | iss-international-crews | 16 s | 2:23.8 → 2:39.8 | 10.0 s -> 16.0 s |
| 13 | atlantis-final-landing | 8 s | 7:21.5 → 7:29.5 | 6.0 s -> 8.0 s |

Two of the extensions could not be what §5 literally asked for, and the packet says so:

- **Shot 4.** `Aplllo 11.mp4` (KSC-69-71212) is a launch film; it has no rollout and no staging. The six seconds are the pad hold and the ignition build-up immediately before the v001 in-point, in the same continuous take (00:14.0 → 00:38.0): pad, ignition at ~00:15.6, first motion at ~00:20 (which is film 0:24.5, the section change), ascent to the v001 out-point. If Dan would rather have six more seconds of ascent after 00:38 instead, it is a one-line change and a re-render.
- **Shot 11.** Sixteen continuous seconds (02:23.8 → 02:39.8): flag ring, crew group, spacewalk, two crew at a console, then the station over Earth up to the last frame before the interview cut. The source's own cuts are inside it; "crews and station over Earth" as §5 asked, with the station shot at the end (3 s).

Shot 3 is the v001 cut plus half a second (03:53.5 → 04:00.0; the shot is continuous past 04:01). Shot 13 gains two seconds at the head — the night final approach before the touchdown — and keeps the runway camera change at its tail as v001 did. The still is pillarboxed at full height inside the 16:9 frame (a slide in the projector), 4 % centred push over the six seconds, no pan.

`CUTS.csv` and `edit-decision-list.json` carry a `change` column, the source page of every cut and the terms wording ruled in 37 §2 (`terms_as_shown`). `video/archive/CLIPS.md` gets the same terms note appended. Cut-point frame grids are in `review/v002-cut-scans/`.

## 2. The assembly (30 §3, §5, §8; OPENING-DEN.md)

One continuous file, 3:21.9:

| Time | What |
|---|---|
| 0:00 – 0:06 | Projector start: the frame is the den's projection rectangle, filling the screen; the beam flickers in under the swell (0.4–2.6 s), the blank light finds the wall; no countdown numerals (a home reel, not a print). |
| 0:06 – 2:18 | The fourteen cuts inside the projector frame — soft-cornered gate, gate weave, lamp flicker, light grain, mild warm cast; black in the footage is unlit wall (the image is screen-blended onto the darkened wall, not pasted). *Orbit of Hope* from 0:00, ending naturally at 2:18. |
| 2:12 – 2:18 | The pull-back over the Earth shot: cubic ease-out, six seconds, from scale 1920/928 at (830, 115) to the full room — Glen from behind in the lounger, the projector and its beam, the cigar smoke rising (two 12-second instances started every 9 s, 3-second crossfade, per the treatment). Glen does not turn. |
| 2:19.0 – 3:19.3 | After one second of blank light, the credits scroll inside the projection rectangle at the wide framing: dedication, the three notices, then `registry.credits` in order — dark ink on the projector's lit field, in the game's faces (Barlow, Barlow Condensed). *Orbit of Hope (refrain)* under it from its quiet start. |
| 3:19.3 – 3:21.9 | Run-out: the tail leader flaps in the gate, the lamp dies with two stutters, the beam fades and the den darkens over 1.5 s, half a second of black. The player's 700 ms dissolve to the console under the hero title starts from that black. |

Composited at 3972×2234 (design × 1920/928) so the footage sits on the projection rectangle at native resolution; the camera crop is scaled to 1920×1080. Beam at 0.32 × the lamp, smoke at 0.16, composite order room → film → beam → smoke, coordinates from `registry.opening_den`. The flicker, weave and grain are deliberately light so the file holds at 1080p under 50 MB.

## 3. Decisions taken, for Dan to keep or reverse

1. **Music under the credits.** Nothing in 30 or 37 assigns any; a silent minute of wall seemed wrong. *Orbit of Hope (refrain)* — already the menu track — runs from its start under the credits and fades over the run-out. Silence, or another track, is a re-render.
2. **Credits on the lit field, dark ink.** The den plate is painted with a bright screen (the room is lit by it), so the credits are ink on that light — the game's paper look — rather than light text on a dark wall, which would have left a glowing empty frame around a black window. Speed 150 px/s at film resolution, 60 s in all; each line is on the wall about seven seconds.
3. **The Archive credits.** `registry.credits` 0.5.3 still carries the placeholder line ("Archival clip credits will be added…"). The film replaces that one line with the fourteen approved sources of 37 §2/§6, one line each with the title the source page gives (looked up on images-api.nasa.gov and archive.org metadata today) and the NASA terms line; the authored non-affiliation line is kept and every other credit line is verbatim. The exact lines are in `film-v002/provenance/archive-lines.json` — **proposed for `registry.credits` in the next content revision (Codex)** so the JSON says what the film says. If Dan wants different wording, the credits image and the film re-render in one command.
4. **Baked credits vs. live credits.** The den treatment asks for live, reviewable text in the player. This file bakes the credits so the film stands alone as asked. For the player, two options are both supported by the EDL: play the file to 2:18.0 (the last pull-back frame is the wide den at the layers' rest state) and run the live layers and the live scroll from `registry.credits` from there — my recommendation, since it keeps the credits in the sheet — or play the whole file. To be decided in the wiring task.
5. **Shot 4's six seconds** are before the ignition, not after the lift-off (§1 above).
6. **The v001 selects packet is untouched** (its zip and hashes still match doc 36); v003 is a new folder and zip. The pickup-name pattern is not used.

## 4. Verification

- Selects v003: every clip fully decoded, exact frame counts, 1920×1080, 30 fps, no audio, limited range; eight unchanged clips hash-checked against v001 `FILES.sha256`; `VERIFICATION.json`, `FILES.sha256`.
- Film: both files decode to 6058 frames (3:21.9); MP4 46,725,483 bytes, WebM 47,218,015 bytes, both under 50,000,000; loudness -12.7 LUFS (MP4) / -12.6 LUFS (WebM), true peak -0.5 / -0.1 dBTP; a frame every six seconds in `review/film-contact-sheet.jpg`, the key moments in `review/frame-*.jpg`, the mix in `review/audio-waveform.png`.
- Hashes (SHA-256): MP4 `9233b8c2200e8b9d5208b7a5f8a1d61b9b4ccea123d9e2eace7e25f871371a56` · WebM `3b80cebcb010d3913a18f1e3d5699955d86e774741d2ca43ff85b20356909857` · film zip `050e5f7d0ac3e64d21e7d5241ef8679a1fbaba99bb323c6bd14c11eb95af482f` · selects zip `beb83fedc44755893d0ac473b8566001de92b089ed9339c5916322a9e17a72e9`.
- Reproducible: `film-v002/provenance/assemble.py` (Python 3 + ffmpeg 7.1) rebuilds everything from `selects-v003/`, the repository's den assets, `credits.png` (from `render-credits.mjs`, headless Chromium with the game's fonts) and the two music files; the flicker is seeded.
- The game is untouched: no content, manifest, code or cue change; nothing here enters the run, the log or the replay.

## 5. Next

- **Dan:** watch `FNO-Opening-Film-v002.mp4`; rule on §3 items 1–5.
- **Codex:** `registry.credits` Archive section from `archive-lines.json` in the next content drop (0.5.4), and the CAPCOM/credits sheet pass as before.
- **Claude Code:** the wiring task once ruled — the montage slot plays the file (MP4 with WebM fallback), Skip and reduced motion keep the static wide den and static credits, then the title; the 2:18 hand-over to live layers if item 4 goes that way.

Next number in `00-Index.md` is 40 (Codex took 39 while this was rendering).
