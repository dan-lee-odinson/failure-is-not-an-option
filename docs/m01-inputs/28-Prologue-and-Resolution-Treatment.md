# Prologue and resolution treatment — content 0.5.2

**Document 28 · Codex · 7 September 2026**  
**For:** Dan’s content/art review and Claude Code’s M01 implementation.  
**Direction:** 26 §4–6 and 27 §1–3; historical-caution direction 12 retained.

The handoff is **FNO-M00-Codex-Content-v0.5.2** (folder and ZIP). It contains the six content files, updated manifest, 22 new runtime PNGs, regenerated dialogue sheet, integration changes, and artwork sources/prompts. Claude implements the player stages, hints and portrait presentation; Dan’s sheet and art clearance remains pending.

## 1. Content authority

Every decision node has a procedural hint. The lesson intent on g8-adopt-provenance is revised. Four astronaut participants are listed on g8-accountability-brief and repeated on g8-accountability-decision so their portraits remain visible after Continue. Every outcome has tier, result_line, and plate.

Astronaut trust effects already existed as ledger adjustments. They remain unchanged, as do the return choices, rehearsals, execution events, crew conditions, post-flight disagreement, consequences and IX-A constraints. No new game-state fields, outcome conditions, random draws or timers enter the simulation.

**Captions and result lines are authoritative only in content/mission-gemini-8.json**, and appear in the generated sheet for review. Do not copy them into renderer constants or maintain a second prose edition.

## 2. Prologue sequence and chronology

The mission prologue follows selection of a new Gemini VIII scenario from the menu. It is separate from the opening’s dedication, notices, hero title and future archival montage. Continuing a saved run resumes that run without replaying the prologue.

| Order | Content plate ID | Background asset | Moving layer | Purpose |
|---|---|---|---|---|
| 1 | g8-prologue-program | g8-prologue-program | g8-layer-haze | Gemini as preparation for lunar flight; spacecraft on its workstand |
| 2 | g8-prologue-crew | g8-prologue-crew | g8-layer-haze | Armstrong and Scott in the illustrated preparation room |
| 3 | g8-prologue-launch | g8-prologue-launch | g8-layer-haze | Titan II departure; rising exhaust detail |
| 4 | g8-prologue-docking | g8-prologue-orbit | g8-layer-docked | Joined spacecraft above Earth |
| 5 | g8-prologue-inflection | g8-prologue-orbit | g8-layer-docked | Hold on the joined vehicles as the next contact becomes uncertain |
| 6 | g8-scenario-card | g8-prologue-facility | g8-layer-haze | Facility, date, mission, scenario and explicit return to preparation |

This is an overview ending before the crisis is resolved. The scenario card’s context explicitly returns the player to earlier mission preparation. This is necessary because the accepted playable sequence starts with rehearsals before its own docking report. Keep the existing phases in order; do not silently skip preparation or place it after docking without a time transition.

The period facility caption is **Manned Spacecraft Center, Houston**. Render facility, date, and the composed mission — scenario from prologue.scenario_card. Keep context visible beneath them. Continue dissolves into the accepted over-the-shoulder room. The 1973 renaming belongs in History via prologue.history_note, with history_sources resolving through the registry.

Each beat has one background and one separate moving element. The orbital beats reuse the same base and craft layer with different placement/direction. No undocking, uncontrolled tumble, successful entry or capsule recovery is revealed during the prologue.

## 3. Layout, motion and navigation

Use a 1920×1080 design frame. Preserve its aspect ratio and letterbox when necessary. Scale the entire design surface, including layer coordinates, together.

Captions and controls remain live text and native buttons. Keep a left text area approximately x=96–780, y=170–780, with a gentle dark gradient underneath. Preserve the artwork’s highlights. The facility architecture spans the upper frame; its text belongs over the darker foreground. At smaller sizes, reflow live text and retain reachable controls instead of shrinking type until unreadable.

