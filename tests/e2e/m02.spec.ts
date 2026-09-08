/**
 * FNO-M02 browser cases (docs/00_HANDOFF-M02.md, Part 4):
 *  - content 0.5.3: Jim Lovell's label and portrait at each of his seven lines, the two new questions rendered and
 *    logged, the History Lovell note, the retired composite portrait absent;
 *  - the stacked layout at 1366×768 enlarged on every conversation screen and not at 1920×1080 default; the
 *    evidence overlay by keyboard with pinning; the status bar's keys on one row; the panel's dialogue room;
 *  - the tier meaning tooltip and strip; the six-line room at 1920×1080; the sound default on the play keys;
 *  - the replay byte-identical with the new questions asked, with stacked mode toggled by a resize mid-run and the
 *    overlay and the tooltip used.
 */
import { expect, test, type Page } from '@playwright/test';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MANIFEST_FILES, unhash } from './room';
import { assertVisibleWithinViewport, click, fresh, isStacked, node, playRoute, setText, shot, skipPrologue, start, toMenu, withEvidence } from './helpers';

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..', '..');
const registry = JSON.parse(readFileSync(resolve(ROOT, 'content', 'registry.json'), 'utf8')) as { labels: { capcom_history_note: string } };
const mission = JSON.parse(readFileSync(resolve(ROOT, 'content', 'mission-gemini-8.json'), 'utf8')) as { resolution_presentation: { tiers: { id: string; meaning: string }[] } };
const characters = (JSON.parse(readFileSync(resolve(ROOT, 'content', 'characters.json'), 'utf8')) as { characters: { id: string; display: string; portrait: string | null }[] }).characters;
const manifest = JSON.parse(readFileSync(resolve(ROOT, 'assets', 'manifest.json'), 'utf8')) as { assets: { id: string; filename: string }[] };
const file = (id: string): string => manifest.assets.find((a) => a.id === id)!.filename;
const basename = (src: string | null): string => unhash(decodeURIComponent((src ?? '').split('/').pop() ?? ''));
const LOVELL = characters.find((c) => c.id === 'g8-capcom')!;

/** Every CAPCOM line on screen: Lovell's label as the speaker, his neutral portrait from the manifest, and nothing that reads as provenance. */
async function lovellLines(page: Page): Promise<string[]> {
  const lines = page.locator('[data-testid="conversation"] .line[data-role="CAPCOM"]');
  const n = await lines.count();
  expect(n).toBeGreaterThan(0);
  const texts: string[] = [];
  for (let i = 0; i < n; i++) {
    const l = lines.nth(i);
    await expect(l.locator('.who')).toHaveText(LOVELL.display);
    expect(basename(await l.locator('img.portrait').getAttribute('src'))).toBe(file(LOVELL.portrait!));
    texts.push((await l.locator('.what').textContent()) ?? '');
  }
  const visible = (await page.getByTestId('conversation').textContent()) ?? '';
  for (const s of ['H7', 'PDF', 'paraphrase', 'quotation', 'procedural', 'transcript']) expect(visible).not.toContain(s);
  return texts;
}

async function canonical(page: Page): Promise<{ log: string; state: string }> {
  return page.evaluate(() => { const r = window.__fno!.store.run!; return { log: r.canonicalLog(), state: r.canonicalState() }; });
}

async function keysOnOneRow(page: Page): Promise<void> {
  const tops = await page.locator('[data-testid="status-keys"] .k').evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().top)));
  expect(tops.length).toBeGreaterThanOrEqual(5);
  expect(new Set(tops).size, `status keys on one row (tops ${tops.join(', ')})`).toBe(1);
}

// ---------------------------------------------------------------------------
// Content 0.5.3: Lovell
// ---------------------------------------------------------------------------

