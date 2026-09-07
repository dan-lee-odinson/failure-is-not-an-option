# Failure is Not an Option — Review: Equipment Sheets v001 and Apollo Navigation Kit v001

**From:** Claude (Cowork), 7 September 2026 · **To:** Dan (decisions), Codex (the v002 asks in §3), Claude Code (integration notes in §4) · **Packages reviewed:** `art/equipment-sheets-v001/` (25 files, hashes verified) and `art/apollo-navigation-v001/` (340 files, hashes verified).

## 1. Equipment sheets — accepted as design reference; M01 material

Six boards in the same hand as the character sheets: Gemini VIII orbital configuration, Agena target vehicle, Titan II GLV, the docked pair, capsule recovery in four states, and USS Leonard F. Mason. The big shapes are right where they matter to the game: the white adapter and dark reentry module with abreast hatches, the Gemini nose entering the Agena's forward collar on a common axis, a two-stage finless Titan with the twin-chamber first-stage engine and roll markings, the reentry module alone in the water with a flotation collar. Codex's notes are properly cautious about what the boards do not establish — measured scale, exact fittings, the destroyer's March 1966 fit — and say to check dated photographs before any close-up reconstruction. That caution should be kept; the one item I would flag for the same treatment is the destroyer's armament and aft arrangement after her FRAM conversion, which the notes already mark as not independently established.

Where they go: not M00b. They are the source for evidence-card illustrations (a docking-confirmation card with the docked silhouette, a recovery-status card with the capsule afloat), the Gemini IX-A briefing, and the montage-to-illustration transition in `07`. Production assets from them are cutouts or layered scene pieces at contract dimensions, requested when a screen needs one. Nothing in the manifest changes now.

## 2. Navigation kit — accepted in substance; this is the interface kit `18` asked for, about two-thirds complete

Twenty-two labelled controls in six states, four label-free families, four status annunciators, SVG plus 2× transparent PNG, a scoped stylesheet, an offline preview, and a map from each control to the app's existing `data-action` hooks. Codex did the important thing right without being asked: the recommended integration is **label-free SVG backgrounds behind native buttons with live text**, which keeps text application-rendered, keeps the contrast checks meaningful, and keeps enlarged text working. The look — raised bezels, ivory key faces, sage surrounds, a steady green selected bar, amber and red reserved for status — is the console palette from `01` and reads as 1960s hardware rather than a website. Codex also correctly notes the references establish an Apollo-era vocabulary rather than the March 1966 console fit, and that MISSION / CREW / SYSTEMS / TRAJECTORY / PATCHES are proposed destinations that do not exist yet.

**One design point for Dan to rule on before it is applied everywhere.** If every interactive thing becomes a chunky Apollo key, the screen turns into a control panel, and the concept's menus were flight-plan binders, dossiers, and routing slips. I'd propose two vocabularies: **hardware for controls** — navigation, Continue, Choose, Commit, Back, Close, the menu — using this kit; **paper for content** — option cards, evidence, the binder, the debrief — keeping a document treatment, with the kit's bezel used only for the Choose key on a card. That keeps the room a room and the paperwork paperwork.

## 3. Asks for Codex — kit v002, same language

1. **Decision-card states.** The chosen/stamped card and the greyed unchosen card from `16` §3: a paper card with the kit's key as its Choose control, in rest, chosen (stamped ORDERED / CHOSEN, Choose key gone), and unavailable (greyed, reason line visible).
2. **Status-bar marker states.** HISTORICAL CHOICE and ALTERNATE HISTORY as annunciators in the kit's indicator family (the existing four are status lamps; these are mode lamps and should read differently — steady, not alarm-colored).
3. **Panel edges and dividers** for the translucent dialogue and evidence panels, so they sit with the keys.
4. **Title-screen set:** NEW CAMPAIGN, CONTINUE, LOAD, ABOUT at title-screen scale, plus the two or three title treatments `18` asked for.
5. **A period typeface recommendation** for the live text, since the PNGs bake Arial; the CSS should name an open-licensed face with the right feel and record its license.
6. Keep everything else as delivered; no regeneration of the existing 160 assets.

## 4. Integration notes for Claude Code — in the M00b presentation pass

The references arrived before the M00b build, so per `18` the kit is applied in that pass, not M01. Copy the label-free SVG templates and the indicator SVGs into `assets/` with manifest entries (the schema now accepts SVG); adapt `apollo-controls.css` into the app's stylesheet rather than importing it as-is; use live text and the game's font stack; keep the existing `data-action` hooks, focus handling, test ids, and the Glen-head, contrast, and manifest-only-images assertions. Do not implement the proposed future destinations; do not use the labelled PNGs (they bake Arial and fixed labels). Wait for Dan's ruling on §2 before applying bezels to content cards.

## 5. For Dan

1. Rule on the two-vocabulary proposal in §2.
2. Confirm §3 goes to Codex as the kit v002 request.

## 6. Dan's rulings (7 September, later) and a new standing direction

Dan agreed the two vocabularies in §2 as proposed — hardware for controls, paper for content — and confirmed the HISTORICAL CHOICE / ALTERNATE HISTORY markers as mode lamps. §3 goes to Codex as the kit v002 request.

**New standing direction — two interface modes.** Dan's words:

> For future development, I want a toggle between Apollo and Modern interfaces - the buttons become digital display as 2 different UI modes.

So the Apollo kit is the first of two skins, not the only one. A **Modern** mode renders the same controls as flat digital displays — glass, backlit segments, clean type — while the layout, the hooks, the paper vocabulary for content, and every rule about live text, contrast, focus, and reduced motion stay the same. The player toggles between them; the concept already anticipates later eras introducing cleaner displays with the same visual grammar, so the toggle may also become the default per campaign era later.

**What this means now, for Claude Code in the M00b pass:** build the kit as a theme, not as the stylesheet. Controls reference bezel assets and colors through theme tokens (a `data-ui-mode` attribute on the root, CSS custom properties per mode, kit assets resolved through those properties), so the Modern skin is a second set of tokens and SVGs with no logic change. Ship only the Apollo mode in M00b; leave the switch wired but hidden behind a single constant until a Modern kit exists. No branching in `app/` logic on the mode; if a component would need to, the tokens are wrong.

**For Codex, later (not v002):** a Modern kit in the same families and states — selector, key, action, arrow, indicators, mode lamps, decision-card Choose key, title-screen set — as digital-display renderings, delivered as label-free SVG templates like the Apollo kit so the same CSS applies. Not requested yet; recorded so v002 is drawn with a second skin in mind (same geometry and hit areas across modes).
