/**
 * FNO-DEMO-END — the demo-complete screen after the committed Gemini IX-A plan.
 *  - both return routes reach it; the copy; the keys resolve (FOLLOW ON ITCH.IO → the itch.io page in a new tab with
 *    noopener noreferrer, EXIT TO FINAOGAME.COM → the site's home page in the same tab, the primary key, PLAY AGAIN → the
 *    menu with NEW CAMPAIGN available); nothing enters the log;
 *  - reaching it marks the campaign complete: the browser slot holds the finished campaign, the menu's CONTINUE says so
 *    and offers New Campaign / Load, LOAD from the browser still opens the planning screen, export is still offered;
 *  - keyboard order Follow, Exit, Play again; Escape does nothing;
 *  - the replay is byte-identical whether the screen is visited (and the campaign reloaded from the slot) or not;
 *  - the home page's coming-soon block and About carry the itch.io link.
 * Screenshots at 1920 default, 1366 enlarged and 390 (the phone walk in phone.spec.ts photographs it too).
 */
import { expect, test, type Page } from '@playwright/test';
import { click, fresh, playRoute, shot, shotPath, stage, start, toMenu, type RouteSpec } from './helpers';
import { assertKitContrast, assertTextContrast } from './room';

const ITCH = 'https://danleeodinson.itch.io/failure-is-not-an-option';
const HOME = 'https://finaogame.com/';
const COMPLETE = 'This campaign is complete. New Campaign starts another; Load imports a save file.';
const SLOT = 'fno.save.v1';

/** From the resolution cards to the committed plan: the debrief, the planning screen, the first enabled plan, Commit. */
async function commitPlan(page: Page): Promise<string> {
  await expect(page.getByTestId('screen-resolution')).toBeVisible();
  for (let i = 0; i < 4 && (await page.getByTestId('screen-resolution').count()); i += 1) await click(page, 'resolution-next');
  await expect(page.getByTestId('screen-debrief')).toBeVisible();
  await click(page, 'to-planning');
  await expect(page.getByTestId('screen-planning')).toBeVisible();
  await expect(page.getByTestId('to-demo-end')).toHaveCount(0); // no Continue before the plan is committed
  const plan = (await page.locator('[data-testid^="plan-g9"][data-enabled="true"]').first().getAttribute('data-testid'))!.replace(/^plan-/, '');
  await click(page, `select-${plan}`);
  await click(page, 'confirm-plan');
  await expect(page.getByTestId('committed-text')).toContainText('Preparation plan committed.');
  await expect(page.getByTestId('to-demo-end')).toBeVisible();
  return plan;
}

/** The screen's 0.45 s fade-in (and any other finite animation) done, so a screenshot shows the screen as it settles. */
async function settled(page: Page): Promise<void> {
  await page.evaluate(() => Promise.race([
    Promise.all(document.getAnimations().filter((a) => Number.isFinite((a.effect?.getComputedTiming().activeDuration ?? Infinity) as number)).map((a) => a.finished.catch(() => undefined))),
    new Promise((r) => setTimeout(r, 1200)),
  ]));
}

async function canonical(page: Page): Promise<{ log: string; state: string; inputs: number }> {
  return page.evaluate(() => { const r = window.__fno!.store.run!; return { log: r.canonicalLog(), state: r.canonicalState(), inputs: r.identity.inputs.length }; });
}