test('Jim Lovell is CAPCOM at every one of his seven lines; the two new questions render and log; History carries the Lovell note; the composite portrait is retired', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  expect(MANIFEST_FILES.has('fno_gemini_portrait_capcom_neutral_v001.png')).toBe(false);
  expect(existsSync(resolve(ROOT, 'assets', 'fno_gemini_portrait_capcom_neutral_v001.png'))).toBe(false);
  await start(page, 'default');
  await click(page, 'continue-g8-brief-continue');
  await click(page, 'option-g8-prep-recovery');
  await click(page, 'continue-g8-prep-finish');
  const seen = new Set<string>();
  const note = (texts: string[]) => { for (const t of texts) seen.add(t); };
  expect(await node(page)).toBe('g8-docking-report');
  note(await lovellLines(page));
  await click(page, 'continue-g8-docking-report-continue');
  await click(page, 'continue-g8-loss-of-contact-continue');
  expect(await node(page)).toBe('g8-gap-note');
  await click(page, 'question-g8-q-gap');
  note(await lovellLines(page));
  await click(page, 'continue-g8-gap-note-continue');
  expect(await node(page)).toBe('g8-crisis-report');
  await expect(page.getByTestId('question-g8-q-crew-crisis')).toBeVisible();
  await click(page, 'question-g8-q-crew-crisis');
  await expect(page.getByTestId('answer-g8-q-crew-crisis')).toContainText('RCS DIRECT');
  await expect(page.getByTestId('active-portrait')).toHaveAttribute('data-speaker', 'g8-capcom');
  note(await lovellLines(page));
  await shot(page, '1920x1080', 'default', '14b-lovell-crisis-line');
  await click(page, 'open-history');
  await expect(page.getByTestId('capcom-history-note')).toHaveText(registry.labels.capcom_history_note);
  await expect(page.getByTestId('overlay-history')).toContainText('H7');
  await shot(page, '1920x1080', 'default', '07c-history-lovell-note');
  await click(page, 'close-overlay');
  await click(page, 'continue-g8-crisis-report-continue');
  await click(page, 'continue-g8-stabilization-report-continue');
  await click(page, 'option-g8-order-return');
  expect(await node(page)).toBe('g8-return-brief');
  await expect(page.getByTestId('question-g8-q-crew-return')).toBeVisible();
  await click(page, 'question-g8-q-crew-return');
  await expect(page.getByTestId('answer-g8-q-crew-return')).toContainText('no crew request');
  note(await lovellLines(page));
  await click(page, 'option-g8-return-earlier');
  await click(page, 'continue-g8-execute-return');
  await click(page, 'continue-g8-ground-execution-continue');
  expect(await node(page)).toBe('g8-return-beat-1');
  note(await lovellLines(page));
  expect(seen.size).toBe(7);
  expect([...seen].some((t) => t.includes('relays Scott'))).toBe(true);
  // The questions are ordinary question inputs in the log.
  const questions = await page.evaluate(() => window.__fno!.store.run!.log.flatMap((e) => (e.type === 'input' && e.input.kind === 'question' ? [e.input.question] : [])));
  expect(questions).toEqual(['g8-q-gap', 'g8-q-crew-crisis', 'g8-q-crew-return']);
  await expect(page.locator('img[src*="capcom_neutral"]')).toHaveCount(0);
});

// ---------------------------------------------------------------------------
// Stacked layout
// ---------------------------------------------------------------------------

