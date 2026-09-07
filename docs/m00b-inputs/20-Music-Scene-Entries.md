# Failure is Not an Option — Music: Scene Entries and Cue Sheet

**From:** Dan (assignments), Claude (Cowork; analysis and cues), 7 September 2026 · **To:** Claude Code (implementation, M00b or M01 as scoped below) and Codex (opening treatment in `07`) · **Source of truth for rights:** `audio/README.md` · **Analysis plots:** `audio/analysis/<track>.png` and `analysis.json`.

Dan assigned the five tracks to scenes and asked for them to be trimmed to fit. The originals stay unchanged (README rule); **"trimming" is done at runtime with cue points** — start offset, end offset, fade-in, fade-out, and an optional loop region — recorded in one data file the app reads. Nothing is re-encoded, and the cues can be tuned in play without touching the audio.

## 1. How the tracks were measured

Each MP3 was decoded and analyzed in software: length from the frames, integrated loudness (LUFS), a per-second level curve, section changes (timbre and harmony shifting together), the loudest ten seconds, quiet interior moments that make clean cut points, and the best-matching pair of beats twenty to seventy seconds apart for a seamless loop. Tempo estimates are unreliable on music this ambient (four tracks report the same figure) and are not used for anything. What this cannot judge is feel; the timestamps below are for Dan to jump to and confirm.

Two properties shared by all five tracks shape every cue. They are level-compressed — the body of each sits within about five decibels — so any mid-track cut needs a fade the game adds; and each ends with a short natural fade over its last two to four seconds, so playing a track to its end always lands cleanly. Loudness is consistent (−15.9 to −17.0 LUFS), so no per-track gain is needed; one music volume control covers all.

| Track | Length | LUFS | Section changes | Quiet cut points | Loudest passage | Loop candidate (seamless) | Natural end |
|---|---|---|---|---|---|---|---|
| Orbit of Hope | 2:17 | −17.0 | 0:12, 0:18, 0:24, 0:42, 2:04 | 0:10–0:20 | 2:05–2:15 | 1:41 → 2:05 | fade 2:15–2:17 |
| Orbit of Hope (refrain) | 2:54 | −16.5 | 0:15, 0:19, 0:27, 0:34, 0:52, 0:58, 1:16 | 0:29–0:33, 2:35–2:40 | 2:25–2:35 | **1:00 → 1:52** | fade 2:52–2:54 |
| Mission in Danger | 2:37 | −15.9 | 0:37, 0:43, 1:01, 1:05, 1:49, 1:55 | 0:10, 0:19–0:20, 2:19–2:24 | 0:23–0:33 | 0:26 → 0:50 | fade 2:35–2:37 |
| Per Aspera | 1:46 | −16.1 | 0:14, 0:49, 0:56, 1:15 | 0:10–0:11, 0:16–0:18, 0:27–0:29 | 1:32–1:42 | 1:04 → 1:29 | fade 1:44–1:46 |
| Disaster and Loss | 2:24 | −16.2 | 0:25, 0:28, 0:46, 1:56, 2:02, 2:09 | 0:20–0:27, 1:54–2:02 | 1:32–1:42 | 1:28 → 1:52 | fade 2:22–2:24 |

## 2. Scene entries

Every entry obeys the placement rules in `audio/README.md` and `07`: music carries no information the player needs; it is optional and volume-controlled; it starts on an explicit player interaction; it never becomes a reading clock. The last rule decides the shape of these entries: **on any screen where the player reads and decides, the music plays once and falls silent; it does not loop.** Loops are for the menu only, where nothing is being decided.

### Opening — *Orbit of Hope*, full track (`07`)

When the archival montage exists, the whole track, 0:00 to 2:17, under the montage; the cut follows the music. The measured shape supports `07`'s timeline: a six-second swell, a quiet passage from 0:10 to 0:20 that suits the "engineering drawings, hands at work" opening, a long build, and the loudest passage at 2:05–2:15, which is where the painted room should resolve under the title; the natural fade at 2:15 is the end of the sequence.

**Until the montage exists** (M00b/M01, scroll → title → menu per `18`): play 0:00 to 0:42 under the scrolling text and the title resolve — 0:42 is a section change, so the cut lands on a musical seam — with a 2.5-second fade-out that crossfades into the menu loop below. If the scroll runs longer than 0:42 at the player's reading pace, extend to the next seam at 2:04 rather than cutting mid-phrase.

### Title screen and menu — *Orbit of Hope (refrain)*, looped