Use the existing Chakra Petch hero face for plate headings and the result tier. The current title ruling in 26 is study A ×0.75, superseding the earlier larger study. Captions use the existing readable body face at a substantially smaller size. Do not bake words, controls or the agency stand-in into these PNGs.

moving_element.placement supplies x/y/width/height and opacity in design pixels. motion.from and motion.to are offsets added to placement, not absolute positions. Animate once, slowly and linearly; hold the final position. Durations are animation lengths, never deadlines or reading limits.

| Beat | Motion | Offset change | Duration |
|---|---|---|---|
| Program | Haze drifts right | +36 px x | 20 s |
| Crew | Haze drifts right | +22 px x | 20 s |
| Launch | Haze rises | −48 px y | 20 s |
| Docking | Craft drifts right | +20 px x | 20 s |
| Inflection | Craft drifts left | −24 px x | 24 s |
| Facility | Haze drifts right | +24 px x | 20 s |

Use the JSON values, including opacity, as authority. Haze is atmosphere/light texture, not a simulated weather system. Clip layers to the frame; they cannot receive focus or pointer events.

Use approximately 450 ms fades between plates and 700 ms into the room. Reduced motion uses the static from composition and cuts between stages. Continue is immediately available. Skip Prologue goes to the facility card so the mission/date and time transition remain clear. Continue there enters the console once. Rapid repeated clicks must not also trigger a game choice.

Use accepted Apollo kit faces behind native controls: primary Continue, quieter Skip Prologue, and existing focus/selected treatments. Preserve keyboard activation, visible focus and text-size settings. The 30-second help behavior belongs to Claude’s presentation state: decisions read hint; other screens highlight their continuation control per 26. Input resets the timer. Hints never affect availability, consequences or replay logs.

## 4. Portraits and historical participants

Eight astronaut PNGs cover Armstrong, Scott, Cunningham and Stafford, each neutral and concerned. Four additional PNGs provide matched neutral/concerned pairs for Mara Voss and Elias Reed. Their accepted sheets contained both expressions, but the M00b runtime manifest held only their single neutral slots.

All portraits are 768×1024 sRGB RGBA with full heads retained. Neutral is calm; concerned carries a small frown and raised inner brows/worry lines. Expressions represent game relationships, not documented historical emotions.

characters[].portraits.neutral and .concerned point to the pairs. Astronaut portrait fields point to neutral. Controllers retain their original portrait fields for the existing console; use their new pairs consistently on relationship cards. Resolve IDs through the manifest; do not construct filenames. Controller character IDs use g8-systems/g8-recovery, while the new asset IDs use portrait-systems-… and portrait-recovery-….

At the accountability briefing and decision, render participants as portraits plus supplied name-and-role labels. These are not additional invented speakers. Keep their positions in the attributed context card. Add no unsourced speech, quotation-like captions under faces, or synthesized voices. Existing criticism and the ground-responsibility choice remain intact.

## 5. Resolution cards

Enter after the engine has recorded the completed outcome and all scenario relationship effects, before the existing debrief. Read the recorded outcome ID and retrieve its metadata. Never apply an effect while showing, skipping, revisiting or dismissing a card.

Use two player-paced cards:

1. Result plate, resolution_presentation.heading, hero-sized outcome.tier, existing outcome.title, and outcome.result_line.
2. Same plate with stronger dark overlay, relationships_heading, and the changed-character row.

Continue advances result → relationships → existing debrief. Skip goes directly to debrief. If no character changed, omit the relationship card. Reduced motion cuts between cards. Retain the run’s existing alternate-history indication where applicable; the result tier does not alter that state.

| Outcome IDs | Tier | Plate asset |
|---|---|---|
| g8-out-earlier-2, g8-out-later-2 | SUCCESS | g8-resolution-success |
| g8-out-earlier-1, g8-out-later-1 | MIXED | g8-resolution-mixed |
| g8-out-earlier-0, g8-out-later-0 | COSTLY | g8-resolution-costly |

SUCCESS grades the **recovery response within this scenario**. The mission still ended early; it does not mean all Gemini VIII objectives were completed. The content heading and result lines make that distinction explicit.