test('stacked layout at 1366×768 enlarged on every conversation screen: content-width panel, EVIDENCE key and overlay with pinning by keyboard, one-row status keys, the cards below', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await start(page, 'large');
  const check = async (): Promise<void> => {
    expect(await isStacked(page), `stacked at ${await node(page)}`).toBe(true);
    await expect(page.locator('aside.evidence')).toHaveCount(0);
    await expect(page.getByTestId('open-evidence')).toBeVisible();
    await keysOnOneRow(page);
    const geometry = await page.getByTestId('conversation').evaluate((el) => {
      const b = el.getBoundingClientRect();
      const body = el.querySelector('.conv-body')!.getBoundingClientRect();
      const lines = el.querySelector('.conv-lines')!.getBoundingClientRect();
      const lh = parseFloat(getComputedStyle(el.querySelector('.conv-lines')!).lineHeight);
      const plate = document.getElementById('plate')!.getBoundingClientRect();
      const w = 1920 * Math.max(plate.width / 1920, plate.height / 1080);
      return { left: b.left, right: b.right, height: b.height, dialogue: body.bottom - Math.max(body.top, lines.top), lh, glenRight: plate.left + (plate.width - w) / 2 + 0.25 * w, vh: innerHeight, vw: innerWidth };
    });
    expect(geometry.left).toBeGreaterThanOrEqual(geometry.glenRight - 1); // Glen's clear zone
    expect(geometry.right).toBeGreaterThan(geometry.vw * 0.9); // the content width, the evidence column gone
    expect(geometry.height).toBeLessThanOrEqual(geometry.vh * 0.55 + 2);
    if (await page.getByTestId('questions').count()) {
      expect(geometry.dialogue).toBeGreaterThanOrEqual(4 * geometry.lh);
      for (const q of await page.locator('[data-testid="questions"] .question').all()) await expect(q).toBeInViewport();
    }
  };
  const step = async (id: string): Promise<void> => { await click(page, id); await check(); };
  await check();
  await step('continue-g8-brief-continue');
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
  // The evidence overlay from the keyboard: Enter opens, a pin pins and keeps the overlay, Escape closes and returns focus.
  await page.getByTestId('open-evidence').focus();
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('overlay-evidence')).toBeVisible();
  await expect(page.getByTestId('overlay-evidence').locator('.ev-item')).toHaveCount(await page.evaluate(() => Object.keys(window.__fno!.store.run!.state.mission.evidence).length));
  await page.getByTestId('pin-g8-ev-reserve').focus();
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('pin-g8-ev-reserve')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('pin-g8-ev-reserve')).toBeFocused();
  await expect(page.getByTestId('overlay-evidence')).toBeVisible();
  expect(await page.getByTestId('overlay-evidence').locator('.ev-item').first().getAttribute('data-testid')).toBe('evidence-g8-ev-reserve');
  await shot(page, '1366x768', 'large', '24-evidence-overlay');
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('overlay-evidence')).toHaveCount(0);
  await expect(page.getByTestId('open-evidence')).toBeFocused();
  expect(await node(page)).toBe('g8-return-brief');
  // The cards sit below the panel; the page scrolls to them.
  await page.getByTestId('option-g8-return-earlier').scrollIntoViewIfNeeded();
  await expect(page.getByTestId('option-g8-return-earlier')).toBeInViewport();
  await assertVisibleWithinViewport(page, 'option-g8-return-later');
  await step('option-g8-return-earlier');
  await step('continue-g8-execute-return');
  await step('continue-g8-ground-execution-continue');
  await step('continue-g8-return-beat-1-continue');
  await step('continue-g8-return-beat-2-continue');
  await step('continue-g8-pickup-report-continue');
  await step('continue-g8-relationship-response-continue');
  await step('option-g8-adopt-provenance');
  await step('continue-g8-accountability-brief-continue');
  // Never persisted: nothing in storage; and at the default text size the same viewport stacks too, since the return decision's three question keys would starve the dialogue there as well.
  expect(await page.evaluate(() => Object.keys(localStorage).some((k) => /stack/i.test(k)))).toBe(false);
  await click(page, 'open-settings');
  await click(page, 'text-size');
  await click(page, 'close-overlay');
  expect(await isStacked(page)).toBe(true);
  await page.setViewportSize({ width: 1600, height: 900 });
  await expect.poll(() => isStacked(page)).toBe(false); // room enough for the dialogue: the column layout returns
  await page.setViewportSize({ width: 1366, height: 768 });
  await expect.poll(() => isStacked(page)).toBe(true);
});

test('the column layout at 1920×1080 default on every conversation screen, with at least six lines of dialogue above the pinned questions', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await start(page, 'default');
  const check = async (): Promise<void> => {
    expect(await isStacked(page), `columns at ${await node(page)}`).toBe(false);
    await expect(page.locator('aside.evidence')).toHaveCount(1);
    await expect(page.getByTestId('open-evidence')).toHaveCount(0);
    await expect(page.getByTestId('open-saveload')).toHaveText('SAVE / LOAD');
  };
  const step = async (id: string): Promise<void> => { await click(page, id); await check(); };
  await check();
  await step('continue-g8-brief-continue');
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
  // The return decision with every answer asked: the answers are in the scrolling body in the order asked, the footer holds the keys alone (in a row), and the dialogue area shows at least six lines of text and three whole speaker tiles before scrolling.
  const m = await page.getByTestId('conversation').evaluate((el) => {
    const body = el.querySelector('.conv-body')!.getBoundingClientRect();
    const lines = el.querySelector('.conv-lines')!;
    const l = lines.getBoundingClientRect();
    const lh = parseFloat(getComputedStyle(lines).lineHeight);
    const tiles = Array.from(lines.querySelectorAll('.line'));
    const whole = tiles.filter((t) => { const r = t.getBoundingClientRect(); return r.top >= body.top - 1 && r.bottom <= body.bottom + 1; }).length;
    const answers = Array.from(lines.querySelectorAll('.answer')).map((a) => a.getAttribute('data-testid'));
    const keys = Array.from(el.querySelectorAll('.conv-questions .question')).map((q) => Math.round(q.getBoundingClientRect().top));
    return { dialogue: body.bottom - Math.max(body.top, l.top), lh, tiles: tiles.length, whole, answers, footerAnswers: el.querySelectorAll('.conv-questions .answer').length, keyRows: new Set(keys).size };
  });
  expect(m.tiles).toBe(6);
  expect(m.answers).toEqual(['answer-g8-q-recovery-risk', 'answer-g8-q-reserve-risk', 'answer-g8-q-crew-return']);
  expect(m.footerAnswers).toBe(0);
  expect(m.keyRows).toBe(1);
  expect(m.dialogue).toBeGreaterThanOrEqual(6 * m.lh);
  expect(m.whole).toBeGreaterThanOrEqual(3);
  const active = (await page.getByTestId('active-portrait').locator('img').boundingBox())!.height;
  const thumb = (await page.locator('[data-testid="conversation"] .line img.portrait').first().boundingBox())!.height;
  expect(active).toBeGreaterThan(thumb * 1.5);
  await shot(page, '1920x1080', 'default', '15b-return-decision-answers');
});

