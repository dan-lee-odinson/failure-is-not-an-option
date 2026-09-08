/**
 * AC-12 — Presentation and access, plus the M00b screenshot set (handoff §7.1) as carried through M00c and M01
 * (a new campaign now passes through the prologue; the outcome record leads to the resolution cards):
 * the opening (each chapter), the hero title, the menu with CONTINUE disabled
 * and enabled, prep cards at rest / chosen / unavailable, loss of contact,
 * crisis, the return decision (Details open, both lamp states), an execution
 * beat, the post-flight decision, the debrief with "Departures from the
 * record", IX-A planning, About/Credits — at 1920×1080 and 1366×768, default
 * and enlarged text. Every room shot re-runs the Glen clear-zone, contrast and
 * manifest checks; every kit control's contrast is recorded to
 * artifacts/contrast.json. Drives the real UI by clicking; nothing here
 * reaches into the engine.
 */
import { expect, test } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { assertGlenUncovered, assertManifestImagesOnly, kitFaceTable } from './room';
import { ARTIFACTS, TEXT, VIEWPORTS, assertNoHorizontalOverflow, assertParticipants, assertVisibleWithinViewport, awaitRoom, click, fakeFilm, fresh, isStacked, node, seekFilm, setText, shot, skipPrologue, stage, start, toMenu, withEvidence } from './helpers';

// ---------------------------------------------------------------------------
// Opening, menu, About
// ---------------------------------------------------------------------------

for (const vp of VIEWPORTS) for (const text of TEXT) {
  test(`opening, menu and About screenshots: ${vp.name} ${text} text`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await fakeFilm(page); // the film under a fake media clock here; the real file plays in deploy.spec.ts
    await fresh(page, false);
    expect(await stage(page)).toBe('start');
    // Text size is a per-player setting; set it once on the menu, then replay the opening at that size.
    if (text === 'large') {
      await click(page, 'skip-to-menu');
      await setText(page, 'large');
      await click(page, 'menu-about');
      await click(page, 'replay-opening');
      expect(await stage(page)).toBe('start');
    }
    await shot(page, vp.name, text, '00-opening-start');
    await expect(page.getByTestId('begin')).toBeVisible();
    await expect(page.getByTestId('skip-to-menu')).toBeVisible();
    // Silent before the first Begin; the large-text run has already skipped once, which turned the master on.
    await expect(page.getByTestId('sound-toggle')).toHaveAttribute('aria-pressed', text === 'default' ? 'false' : 'true');

    // FNO-DEPLOY: Begin plays the film; at 2:18 the den takes over and the credits scroll on its wall.
    await click(page, 'begin');
    expect(await stage(page)).toBe('film');
    await expect(page.getByTestId('film')).toHaveAttribute('src', /\/video\/opening-film\.mp4$/);
    await shot(page, vp.name, text, '01-opening-film');
    await seekFilm(page, 138);
    await expect(page.getByTestId('screen-opening')).toHaveAttribute('data-stage', 'credits');
    await expect(page.getByTestId('film')).toHaveCount(0);
    await click(page, 'scroll-toggle'); // pause so the shots are repeatable
    await expect(page.getByTestId('scroll-toggle')).toHaveText('RESUME');
    const prose = page.getByTestId('op-prose');
    await expect(prose).toBeVisible();
    // One column on the wall: the dedication, the three notices, then the credit sections; no visible scrollbar.
    await expect(prose.locator('.wall-dedication p')).toHaveCount(2);
    await expect(prose.locator('.wall-notices p')).toHaveCount(3);
    await expect(prose.locator('.wall-section')).toHaveCount(6);
    await expect(prose).toContainText('To the men and women of NASA');
    await expect(prose).toContainText('independent homage to NASA');
    expect(await page.getByTestId('op-scroll').evaluate((el) => getComputedStyle(el).scrollbarWidth)).toBe('none');
    await prose.locator('p').first().evaluate((el) => el.scrollIntoView({ block: 'center' }));
    await shot(page, vp.name, text, '01b-opening-credits-dedication');
    await prose.locator('.wall-section').nth(4).evaluate((el) => el.scrollIntoView({ block: 'start' }));
    await shot(page, vp.name, text, '01c-opening-credits-archive');
    // Manual scrolling while paused reaches every word: the last line can be brought fully into the wall.
    await prose.locator('p').last().evaluate((el) => el.scrollIntoView({ block: 'center' }));
    const lastVisible = await prose.locator('p').last().evaluate((el) => { const r = el.getBoundingClientRect(); const box = el.closest('#op-scroll')!.getBoundingClientRect(); return r.top >= box.top - 1 && r.bottom <= box.bottom + 1; });
    expect(lastVisible).toBe(true);
    await page.getByTestId('op-scroll').evaluate((el) => { el.scrollTop = 0; });

    // Continue at any time: a quick fade to the hero title.
    await click(page, 'stage-next');
    await expect(page.getByTestId('screen-opening')).toHaveAttribute('data-stage', 'title');
    await expect(page.getByTestId('screen-opening')).not.toHaveAttribute('data-fade', /.+/, { timeout: 5000 });
    await expect(page.getByTestId('hero-title')).toBeVisible();
    const continueSize = await page.getByTestId('hero-continue').evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
    expect(continueSize).toBeGreaterThanOrEqual(18);
    await assertGlenUncovered(page);
    await shot(page, vp.name, text, '03-hero-title');

    await click(page, 'hero-continue');
    expect(await stage(page)).toBe('menu');
    await expect(page.getByTestId('start-load')).toBeDisabled();
    await expect(page.getByTestId('continue-reason')).toBeVisible();
    for (const id of ['start-new', 'start-load', 'menu-load', 'menu-about']) await assertVisibleWithinViewport(page, id);
    await expect(page.getByTestId('fullscreen-line')).toHaveText('Best played full screen — press F11 on Windows.');
    const fsEnabled = await page.evaluate(() => document.fullscreenEnabled);
    if (fsEnabled) await expect(page.getByTestId('fullscreen')).toHaveText('FULL SCREEN');
    else await expect(page.getByTestId('fullscreen')).toHaveCount(0);
    await shot(page, vp.name, text, '04-menu-continue-disabled');

    await click(page, 'menu-about');
    await expect(page.getByTestId('overlay-about')).toBeVisible();
    await expect(page.getByTestId('replay-opening')).toBeVisible();
    await expect(page.getByTestId('soundscape-credits')).toContainText('Beep 8 count (loopable) by JonNicholas, freesound.org, CC BY 3.0');
    await expect(page.getByTestId('ost-list')).toContainText('Orbit of Hope');
    await shot(page, vp.name, text, '05-about-credits');
    await click(page, 'close-overlay');

    // A valid save enables CONTINUE on the next launch. NEW CAMPAIGN runs the prologue first (M01); CONTINUE resumes a run without it.
    await click(page, 'start-new');
    await skipPrologue(page);
    await click(page, 'continue-g8-brief-continue');
    await click(page, 'open-saveload');
    await click(page, 'save-browser');
    await expect(page.getByTestId('save-message')).toHaveText('Saved to this browser.');
    await page.reload();
    await expect(page.getByTestId('screen-opening')).toHaveAttribute('data-stage', 'menu');
    await expect(page.getByTestId('start-load')).toBeEnabled();
    await expect(page.getByTestId('continue-reason')).toHaveCount(0);
    await shot(page, vp.name, text, '06-menu-continue-enabled');
    await click(page, 'start-load');
    await expect(page.getByTestId('screen-console')).toBeVisible();
    await expect(page.getByTestId('screen-prologue')).toHaveCount(0);
    expect(await node(page)).toBe('g8-prep-select');
  });
}