COSTLY separates the worst two recovered-crew outcomes from MIXED. All six retain their abort-safe kind. FAILURE and LOSS are reserved vocabulary for future scenarios and are never displayed for M00.

The plates show the capsule secured aboard the recovery destroyer, from warmer recovery light to a weary dark deck. Hatches are empty because recovery is complete; they do not suggest crew loss. Chairs and blankets in COSTLY convey exhaustion. Weather, lighting and staging are artistic tone, not measured recovery times, medical diagnoses, ship damage or additional resource losses.

### Relationship row

Compute net trust change from identity.initial_ledger.people[id].trust to completed state.ledger.people[id].trust. Missing starting trust is zero, consistent with seeding. Snapshot at scenario completion, before an IX-A plan can change anything.

Positive selects portraits.neutral and trust_up; negative selects portraits.concerned and trust_down; zero is omitted. Add each name as live text. Words communicate the change independently of face or color. Do not mistake the final trust total for the delta.

Use Voss, Reed, Armstrong, Scott, Cunningham, Stafford as stable display order, excluding zero changes. At 1920×1080 all six may fit in one row; at 1366×768 or large text, wrap to two rows of three with Continue reachable. A missing image falls back to name/change text without blocking navigation.

The blame branch retains Armstrong/Scott losses and Cunningham/Stafford gains. Ground responsibility retains Armstrong/Scott gains and unchanged critics. Historical disagreement remains; the game’s social consequences stay labeled fiction.

## 6. Sound and historical framing

Keep Orbit of Hope under the prologue as directed in 26. Carry playback across plates without restarting at each Continue, respecting audio settings. No soundtrack files or cue map change in this package. Distinct voices are absent; all dialogue remains on screen. Existing room beds/effects resume with the room.

Moving Per Aspera from post-flight to resolution remains Dan’s audition choice. Do not relocate it implicitly.

H1/H2 support mission/crew/launch/docking facts; H9 supports Gemini’s program context; H10 supports the period facility name and renaming. URLs and source notes live in the registry. F11 records authored presentation, expressions, lighting and result summaries alongside F7’s outcome model and F8/F10’s social consequences. Detailed references belong in About/Sources per 26; retain the short facility-history note in History. No new art contains NASA marks.

## 7. Integration and review

The patch baseline is **M00b commit 223a6cb8606b64abd11968b0f454ede12a8760fc, content 0.5.1**. Claude’s M00c may already be newer. Check baseline hashes and merge changes; do not replace its player files or revert the fixes from 26. No app/ implementation is supplied or modified.

Package contents:

- content/: six versioned JSON files, including all caption and result-line text.
- assets/manifest.json: full manifest; assets/ contains only the 22 added PNGs. Retain existing M00b assets/audio.
- docs/dialogue-sheet.md and .csv: full regenerated review sheet.
- integration/: schema, types, validator, sheet generator and tests, patch, baseline hashes.
- art/: 16 generated source images, prompt/reference records, export inventory, and dark-background review sheets.
- mechanics-audit.json, VALIDATION.md, FILES.sha256: comparison and package evidence.

The sheet distinguishes authored M01 text from the current M00b renderer. After implementing M01, Claude should regenerate it against the new renderer and rerun coverage. This package does not claim browser validation of unimplemented screens.

Checks cover 56 complete routes, six outcomes, 112 plan commits, zero draws and 103 tests. Type checking and on-disk image/manifest checks pass. Strict baseline comparison confirms unchanged mechanics and existing historical criticism. Older saves remain subject to the existing version/fingerprint rejection policy; retain the older build for those saves rather than rewriting their identity.

Claude’s acceptance pass should cover all five prologue beats and facility card; Skip/Continue and rapid clicks; both text sizes at 1920×1080 and 1366×768; reduced motion; saved-run resume; all tiers and both accountability stances. Confirm each nonzero relationship uses the correct face/label, zero changes stay hidden, and presentation never adds a domain event.