// ---------------------------------------------------------------------------
// Tier meaning, sound default, Save / Load hint
// ---------------------------------------------------------------------------

test('the tier meaning: a title on the tier word, the ⓘ key opens the paper strip, Escape and the key close it, keyboard-reachable, nothing in the log', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await start(page, 'default');
  await playRoute(page, { prep: ['contact', 'recovery'], route: 'earlier', stance: 'ground' });
  const meaning = mission.resolution_presentation.tiers.find((t) => t.id === 'SUCCESS')!.meaning;
  await expect(page.getByTestId('resolution-tier')).toHaveAttribute('title', meaning);
  const before = await canonical(page);
  await expect(page.getByTestId('tier-meaning')).toHaveCount(0);
  await expect(page.getByTestId('tier-info-toggle')).toHaveAttribute('aria-expanded', 'false');
  await click(page, 'tier-info-toggle');
  await expect(page.getByTestId('tier-meaning')).toHaveText(meaning);
  await expect(page.getByTestId('tier-info-toggle')).toHaveAttribute('aria-expanded', 'true');
  await shot(page, '1920x1080', 'default', '44-tier-meaning');
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('tier-meaning')).toHaveCount(0);
  await expect(page.getByTestId('tier-info-toggle')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('tier-meaning')).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('tier-meaning')).toHaveCount(0);
  expect(await canonical(page)).toEqual(before);
  await click(page, 'tier-info-toggle');
  await click(page, 'resolution-next');
  await expect(page.getByTestId('screen-resolution')).toHaveAttribute('data-card', 'relationships');
  await expect(page.getByTestId('tier-meaning')).toHaveCount(0);
});

test('the sound is on after the first play gesture: Begin, or the menu keys of a returning player; a persisted off stays off on the prologue and the resolution screens', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  // A returning player (the opening already seen): NEW CAMPAIGN is the gesture.
  await fresh(page, true);
  await expect(page.getByTestId('sound-toggle')).toHaveAttribute('aria-pressed', 'false');
  await click(page, 'start-new');
  await expect(page.getByTestId('screen-prologue')).toBeVisible();
  await expect(page.getByTestId('sound-toggle')).toHaveAttribute('aria-pressed', 'true');
  await skipPrologue(page);
  await playRoute(page, { prep: ['contact', 'recovery'], route: 'earlier', stance: 'ground' });
  await expect(page.getByTestId('sound-toggle')).toHaveAttribute('aria-pressed', 'true');
  // Begin is the gesture on a first launch.
  await fresh(page, false);
  await click(page, 'begin');
  await click(page, 'skip-to-menu');
  await click(page, 'start-new');
  await expect(page.getByTestId('sound-toggle')).toHaveAttribute('aria-pressed', 'true');
  // Turned on and then off on the menu (an explicit, persisted setting), it stays off through the prologue and the cards.
  await fresh(page, true);
  await click(page, 'sound-toggle');
  await expect(page.getByTestId('sound-toggle')).toHaveAttribute('aria-pressed', 'true');
  await click(page, 'sound-toggle');
  await expect(page.getByTestId('sound-toggle')).toHaveAttribute('aria-pressed', 'false');
  expect(await page.evaluate(() => (JSON.parse(localStorage.getItem('fno.audio') ?? '{}') as { enabled?: boolean }).enabled)).toBe(false);
  await click(page, 'start-new');
  await expect(page.getByTestId('screen-prologue')).toBeVisible();
  await expect(page.getByTestId('sound-toggle')).toHaveAttribute('aria-pressed', 'false');
  await skipPrologue(page);
  await playRoute(page, { prep: [], route: 'later', stance: 'blame' });
  await expect(page.getByTestId('sound-toggle')).toHaveAttribute('aria-pressed', 'false');
});