// ---------------------------------------------------------------------------
// Console screenshots, earlier route (alternate history from execution on)
// ---------------------------------------------------------------------------

for (const vp of VIEWPORTS) for (const text of TEXT) {
  test(`console screenshots and layout, earlier route: ${vp.name} ${text} text`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await start(page, text);
    const v = vp.name;
    // Preparation: rest, chosen, unavailable.
    expect(await node(page)).toBe('g8-brief');
    await click(page, 'continue-g8-brief-continue');
    expect(await node(page)).toBe('g8-prep-select');
    await expect(page.getByTestId('badge-historical-choice')).toHaveCount(0);
    await shot(page, v, text, '10-prep-rest');
    await click(page, 'option-g8-prep-recovery');
    await expect(page.getByTestId('stamp-g8-prep-recovery')).toHaveText('CHOSEN');
    await expect(page.getByTestId('option-g8-prep-recovery')).toHaveCount(0);
    // Focus moved to the next valid continuation, not to the removed key.
    expect(await page.evaluate(() => document.activeElement?.getAttribute('data-testid'))).toBe('continue-g8-prep-finish');
    await shot(page, v, text, '11-prep-chosen');
    await click(page, 'option-g8-prep-contact');
    await expect(page.getByTestId('card-g8-prep-systems')).toHaveAttribute('data-state', 'unavailable');
    await expect(page.getByTestId('reason-g8-prep-systems')).toHaveText('No preparation opportunities remaining.');
    await expect(page.getByTestId('option-g8-prep-systems')).toHaveCount(0);
    await shot(page, v, text, '12-prep-unavailable');
    await click(page, 'continue-g8-prep-finish');
    // Docking
    expect(await node(page)).toBe('g8-docking-report');
    await expect(page.getByTestId('display-time')).toHaveText('MET approximately 06:33');
    await click(page, 'continue-g8-docking-report-continue');
    // Gap
    expect(await node(page)).toBe('g8-loss-of-contact');
    await expect(page.getByTestId('contact')).toHaveText('CONTACT: NONE');
    await shot(page, v, text, '13-loss-of-contact');
    await click(page, 'continue-g8-loss-of-contact-continue');
    await withEvidence(page, async () => { await expect(page.getByTestId('evidence-g8-ev-docked')).toHaveAttribute('data-badge', 'PREVIOUS CONTACT'); });
    await click(page, 'question-g8-q-gap');
    await expect(page.getByTestId('conversation')).toContainText("We'll have to wait for contact");
    await expect(page.getByTestId('conversation').locator('.conv-lines [data-testid="answer-g8-q-gap"]')).toBeVisible(); // answers are dialogue: in the body, not the footer (M02)
    await expect(page.getByTestId('conversation').locator('.conv-questions .answer')).toHaveCount(0);
    await expect(page.getByTestId('badge-alt-history')).toHaveCount(0);
    await click(page, 'continue-g8-gap-note-continue');
    // Crisis
    expect(await node(page)).toBe('g8-crisis-report');
    await withEvidence(page, async () => { await expect(page.getByTestId('evidence-g8-ev-crisis')).toBeVisible(); });
    await shot(page, v, text, '14-crisis-report');
    await click(page, 'continue-g8-crisis-report-continue');
    await click(page, 'continue-g8-stabilization-report-continue');
    expect(await node(page)).toBe('g8-rule-decision');
    await expect(page.getByTestId('badge-historical-choice')).toBeVisible();
    // Details open by default on every card (M00c).
    expect(await page.getByTestId('card-g8-order-return').locator('details').evaluate((d) => (d as HTMLDetailsElement).open)).toBe(true);
    // History: the explanation, the lamp sentence and the sources; no provenance lines, no fiction register.
    await click(page, 'open-history');
    await expect(page.getByTestId('overlay-history')).toBeVisible();
    await expect(page.getByTestId('overlay-history')).toContainText('Historical sources');
    await expect(page.getByTestId('overlay-history')).not.toContainText('Fiction register');
    await expect(page.getByTestId('overlay-history')).not.toContainText('Report, procedure');
    await shot(page, v, text, '07-history-panel');
    await click(page, 'close-overlay');
    await click(page, 'option-g8-order-return');
    // Return decision: HISTORICAL CHOICE lamp, Details open, no chips, pinning in the Evidence panel only.
    expect(await node(page)).toBe('g8-return-brief');
    await expect(page.getByTestId('badge-historical-choice')).toBeVisible();
    await expect(page.getByTestId('badge-alt-history')).toHaveCount(0);
    await expect(page.getByTestId('active-portrait')).toBeVisible();
    const activeH = (await page.getByTestId('active-portrait').locator('img').boundingBox())!.height;
    const thumbH = (await page.locator('[data-testid="conversation"] .line img.portrait').first().boundingBox())!.height;
    expect(activeH).toBeGreaterThan(thumbH * 1.5);
    if (v === '1920x1080') { expect(activeH).toBeGreaterThanOrEqual(200); expect(activeH).toBeLessThanOrEqual(260); }
    // The rehearsal readout appears once, under "Supported by" on each card; not under Glen's question.
    await expect(page.getByTestId('readout')).toHaveCount(0);
    await expect(page.getByTestId('card-g8-return-earlier')).toContainText('Supported by');
    // The conversation panel: no horizontal overflow, and Glen's questions in view without scrolling the panel.
    const panel = await page.getByTestId('conversation').evaluate((el) => {
      const b = el.getBoundingClientRect();
      const q = el.querySelector('.conv-questions')!.getBoundingClientRect();
      const body = el.querySelector('.conv-body')!;
      const cs = getComputedStyle(el), bs = getComputedStyle(body);
      const inner = b.right - parseFloat(cs.borderRightWidth);
      const past = Array.from(el.querySelectorAll<HTMLElement>('*')).filter((c) => c.getBoundingClientRect().right > inner + 0.5).length;
      const noX = cs.overflowX === 'hidden' && bs.overflowX === 'hidden' && past === 0 && body.scrollWidth <= body.clientWidth + 1 && el.scrollWidth <= el.clientWidth + 1;
      return { noX, qIn: q.top >= b.top && q.bottom <= b.bottom + 1, scrollTop: el.scrollTop };
    });
    expect(panel.noX, 'no horizontal overflow in the conversation panel').toBe(true);
    expect(panel.qIn, "Glen's questions within the panel").toBe(true);
    expect(panel.scrollTop).toBe(0);
    for (const q of ['question-g8-q-recovery-risk', 'question-g8-q-reserve-risk']) await expect(page.getByTestId(q)).toBeInViewport();
    for (const id of ['option-g8-return-earlier', 'option-g8-return-later', 'card-g8-return-earlier', 'card-g8-return-later']) await assertVisibleWithinViewport(page, id);
    for (const id of ['g8-return-earlier', 'g8-return-later']) {
      expect(await page.getByTestId(`card-${id}`).locator('details').evaluate((d) => (d as HTMLDetailsElement).open)).toBe(true);
      await expect(page.getByTestId(`card-${id}`)).toContainText('Risk');
      await expect(page.getByTestId(`card-${id}`)).toContainText('Attraction');
    }
    expect(await page.locator('[data-testid="strip"] [data-action^="pin:"]').count()).toBe(0);
    expect(await page.locator('[data-testid="conversation"] [data-action^="pin:"]').count()).toBe(0);
    // The once-only pin hint appears on first hover, dismisses, and stays dismissed; pinning is UI-only (in the column, or in the stacked layout's overlay).
    await withEvidence(page, async () => {
      await page.getByTestId('pin-g8-ev-reserve').hover();
      await expect(page.getByTestId('pin-hint')).toBeVisible();
      await click(page, 'pin-hint-dismiss');
      await expect(page.getByTestId('pin-hint')).toHaveCount(0);
      await page.getByTestId('pin-g8-ev-reserve').hover();
      await expect(page.getByTestId('pin-hint')).toHaveCount(0);
      await click(page, 'pin-g8-ev-reserve');
      await expect(page.getByTestId('pin-g8-ev-reserve')).toHaveAttribute('aria-pressed', 'true');
    });
    expect(await node(page)).toBe('g8-return-brief');
    await shot(page, v, text, '15-return-decision');
    await click(page, 'option-g8-return-earlier');
    // Receipt: the committed cards stay on screen, stamped ORDERED and greyed; focus on Execute.
    expect(await node(page)).toBe('g8-order-receipt');
    await expect(page.getByTestId('committed-cards')).toBeVisible();
    await expect(page.getByTestId('stamp-g8-return-earlier')).toHaveText('ORDERED');
    await expect(page.getByTestId('card-g8-return-later')).toHaveAttribute('data-state', 'closed');
    expect(await page.locator('[data-action^="option:"]').count()).toBe(0);
    await expect(page.getByTestId('badge-alt-history')).toHaveCount(0);
    await expect(page.getByTestId('badge-historical-choice')).toHaveCount(0);
    expect(await page.evaluate(() => document.activeElement?.getAttribute('data-testid'))).toBe('continue-g8-execute-return');
    await shot(page, v, text, '16-order-receipt');
    await click(page, 'continue-g8-execute-return');
    // Execution: ALTERNATE HISTORY from here on the earlier route.
    expect(await node(page)).toBe('g8-ground-execution');
    await expect(page.getByTestId('badge-alt-history')).toBeVisible();
    await expect(page.getByTestId('applied')).toBeVisible();
    await shot(page, v, text, '17-execution-alternate');
    await click(page, 'continue-g8-ground-execution-continue');
    expect(await node(page)).toBe('g8-return-beat-1');
    await expect(page.getByTestId('status-panel')).toBeVisible();
    await shot(page, v, text, '18-return-beat-1');
    await click(page, 'continue-g8-return-beat-1-continue');
    await expect(page.getByTestId('event-text')).toBeVisible();
    await click(page, 'continue-g8-return-beat-2-continue');
    await click(page, 'continue-g8-pickup-report-continue');
    expect(await node(page)).toBe('g8-relationship-response');
    await expect(page.getByTestId('applied')).toContainText('trust');
    await click(page, 'continue-g8-relationship-response-continue');
    await click(page, 'option-g8-adopt-provenance');
    // Post-flight: the earlier route keeps ALTERNATE HISTORY over the historical stance; the four astronauts are present as portrait and label (M01).
    expect(await node(page)).toBe('g8-accountability-brief');
    await withEvidence(page, async () => { await expect(page.getByTestId('evidence-g8-ev-postflight-context')).toBeVisible(); });
    await assertParticipants(page);
    await shot(page, v, text, '19a-accountability-brief-participants');
    await click(page, 'continue-g8-accountability-brief-continue');
    expect(await node(page)).toBe('g8-accountability-decision');
    await assertParticipants(page);
    await expect(page.getByTestId('badge-alt-history')).toBeVisible();
    await expect(page.getByTestId('badge-historical-choice')).toHaveCount(0);
    await shot(page, v, text, '19-postflight-decision');
    await click(page, 'option-g8-own-ground-contingencies');
    await expect(page.getByTestId('stamp-g8-own-ground-contingencies')).toHaveText('CHOSEN');
    await expect(page.getByTestId('narration')).toContainText('Response pending.');
    await click(page, 'continue-g8-resolve-accountability');
    await expect(page.getByTestId('event-text')).toBeVisible();
    await click(page, 'continue-g8-finish');
    // The resolution cards come first (M01); their own cases cover them. Skip to the debrief here.
    await expect(page.getByTestId('screen-resolution')).toHaveAttribute('data-card', 'result');
    await click(page, 'resolution-skip');
    // Debrief
    await expect(page.getByTestId('screen-debrief')).toBeVisible();
    await expect(page.getByTestId('to-resolution')).toBeVisible();
    await expect(page.getByTestId('outcome-title')).toContainText('Crew recovered');
    await expect(page.getByTestId('badge-alt-history')).toBeVisible();
    await expect(page.getByTestId('departures-from-record')).toBeVisible();
    await expect(page.getByTestId('departures-from-record')).toContainText('Return timing');
    await expect(page.getByTestId('postflight-panel')).toContainText('cleared Armstrong and Scott');
    await expect(page.getByTestId('event-record-toggle')).toHaveCount(0);
    expect(await page.locator('[data-testid="screen-debrief"] .notes').evaluateAll((els) => els.map((e) => e.textContent ?? '').join(' '))).not.toMatch(/g[89]-/);
    await shot(page, v, text, '20-debrief-departures');
    await click(page, 'to-planning');
    // Planning
    await expect(page.getByTestId('screen-planning')).toBeVisible();
    await expect(page.getByTestId('badge-alt-history')).toBeVisible();
    await expect(page.getByTestId('plan-g9-plan-systems-contact')).toHaveAttribute('data-enabled', 'false');
    await expect(page.getByTestId('select-g9-plan-systems-contact')).toBeDisabled();
    await expect(page.getByTestId('plan-reason-g9-plan-systems-contact')).toContainText('This mission must include');
    expect(await page.getByTestId('select-g9-plan-systems-contact').getAttribute('aria-describedby')).toBe('plan-reason-g9-plan-systems-contact');
    await expect(page.getByTestId('confirm-plan')).toBeDisabled();
    await click(page, 'select-g9-plan-recovery-contact');
    await expect(page.getByTestId('confirm-plan')).toBeEnabled();
    await shot(page, v, text, '21-gemini-9a-planning');
    await click(page, 'confirm-plan');
    await expect(page.getByTestId('committed-text')).toContainText('Preparation plan committed.');
    await expect(page.getByTestId('stamp-g9-plan-recovery-contact')).toHaveText('CHOSEN');
    await expect(page.getByTestId('plan-g9-plan-recovery-systems')).toHaveAttribute('data-state', 'closed');
    await expect(page.getByTestId('confirm-plan')).toBeDisabled();
    await assertNoHorizontalOverflow(page);
  });
}

