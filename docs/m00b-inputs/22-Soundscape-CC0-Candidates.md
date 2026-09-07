# Failure is Not an Option — Soundscape: Free-to-Use Replacement Set

**From:** Claude (Cowork), 7 September 2026 · **To:** Dan (audition and choose) · **Replaces:** the six Epidemic Sound files in `audio/soundscape/` (see `21`), which cannot be redistributed.

Every candidate below is on Freesound under **Creative Commons 0** — I opened each sound's own page and read the license line there on 7 September 2026. CC0 means the sound may be copied, modified, distributed and used for any purpose, including in a public repository, with no attribution required; the game credits the uploaders anyway, in About/Credits and the audio README, because it costs nothing and it is decent. Downloading from Freesound needs a free account. Put the chosen files in `audio/soundscape-cc0/` with their original filenames, and each gets a README row: title, uploader, Freesound URL, CC0, date downloaded.

One caution that applies to every Freesound sound: the uploader declares the license, and CC0 cannot be revoked, but if a listing ever looks like it was not the uploader's to give (a recognizable commercial library sound, for instance), skip it. None of the ones below raised that flag.

## The matched set

| Role (from `21` §1) | Candidate | Uploader | Length | Format | Notes |
|---|---|---|---|---|---|
| **Room bed** — hum and fans under every console screen (loop) | [Room Tone – Empty room with AC & desktop computer running](https://freesound.org/people/seventhsamurai/sounds/332417/) | seventhsamurai | 1:00 | WAV 48 kHz stereo | AC plus a running computer: the closest match to "ventilation hum, equipment fans." A minute is plenty to cut a seamless loop from. |
| Room bed — alternative, lower and plainer | [01 room tone low frequency hvac](https://freesound.org/people/pushkin/sounds/215293/) | pushkin | 0:34 | FLAC 44.1 kHz stereo | Subtle low-frequency fan against a quiet background; use if the first is too busy under dialogue. |
| Room bed — alternative, bigger space | [Room Tone Office Industrial Ambience 01](https://freesound.org/people/mzui/sounds/203297/) | mzui | 2:14 | WAV 44.1 kHz stereo | Larger, more mechanical room; may suit the MOCR's size better than a small office. Audition all three against the room plate. |
| **Walla** — indistinct background conversation, low layer on preparation and post-flight screens only | [Busy Room Ambience / People talking in background #2](https://freesound.org/people/Breviceps/sounds/465699/) | Breviceps | 0:28 | WAV 44.1 kHz stereo | About a hundred people in an auditorium; unintelligible by nature, which is exactly the concept's rule. Short, so loop it and keep it well down in the mix. |
| Walla — alternative with typing and a quieter crowd | [Typing Office chatter in background](https://freesound.org/people/SduggySounds/sounds/725718/) | SduggySounds | 1:41 | WAV 48 kHz 24-bit mono | Keyboard, mouse clicks, AC hum and distant unintelligible chatter in one bed; covers the concept's "keyboard taps" too. Mono, which is fine for a bed. |
| **Button press** — Choose, Commit, Continue | [SWITCH BUTTON PRESSING](https://freesound.org/people/EricsSoundschmiede/sounds/457411/) | EricsSoundschmiede | 0:07 | WAV 44.1 kHz stereo | A mechanical switch-button click; several presses in the file to pick the cleanest from. |
| **Toggle** — menu selection, the Apollo/Modern switch later | [Light Switch ON / OFF](https://freesound.org/people/FillSoko/sounds/257958/) | FillSoko | 0:13 | WAV 44.1 kHz | A firm toggle with distinct on and off; use one direction for select and the other for deselect. |
| **Rotary / detent** — text size, music volume | [130111 light switches, clicks, dimmer slides, hotel London](https://freesound.org/people/TRP/sounds/713997/) | TRP | 0:34 | MP3 48 kHz | A set of switch clicks and dimmer slides; the dimmer detents are the rotary sound. MP3 source, so it goes in as-is rather than re-encoded. |
| **Paper** — pinning evidence, opening the binder | [Paper Shuffle and Stack](https://freesound.org/people/moose13088/sounds/182889/) | moose13088 | 0:45 | AIFF 48 kHz | Booth-recorded stacking and shuffling; clean, no room noise, cuts easily into short one-shots. |
| Paper — alternative with page flips | [Paper Rustling 01](https://freesound.org/people/swidmark/sounds/171320/) | swidmark | 0:46 | WAV 44.1 kHz | Rustling and page-flipping; the flips suit the dossier and binder pages. Take both; use each where it fits. |
| **Headset / loop click** — AOS, LOS, a controller keying in (missing from the Epidemic set) | [Radio Sign Off / Squelch](https://freesound.org/people/JovianSounds/sounds/524205/) | JovianSounds | 0:01 | WAV 44.1 kHz | A squelch tail at the end of a transmission — the sound of a loop going quiet, right for LOS. |
| Headset — alternative, shorter and drier | [End radio transmission](https://freesound.org/people/ReadeOnly/sounds/47646/) | ReadeOnly | 0:00.4 | WAV 44.1 kHz | A 365 ms static burst; good for a key-up or key-down click. |
| **Electronic alert** — the reserve warning, indicator changes (missing from the Epidemic set) | [Computer Beeps and Signals](https://freesound.org/people/Kinoton/sounds/351257/) | Kinoton | 0:08 | WAV 48 kHz | Synthesized display and warning cues; pick one short tone and use it consistently. Restraint: one beep, never a repeating alarm — the concept forbids alerts that become a clock. |
| Electronic alert — alternative | [alarm beep electronic](https://freesound.org/people/reecord2/sounds/96063/) | reecord2 | 0:05 | WAV 44.1 kHz | A plain electronic beep; cut a single cycle from it. |

## Two originals worth making instead of downloading

**The Quindar tone.** The beeps that bracket ground transmissions in NASA air-to-ground audio are a pure tone, 250 milliseconds, at 2525 Hz to open and 2475 Hz to close. They are trivially synthesized — no recording, no rights, entirely the project's own — and they are the most recognizable sound Mission Control has. Whether Gemini VIII's loops used them is a question for Codex's sources before the game claims it; as an interface sound for a controller keying in, it needs no historical claim. Claude Code can generate both tones from a two-line script at build time, which also means they never sit in the repository as binaries.

**The switches and paper, recorded at home.** If any of the mechanical candidates disappoint, ten minutes with a phone, a toggle switch, a rotary knob and a folder of paper produces sounds that are unarguably yours. Record in the quietest room available, at night, with the phone a hand's width from the source.

## What happens next

1. Dan auditions the candidates (each Freesound page has a player) and picks one per role, or records his own.
2. The chosen files go in `audio/soundscape-cc0/`; the README gets a row per file with title, uploader, URL, "CC0 1.0," and the date.
3. The Epidemic Sound files stay in `audio/soundscape/` for local comparison only and are listed in `.gitignore` so they can never be committed by accident.
4. Claude Code builds the cues per `21` §3 against the chosen files, adds the Quindar generator, and records credits in About.

## Dan's selection (7 September, later)

| Role | Chosen | Uploader | Freesound | License (verified on the sound page, 7 Sep 2026) |
|---|---|---|---|---|
| Room bed (loop) | Room Tone – Empty room with AC & desktop computer running | seventhsamurai | https://freesound.org/people/seventhsamurai/sounds/332417/ | CC0 1.0 |
| Walla layer (loop, low; preparation and post-flight only) | Typing Office chatter in background | SduggySounds | https://freesound.org/people/SduggySounds/sounds/725718/ | CC0 1.0 |
| Button press (Choose, Commit, Continue) | SWITCH BUTTON PRESSING.wav | EricsSoundschmiede | https://freesound.org/people/EricsSoundschmiede/sounds/457411/ | CC0 1.0 |
| Toggle and rotary/detent (menu selection, text size, volume, the mode switch later) | 130111 light switches, clicks, dimmer slides, hotel London ON | TRP | https://freesound.org/people/TRP/sounds/713997/ | CC0 1.0 — one file covers both roles; cut the toggle from the switch clicks and the detents from the dimmer slides |
| Paper (pin, binder, dossier pages) | Paper Rustling 01.wav | swidmark | https://freesound.org/people/swidmark/sounds/171320/ | CC0 1.0 |
| Headset / loop click (AOS, LOS, key-up) | End radio transmission | ReadeOnly | https://freesound.org/people/ReadeOnly/sounds/47646/ | CC0 1.0 |
| Electronic alert (reserve warning, indicator changes) | Beep 8 count (loopable).wav | JonNicholas | https://freesound.org/people/JonNicholas/sounds/266156/ | **CC BY 3.0 — attribution required.** Fine for the open-source game; the credit line "Beep 8 count (loopable) by JonNicholas, freesound.org, CC BY 3.0" must appear in About/Credits and the audio README, and the license text ships with the repository. Use one beep from the eight, not the loop: the concept forbids a repeating alarm. |

Quindar tones stay as a build-time original (§"Two originals"). No self-recordings needed unless a candidate disappoints in the mix.

### Room bed default level (Dan, 7 September)

- The empty-room ambiance (Room Tone, seventhsamurai #332417) plays at a **reduced level by default: 60–75 % below full scale**, i.e. a gain of roughly **0.25–0.40** (about −8 to −12 dB relative to the one-shots). Builder: expose it as `room_bed_gain` in the soundscape map, default `0.3`, so it can be tuned in playtest without a rebuild. The walla layer sits under the bed, not above it.