/** The screen as specified: the heading, the three lines, the three keys with their targets, in order, on screen, readable. */
async function assertDemoEnd(page: Page): Promise<void> {
  await expect(page.getByTestId('screen-demo-end')).toBeVisible();
  await expect(page.getByTestId('demo-end-heading')).toHaveText('DEMO COMPLETE');
  await expect(page.getByTestId('demo-end-line-1')).toHaveText('Thank you for flying Gemini VIII with us.');
  await expect(page.getByTestId('demo-end-line-2')).toHaveText('Failure is Not an Option is in development. The full game is coming.');
  await expect(page.getByTestId('demo-end-line-3')).toHaveText('Follow the game on itch.io for updates.');
  const follow = page.getByTestId('follow-itch');
  await expect(follow).toHaveText('FOLLOW ON ITCH.IO');
  await expect(follow).toHaveAttribute('href', ITCH);
  await expect(follow).toHaveAttribute('target', '_blank');
  await expect(follow).toHaveAttribute('rel', 'noopener noreferrer');
  const exit = page.getByTestId('exit-home');
  await expect(exit).toHaveText('EXIT TO FINAOGAME.COM');
  await expect(exit).toHaveAttribute('href', HOME);
  expect(await exit.getAttribute('target')).toBeNull(); // the same tab: the exit button
  await expect(exit).toHaveClass(/\bk-key\b/); // the primary (raised) key
  await expect(page.getByTestId('play-again')).toHaveText('PLAY AGAIN');
  const boxes = await Promise.all(['follow-itch', 'exit-home', 'play-again'].map((id) => page.getByTestId(id).boundingBox()));
  for (const b of boxes) { expect(b).not.toBeNull(); expect(b!.height).toBeGreaterThanOrEqual(40); }
  expect(boxes[0]!.x <= boxes[1]!.x || boxes[0]!.y < boxes[1]!.y).toBe(true); // Follow before Exit, Exit before Play again
  expect(boxes[1]!.x <= boxes[2]!.x || boxes[1]!.y < boxes[2]!.y).toBe(true);
  expect(await page.evaluate(() => window.__fno!.complete())).toBe(true);
  await assertTextContrast(page, ['.de-heading', '.de-line']);
  await assertKitContrast(page);
}

const CASES = [
  { route: 'earlier', vp: { width: 1920, height: 1080 }, name: '1920x1080', text: 'default' },
  { route: 'later', vp: { width: 1366, height: 768 }, name: '1366x768', text: 'large' },
  { route: 'earlier', vp: { width: 390, height: 844 }, name: 'phone-390', text: 'default' },
] as const;

for (const c of CASES) {
  test(`the ${c.route} route reaches the demo-complete screen at ${c.name} ${c.text}; the keys resolve; the campaign is complete on the menu; Load still opens the planning screen`, async ({ page }) => {
    await page.setViewportSize(c.vp);
    await start(page, c.text);
    await playRoute(page, { prep: ['recovery'], route: c.route, stance: 'ground' });
    const plan = await commitPlan(page);
    await click(page, 'to-demo-end');
    await assertDemoEnd(page);
    await settled(page);
    await shot(page, c.name, c.text, '60-demo-complete');
    // Arrival wrote the browser slot: the finished campaign, its last input the committed plan; the log carries nothing of the screen.
    const slot = await page.evaluate((k) => localStorage.getItem(k), SLOT);
    expect(slot).not.toBeNull();
    const saved = JSON.parse(slot!) as { identity: { inputs: { kind: string; id?: string; plan?: string }[] } };
    expect(saved.identity.inputs.at(-1)).toEqual({ kind: 'confirm_plan', id: 'g9-confirm-plan', plan });
    const here = await canonical(page);
    expect(here.log).not.toMatch(/demo-end|play-again|itch/i);
    // PLAY AGAIN: the menu, where CONTINUE says the campaign is complete and NEW CAMPAIGN / LOAD are offered.
    await click(page, 'play-again');
    expect(await stage(page)).toBe('menu');
    await expect(page.getByTestId('start-load')).toBeDisabled();
    await expect(page.getByTestId('continue-reason')).toHaveText(COMPLETE);
    await expect(page.getByTestId('start-new')).toBeEnabled();
    await expect(page.getByTestId('menu-load')).toBeEnabled();
    await settled(page);
    await shot(page, c.name, c.text, '61-menu-campaign-complete');
    // LOAD: export still offered; the slot opens the planning screen (the debrief reachable), with its CONTINUE back to the screen.
    await click(page, 'menu-load');
    await expect(page.getByTestId('export')).toBeEnabled();
    await click(page, 'load-browser');
    await expect(page.getByTestId('screen-planning')).toBeVisible();
    await expect(page.getByTestId('committed-text')).toBeVisible();
    await expect(page.getByTestId('to-demo-end')).toBeVisible();
    expect((await canonical(page)).log).toBe(here.log);
    await click(page, 'open-saveload');
    await expect(page.getByTestId('export')).toBeEnabled();
    await click(page, 'close-overlay');
    await click(page, 'to-demo-end');
    await expect(page.getByTestId('screen-demo-end')).toBeVisible();
    // A later launch opens on the menu with the same answer.
    await page.reload();
    await toMenu(page);
    await expect(page.getByTestId('start-load')).toBeDisabled();
    await expect(page.getByTestId('continue-reason')).toHaveText(COMPLETE);
  });
}

