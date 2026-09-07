# Failure is Not an Option — Direction: Opening Screens and Interface Style

**From:** Dan (director), transcribed by Claude (Cowork), 7 September 2026 · **To:** Codex (references and treatment) and Claude Code (implementation) · **Status:** Standing direction. Scope: M01, or the M00b presentation pass if the references arrive in time.

## Dan's words

> The opening screen shows various sections of text in boxes - it looks very disjointed like they are different options, rather than written prose (the dedication, the disclaimers, etc), and the game title is small and unimpressive. If this is just a stand-in for the real title cards and credit screens, that is fine. If it is intended to be a permanent section, it needs a lot of reworking. The completed opening screens should be cinematic, scrolling text, resolving back to a large stylized font title and then new campaign, save, load options in better stylized buttons. I will have GPT put together some button references to use throughout the game.

## What the current opening is

A stand-in. The M00 build needed the dedication, the project disclaimer, the AI disclosure, and the dramatization statement on screen before play (`08-Dedication-and-Disclaimers.md`), and the opening cinematic is its own workstream (`07-Opening-Cinematic.md`) that does not exist yet, so Claude Code rendered the required notices as plain panels with a small title. Nothing about it was designed. It is replaced, not reworked.

## The direction

**Opening sequence.** Cinematic. The dedication and the notices are presented as scrolling text — written prose that moves, not boxes — which resolves to a large, stylized title treatment, which gives way to the main menu: New Campaign, Continue, Load, and the About/Credits entry, in stylized buttons. When the archival montage from `07` exists, it sits between the scroll and the title, ending unbranded and fading before the illustrated room resolves under the title, exactly as `07` specifies. Until then the sequence is scroll → title → menu. Rules from `07` and `08` still hold: player-paced, a visible Skip, keyboard reachable, an immediate cut under reduced motion, the notices permanently reachable from About/Credits, no forced countdown, and the dedication given its own space, never combined with the disclaimer text on one card.

**Title treatment.** Large, stylized, application-rendered or a supplied image — Codex proposes; Dan chooses. It is the one place the game's name gets to be a piece of design. It carries no NASA marks (`09`). Period feel over novelty: 1966 Houston, not science fiction.

**Buttons and interface style.** Dan is having Codex produce button references to be used throughout the game — not only the menu. That makes them a small interface kit: primary button, secondary button, disabled state, the chosen/stamped state the decision cards need (`16` §3), badges, the status-bar marker states (HISTORICAL CHOICE / ALTERNATE HISTORY), and panel edges — in the room's palette (institutional cream, console green, charcoal, muted blue, amber, restrained red) and its ink-and-flat-color hand. Codex delivers them as flat reference images plus a one-page note on states and sizing; Claude Code implements them in CSS, not as image buttons, so text stays application-rendered and the contrast checks keep passing.

## Who does what

- **Codex:** the button and interface references; a title treatment proposal (two or three directions); an updated `07` that places the scrolling text and the title resolve in the timeline. Deliver into `art/` with the usual handoff and hashes.
- **Claude Code:** implement the opening sequence, the title, and the menu; apply the interface kit across every screen. If the references land before the M00b presentation pass starts, the kit is applied in that pass, since the decision-state stamping in `16` §3 needs a button style anyway; otherwise the opening and the kit are the first M01 task.
- **Dan:** choose the title direction; review the kit on the sheet of references before it is built.