// ---------------------------------------------------------------------------
// Later route: the historical timing keeps HISTORICAL CHOICE and never lights ALTERNATE HISTORY
// ---------------------------------------------------------------------------

for (const vp of VIEWPORTS) {
  test(`marker precedence on the later route: ${vp.name}`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await start(page, 'default');
    await click(page, 'continue-g8-brief-continue');
    await click(page, 'option-g8-prep-systems');
    await click(page, 'option-g8-prep-contact');
    await click(page, 'continue-g8-prep-finish');
    await click(page, 'continue-g8-docking-report-continue');
    await click(page, 'continue-g8-loss-of-contact-continue');
    await click(page, 'continue-g8-gap-note-continue');
    await click(page, 'continue-g8-crisis-report-continue');
    await click(page, 'continue-g8-stabilization-report-continue');
    await expect(page.getByTestId('badge-historical-choice')).toBeVisible();
    await click(page, 'option-g8-order-return');
    await expect(page.getByTestId('badge-historical-choice')).toBeVisible();
    await click(page, 'option-g8-return-later');
    expect(await node(page)).toBe('g8-order-receipt');
    await expect(page.getByTestId('stamp-g8-return-later')).toHaveText('ORDERED');
    await expect(page.getByTestId('badge-alt-history')).toHaveCount(0);
    await expect(page.getByTestId('badge-historical-choice')).toHaveCount(0);
    await click(page, 'continue-g8-execute-return');
    expect(await node(page)).toBe('g8-ground-execution');
    await expect(page.getByTestId('badge-alt-history')).toHaveCount(0);
    await shot(page, vp.name, 'default', '17b-execution-historical-timing');
    await click(page, 'continue-g8-ground-execution-continue');
    await click(page, 'continue-g8-return-beat-1-continue');
    await click(page, 'continue-g8-return-beat-2-continue');
    await click(page, 'continue-g8-pickup-report-continue');
    await click(page, 'continue-g8-relationship-response-continue');
    await click(page, 'option-g8-adopt-recovery');
    await click(page, 'continue-g8-accountability-brief-continue');
    expect(await node(page)).toBe('g8-accountability-decision');
    await expect(page.getByTestId('badge-historical-choice')).toBeVisible();
    await expect(page.getByTestId('badge-alt-history')).toHaveCount(0);
    await shot(page, vp.name, 'default', '19b-postflight-historical-choice');
    await click(page, 'option-g8-back-crew-criticism');
    await click(page, 'continue-g8-resolve-accountability');
    await click(page, 'continue-g8-finish');
    await expect(page.getByTestId('screen-resolution')).toBeVisible();
    await expect(page.getByTestId('badge-alt-history')).toHaveCount(0); // the card keeps the lamp's state: none on the later route
    await click(page, 'resolution-skip');
    await expect(page.getByTestId('screen-debrief')).toBeVisible();
    await expect(page.getByTestId('badge-alt-history')).toHaveCount(0);
    await expect(page.getByTestId('departures-from-record')).toContainText('as history did');
    await click(page, 'to-planning');
    await expect(page.getByTestId('badge-alt-history')).toHaveCount(0);
  });
}