Start at 0:00 (the seven-second swell doubles as the title settling). Loop region **1:00 → 1:52**: the two ends of that passage match closely in timbre and harmony, and a 200-millisecond crossfade at the seam hides the join. The loop runs while the menu is up; on New Campaign or Load, fade out over 2 seconds. The refrain's loudest passage (2:25–2:35) is never reached in the loop and stays available for a later credits or patch-wardrobe screen.

### Crisis report through the tracking ship, and the return decision — *Mission in Danger*, once

Cue on the arrival of the crisis report (`g8-crisis-report`), 0:00, so the swell lands with the report; the loudest passage at 0:23–0:33 falls where the stabilization report and the rule acknowledgement arrive at a normal reading pace. The track then runs at a steady level through the return briefing and the decision. **No loop.** If the player is still deciding when it ends at 2:37, the room's ambient sound carries — silence at the console is the design, not a gap. On Choose (`g8-return-earlier` / `g8-return-later`), if the track is still playing, fade out over 2 seconds so the execution beats play against the room alone.

### Post-flight and debrief — *Per Aspera*, once

Cue on entry to the post-flight scene (`g8-accountability-brief`), 0:00. The quiet opening (0:10–0:30) sits under the historical context card; the build to 1:32–1:42 reaches the debrief if the player moves at a reading pace. No loop; ends naturally at 1:46. If the player opens the debrief before the track ends, let it run out; do not restart or retrigger for the Gemini IX-A briefing, which is silent until a later mission adds its own cue.

### Reserved — *Disaster and Loss*

Not used in M00: every route recovers the crew. Held for loss outcomes in later missions. Its shape — a collapse at 0:20–0:27, a long steady middle, a second collapse at 1:54–2:02 — suggests cueing it on a loss outcome record with the first collapse under the report itself. Recorded here so the reservation is on file; no cue is implemented.

## 3. The music map — what Claude Code builds

One JSON file the app reads (`app/music-map.json`, or a content-side file if Codex prefers to own cue tuning), one entry per cue, validated like the manifest:

```
{ "id": "menu-loop", "asset": "audio-orbit-of-hope-refrain", "trigger": "screen:menu",
  "start": 0.0, "end": null, "fade_in": 0.0, "fade_out": 2.0,
  "loop": { "from": 60.5, "to": 111.7, "crossfade": 0.2 },
  "stop_on": ["start-new", "start-load"] }
```

Rules: the five MP3s enter `assets/` with manifest entries (`kind: audio`, credit line and rights line from the README — this is a small schema addition, like the SVG one); playback through Web Audio so cues, fades, and the loop crossfade are sample-accurate; one music volume control persisted per player alongside text size, with music off by default until the player turns it on the first time (that is the "explicit player interaction"); reduced-motion has no bearing on audio; the music map is player-visible in About/Credits as the OST list. No cue ever changes domain state, and the replay test must not see audio events. Tests: every cue's asset exists; start, end, and loop points lie inside the track's length; each `trigger` and `stop_on` names a real screen or input id.

Scope: the menu loop and the interim opening belong to the opening-screens work (`18`, M00b if the kit lands in time, else M01); the crisis and post-flight cues can ship with M00b since they need no art.

## 4. For Dan

Jump to these spots and say yes or no: the refrain at 1:00 and 1:52 (does the loop seam sit on a phrase boundary to your ear?); Mission in Danger at 0:23 (is that the moment for the stabilization report?); Per Aspera at 1:32 (does it feel like the debrief?). Adjustments are numbers in the music map, not new audio.

## 5. Dan's rulings on the cue spots (7 September, later)

> The refrain loop should work. Mission in danger ok to try, may need adjusting, Per Aspera should start at 1:30

Applied to the music map:

- **Menu loop** — refrain 1:00 → 1:52 stands.
- **Crisis and return decision** — Mission in Danger from 0:00 as written, marked *provisional*: the numbers are expected to move after playtest 2. Tune the start offset first (later start = the loudest passage arrives sooner), then the fade on Choose.
- **Post-flight and debrief** — Per Aspera **starts at 1:30** (start offset 90.0 s, fade-in 1.0 s so the entry is not a hard cut into a loud passage). Note for Dan's awareness, not an objection: from 1:30 the track has sixteen seconds left before its natural end at 1:46, so the post-flight scene gets the closing build and then silence for the rest of the scene and the debrief. If, in play, that turns out to be too short, the alternative that keeps the same feel is a start at 1:04 (a section change; the build then arrives about half a minute in). Either way it is one number in the map.
