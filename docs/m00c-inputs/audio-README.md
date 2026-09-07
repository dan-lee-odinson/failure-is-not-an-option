# Original soundtrack — provenance and rights

The game's soundtrack is made by Dan Lee-Odinson on Suno under a Pro plan subscription, and it is entirely instrumental: no lyrics, written or generated. *Orbit of Hope* is the first track and the opening's music; later tracks follow the same origin and the same terms, and each gets a row in the table at the end.

## Orbit of Hope

**File:** `Orbit of Hope.mp3`, about 2 minutes 18 seconds by file metadata (see `../07-Opening-Cinematic.md`). Keep the original unchanged; edits for the opening are derived copies.

**Origin:** Made by Dan Lee-Odinson on Suno under a Pro plan subscription, and supplied to this project on 7 September 2026. Recorded here on Dan's statement of 7 September 2026.

**Suno's terms, as read on 7 September 2026** (help.suno.com/en/articles/2746945, "Do I have the copyrights to songs I made?", last updated 4 September 2026):

- Songs made while subscribed to the Pro or Premier plan are owned by the subscriber. Songs made on the free plan are owned by Suno and limited to non-commercial use.
- On a paid plan the subscriber is the only party allowed to monetize the song through distribution or other channels.
- The article warns that the material may not be eligible for copyright protection, because copyright protects human authorship and music made entirely with AI would not qualify. Lyrics written by the user are the user's and may be registrable separately; some jurisdictions may treat the user as the writer with Suno as a tool.

**What this means for the game (a record, not legal advice):**

- Suno makes no claim on the track. Dan may include it in this non-commercial open-source project and credit it as his.
- Ownership under Suno's terms and copyright protection are two different things. The credits should state the first and not overstate the second. Proposed credit line: "Orbit of Hope · made with Suno by Dan Lee-Odinson." Proposed rights line for the repository: "Owned by Dan Lee-Odinson under Suno's Pro plan terms; released with the game under a licence to be chosen before publication."
- Per `07-Opening-Cinematic.md`, the track gets its own credit and distribution entry rather than inheriting the game's code licence.

**Lyrics:** none. The track is instrumental, so the lyrics exception in Suno's article does not apply and the copyright-eligibility caveat above applies in full. Recorded on Dan's statement of 7 September 2026.

## Tracks

All tracks: made by Dan Lee-Odinson on Suno under a Pro plan subscription, instrumental, no lyrics, same terms as *Orbit of Hope* above. Lengths are measured from the MP3 frames (variable bitrate, mostly 160–224 kbps, 44.1 kHz). "Use" is the assigned place in the game; a proposal in parentheses is Claude's suggestion from the title and mood, not a decision, until Dan or the cinematic/scene briefs assign it. Originals stay unchanged; any edit is a derived copy.

| Track | File | Length | Use | Origin |
|---|---|---|---|---|
| Orbit of Hope | `Orbit of Hope.mp3` | 2:18 | Opening cinematic (07) | Suno, Pro plan, instrumental; supplied 7 Sep 2026 |
| Orbit of Hope (refrain) | `Orbit of Hope (refrain).mp3` | 2:54 | Unassigned (proposed: title screen and menu, or the Gemini IX-A briefing — 07 anticipated a menu reprise of the main theme) | Suno, Pro plan, instrumental; supplied 7 Sep 2026 |
| Mission in Danger | `Mission in Danger.mp3` | 2:37 | Unassigned (proposed: the crisis report through the tracking ship and the return decision) | Suno, Pro plan, instrumental; supplied 7 Sep 2026 |
| Mission in Danger Drum Background | `Mission in Danger Drum Background.mp3` | 2:06 | Dan Lee-Odinson, Suno Pro, instrumental | Replaces *Mission in Danger* as the crisis/return-decision cue (Dan, playtest 2, 7 Sep 2026): from 0:00 on the crisis report, once, cue gain 0.75 (25 % lower). Quiet 10 s intro, steady body from 0:10, ends at 2:06; −17.1 LUFS. *Mission in Danger* stays in the repository, uncued. |
| Disaster and Loss | `Disaster and Loss.mp3` | 2:24 | Unassigned (proposed: loss outcomes in later missions; M00 has no loss outcome, so not used in the first playable) | Suno, Pro plan, instrumental; supplied 7 Sep 2026 |
| Per Aspera | `Per Aspera.mp3` | 1:46 | Unassigned (proposed: post-flight scene and debrief) | Suno, Pro plan, instrumental; supplied 7 Sep 2026 |