// ---------------------------------------------------------------------------
// Access, motion, launches, audio, saves
// ---------------------------------------------------------------------------

test('keyboard reaches every stage of the opening, the menu, every card and lamp; focus never lands on a removed key', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await fakeFilm(page);
  await fresh(page, false);
  await page.keyboard.press('Tab');
  await expect(page.getByTestId('begin')).toBeFocused();
  await page.keyboard.press('Enter');
  expect(await stage(page)).toBe('film');
  await expect(page.getByTestId('film-skip')).toBeFocused(); // the film's controls are reachable while it plays
  await seekFilm(page, 138);
  await expect(page.getByTestId('screen-opening')).toHaveAttribute('data-stage', 'credits');
  await expect(page.getByTestId('stage-next')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('screen-opening')).toHaveAttribute('data-stage', 'title');
  await expect(page.getByTestId('screen-opening')).not.toHaveAttribute('data-fade', /.+/, { timeout: 5000 });
  await expect(page.getByTestId('hero-continue')).toBeFocused();
  await page.keyboard.press('Enter');
  expect(await stage(page)).toBe('menu');
  await expect(page.getByTestId('start-new')).toBeFocused();
  // Tab order on the menu skips the disabled CONTINUE and reaches LOAD and ABOUT.
  await page.keyboard.press('Tab');
  await expect(page.getByTestId('menu-load')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByTestId('menu-about')).toBeFocused();
  await page.getByTestId('start-new').focus();
  await page.keyboard.press('Enter');
  // The prologue from the keyboard (M01): Continue is focused on every plate; Enter walks the five beats and the scenario card into the room.
  await expect(page.getByTestId('screen-prologue')).toBeVisible();
  await expect(page.getByTestId('prologue-next')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByTestId('prologue-skip')).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  for (let i = 1; i <= 5; i++) {
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('screen-prologue')).toHaveAttribute('data-index', String(i));
  }
  await expect(page.getByTestId('prologue-enter')).toBeFocused();
  await page.keyboard.press('Enter');
  await awaitRoom(page);
  // Tab from the top reaches the Continue key and reveals focus.
  let reached = false;
  for (let i = 0; i < 40; i++) {
    await page.keyboard.press('Tab');
    const id = await page.evaluate(() => document.activeElement?.getAttribute('data-testid') ?? '');
    if (id === 'continue-g8-brief-continue') { reached = true; break; }
  }
  expect(reached).toBe(true);
  expect(await page.evaluate(() => document.activeElement?.matches(':focus-visible') ?? false)).toBe(true);
  expect(await page.evaluate(() => getComputedStyle(document.activeElement as Element).outlineStyle)).not.toBe('none');
  await page.keyboard.press('Enter');
  expect(await node(page)).toBe('g8-prep-select');
  // Open an overlay from the keyboard, close with Escape, focus returns to the opener.
  await page.getByTestId('open-history').focus();
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('overlay-history')).toBeVisible();
  await expect(page.getByTestId('alt-history-explanation')).toContainText('H6');
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('overlay-history')).toHaveCount(0);
  await expect(page.getByTestId('open-history')).toBeFocused();
  // A card's Choose key from the keyboard: the key goes away and focus moves to the next continuation.
  await page.getByTestId('option-g8-prep-contact').focus();
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('option-g8-prep-contact')).toHaveCount(0);
  await expect(page.getByTestId('continue-g8-prep-finish')).toBeFocused();
  // Details disclosure and the pin glyph are keyboard-reachable.
  await page.getByTestId('details-g8-prep-recovery').focus();
  await page.keyboard.press('Enter'); // Details starts open (M00c): Enter closes it, Enter again reopens it
  expect(await page.getByTestId('card-g8-prep-recovery').locator('details').evaluate((d) => (d as HTMLDetailsElement).open)).toBe(false);
  await page.keyboard.press('Enter');
  expect(await page.getByTestId('card-g8-prep-recovery').locator('details').evaluate((d) => (d as HTMLDetailsElement).open)).toBe(true);
  await withEvidence(page, async () => {
    await page.getByTestId('pin-g8-ev-contact-worksheet').focus();
    await expect(page.getByTestId('pin-hint')).toBeVisible();
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('pin-g8-ev-contact-worksheet')).toHaveAttribute('aria-pressed', 'true');
  });
  // The lamp is a button that opens History.
  await click(page, 'continue-g8-prep-finish');
  await click(page, 'continue-g8-docking-report-continue');
  await click(page, 'continue-g8-loss-of-contact-continue');
  await click(page, 'continue-g8-gap-note-continue');
  await click(page, 'continue-g8-crisis-report-continue');
  await click(page, 'continue-g8-stabilization-report-continue');
  // Keyboard focus (Shift+Tab from the first key after the lamp) shows the focus outline on the lamp; in the stacked layout the EVIDENCE key sits between.
  await page.getByTestId('open-binder').focus();
  await page.keyboard.press('Shift+Tab');
  if (await isStacked(page)) {
    await expect(page.getByTestId('open-evidence')).toBeFocused();
    await page.keyboard.press('Shift+Tab');
  }
  await expect(page.getByTestId('badge-historical-choice')).toBeFocused();
  expect(await page.evaluate(() => getComputedStyle(document.activeElement as Element).outlineStyle)).not.toBe('none');
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('overlay-history')).toBeVisible();
  await expect(page.getByTestId('lamp-explanation')).toContainText('HISTORICAL CHOICE');
});