test('keyboard: focus lands on EXIT, the order is Follow, Exit, Play again, Escape does nothing, Enter on PLAY AGAIN reaches the menu', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await start(page, 'default');
  await playRoute(page, { prep: ['contact'], route: 'earlier', stance: 'blame' });
  await commitPlan(page);
  await page.getByTestId('to-demo-end').focus();
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('screen-demo-end')).toBeVisible();
  const focused = (): Promise<string | null> => page.evaluate(() => document.activeElement?.getAttribute('data-testid') ?? null);
  expect(await focused()).toBe('exit-home');
  await page.keyboard.press('Shift+Tab');
  expect(await focused()).toBe('follow-itch');
  await page.keyboard.press('Tab');
  expect(await focused()).toBe('exit-home');
  await page.keyboard.press('Tab');
  expect(await focused()).toBe('play-again');
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('screen-demo-end')).toBeVisible();
  expect(await focused()).toBe('play-again');
  // From the card (not focusable), the tab order runs Follow, Exit, Play again, then the sound control.
  await page.getByTestId('demo-end-heading').click();
  const order: string[] = [];
  for (let i = 0; i < 4; i += 1) { await page.keyboard.press('Tab'); order.push((await focused()) ?? ''); }
  expect(order).toEqual(['follow-itch', 'exit-home', 'play-again', 'sound-toggle']);
  await expect(page.getByTestId('screen-demo-end')).toBeVisible();
  await page.getByTestId('play-again').focus();
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('menu')).toBeVisible();
  await expect(page.getByTestId('start-new')).toBeEnabled();
  await expect(page.getByTestId('start-new')).toBeFocused();
});

test('the replay is byte-identical whether the demo-complete screen is visited and the campaign reloaded from the slot, or not', async ({ page }) => {
  const route: RouteSpec = { prep: ['recovery'], route: 'later', stance: 'ground', questions: true };
  await page.setViewportSize({ width: 1920, height: 1080 });
  // A: the screen visited, PLAY AGAIN, the campaign reloaded from the slot the arrival wrote.
  await start(page, 'default');
  await playRoute(page, route);
  const plan = await commitPlan(page);
  await click(page, 'to-demo-end');
  await expect(page.getByTestId('screen-demo-end')).toBeVisible();
  const atScreen = await canonical(page);
  await click(page, 'play-again');
  await click(page, 'menu-load');
  await click(page, 'load-browser');
  await expect(page.getByTestId('screen-planning')).toBeVisible();
  const a = await canonical(page);
  // B: the same inputs, the plan committed, nothing else.
  await start(page, 'default');
  await playRoute(page, route);
  expect(await commitPlan(page)).toBe(plan);
  const b = await canonical(page);
  expect(atScreen.log).toBe(b.log);
  expect(a.log).toBe(b.log);
  expect(a.state).toBe(b.state);
  expect(a.inputs).toBe(b.inputs);
  expect(a.log).not.toMatch(/demo-end|play-again|itch/i);
});

test('the home page carries the itch.io link in the coming-soon block, and About carries it under HOME', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto('/');
  const follow = page.locator('.coming-soon a[data-follow="itch"]');
  await expect(follow).toHaveAttribute('href', ITCH);
  await expect(follow).toContainText('Follow on itch.io');
  await expect(page.locator('.coming-soon a[href="./demo/"]')).toHaveCount(1); // the block's own link stays
  await follow.scrollIntoViewIfNeeded();
  await page.screenshot({ path: shotPath('site', 'laptop-1366', 'coming-soon-itch'), fullPage: false });
  await fresh(page, true);
  await toMenu(page);
  await click(page, 'menu-about');
  const about = page.getByTestId('about-itch');
  await expect(about).toHaveText('FOLLOW ON ITCH.IO');
  await expect(about).toHaveAttribute('href', ITCH);
  await expect(about).toHaveAttribute('target', '_blank');
  await expect(about).toHaveAttribute('rel', 'noopener noreferrer');
  const home = (await page.getByTestId('home-link').boundingBox())!;
  const itch = (await about.boundingBox())!;
  expect(itch.x > home.x || itch.y > home.y).toBe(true); // after HOME
  await settled(page);
  await shot(page, '1366x768', 'default', '62-about-itch');
});
