/**
 * FNO-HOTFIX-01 — the phone-width layout (doc 47 §2 C–D; Codex's live-site findings FNO-LIVE-01, clipped dialogue, and
 * FNO-LIVE-02, the toolbar overflowing). At 320, 390 and 430 px, default and enlarged text, every screen is walked:
 * the menu and its overlays, the opening's static credits, the prologue plates and the scenario card, every
 * conversation and decision of a full route (with Glen's questions asked, the evidence overlay, the Binder and the
 * History), the resolution cards, the debrief, the IX-A planning, the demo-complete screen after the committed plan
 * (FNO-DEMO-END) and the menu after it. On each screen: no element's right edge beyond
 * the viewport, no text clipped by its box or by an overflow ancestor, the toolbar keys inside the viewport and at
 * least 40 px tall, the mode lamp visible, the status text on a row of its own. The contrast samplers run at 390 too.
 * Every screen is photographed; the per-screen result goes to artifacts/phone-sweep/<viewport>-<text>.json.
 */
import { expect, test, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ARTIFACTS, TEXT, assertVisibleWithinViewport, awaitRoom, click, fakeFilm, fresh, node, setText, shotPath, stage, toMenu, type TextSize } from './helpers';
import { PLATE_TEXT_SAMPLES, TEXT_SAMPLES, assertKitContrast, assertTextContrast } from './room';

export const PHONES = [
  { name: 'phone-320', width: 320, height: 844 },
  { name: 'phone-390', width: 390, height: 844 },
  { name: 'phone-430', width: 430, height: 932 },
] as const;

/** Everything doc 47 §2 D asks of a phone screen, as a list of findings (empty when the screen is right). */
async function measurePhone(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const issues: string[] = [];
    const name = (el: Element): string => `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\s+/).slice(0, 3).join('.') : ''}${el.getAttribute('data-testid') ? `[${el.getAttribute('data-testid')}]` : ''}`;
    // The artwork is allowed past the edges: the room plate under object-fit: cover, the design-frame scenes and layers, the hero lockup.
    const decorative = (el: Element): boolean => !!el.closest('.room-layer, .hero-title, .hero-overlay, .pl-scene, .film-frame, .den-frame > img, .den-dark, .res-overlay > .res-head + *:not(.res-copy)');
    if (document.documentElement.scrollWidth > vw + 1) issues.push(`the document scrolls horizontally: scrollWidth ${document.documentElement.scrollWidth} > ${vw}`);
    for (const el of Array.from(document.querySelectorAll<HTMLElement>('#app *'))) {
      if (decorative(el)) continue;
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden' || cs.display === 'contents') continue;
      const b = el.getBoundingClientRect();
      if (b.width === 0 || b.height === 0) continue;
      if (b.right > vw + 1) issues.push(`${name(el)}: right edge ${Math.round(b.right)} px is past the viewport (${vw} px)`);
      if (b.left < -1) issues.push(`${name(el)}: left edge ${Math.round(b.left)} px is off the viewport`);
      const ownText = Array.from(el.childNodes).some((n) => n.nodeType === Node.TEXT_NODE && (n.textContent ?? '').trim().length > 0);
      if (!ownText) continue;
      if (el.clientWidth > 0 && el.scrollWidth > el.clientWidth + 1) issues.push(`${name(el)}: text wider than its box (${el.scrollWidth} > ${el.clientWidth} px) — "${(el.textContent ?? '').trim().slice(0, 40)}"`);
      for (let anc = el.parentElement; anc && anc !== document.body; anc = anc.parentElement) {
        const a = getComputedStyle(anc);
        if (a.overflowX === 'visible' && a.overflowY === 'visible') continue;
        const ab = anc.getBoundingClientRect();
        if (b.right > ab.right + 1 || b.left < ab.left - 1) issues.push(`${name(el)} [${Math.round(b.left)}–${Math.round(b.right)}] is clipped by ${name(anc)} [${Math.round(ab.left)}–${Math.round(ab.right)}] — "${(el.textContent ?? '').trim().slice(0, 40)}"`);
      }
    }
    for (const k of Array.from(document.querySelectorAll<HTMLElement>('[data-testid="status-keys"] .k'))) {
      const b = k.getBoundingClientRect();
      const label = (k.textContent ?? '').trim();
      if (b.right > vw + 1 || b.left < -1) issues.push(`toolbar key ${label}: outside the viewport (${Math.round(b.left)}–${Math.round(b.right)} px)`);
      if (b.height < 40) issues.push(`toolbar key ${label}: ${Math.round(b.height)} px tall, under the 40 px touch height`);
    }
    const lamp = document.querySelector<HTMLElement>('[data-testid="status-bar"] .lamp');
    if (lamp) {
      const b = lamp.getBoundingClientRect();
      if (b.width === 0 || b.height === 0 || b.right > vw + 1 || b.left < -1) issues.push(`the mode lamp "${(lamp.textContent ?? '').trim()}" is not visible inside the viewport`);
    }
    const left = document.querySelector<HTMLElement>('[data-testid="status-bar"] .status-left');
    if (left) {
      const b = left.getBoundingClientRect();
      if (b.width < vw * 0.5) issues.push(`the status text has ${Math.round(b.width)} px of a ${vw} px viewport (needs a row of its own)`);
    }
    return Array.from(new Set(issues));
  });
}