test('reduced motion: no film, the static den and credits with Continue, immediate cuts, no animations', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await fakeFilm(page);
  await fresh(page, false);
  await click(page, 'begin');
  expect(await stage(page)).toBe('credits'); // no video under reduced motion: the wide den with the static credits
  await expect(page.getByTestId('film')).toHaveCount(0);
  await expect(page.getByTestId('op-scroll')).toHaveClass(/static/);
  await expect(page.getByTestId('scroll-toggle')).toHaveCount(0);
  await expect(page.getByTestId('op-prose')).toContainText('independent homage');
  const top = await page.getByTestId('op-scroll').evaluate((el) => el.scrollTop);
  await page.waitForTimeout(1500);
  expect(await page.getByTestId('op-scroll').evaluate((el) => el.scrollTop)).toBe(top);
  expect(await page.evaluate(() => document.getAnimations().length)).toBe(0); // no smoke, no flicker
  await click(page, 'stage-next');
  expect(await stage(page)).toBe('title'); // an immediate cut
  await expect(page.getByTestId('screen-opening')).not.toHaveAttribute('data-fade', /.+/);
  await click(page, 'hero-continue');
  expect(await stage(page)).toBe('menu');
  expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
  await click(page, 'start-new');
  // The prologue under reduced motion (M01): the static from composition, no animation, cuts between plates; Skip → the card → a cut into the room.
  await expect(page.getByTestId('screen-prologue')).toHaveAttribute('data-index', '0');
  expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
  expect(await page.getByTestId('prologue-layer').evaluate((el) => getComputedStyle(el).transform)).toBe('none');
  await click(page, 'prologue-next');
  await expect(page.getByTestId('screen-prologue')).toHaveAttribute('data-index', '1');
  await expect(page.locator('.pl-prev')).toHaveCount(0);
  expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
  await click(page, 'prologue-skip');
  await expect(page.getByTestId('screen-prologue')).toHaveAttribute('data-card', 'scenario');
  await click(page, 'prologue-enter');
  await expect(page.getByTestId('screen-console')).toBeVisible();
  await expect(page.getByTestId('room-dissolve')).toHaveCount(0); // a cut, never a dissolve
  await awaitRoom(page);
  expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
});

