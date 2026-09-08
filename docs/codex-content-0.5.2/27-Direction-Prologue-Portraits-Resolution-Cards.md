# Direction — prologue captions, astronaut portraits, and scenario resolution cards

**From:** Dan (director), transcribed by Claude · **Date:** 7 September 2026 · **To:** Codex (content 0.5.2, art, treatments) and Claude Code (M01) · **Follows:** `26-Playtest-2-Findings.md` §4–§7. Standing direction.

## 1. Dan's rulings on the two flags in 26

> Go with Manned Spacecraft Center, Houston. Show the headshots and names, but do not attribute quotes that are not citable.

- **Facility caption (26 §4):** "Manned Spacecraft Center, Houston" on the scenario card for Gemini- and Apollo-era scenarios. History carries the one-line note that the center was renamed the Lyndon B. Johnson Space Center in 1973.
- **Astronaut portraits (26 §6):** at the accountability decision, show the four portraits (Armstrong, Scott, Cunningham, Stafford) with name and role labels, the way Voss and Reed are shown. **No lines under them** unless a line is a citable quotation with its source in provenance. Their positions stay summarised in the existing context card as attributed, not quoted. This is the rule for every real person in the game from here on: headshot and name, yes; words only when citable.

## 2. Dan's addition — scenario resolution cards

> There should be a Scenario resolution card(s) with the mission results: Success, Mixed, Failure, etc and illustrations — there are equipment references for the capsule recovery, the astronaut reference cards etc which can be used. Relationship changes can be shown next to the headshot of the character, neutral (which looks positive) used for positive increase, concerned for negative decrease.

### What it is

When a scenario ends (the outcome record is written, before the debrief), one or more full-screen cards resolve in — the same presentation family as the prologue and the scenario card — showing:

1. **Result** — a tier word in the hero face at title scale: SUCCESS / MIXED / FAILURE (Codex proposes the full tier list; "etc" leaves room for e.g. LOSS for later missions). Beneath it, the outcome's own title from the content (e.g. "Crew recovered — extra orbit, prompt warning response") and a one- or two-sentence result line.
2. **Illustration** — a plate drawn from the accepted equipment sheets and character sheets: for Gemini VIII, the capsule recovery (`fno_equipment_gemini-capsule-recovery_v001`), the *USS Leonard F. Mason*, the docked Gemini–Agena, the Titan II, and the crew portraits are all available. Illustrations are per outcome tier or per outcome, Codex's call, but every M00 outcome must have one.
3. **Relationships** — a row of the characters whose standing with Glen changed in this run: headshot, name, and the change shown by expression — **neutral** for an increase, **concerned** for a decrease — with a short label ("Trust up" / "Trust down", or the content's own wording). Characters with no change are not shown. For Gemini VIII this covers Voss, Reed, and at the accountability fork Armstrong, Scott, Cunningham and Stafford (portraits from §1; expressions needed for those four — see art asks).

Then the debrief as it is now.

### Mapping the six M00 outcomes to tiers

All six recover the crew, so none is FAILURE. Proposed, for Codex to confirm against the content's own crew-condition facts:

| Outcome | Tier |
|---|---|
| `g8-out-earlier-2` coordinated pickup, `g8-out-later-2` prompt warning response | SUCCESS |
| `g8-out-earlier-1` difficult pickup, `g8-out-later-1` difficult entry preparations | MIXED |
| `g8-out-earlier-0` punishing sea wait, `g8-out-later-0` rushed entry | MIXED (leaning failure — Codex may propose a fourth tier such as COSTLY if two levels of MIXED read the same) |

The tier is a **label on the outcome** (`tier` field, content 0.5.2), never a new mechanic; the outcome itself is unchanged. Label, never delete.

### Contract

- **Content 0.5.2 (Codex):** `outcomes[].tier`, `outcomes[].result_line`, `outcomes[].plate` (asset id); relationship deltas are already in the content — Claude Code reads them from the run; if any delta is not yet expressed as data (e.g. astronaut trust at the accountability fork), Codex exposes it as a `relationship` effect so the card can read it rather than infer it.
- **Art (Codex):** resolution plates 1920×1080 in the room's hand (one per tier at minimum, per outcome if cheap), composed from the equipment and character sheets; four astronaut portraits 768×1024 RGBA in **neutral and concerned** (the controller portraits already have both); no NASA marks; the plates enter the manifest like the room.
- **Claude Code (M01):** the resolution stage between the outcome record and the debrief, using the opening's stage machinery (fade in, player-paced, Continue, Skip; reduced motion cuts), the tier in Chakra Petch at the title scale ruled in 26 (×0.75 of study A), the illustration under a dark overlay like the hero, the relationship row in the conversation-panel style. Per Aspera's cue moves to start on the resolution card rather than the post-flight brief if Dan prefers after hearing it (a number in the map).

## 3. Codex's package, complete

1. Content 0.5.2: reworded `g8-adopt-provenance` intent (26 §3 #11); `hint` on every decision node (26 §5); `participants` on `g8-accountability-brief` (§1); `outcomes[].tier / result_line / plate` (§2); any relationship delta not yet data; regenerated sheet; Dan clears the sheet.
2. Art: four astronaut portraits (neutral + concerned); resolution plates; prologue plates with moving-element layers (26 §4) and the facility plate captioned per §1.
3. Treatments: the prologue (26 §4) and the resolution cards (this doc) in one document, with the caption and result-line text as content, not prose in the treatment.

Next number in `00-Index.md` is 28.
