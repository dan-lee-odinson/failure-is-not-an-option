# Failure is Not an Option — Opening Cinematic Treatment

**Status:** Updated 7 September 2026 for confirmed directions 18 and 19. The opening flow is specified for M00b; the three title designs await Dan’s selection. This remains a treatment, not an edited film or a verified shot list.

**Music:** [Orbit of Hope](audio/Orbit%20of%20Hope.mp3), supplied by the user. File metadata reports approximately **2 minutes 18 seconds** (137.976 seconds). The music has not been auditioned or analyzed for beats, instrumentation, vocals, or structural cues in preparing this treatment. All time ranges below are provisional editorial allocations; the actual cut should follow the track after listening.

## Opening flow — current build and future montage

**M00b: dedication prose scroll → separate notices prose scroll → large title → main menu.** When the archival edit exists: dedication → notices → montage → unbranded archival end / full fade → illustrated Houston room and title → menu. The dedication and notices occupy separate chapters with clear visual space; they never share an option-looking card. Use the exact approved copy in `08` / `registry.notices`, including the dramatization notice.

| Stage | Treatment | Player control / exit |
|---|---|---|
| Start | Quiet, uncluttered screen; a Begin control starts the presentation and permits audio playback. | Skip to menu is also available. No forced countdown. |
| Dedication | The two dedication paragraphs, centered in a comfortable reading column against darkness, moving slowly upward as a single prose composition. No panel borders. | Pause/Resume scroll and Continue remain visible; do not require waiting for the animation. |
| Notices | A fresh visual chapter after the dedication leaves the screen. Project notice, AI disclosure, and dramatization statement flow as three ordinary paragraphs in one continuous column. | Same controls; manual scrolling while paused; all words remain accessible. |
| Montage, when ready | The approximately 2:18 timeline below begins here, independently of time spent reading notices. | Visible Skip to menu; playback failure leads to the same usable menu. |
| Title | Large chosen title treatment resolves over the approved 2D control room behind Glen’s shoulder. No NASA marks. | Continue / any explicitly indicated title action reveals the menu immediately; no minimum title hold. |
| Main menu | NEW CAMPAIGN, CONTINUE, LOAD, ABOUT / CREDITS in Apollo keys with live text. | Keyboard navigation; Continue is disabled with a reason if no valid save exists. |

Under reduced motion, dedication and notices are static, readable prose chapters with Continue; use immediate cuts between chapters, archive, title, and menu. Never animate text offscreen while it has keyboard focus. Continue advances one stage; Skip to menu bypasses the remaining presentation. About/Credits permanently retains all notices and Replay Opening. On return launches, go directly to the menu after the opening has been viewed or skipped. No mission time or game state advances during these presentation stages.

Use Barlow Regular/SemiBold for prose, about 20–24 px at ordinary desktop size with generous line spacing and a roughly 55–65-character reading column. Apply the game’s enlarged text setting and allow manual vertical scrolling. Keep Skip, Continue, Pause/Resume and volume outside the moving text. The notice paragraphs should feel written, not like choices.

Title studies are in `art/apollo-navigation-v002/titles/`: **A — Flight Room (recommended)**, **B — Flight Operations**, **C — Projection Board**. Their schematic room backdrop is only a layout reference. Final artwork uses the accepted dramatic 2D room with its Glen-head safe area and the approved original emblem. The title is a live layout; menu keys are native controls with label-free SVG backgrounds. The Apollo/Modern setting is an interface theme, not a campaign mechanic. Only Apollo ships in M00b.

## Central idea

The opening moves through the history of the space program, then resolves into the illustrated world the player will inhabit. Archival footage establishes the human achievement; the last transition puts the responsibility in the player's hands.

The footage is a prologue about the history we know, not a prediction of the player's campaign. After reaching the modern era, the title transition deliberately returns to Houston in 1966 for the start of the Gemini campaign. A quiet date/location caption establishes that return.

## Preferred destination: Mission Control

Use the VAB prominently during the assembly and launch passages, but finish at the flight director's console. The VAB supplies scale and anticipation. Mission Control introduces the player's role and provides a direct transition into the first interaction.

An alternative VAB ending remains viable: a towering launch vehicle and gantry dissolve into an inked 2D title-screen illustration, then New Campaign leads to the control room. It gives the title screen grandeur, but adds a scene change before the director takes the console.

## Provisional sequence for the full track

The table describes footage to seek. Specific clips, source IDs, usable frames, and reuse conditions have not yet been verified. Dates and ordering will be checked against each selected clip.

| Approximate range | Visual material to seek | Purpose |
|---|---|---|
| 00:00–00:12 | Black resolving into engineering drawings, hands at work, early control-room equipment, and a launchpad. | Begin with people preparing, then reveal the scale of their task. A short on-screen phrase such as “The history we know” can frame the archive. |
| 00:12–00:32 | Gemini launch, capsule and target imagery, EVA footage, controllers following the mission. | Establish the campaign's starting era and the link between ground decisions and people in flight. |
| 00:32–00:56 | Apollo-era VAB assembly, Saturn V movement and launch, lunar approach and surface activity, flight-control reaction. | Widen the ambition. Use recognizable shapes to connect otherwise different footage: gantries, windows, circles, hands and switches. |
| 00:56–01:14 | Skylab habitation/repair material and Apollo–Soyuz preparation or docking. | Give space to living and working in orbit, repair, and cooperation. Seek usable archive for these passages rather than filling the montage only with iconic launches. |
| 01:14–01:35 | Shuttle assembly/launch, satellite servicing, Shuttle–Mir and station construction. | Show increasing complexity and interdependence. Keep people and work visible alongside spacecraft. |
| 01:35–01:54 | ISS international crews and operations, commercial crew transport, Artemis assembly/rollout/launch or actual in-space footage. | Arrive in the contemporary program. Use actual mission footage where available; label any necessary visualization distinctly. |
| 01:54–02:06 | Earth or a spacecraft window, followed by a carefully selected control-room visual bridge. | Let the montage settle and prepare the move from archive to illustration. The final image must be chosen for its composition. |
| 02:06–02:18 | Painted/inked transition into the 1960s director's view; title resolves over the room. | Land on the exact illustrated scene that will remain behind the menu or first interaction. Timing follows the track's actual ending once auditioned. |