test('a second launch goes straight to the menu; Replay opening starts it again', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await fakeFilm(page);
  await fresh(page, false);
  expect(await stage(page)).toBe('start');
  await click(page, 'skip-to-menu');
  expect(await stage(page)).toBe('menu');
  await page.reload();
  await expect(page.getByTestId('screen-opening')).toHaveAttribute('data-stage', 'menu');
  await click(page, 'menu-about');
  await click(page, 'replay-opening');
  expect(await stage(page)).toBe('start');
  await click(page, 'begin');
  expect(await stage(page)).toBe('film');
  await click(page, 'skip-to-menu');
  expect(await stage(page)).toBe('menu');
});

test('the wall credits scroll on their own, pause, resume, and run out when the text has cleared', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await fakeFilm(page);
  await fresh(page, false);
  await click(page, 'begin');
  await seekFilm(page, 138);
  await expect(page.getByTestId('screen-opening')).toHaveAttribute('data-stage', 'credits');
  const box = page.getByTestId('op-scroll');
  const t0 = await box.evaluate((el) => el.scrollTop);
  await page.waitForTimeout(2400); // the scroll starts after the film's one-second blank
  const t1 = await box.evaluate((el) => el.scrollTop);
  expect(t1).toBeGreaterThan(t0);
  await click(page, 'scroll-toggle');
  const p0 = await box.evaluate((el) => el.scrollTop);
  await page.waitForTimeout(800);
  expect(await box.evaluate((el) => el.scrollTop)).toBe(p0);
  await click(page, 'scroll-toggle');
  await page.waitForTimeout(800);
  expect(await box.evaluate((el) => el.scrollTop)).toBeGreaterThan(p0);
  // Jump to the end: the last line has cleared; after the hold the run-out runs on its own — the beam dies, the den darkens, black — and the title dissolves in.
  await box.evaluate((el) => { el.scrollTop = el.scrollHeight; });
  await expect(page.getByTestId('screen-opening')).toHaveAttribute('data-runout', 'beam', { timeout: 5000 });
  await expect(page.getByTestId('screen-opening')).toHaveAttribute('data-runout', 'dark', { timeout: 5000 });
  await expect(page.getByTestId('screen-opening')).toHaveAttribute('data-stage', 'title', { timeout: 8000 });
  await expect(page.getByTestId('screen-opening')).toHaveAttribute('data-fade', 'in');
  await expect(page.getByTestId('screen-opening')).not.toHaveAttribute('data-fade', /.+/, { timeout: 5000 });
});