test.describe('the phone-width layout (FNO-HOTFIX-01)', () => {
  for (const vp of PHONES) {
    for (const text of TEXT) {
      test(`${vp.name} ${text} text: every screen fits, nothing is clipped, the toolbar wraps`, async ({ page }) => {
        test.setTimeout(240_000);
        await page.setViewportSize({ width: vp.width, height: vp.height });
        const report: Record<string, string[]> = {};
        let n = 0;
        const screen = async (label: string): Promise<string[]> => {
          n += 1;
          const issues = await measurePhone(page);
          report[label] = issues;
          await page.screenshot({ path: shotPath(vp.name, text, `${String(n).padStart(2, '0')}-${label}`), fullPage: false });
          return issues;
        };
        const contrast = vp.width === 390;
        /** Finite animations and transitions done (a plate's fade-in, a key's transition) — the den's smoke loops are left running. */
        const settled = async (): Promise<void> => {
          await page.evaluate(() => Promise.race([
            Promise.all(document.getAnimations().filter((a) => Number.isFinite((a.effect?.getComputedTiming().activeDuration ?? Infinity) as number)).map((a) => a.finished.catch(() => undefined))),
            new Promise((r) => setTimeout(r, 1200)),
          ]));
        };

        // The opening's static credits (Skip during the film), then the menu and its overlays.
        await fakeFilm(page);
        await fresh(page, false);
        await expect(page.getByTestId('sound-toggle')).toHaveAttribute('aria-pressed', 'true'); // sound on before any gesture (R1)
        await click(page, 'begin');
        await click(page, 'film-skip');
        await expect(page.getByTestId('screen-opening')).toHaveAttribute('data-credits', 'static');
        await expect.poll(() => page.getByTestId('den-plate').evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
        await settled();
        await screen('opening-static-credits');
        await click(page, 'skip-to-menu');
        expect(await stage(page)).toBe('menu');
        await setText(page, text as TextSize); // the menu's own TEXT SIZE key (the Settings overlay carries a second one)
        await click(page, 'open-settings');
        await screen('settings');
        await click(page, 'close-overlay');
        await screen('menu');
        for (const [id, label] of [['menu-about', 'about'], ['menu-load', 'save-load']] as const) {
          await click(page, id);
          await screen(label);
          await click(page, 'close-overlay');
        }

        // The prologue: five plates and the scenario card, then the room.
        await click(page, 'start-new');
        await expect(page.getByTestId('screen-prologue')).toBeVisible();
        for (let i = 1; i <= 5; i += 1) {
          await expect(page.getByTestId('prologue-next')).toBeVisible();
          await settled();
          await screen(`prologue-${i}`);
          if (contrast) await assertTextContrast(page, PLATE_TEXT_SAMPLES);
          await click(page, 'prologue-next');
        }
        await expect(page.getByTestId('screen-prologue')).toHaveAttribute('data-card', 'scenario');
        await settled();
        await screen('scenario-card');
        await click(page, 'prologue-enter');
        await awaitRoom(page);

        // Every conversation and decision of a route, with the questions asked; the overlays from the toolbar.
        const roomChecks = async (label: string): Promise<void> => {
          await screen(label);
          if (contrast) { await assertTextContrast(page, TEXT_SAMPLES); await assertKitContrast(page); }
        };
        const step = async (id: string): Promise<void> => {
          await click(page, id);
          await roomChecks(await node(page));
        };
        expect(await node(page)).toBe('g8-brief');
        await roomChecks('g8-brief');
        for (const [id, label] of [['open-binder', 'binder'], ['open-history', 'history'], ['open-saveload', 'save-load-console'], ['open-settings', 'settings-console']] as const) {
          await click(page, id);
          await screen(label);
          await click(page, 'close-overlay');
        }
        if (await page.getByTestId('open-evidence').count()) {
          await click(page, 'open-evidence');
          await screen('evidence-overlay');
          await click(page, 'close-overlay');
        }
        await step('continue-g8-brief-continue');
        await step('option-g8-prep-contact');
        await step('option-g8-prep-recovery');
        await step('continue-g8-prep-finish');
        await step('continue-g8-docking-report-continue');
        await step('continue-g8-loss-of-contact-continue');
        await step('question-g8-q-gap');
        await step('continue-g8-gap-note-continue');
        await step('question-g8-q-crew-crisis');
        await step('continue-g8-crisis-report-continue');
        await step('continue-g8-stabilization-report-continue');
        await step('option-g8-order-return');
        for (const q of ['g8-q-recovery-risk', 'g8-q-reserve-risk', 'g8-q-crew-return']) await step(`question-${q}`);
        // FNO-LIVE-01: Return Planning with the active portrait and three answers — every word of every line visible.
        await expect(page.getByTestId('active-portrait')).toBeVisible();
        expect(report[await node(page)], 'Return Planning (FNO-LIVE-01)').toEqual([]);
        if (await page.getByTestId('open-evidence').count()) {
          await click(page, 'open-evidence');
          await screen('evidence-overlay-return');
          await click(page, 'close-overlay');
        }
        await step('option-g8-return-earlier');
        await step('continue-g8-execute-return');
        await step('continue-g8-ground-execution-continue');
        await step('continue-g8-return-beat-1-continue');
        await step('continue-g8-return-beat-2-continue');
        await step('continue-g8-pickup-report-continue');
        await step('continue-g8-relationship-response-continue');
        await step('option-g8-adopt-provenance');
        await expect(page.getByTestId('participants')).toBeVisible(); // the criticism scene with the four astronauts' headshots
        await step('continue-g8-accountability-brief-continue');
        await step('option-g8-own-ground-contingencies');
        await step('continue-g8-resolve-accountability');
        await click(page, 'continue-g8-finish');

        // The resolution cards, the debrief, the IX-A planning.
        await expect(page.getByTestId('screen-resolution')).toBeVisible();
        for (let i = 0; i < 4 && (await page.getByTestId('screen-resolution').count()); i += 1) {
          const card = await page.getByTestId('screen-resolution').getAttribute('data-card');
          await screen(`resolution-${card}`);
          if (contrast) await assertTextContrast(page, PLATE_TEXT_SAMPLES);
          await click(page, 'resolution-next');
        }
        await expect(page.getByTestId('screen-debrief')).toBeVisible();
        await screen('debrief');
        await click(page, 'to-planning');
        await expect(page.getByTestId('screen-planning')).toBeVisible();
        await screen('planning');

        // The committed plan, then the demo-complete screen (FNO-DEMO-END): the card as the paper sheet below the picture, the keys wrapping; PLAY AGAIN to the menu, where CONTINUE says the campaign is complete.
        const plan = (await page.locator('[data-testid^="plan-g9"][data-enabled="true"]').first().getAttribute('data-testid'))!.replace(/^plan-/, '');
        await click(page, `select-${plan}`);
        await click(page, 'confirm-plan');
        await expect(page.getByTestId('committed-text')).toBeVisible();
        await screen('planning-committed');
        await click(page, 'to-demo-end');
        await expect(page.getByTestId('screen-demo-end')).toBeVisible();
        await settled();
        await screen('demo-complete');
        if (contrast) { await assertTextContrast(page, ['.de-heading', '.de-line']); await assertKitContrast(page); }
        for (const id of ['demo-end-card', 'follow-itch', 'exit-home', 'play-again']) await assertVisibleWithinViewport(page, id);
        await click(page, 'play-again');
        expect(await stage(page)).toBe('menu');
        await expect(page.getByTestId('continue-reason')).toContainText('This campaign is complete.');
        await screen('menu-campaign-complete');

        // The report, then the verdict: the briefing, Return Planning, the criticism scene and a resolution card first (doc 47 §2 D), then everything.
        const dir = resolve(ARTIFACTS, 'phone-sweep');
        mkdirSync(dir, { recursive: true });
        writeFileSync(resolve(dir, `${vp.name}-${text}.json`), JSON.stringify({ viewport: vp, text, screens: report }, null, 2) + '\n');
        for (const key of ['g8-brief', 'g8-return-brief', 'g8-accountability-brief', 'resolution-result', 'demo-complete']) expect(report[key], key).toEqual([]);
        const failing = Object.entries(report).filter(([, v]) => v.length > 0);
        expect(failing, `${failing.length} screen(s) with findings`).toEqual([]);
      });
    }
  }
});