test('the Save / Load panel says the new campaign plays the mission briefing', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await fresh(page, true);
  await toMenu(page);
  await click(page, 'menu-load');
  await expect(page.getByTestId('new-campaign-hint')).toHaveText('(plays the mission briefing)');
  expect(await page.getByTestId('new-campaign').getAttribute('aria-describedby')).toBe('new-campaign-hint');
  await shot(page, '1366x768', 'default', '25-saveload-new-campaign-hint');
});

// ---------------------------------------------------------------------------
// Replay identity
// ---------------------------------------------------------------------------

test('the replay is byte-identical with the new questions asked, with the layout toggled by a resize and a text-size change mid-run, the evidence overlay and the tooltip used', async ({ page }) => {
  const route = { prep: ['recovery'] as ['recovery'], route: 'earlier' as const, stance: 'blame' as const, questions: true };
  const finish = async (): Promise<void> => {
    await click(page, 'to-planning');
    await click(page, 'select-g9-plan-recovery-contact');
    await click(page, 'confirm-plan');
    await expect(page.getByTestId('committed-text')).toContainText('Preparation plan committed.');
  };
  // A: every presentation state exercised.
  await page.setViewportSize({ width: 1920, height: 1080 });
  await start(page, 'default');
  await click(page, 'continue-g8-brief-continue');
  await click(page, 'option-g8-prep-recovery');
  await click(page, 'continue-g8-prep-finish');
  await click(page, 'continue-g8-docking-report-continue');
  await click(page, 'continue-g8-loss-of-contact-continue');
  await click(page, 'question-g8-q-gap');
  await click(page, 'continue-g8-gap-note-continue');
  await click(page, 'question-g8-q-crew-crisis');
  await click(page, 'continue-g8-crisis-report-continue');
  await click(page, 'continue-g8-stabilization-report-continue');
  await click(page, 'option-g8-order-return');
  for (const q of ['g8-q-recovery-risk', 'g8-q-reserve-risk', 'g8-q-crew-return']) await click(page, `question-${q}`);
  expect(await isStacked(page)).toBe(false);
  await page.setViewportSize({ width: 1366, height: 768 });
  await click(page, 'open-settings');
  await click(page, 'text-size');
  await click(page, 'close-overlay');
  await expect.poll(() => isStacked(page)).toBe(true);
  await withEvidence(page, async () => { await click(page, 'pin-g8-ev-reserve'); await expect(page.getByTestId('pin-g8-ev-reserve')).toHaveAttribute('aria-pressed', 'true'); });
  await page.setViewportSize({ width: 1920, height: 1080 });
  await expect.poll(() => isStacked(page)).toBe(false);
  await click(page, 'open-settings');
  await click(page, 'text-size');
  await click(page, 'close-overlay');
  await click(page, 'option-g8-return-earlier');
  await click(page, 'continue-g8-execute-return');
  await click(page, 'continue-g8-ground-execution-continue');
  await click(page, 'continue-g8-return-beat-1-continue');
  await click(page, 'continue-g8-return-beat-2-continue');
  await click(page, 'continue-g8-pickup-report-continue');
  await click(page, 'continue-g8-relationship-response-continue');
  await click(page, 'option-g8-adopt-provenance');
  await click(page, 'continue-g8-accountability-brief-continue');
  await click(page, 'option-g8-back-crew-criticism');
  await click(page, 'continue-g8-resolve-accountability');
  await click(page, 'continue-g8-finish');
  await expect(page.getByTestId('screen-resolution')).toBeVisible();
  await click(page, 'tier-info-toggle');
  await expect(page.getByTestId('tier-meaning')).toBeVisible();
  await click(page, 'resolution-next');
  await click(page, 'resolution-next');
  await expect(page.getByTestId('screen-debrief')).toBeVisible();
  await finish();
  const a = await canonical(page);
  // B: the same inputs, nothing else.
  await start(page, 'default');
  await playRoute(page, route);
  await click(page, 'resolution-skip');
  await finish();
  const b = await canonical(page);
  expect(a.log).toBe(b.log);
  expect(a.state).toBe(b.state);
  expect(a.log).toMatch(/g8-q-crew-crisis/);
  expect(a.log).toMatch(/g8-q-crew-return/);
  expect(a.log).not.toMatch(/stacked|overlay|evidence-panel|tier-info|tooltip|meaning/i);
});