test('run-out timing under fake timers: 1.2 s hold, the beam 0.6 s, the den dark 1.5 s, black 0.5 s, the title in 0.7 s; Continue fades in 0.4 s', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await fakeFilm(page);
  await page.clock.install();
  await fresh(page, false);
  await page.clock.pauseAt(Date.now() + 1000); // from here the page's clock moves only when the test advances it
  const runout = async (): Promise<string> => (await page.getByTestId('screen-opening').getAttribute('data-runout')) ?? '';
  await click(page, 'begin');
  await seekFilm(page, 138);
  await expect(page.getByTestId('screen-opening')).toHaveAttribute('data-stage', 'credits');
  await page.clock.runFor(1100); // past the film's one-second blank: the scroll is driving
  const box = page.getByTestId('op-scroll');
  await box.evaluate((el) => { el.scrollTop = el.scrollHeight; });
  // The driver notices the end on its first fake frame (within the first ~32 ms); the timings below are measured from there.
  await page.clock.runFor(100);
  expect(await runout()).toBe('none');
  await page.clock.runFor(1050); // t ≈ 1.15 s: still holding
  expect(await runout()).toBe('none');
  await page.clock.runFor(100); // t ≈ 1.25 s: the 1.2 s hold is over, the beam is dying
  expect(await runout()).toBe('beam');
  expect(await stage(page)).toBe('credits');
  await page.clock.runFor(600); // t ≈ 1.85 s: the den is darkening
  expect(await runout()).toBe('dark');
  await page.clock.runFor(1500); // t ≈ 3.35 s: black
  expect(await runout()).toBe('black');
  await page.clock.runFor(500); // t ≈ 3.85 s: the title dissolving in over 0.7 s
  await expect(page.getByTestId('screen-opening')).toHaveAttribute('data-stage', 'title');
  await expect(page.getByTestId('screen-opening')).toHaveAttribute('data-fade', 'in');
  await expect(page.getByTestId('screen-opening')).toHaveClass(/den/);
  await page.clock.runFor(600); // t ≈ 4.45 s: still dissolving
  await expect(page.getByTestId('screen-opening')).toHaveAttribute('data-fade', 'in');
  await page.clock.runFor(150); // t ≈ 4.6 s: done
  await expect(page.getByTestId('screen-opening')).not.toHaveAttribute('data-fade', /.+/);
  // Continue from the credits: a quick fade (0.4 s out, 0.4 s in).
  await click(page, 'hero-continue');
  await click(page, 'menu-about');
  await click(page, 'replay-opening');
  await click(page, 'begin');
  await seekFilm(page, 138);
  await expect(page.getByTestId('screen-opening')).toHaveAttribute('data-stage', 'credits');
  await click(page, 'stage-next');
  await expect(page.getByTestId('screen-opening')).toHaveAttribute('data-fade', 'out');
  await expect(page.getByTestId('screen-opening')).toHaveClass(/quick/);
  await page.clock.runFor(350);
  expect(await stage(page)).toBe('credits');
  await page.clock.runFor(100);
  await expect(page.getByTestId('screen-opening')).toHaveAttribute('data-stage', 'title');
  await expect(page.getByTestId('screen-opening')).toHaveAttribute('data-fade', 'in');
  await page.clock.runFor(450);
  await expect(page.getByTestId('screen-opening')).not.toHaveAttribute('data-fade', /.+/);
});

test('the FULL SCREEN key is absent when the Fullscreen API is unavailable', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.addInitScript(() => { Object.defineProperty(document, 'fullscreenEnabled', { get: () => false }); });
  await fresh(page, true);
  await expect(page.getByTestId('fullscreen-line')).toBeVisible();
  await expect(page.getByTestId('fullscreen')).toHaveCount(0);
});

test('idle help: after 30 s the continuation key is highlighted; any input clears it; hints can be hidden and the setting persists; nothing under reduced motion', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.clock.install();
  await fresh(page, true);
  await page.clock.pauseAt(Date.now() + 1000);
  await toMenu(page);
  await click(page, 'start-new');
  await skipPrologue(page, true);
  expect(await node(page)).toBe('g8-brief');
  const key = page.getByTestId('continue-g8-brief-continue');
  await page.clock.runFor(29_000);
  await expect(key).not.toHaveClass(/idle-hint/);
  await page.clock.runFor(1_100);
  await expect(key).toHaveClass(/idle-hint/);
  expect(await page.evaluate(() => window.__fno!.idle())).toBe(true);
  await shot(page, '1920x1080', 'default', '22-idle-highlight');
  // Any input clears it (a key press repaints on the next frame, so the highlight never steals an Enter from the key).
  await page.keyboard.press('Shift');
  await page.clock.runFor(50);
  await expect(key).not.toHaveClass(/idle-hint/);
  expect(await page.evaluate(() => window.__fno!.idle())).toBe(false);
  // A decision screen with no hint text highlights nothing.
  await click(page, 'continue-g8-brief-continue');
  expect(await node(page)).toBe('g8-prep-select');
  await page.clock.runFor(31_000);
  expect(await page.evaluate(() => window.__fno!.idle())).toBe(true);
  await expect(page.locator('.idle-hint')).toHaveCount(0);
  await expect(page.getByTestId('hint-strip')).toHaveCount(0);
  // Never in the log.
  expect(await page.evaluate(() => JSON.stringify(window.__fno!.store.run!.log))).not.toMatch(/idle|hint/i);
  // HINTS: HIDE persists and disables the highlight.
  await click(page, 'open-settings');
  await expect(page.getByTestId('hints-toggle')).toHaveText('HINTS: SHOW');
  await click(page, 'hints-toggle');
  await expect(page.getByTestId('hints-toggle')).toHaveText('HINTS: HIDE');
  expect(await page.evaluate(() => localStorage.getItem('fno.hints'))).toBe('0');
  await click(page, 'close-overlay');
  await click(page, 'option-g8-prep-recovery');
  await page.clock.runFor(31_000);
  await expect(page.locator('.idle-hint')).toHaveCount(0);
  await page.reload();
  await expect(page.getByTestId('screen-opening')).toHaveAttribute('data-stage', 'menu');
  await click(page, 'open-settings');
  await expect(page.getByTestId('hints-toggle')).toHaveText('HINTS: HIDE');
});

test('idle help is absent under reduced motion', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.clock.install();
  await fresh(page, true);
  await page.clock.pauseAt(Date.now() + 1000);
  await toMenu(page);
  await click(page, 'start-new');
  await skipPrologue(page, true);
  await page.clock.runFor(31_000);
  await expect(page.locator('.idle-hint')).toHaveCount(0);
  expect(await page.evaluate(() => window.__fno!.idle())).toBe(false);
});