Preserve the original aspect ratio of archival footage. A consistent frame or designed background can accommodate 4:3 footage within the 16:9 composition. Do not stretch it or aggressively crop away the action merely to fill the screen.

## Archive-to-illustration transition

Choose the final archival composition and the final game illustration together. There are two practical approaches:

1. **Composition-matched dissolve:** archival control-room lines align with the illustrated console and overhead fixtures. Detail simplifies into larger painted shapes as the inked silhouettes resolve. This is the preferred approach when a suitable clip can be found.
2. **Light-matched dissolve:** the final archival shot fades into darkness while a similarly placed screen glow remains. That light resolves onto the illustrated console; surrounding room detail appears from the shadows. This works when matching the camera geometry would require forcing the archive.

For the second approach, a modern Earth view can give way to a simple luminous screen shape; the final Gemini-era display should contain period-appropriate artwork or application-rendered information, not an unexplained modern video feed.

The final 2D image resolves just behind and slightly above Glen's shoulder at the console. His crew cut, glasses and waistcoat back form a readable silhouette in a lower corner, with pools of overhead light, darkened console rows and restrained indicators beyond. He sits upright and attentive. This uses the approved close third-person camera direction in `14-Over-the-Shoulder-Camera-Direction.md`. The title is application-rendered.

Suggested title order: **Failure is Not an Option** appears as the room resolves. After it clears or New Campaign is selected, show **Houston, 1966**, then the first on-screen controller message. Any transition animation is presentation only and cannot alter mission state.

## Sound and player control

The approved dedication and notices are in [08-Dedication-and-Disclaimers.md](08-Dedication-and-Disclaimers.md). Present them using the separate scrolling prose chapters above. Their reading time sits outside the provisional 2:18 music timeline.

Use Orbit of Hope as the musical foundation. Remove archival narration, countdowns, radio chatter, and other intelligible dialogue from selected footage to preserve the game's on-screen dialogue rule. Optional launch or equipment sounds should be deliberately mixed under the song, not inherited unexamined from a source clip.

Do not make assumptions here about whether the supplied song contains vocals. Its musical treatment, final fade, and any shorter reprise should be decided after listening. Keep the original MP3 unchanged.

Start playback through an explicit player interaction. Offer a visible Skip control, keyboard access, and music volume control. Once viewed, subsequent launches can go directly to the menu, with Replay Opening available. If the cinematic is skipped or fails to load, transition to the same final illustration and usable menu without blocking play. Do not make cinematic download or playback a requirement for M00 testing.

The full approximately 2:18 presentation can serve as the first-launch opening and a replayable OST film. A shorter menu reprise can be considered after the full edit exists; no excerpt or loop point has been selected yet.

## Footage sourcing

User direction: preserve NASA logos already present in the original footage; do not paint them out or substitute a fictional logo within historical clips. Newly created game art uses an original emblem. End on an unbranded archival shot, or fully fade the footage out before generated art appears, so the transition does not morph or transplant NASA's insignia into the illustration. See [09-Original-Emblem-and-Archive-Policy.md](09-Original-Emblem-and-Archive-Policy.md).

Start with the [NASA Image and Video Library](https://images.nasa.gov/) and mission-specific collections such as [Artemis I Media Resources](https://www.nasa.gov/general/artemis-i-media-resources/). These are source routes, not an approved clip inventory.

NASA's guidance generally permits factual use of its content under its stated conditions, calls for source acknowledgment, and notes that NASA-hosted third-party material can carry separate rights. Check each selected clip and its embedded music/credits; public availability alone does not establish permission to redistribute it. Follow the [NASA media usage guidelines](https://www.nasa.gov/nasa-brand-center/images-and-media/). No footage clearance or publication authorization is claimed by this treatment.

For each selected shot, record its archive ID, direct source page, mission/date, in/out points, origin/credit, reuse notes, and whether original audio is removed. Keep those records alongside the edit. The user's soundtrack gets its own agreed credit and distribution entry rather than inheriting the game's code license.

## Division of work

- **Codex:** refine the storyboard, research and log candidate clips, develop the final room illustration, define the visual transition, and review narrative/visual consistency.
- **Claude:** implement cinematic playback, skip/replay controls, loading behavior, audio controls, and the handoff to the live 2D scene.
- **Editing deliverable:** a shot list and edit timeline synchronized to the auditioned song, followed by an encoded video. Assign the actual editing tool/workflow once selected footage and musical cues are available.
- **Dan:** choose title study A, B, or C, then review the musical pacing once a synchronized edit exists. The control-room ending remains the recommended destination; VAB remains an optional alternative treatment.

This is a separate presentation workstream. The existing Gemini VIII logic prototype can proceed with placeholders while the opening is developed.