**Placement rules, from the concept and 07:** music never carries information the player needs; it is optional and volume-controlled; it starts on an explicit player interaction; nothing loops in a way that becomes a reading clock. Assigning a track to a scene is a presentation decision recorded in the scene's brief, and the game's manifest records each track with its credit line ("<title> · made with Suno by Dan Lee-Odinson") and the rights line above.

## Soundscape (`soundscape/`)

Six sound-effect and ambience files from Epidemic Sound, deposited by Dan on 7 September 2026: control-room hum and fans (5:00), office walla with phones (2:00), a plastic button press, a toggle latch, an old rotary switch, and paper handling. **Rights status: not clear for redistribution.** Epidemic Sound's standard plans license use in the subscriber's published content and forbid redistributing the files; in-game use is directed to its Enterprise/Business licensing. Until Dan resolves this (see `../21-Soundscape-Entries-and-Rights.md`), these files stay out of the repository and any pushed build; they may be used locally to try the mix. Replacements, when chosen, get their own rows here with source and license.

## Soundscape — chosen free-to-use set (`soundscape-cc0/`)

Chosen by Dan on 7 September 2026 from `../22-Soundscape-CC0-Candidates.md`; licenses read on each Freesound sound page that day. Download each from its URL (free Freesound account) into `soundscape-cc0/` under its original filename. CC0 needs no credit; the game credits everyone anyway. The one CC BY file must be credited exactly as its row says, in About/Credits and here, and the CC BY 3.0 license text ships with the repository.

| Role | Title | Uploader | URL | License | Downloaded |
|---|---|---|---|---|---|
| Room bed (loop) | Room Tone – Empty room with AC & desktop computer running | seventhsamurai | https://freesound.org/people/seventhsamurai/sounds/332417/ | CC0 1.0 | 2026-09-07 |
| Walla layer (loop) | Typing Office chatter in background | SduggySounds | https://freesound.org/people/SduggySounds/sounds/725718/ | CC0 1.0 | 2026-09-07 |
| Button press | SWITCH BUTTON PRESSING.wav | EricsSoundschmiede | https://freesound.org/people/EricsSoundschmiede/sounds/457411/ | CC0 1.0 | 2026-09-07 |
| Toggle + rotary detent | 130111 light switches, clicks, dimmer slides, hotel London ON | TRP | https://freesound.org/people/TRP/sounds/713997/ | CC0 1.0 | 2026-09-07 |
| Paper | Paper Rustling 01.wav | swidmark | https://freesound.org/people/swidmark/sounds/171320/ | CC0 1.0 | 2026-09-07 |
| Headset / loop click | End radio transmission | ReadeOnly | https://freesound.org/people/ReadeOnly/sounds/47646/ | CC0 1.0 | 2026-09-07 |
| Electronic alert | Beep 8 count (loopable).wav | JonNicholas | https://freesound.org/people/JonNicholas/sounds/266156/ | **CC BY 3.0** — credit: "Beep 8 count (loopable) by JonNicholas, freesound.org, CC BY 3.0" | 2026-09-07 |
| Quindar tones (open 2525 Hz, close 2475 Hz, 250 ms) | generated at build time | — | — | original, project-owned | n/a |

Fill the "Downloaded" column with the date when each file is in place. The Epidemic Sound files in `soundscape/` remain for local comparison only and are excluded from the repository by `.gitignore`.

**Room bed level.** The room-tone bed plays at a reduced level by default — 60–75 % below full scale (gain ≈ 0.25–0.40; default 0.3, exposed as `room_bed_gain` in the soundscape map). Dan's ruling, 7 September 2026.