test('audio is silent until Begin, on after Begin, a persisted off stays off, and never enters the log', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await fakeFilm(page);
  await fresh(page, false);
  const audio = () => page.evaluate(() => ({ enabled: window.__fno!.audio.enabled(), unlocked: window.__fno!.audio.unlocked() }));
  expect(await audio()).toEqual({ enabled: false, unlocked: false });
  expect(await page.locator('audio, video').count()).toBe(0);
  await click(page, 'begin');
  expect(await audio()).toEqual({ enabled: true, unlocked: true }); // Begin is the player interaction: the master is on
  await expect(page.getByTestId('sound-toggle')).toHaveAttribute('aria-pressed', 'true');
  await click(page, 'skip-to-menu');
  await click(page, 'start-new');
  expect(await page.locator('audio, video').count()).toBe(0); // the prologue's music is Web Audio too
  await skipPrologue(page);
  await click(page, 'continue-g8-brief-continue');
  await click(page, 'option-g8-prep-recovery');
  const before = await page.evaluate(() => JSON.stringify(window.__fno!.store.run!.log));
  await click(page, 'open-settings');
  await expect(page.getByTestId('sound-toggle')).toHaveAttribute('aria-pressed', 'true');
  await page.getByTestId('volume-master').fill('40');
  await click(page, 'close-overlay');
  await click(page, 'continue-g8-prep-finish');
  await click(page, 'continue-g8-docking-report-continue');
  await click(page, 'continue-g8-loss-of-contact-continue');
  await click(page, 'continue-g8-gap-note-continue');
  expect(await node(page)).toBe('g8-crisis-report'); // the crisis cue and alert fire here, presentation only
  const after = await page.evaluate(() => JSON.stringify(window.__fno!.store.run!.log));
  expect(after.startsWith(before.slice(0, -1))).toBe(true);
  expect(after).not.toMatch(/audio|music|sound|cue|volume/i);
  expect(await page.locator('audio, video').count()).toBe(0);
  const prefs = await page.evaluate(() => JSON.parse(localStorage.getItem('fno.audio') ?? '{}') as { enabled: boolean; master: number });
  expect(prefs.enabled).toBe(true);
  expect(prefs.master).toBe(0.4);
  await page.reload();
  await expect(page.getByTestId('screen-opening')).toHaveAttribute('data-stage', 'menu');
  await expect(page.getByTestId('sound-toggle')).toHaveAttribute('aria-pressed', 'true');
  // The player turns it off: the setting persists and Begin no longer turns it on.
  await click(page, 'sound-toggle');
  await expect(page.getByTestId('sound-toggle')).toHaveAttribute('aria-pressed', 'false');
  await page.reload();
  await expect(page.getByTestId('sound-toggle')).toHaveAttribute('aria-pressed', 'false');
  await click(page, 'menu-about');
  await click(page, 'replay-opening');
  await click(page, 'begin');
  expect(await audio()).toEqual({ enabled: false, unlocked: true });
  await expect(page.getByTestId('sound-toggle')).toHaveAttribute('aria-pressed', 'false');
});

test('no voice, no timers, no forced flashing, no art outside the manifest', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await start(page, 'default');
  expect(await page.locator('audio, video').count()).toBe(0);
  const before = await node(page);
  await page.waitForTimeout(2500);
  expect(await node(page)).toBe(before);
  expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
  await assertManifestImagesOnly(page);
  await expect(page.getByTestId('emblem')).toHaveAttribute('aria-hidden', 'true');
});

test('every kit face keeps 4.5:1 with its ink at both text sizes', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await fresh(page, true);
  const table: Record<string, unknown> = {};
  for (const text of TEXT) {
    await setText(page, text);
    const rows = await kitFaceTable(page);
    for (const r of rows) expect(r.ratio, `${r.face} with ${r.ink} against ${r.worst}`).toBeGreaterThanOrEqual(4.5);
    table[text] = rows;
  }
  mkdirSync(ARTIFACTS, { recursive: true });
  writeFileSync(resolve(ARTIFACTS, 'contrast-kit-faces.json'), JSON.stringify(table, null, 1));
});

test('save/export/import round trip through the UI; a bad import is rejected and the session survives', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await start(page, 'default');
  await click(page, 'continue-g8-brief-continue');
  await click(page, 'option-g8-prep-recovery');
  await click(page, 'open-saveload');
  await click(page, 'save-browser');
  await expect(page.getByTestId('save-message')).toHaveText('Saved to this browser.');
  const [download] = await Promise.all([page.waitForEvent('download'), click(page, 'export')]);
  const path = await download.path();
  expect(path).toBeTruthy();
  // Corrupt import: wrong content version (the M00a build's).
  const text = await (await import('node:fs/promises')).readFile(path!, 'utf8');
  const bad = JSON.parse(text) as { identity: { content_version: string } };
  bad.identity.content_version = '0.4.0';
  await page.getByTestId('import-file').setInputFiles({ name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(bad)) });
  await expect(page.getByTestId('save-message')).toContainText('Import rejected');
  await expect(page.getByTestId('save-message')).toContainText('0.4.0');
  await click(page, 'close-overlay');
  expect(await node(page)).toBe('g8-prep-select');
  await expect(page.getByTestId('option-g8-prep-recovery')).toHaveCount(0);
  // Good import after playing further: state returns to the saved point.
  await click(page, 'option-g8-prep-contact');
  await click(page, 'continue-g8-prep-finish');
  expect(await node(page)).toBe('g8-docking-report');
  await click(page, 'open-saveload');
  await page.getByTestId('import-file').setInputFiles({ name: 'good.json', mimeType: 'application/json', buffer: Buffer.from(text) });
  await expect(page.getByTestId('overlay-saveload')).toHaveCount(0);
  await expect(page.getByTestId('screen-console')).toBeVisible();
  expect(await node(page)).toBe('g8-prep-select');
  await expect(page.getByTestId('option-g8-prep-contact')).toBeEnabled();
  // Browser slot load.
  await click(page, 'open-saveload');
  await click(page, 'load-browser');
  await expect(page.getByTestId('overlay-saveload')).toHaveCount(0);
  expect(await node(page)).toBe('g8-prep-select');
});
