# FNO-DEMO-END — build handoff

**Status:** DONE. The demo has an end: after the committed Gemini IX-A plan a demo-complete screen thanks the player, points to the game's itch.io page and offers the way back to finaogame.com; reaching it marks the campaign complete, so the menu's CONTINUE says so instead of reopening the planning screen; the home page's coming-soon block and About carry the itch.io link. One commit on `main`, pushed once with everything green.

| | |
|---|---|
| Task | FNO-DEMO-END (Dan's direction: "for the demo, there is no real path to end. There needs to be a final screen saying 'Demo Complete - Follow for Game Updates' or something like that and have an exit button that returns the player back to the main page."; follow target https://danleeodinson.itch.io/failure-is-not-an-option) |
| Baseline | `e4509b2` (PT3, live) |
| Delivery commit | *(filled in the zip copy)* |
| Changed | `app/links.ts` (new: the itch.io and home destinations), `app/ui-state.ts` (the `demo-end` screen), `app/storage.ts` (`campaignComplete`, `continueState`, the two menu reasons), `app/main.ts` (the `demo-end` and `play-again` actions, the slot written on arrival, CONTINUE's decision, the room bed under the screen), `app/render.ts` (the planning row's CONTINUE, the screen, the About key), `app/styles.css` (the demo-complete block), `scripts/lib/site.ts` + `site/styles.css` (the coming-soon block's second link), `scripts/lib/dialogue-sheet.ts` (the `demo-end` stage; kit-key links as their own runs; the site row), the regenerated sheet, the tests, README, this record. No content, no mechanics, no film, no `registry.site`. |
| Content | 0.5.5, fingerprint unchanged `4c22b8e7949ba84df3799d692dcec360391919b5b18936e9c141991883efff2d`; validate 56 / 6 / 112 / 0 |
| Unit tests | 314 in 21 files (`demo-end.test.ts` new, 8 cases; the sheet and site tests extended); typecheck clean; fail-on-purpose 11 of 11 |
| Browser tests | *(count in the zip copy)* Playwright cases pass (`demo-end.spec.ts` new, 6 cases; the phone walk two screens longer at every size; the home-page case checks the link at every width); replay byte-identical (the m01 and m02 replay cases, and the new case with the screen visited and the campaign reloaded from the slot) |
| Release check | OK on the built `dist/` |
| Deploy | Pages run: *(recorded in the zip copy)* · Live bundle: *(recorded in the zip copy)* |

## 1. The screen (items 1, 2, 4)

The demo's last Continue is the planning screen's: once the plan is committed the row that held the disabled COMMIT key and "Preparation plan committed." carries a raised CONTINUE (`to-demo-end`, the focus default), on every route. It leads to the **demo-complete screen** (`screen: 'demo-end'`, `renderDemoEnd`): the room plate dimmed (a 0.78 scrim), one paper card centred — DEMO COMPLETE · "Thank you for flying Gemini VIII with us." · "Failure is Not an Option is in development. The full game is coming." · "Follow the game on itch.io for updates." — and the keys below in DOM order: FOLLOW ON ITCH.IO (`<a>` to https://danleeodinson.itch.io/failure-is-not-an-option, `target="_blank" rel="noopener noreferrer"`), EXIT TO FINAOGAME.COM (`<a>` to https://finaogame.com/, the same tab, the primary raised `k-key` face and the focus default — the exit button) and PLAY AGAIN (a button: the menu). Keyboard order Follow, Exit, Play again, then the sound control; Escape does nothing there (the key handler only closes overlays and the tier strip). The screen fades in over 0.45 s; none under reduced motion. Sound toggle and volume as on the plates (`soundControl`). Phone (under 600 px): the dimmed picture 16:9 at the top, the card the HOTFIX-01 paper sheet across the width below it, the keys wrapping under the sheet; the screen scrolls if it must.

Presentation only: the `demo-end` action changes the UI state, writes the slot and announces "Demo complete."; nothing is applied to the run, the log carries no entry for it, and the outcome, the debrief and the planning are as they were (the unit case compares the canonical log and state before and after; the browser case compares a run that visited the screen and was reloaded from the slot with one that did not).

**Music (item 4).** No cue of its own: `screen:demo-end` triggers nothing in the music map and stops nothing, so whatever plays under the planning screen carries on (the room bed, which `syncAudio` keeps for the screen; the post-flight cue if it has not run out), and the menu loop starts with the menu on PLAY AGAIN. See the decisions.

## 2. Save state (item 3)

`campaignComplete(run)` (app/storage.ts): the mission closed and the follow-on plan committed — derived from the run's own state, nothing added to a save (the save file keeps its five fields; the unit case proves the flag survives `createSave` → `verifySave` by replay). Reaching the screen writes the browser slot (`saveToBrowser`), so the campaign the menu knows is the finished one. `continueState(slot)` decides the menu's CONTINUE: an empty slot ("No saved campaign in this browser yet. New Campaign starts one; Load imports a file."), a save that fails verification ("The saved campaign cannot be resumed: …"), a live run (enabled), a completed campaign ("This campaign is complete. New Campaign starts another; Load imports a save file.", disabled) — never a silent reopening of the last screen. NEW CAMPAIGN and LOAD stay available; LOAD FROM THIS BROWSER (or an import) of the finished campaign opens the planning screen as before, with its CONTINUE back to the screen and the debrief and export reachable; EXPORT JSON FILE works from the planning screen and from the menu's Load panel (the finished run stays loaded after PLAY AGAIN until a new one replaces it).

## 3. The links (item 5)

`app/links.ts` carries the two destinations. About / Credits: a FOLLOW ON ITCH.IO key beside HOME (a key-styled link, new tab, `noopener noreferrer`). The home page: the coming-soon block keeps its text and its own link and gains "Follow on itch.io ↗" beside it (`FOLLOW_LINK` in `scripts/lib/site.ts`, text and destination both presentation constants like the NASA-guidelines and GitHub destinations, so `registry.site` is unchanged and the release check's block and item checks pass as before); the two links stack in a `.coming-links` column at the block's right edge (`site/styles.css`, the three width rules moved from the single link to the column). The dialogue sheet's site section carries the link as app copy after the block's four items.

## 4. The sheet (item 6)

`captureDemoEnd` records the screen after every committed plan under its own stage — phase and node `demo-end`, "Demo complete", between planning and the overlays — so the seven strings appear once, on every route (branch empty). The menu is also captured with the completed-campaign reason (a `ui.hint` on `opening-menu`). A link styled as a kit key (`a.k`: HOME, FOLLOW ON ITCH.IO, EXIT TO FINAOGAME.COM) is its own run and a `ui.button`, so the demo-end keys never glue together; `docs/dialogue-sheet.{md,csv}` regenerated (872 strings).

## 5. Tests (item 7)

Unit — `tests/core/demo-end.test.ts`: the flag on all 56 routes and its absence from the save file; `continueState` for the four slot states; the menu rendered with the completed-campaign reason (CONTINUE disabled with the reason, NEW CAMPAIGN and LOAD enabled); the planning row's CONTINUE only once committed, as the focus default in place of the commit key; the screen's copy, keys, attributes and order, the log and state untouched, the replay unchanged; the screen on all 56 routes; the About key and the home page's link with `registry.site`'s block unchanged; the sheet's stage, order and site row. The sheet test renders the screen after every committed plan and the menu with the reason; the site-contract test admits the one app row.

Browser — `tests/e2e/demo-end.spec.ts`: the earlier route at 1920 default, the later at 1366 enlarged and the earlier at 390 reaching the screen (the copy, the keys' href / target / rel, EXIT the raised key, the keys on screen and 40 px tall, contrast of the card's text and every kit face), the slot written on arrival with the committed plan as its last input, the log free of the screen, PLAY AGAIN to the menu with CONTINUE disabled and the reason, NEW CAMPAIGN / LOAD enabled, LOAD reopening the planning screen with CONTINUE and export offered, a reload landing on the menu with the same answer; the keyboard order and Escape; the replay byte-identical with the screen visited and the campaign reloaded from the slot; the home page's link and About's. `phone.spec.ts` walks on to the committed plan, the screen (the keys inside the viewport) and the menu after it at 320 / 390 / 430 × default / enlarged. `deploy.spec.ts` checks the coming-soon link at all four widths.

## 6. Checks and evidence (item 8)

`npm run validate`, `npm run validate:fail`, `npm run typecheck`, `npm test`, `npm run test:e2e`, `npm run build`, `npm run release-check`: transcripts under `evidence/`. Screenshots: the screen and the menu after it at 1920 default (`60-demo-complete`, `61-menu-campaign-complete`), 1366 enlarged and 390; About with the key (`62-about-itch`); the phone walk's committed plan, screen and menu at 390 (`49-planning-committed`, `50-demo-complete`, `51-menu-campaign-complete`); the home page's coming-soon block at 1366 (`site-laptop-1366/coming-soon-itch`) and the full home page at 1920 and 390.

## Decisions taken here (reversible)

1. **The campaign-complete flag is derived, not stored**: the mission closed and the plan committed. The only campaign the menu knows is the browser slot, so reaching the screen writes the slot with the finished run — that is what "marks the campaign complete" — and nothing is added to the save format (older saves, exports and the verifier are untouched). A player who commits the plan, saves and quits before pressing CONTINUE gets the same menu answer, which is right: that campaign has nothing left but the screen.
2. **Music: no cue on the screen.** Read literally, "the menu loop continues under the screen" cannot happen — the menu loop stops at the first console screen and the planning screen, so nothing of it is playing when the screen arrives; and "no new cue" rules out triggering the refrain loop there. So the screen triggers and stops nothing: the room bed and any running cue carry on, the menu loop starts with PLAY AGAIN. If Dan wants the refrain loop under the screen, it is one trigger in `app/music-map.json` (`screen:demo-end`) and the director already refuses to restart a cue that is playing, so PLAY AGAIN would not retrigger it.
3. **EXIT takes the focus** on arrival as the primary key (Enter leaves for the home page); Shift+Tab reaches FOLLOW, Tab reaches PLAY AGAIN. The idle highlight lands on EXIT too.
4. **The home page's link opens in the same tab**, like the page's other off-site links (GitHub, the NASA guidelines, the social links); the game's keys open the itch.io page in a new tab as directed, since the game would otherwise be lost.
5. **The finished run stays loaded after PLAY AGAIN** until NEW CAMPAIGN or a load replaces it, so EXPORT is offered from the menu's Load panel as well.

## Not changed

Mechanics, content, the film, `registry.site`, the music map. Content 0.5.5 and its fingerprint are as delivered by PT3.
