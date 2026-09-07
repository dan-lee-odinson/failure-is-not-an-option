# Failure is Not an Option — Soundscape: Entries and a Rights Problem

**From:** Claude (Cowork), 7 September 2026 · **To:** Dan (a decision), Claude Code (cues, when the files are clear) · **Files:** `audio/soundscape/`, six Epidemic Sound MP3s deposited by Dan.

## 1. What is there

| File (Epidemic Sound) | Length | Role in the concept's soundscape (`01`) |
|---|---|---|
| Ambience, Hitech, Control Room, Empty Office, Computer Fans, Hum 02 | 5:00 | The room bed: ventilation hum, equipment fans. Loops under every console screen. |
| Ambience, Office, Walla, Phones Ringing, Low Activity 02 | 2:00 | Optional indistinct background conversation — the concept allows it as long as it never carries information the player needs. A low layer for preparation and the post-flight scene, not for the crisis. |
| Mechanical, Click, Button, Press, Analog, Plastic | 0:05 | Button press — Choose, Commit, Continue. |
| Mechanical, Switch, Toggle, Latch | 0:11 | Toggle — menu selection, the Apollo/Modern switch when it exists. |
| Mechanical, Switch, Light Switch, Old, Rotary | 0:07 | Rotary — text-size or music-volume control. |
| Paper, Handle, Paper Movement 01 | 0:14 | Paper — pinning evidence, opening the binder, turning a dossier page. |

Good picks: they are the concept's list almost item for item (hum, fans, headset clicks, keyboard, paper, alerts, optional chatter). Two items from that list are still missing — a headset click for AOS/LOS and an electronic alert for the reserve warning — and would be worth adding from wherever the rest end up coming from.

## 2. The rights problem — a decision for Dan, not legal advice

These come from Epidemic Sound, which is a subscription license, and the repository is going to be public and open source. Two things I checked:

- Epidemic Sound's Personal/Creator and Commercial/Pro plans license tracks for use *in the subscriber's published content* (video, podcast, stream) and **do not permit redistributing the audio files themselves**; a third-party summary of the plan terms puts it as "Cannot redistribute tracks. Sync to video/podcast only," with redistribution marked as forbidden on every standard tier, and use rights tied to an active subscription (already-published work survives cancellation, new use does not).
- For games, Epidemic Sound's own pages point developers to its Enterprise or Business solutions ("Music licensing for games is complex, but Epidemic Sound's Enterprise solution can simplify it"); its game-development page does not say that standard plans cover in-game audio, and I could not retrieve the license policy pages themselves (they served only a cookie notice).

What that means in practice: a public GitHub repository containing these six MP3s is redistribution of the files, whatever the game's own license says, and in-game use is at best not clearly covered by a standard plan. So **as delivered, these files should not go into the repository**, and I'd hold them out of any build that gets pushed. They are fine to use locally to try the mix.

Three ways forward, in the order I'd suggest:

1. **Replace with sources that allow redistribution.** All six sounds are simple and common. Freesound.org carries thousands of CC0 (public-domain-dedicated) room tones, fans, switches, and paper handling; NASA's own audio archive is public domain and has period room tone; and the switches and paper can be recorded at home in ten minutes and are then entirely yours. Each replacement gets a row in the audio README with its source and license, exactly as the music does.
2. **Ask Epidemic Sound directly** whether a non-commercial open-source game with the files in a public repository is covered by your plan, and keep the written answer in `audio/`. I would expect "no" for the repository question, but a written answer is the only thing that settles it.
3. **Keep the files out of the repository and load them at runtime from somewhere that is not redistributed.** This works technically and undermines the open-source intent, so I list it only for completeness.

## 3. What Claude Code builds, once the files are clear

The cue mechanics are the same whichever files end up in the slots, so they can be specified now. Add a `soundscape` section to the music map: the room bed as a seamless loop under every console screen at a low level (the concept's "equipment continuing to run"), started with the first player interaction alongside the music setting; the walla layer as a second loop with its own lower gain, enabled only on preparation and post-flight screens; one-shot effects bound to UI events (Choose/Commit/Continue → button; menu selection → toggle; pin and binder → paper), never to domain events, so the replay test cannot see them. Effects and beds are separate volume controls from music. Loop points for the beds come from the same analysis as the music once the final files exist. Every file enters the manifest as `kind: audio` with its source and license.

## 4. For Dan

1. Choose among §2's three routes. My recommendation is route 1; if you want, I'll pull a matched set of CC0 candidates from Freesound and NASA with their license lines for you to audition.
2. Say whether the role assignments in §1 are right.
