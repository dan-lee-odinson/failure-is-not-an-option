/**
 * App bootstrap and store. The store holds the run (domain) and UI-only state
 * (opening stage, overlays, pins, text size, audio preferences, hints). UI
 * state never touches the run; every domain change goes through
 * run.apply(input). Audio, theme, text size, overlays and pins never enter
 * the ledger, the log, a save, or the replay.
 */
import { Run, describeNode, indexContent, type Input } from '../core';
import { bundle } from './content-bundle';
import { DESIGN, esc, render } from './render';
import { describeResolution } from './resolution';
import { exportFilename, exportText, hasBrowserSave, importFromText, loadFromBrowser, saveToBrowser } from './storage';
import { layoutEmblem } from './plate';
import { applyTheme } from './theme';
import { AudioDirector, type MusicMap, type SoundscapeMap } from './audio';
import { audioUrl } from './assets';
import { DEFAULT_AUDIO, PREF_KEYS, STAGES, defaultUi, screenId, type AudioPrefs, type Overlay, type Stage, type Store, type UiState } from './ui-state';
export { FULLSCREEN_LINE } from './render';
import musicMap from './music-map.json';
import soundscapeMap from './soundscape-map.json';

export type { Store, UiState, Screen, Overlay, Stage } from './ui-state';

// ---------------------------------------------------------------------------
// Per-player preferences (presentation only; never part of a save)
// ---------------------------------------------------------------------------

function readPref(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}
function writePref(key: string, value: string): void {
  try { localStorage.setItem(key, value); } catch { /* storage unavailable: preferences simply do not persist */ }
}
function readAudioPrefs(): AudioPrefs {
  const raw = readPref(PREF_KEYS.audio);
  if (!raw) return { ...DEFAULT_AUDIO };
  try {
    const p = JSON.parse(raw) as Partial<AudioPrefs>;
    const num = (v: unknown, d: number) => (typeof v === 'number' && v >= 0 && v <= 1 ? v : d);
    return { enabled: p.enabled === true, master: num(p.master, DEFAULT_AUDIO.master), music: num(p.music, DEFAULT_AUDIO.music), effects: num(p.effects, DEFAULT_AUDIO.effects), beds: num(p.beds, DEFAULT_AUDIO.beds) };
  } catch {
    return { ...DEFAULT_AUDIO };
  }
}

const content = indexContent(bundle);
const openingSeen = readPref(PREF_KEYS.openingSeen) === '1';
/** The player has made a sound setting (persisted); otherwise Begin turns the master on (playtest 2, note 1). */
let audioPersisted = readPref(PREF_KEYS.audio) !== null;
const reducedMotionQuery = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null;

const store: Store = {
  content,
  run: null,
  ui: defaultUi({
    screen: 'opening',
    stage: openingSeen ? 'menu' : 'start',
    textSize: readPref(PREF_KEYS.textSize) === 'large' ? 'large' : 'default',
    pinHintSeen: readPref(PREF_KEYS.pinHint) === '1',
    audio: readAudioPrefs(),
    openingSeen,
    hasBrowserSave: hasBrowserSave(),
    reducedMotion: reducedMotionQuery?.matches ?? false,
    debug: /(^|[?&])debug(=|&|$)/.test(location.search),
    hints: readPref(PREF_KEYS.hints) !== '0',
  }),
};

const director = new AudioDirector(musicMap as MusicMap, soundscapeMap as SoundscapeMap, audioUrl);
director.stillReading = () => store.ui.screen === 'opening' && (store.ui.stage === 'dedication' || store.ui.stage === 'notices');
director.setPrefs(store.ui.audio);

function announce(text: string): void {
  const live = document.getElementById('live');
  if (live) live.textContent = text;
}

// ---------------------------------------------------------------------------
// Domain
// ---------------------------------------------------------------------------

function applyInput(input: Input): void {
  const run = store.run;
  if (!run) return;
  const r = run.apply(input);
  if (!r.ok) {
    store.ui.message = `Input rejected: ${r.message}`;
    announce(store.ui.message);
    return;
  }
  store.ui.message = null;
  if (run.state.mission.completed && store.ui.screen === 'console') {
    // The outcome and every relationship effect are recorded; the resolution cards read them and change nothing.
    if (describeResolution(content, run)) {
      store.ui.screen = 'resolution';
      store.ui.resolution = 'result';
      announce('Mission closed. Recovery result.');
    } else {
      store.ui.screen = 'debrief';
      announce('Mission closed. Debrief.');
    }
  }
  if (input.kind === 'confirm_plan') {
    store.ui.highlightPlan = null;
    announce('Preparation plan committed.');
  }
}

function currentNodeId(): string | null {
  return store.run?.currentNode()?.node.id ?? null;
}

function activateRun(run: Run, viaLoad: boolean): void {
  store.run = run;
  store.ui.pinned = [];
  store.ui.open = [];
  store.ui.details = {};
  store.ui.highlightPlan = null;
  store.ui.message = null;
  store.ui.overlay = null;
  if (run.state.mission.completed) {
    store.ui.screen = run.state.followon.committed || viaLoad ? 'planning' : 'debrief';
    // A loaded completed save lands on the planning screen; the debrief stays reachable.
    if (viaLoad && !run.state.followon.committed) store.ui.screen = 'debrief';
  } else {
    store.ui.screen = 'console';
  }
}

/** NEW CAMPAIGN (or the Save / Load panel's new campaign): the prologue runs once, between the menu and the first console screen. Continue and Load resume a run without it. */
function startNewCampaign(): void {
  activateRun(new Run(content, { seed: 1 }), false);
  if (content.mission.prologue) {
    store.ui.screen = 'prologue';
    store.ui.prologue = { index: 0, prev: null, prevProgress: 0 };
  }
}

// ---------------------------------------------------------------------------
// Prologue and resolution stages (FNO-M01): player-paced plates; presentation only, never in the log
// ---------------------------------------------------------------------------

/** Crossfade between plates, and the dissolve of the scenario card into the room (treatment 28 §3). */
const CROSSFADE_MS = 450;
const DISSOLVE_MS = 700;
/** Under reduced motion the room is a cut; a short guard still keeps a repeated press from reaching the console. */
const CUT_GUARD_MS = 300;
let plateTimer: ReturnType<typeof setTimeout> | null = null;
let dissolveTimer: ReturnType<typeof setTimeout> | null = null;
/** Until this time (Date.now()) input controls are ignored: the press that entered the room cannot also reach a console key. */
let guardUntil = 0;

/** The moving layer's animation on the plate now on screen: which plate, and how far its motion has played (ms). */
function layerState(): { plate: string | null; time: number; seconds: number } {
  const main = document.querySelector<HTMLElement>('.screen-prologue');
  const el = main?.querySelector<HTMLElement>('.pl-current .pl-layer');
  const anim = el?.getAnimations()[0];
  const t = anim?.currentTime;
  return { plate: main?.dataset.plate ?? null, time: typeof t === 'number' ? t : 0, seconds: Number(el?.dataset.seconds) || 0 };
}

function goToPlate(index: number): void {
  const ui = store.ui;
  const count = (content.mission.prologue?.plates.length ?? 0) + 1;
  const next = Math.max(0, Math.min(count - 1, index));
  const prev = ui.screen === 'prologue' && !ui.reducedMotion && next !== ui.prologue.index ? ui.prologue.index : null;
  const s = layerState();
  const progress = prev === null || s.seconds <= 0 ? 0 : Math.min(1, s.time / (s.seconds * 1000));
  ui.screen = 'prologue';
  ui.prologue = { index: next, prev, prevProgress: progress };
  if (plateTimer) { clearTimeout(plateTimer); plateTimer = null; }
  if (prev !== null) {
    plateTimer = setTimeout(() => {
      plateTimer = null;
      if (store.ui.screen === 'prologue') { store.ui.prologue = { ...store.ui.prologue, prev: null, prevProgress: 0 }; paint(); }
    }, CROSSFADE_MS);
  }
}

/** The scenario card's Continue enters the console once: the room paints at once, the card dissolves over it, and inputs are guarded meanwhile. */
function enterRoom(): void {
  const ui = store.ui;
  if (ui.screen !== 'prologue') return;
  if (plateTimer) { clearTimeout(plateTimer); plateTimer = null; }
  ui.prologue = { index: ui.prologue.index, prev: null, prevProgress: 0 };
  ui.screen = 'console';
  ui.dissolve = !ui.reducedMotion;
  guardUntil = Date.now() + (ui.reducedMotion ? CUT_GUARD_MS : DISSOLVE_MS);
  if (dissolveTimer) clearTimeout(dissolveTimer);
  dissolveTimer = setTimeout(() => {
    dissolveTimer = null;
    if (store.ui.dissolve) { store.ui.dissolve = false; paint(); }
  }, DISSOLVE_MS);
  announce('Mission preparation.');
}

function toDebrief(): void {
  store.ui.screen = 'debrief';
  store.ui.tierInfo = false;
  announce('Debrief.');
}

// ---------------------------------------------------------------------------
// Stacked play layout (M02, Part 2): presentation only, never persisted
// ---------------------------------------------------------------------------

/** The dialogue area must show at least this many lines of body text; otherwise the layout stacks. */
const STACK_MIN_LINES = 4;
/** The viewport, text size and node the current stacked decision was made for; a change re-evaluates from the column layout. */
let stackedKey = '';

/** The heaviest conversation screen the content can produce: the longest scene title and header label, and the largest set of Glen's questions. */
const PROBE = ((): { title: string; label: string; questions: string[] } => {
  let title = '';
  let label = '';
  let questions: string[] = [];
  for (const { node } of content.nodes.values()) {
    if ((node.type === 'briefing' || node.type === 'decision' || node.type === 'event') && (node.title ?? '').length > title.length) title = node.title ?? '';
    if ((node.type === 'briefing' || node.type === 'decision') && (node.header_label ?? '').length > label.length) label = node.header_label ?? '';
    if ((node.type === 'briefing' || node.type === 'decision') && (node.questions?.length ?? 0) > questions.length) questions = (node.questions ?? []).map((q) => q.text);
  }
  return { title, label, questions };
})();

/**
 * In the column layout as painted, with this viewport and text size: would the conversation panel's dialogue area be
 * shorter than four lines of body text on the heaviest screen? Measured with a hidden probe panel in the real
 * stylesheet — the card strip at its CSS maximum, the panel's head, the active portrait where the stylesheet stacks it
 * above the lines, and the largest question set pinned in the footer — so the answer depends only on the viewport and
 * the text size, never on the node, and the layout never flips between screens within a session.
 */
function dialogueStarves(root: HTMLElement): boolean {
  const stage = root.querySelector<HTMLElement>('.stage');
  const strip = root.querySelector<HTMLElement>('.strip');
  const status = root.querySelector<HTMLElement>('.status-bar');
  if (!stage || !strip || !status) return false;
  const stripMax = parseFloat(getComputedStyle(strip).maxHeight) || strip.getBoundingClientRect().height;
  const stageWorst = innerHeight - status.getBoundingClientRect().height - stripMax;
  const probe = document.createElement('section');
  probe.className = 'conversation panel';
  probe.setAttribute('aria-hidden', 'true');
  probe.style.visibility = 'hidden';
  probe.style.pointerEvents = 'none';
  probe.innerHTML = `<div class="conv-head"><div class="scene-title">${esc(PROBE.title)}</div><div class="header-label">${esc(PROBE.label)}</div></div>`
    + `<div class="conv-body with-portrait"><figure class="active-portrait"><img alt="" /><figcaption class="who">x</figcaption></figure><div class="conv-lines"><div class="line no-speaker"><div><div class="what">x</div></div></div></div></div>`
    + (PROBE.questions.length ? `<div class="conv-questions"><div class="questions">${PROBE.questions.map((q) => `<button type="button" class="question paper" tabindex="-1">${esc(q)}</button>`).join('')}</div></div>` : '');
  stage.appendChild(probe);
  try {
    const inset = parseFloat(getComputedStyle(probe).top) || 0;
    const height = Math.max(0, stageWorst - 2 * inset);
    probe.style.maxHeight = `${height}px`;
    probe.style.height = `${height}px`;
    const body = probe.querySelector<HTMLElement>('.conv-body')!;
    const lines = probe.querySelector<HTMLElement>('.conv-lines')!;
    const b = body.getBoundingClientRect();
    const l = lines.getBoundingClientRect();
    const cs = getComputedStyle(lines);
    const lineHeight = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.45;
    return b.bottom - Math.max(b.top, l.top) < STACK_MIN_LINES * lineHeight;
  } finally {
    probe.remove();
  }
}

/** Decide the layout for this viewport and text size from the column layout, once; paint again only if it changes. */
function evaluateStacked(root: HTMLElement): void {
  const ui = store.ui;
  const key = ui.screen === 'console' ? `${innerWidth}x${innerHeight}|${ui.textSize}` : '';
  if (key === stackedKey) return;
  stackedKey = key;
  if (!key) { ui.stacked = false; return; }
  ui.stacked = false;
  root.innerHTML = render(store);
  ui.stacked = dialogueStarves(root);
}

let paintFrame = 0;
function schedulePaint(): void {
  if (paintFrame) return;
  paintFrame = requestAnimationFrame(() => { paintFrame = 0; paint(); });
}

/**
 * Move the plate's layer once, linearly, by (to − from) in frame pixels over its seconds, then hold (fill forwards).
 * A repaint of the same plate resumes at the time the previous animation had reached; a new plate starts at zero;
 * a resize rescales the remaining motion from the same point. Nothing here under reduced motion: the layer stays at
 * its `from` composition, which the renderer placed.
 */
function driveLayer(before: { plate: string | null; time: number }): void {
  if (store.ui.screen !== 'prologue' || store.ui.reducedMotion) return;
  const main = document.querySelector<HTMLElement>('.screen-prologue');
  const el = main?.querySelector<HTMLElement>('.pl-current .pl-layer[data-dx]');
  if (!main || !el || typeof el.animate !== 'function') return;
  for (const a of el.getAnimations()) a.cancel();
  const frame = el.closest<HTMLElement>('.pl-frame');
  const scale = (frame?.clientWidth || DESIGN.width) / DESIGN.width;
  const dx = Number(el.dataset.dx) * scale;
  const dy = Number(el.dataset.dy) * scale;
  const duration = Math.max(1, Number(el.dataset.seconds) || 0) * 1000;
  const anim = el.animate([{ transform: 'translate(0px, 0px)' }, { transform: `translate(${dx}px, ${dy}px)` }], { duration, easing: 'linear', fill: 'forwards' });
  anim.currentTime = before.plate === main.dataset.plate ? Math.min(duration, before.time) : 0;
}

/** Whether CONTINUE on the menu can resume the browser slot, with the visible reason when it cannot. */
function refreshContinueSave(): void {
  store.ui.hasBrowserSave = hasBrowserSave();
  if (!store.ui.hasBrowserSave) { store.ui.continueSave = { ok: false, reason: 'No saved campaign in this browser yet. New Campaign starts one; Load imports a file.' }; return; }
  const r = loadFromBrowser(content);
  store.ui.continueSave = r.ok ? { ok: true } : { ok: false, reason: `The saved campaign cannot be resumed: ${r.message}` };
}

function downloadText(filename: string, text: string): void {
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ---------------------------------------------------------------------------
// Opening stages
// ---------------------------------------------------------------------------

function markOpeningSeen(): void {
  store.ui.openingSeen = true;
  writePref(PREF_KEYS.openingSeen, '1');
}

function goToStage(stage: Stage): void {
  store.ui.screen = 'opening';
  store.ui.stage = stage;
  store.ui.scrollPaused = false;
  if (stage !== 'title') clearFade();
  if (stage === 'menu') { markOpeningSeen(); refreshContinueSave(); }
}

// The prose → title transition: a fade to black, then the title fading in; quick when the player pressed Continue; a cut under reduced motion.
let fadeTimer: ReturnType<typeof setTimeout> | null = null;

function clearFade(): void {
  if (fadeTimer) { clearTimeout(fadeTimer); fadeTimer = null; }
  store.ui.fade = null;
  store.ui.fadeQuick = false;
}

function fadeToTitle(quick: boolean): void {
  stopProseScroll();
  if (store.ui.reducedMotion) { goToStage('title'); return; }
  if (fadeTimer) clearTimeout(fadeTimer);
  store.ui.fade = 'out';
  store.ui.fadeQuick = quick;
  paint();
  fadeTimer = setTimeout(() => {
    goToStage('title');
    store.ui.fade = 'in';
    store.ui.fadeQuick = quick;
    paint();
    fadeTimer = setTimeout(() => { fadeTimer = null; store.ui.fade = null; store.ui.fadeQuick = false; paint(); }, quick ? 400 : 1500);
  }, quick ? 400 : 1000);
}

function nextStage(): void {
  const s = store.ui.stage;
  if (s === 'dedication') {
    if (store.ui.reducedMotion) goToStage('notices'); // two static pages
    else fadeToTitle(true); // the notices are in the same column; Continue cuts to the title with a quick fade
    return;
  }
  if (s === 'notices') { goToStage('title'); return; } // the montage slot is a 0-duration pass-through
  const i = STAGES.indexOf(s);
  goToStage(STAGES[Math.min(i + 1, STAGES.length - 1)]!);
}

function persistAudio(): void {
  audioPersisted = true;
  writePref(PREF_KEYS.audio, JSON.stringify(store.ui.audio));
  director.setPrefs(store.ui.audio);
}

/**
 * Begin (or Skip) is the explicit player interaction: the master goes on unless the player has already set it (playtest 2,
 * note 1). The menu's play keys (New Campaign, Continue, Load, Import) count too (M02): a returning player who never
 * pressed Begin on this browser gets the same default; a persisted setting always wins.
 */
function audioOnAtBegin(): void {
  director.unlock();
  if (!audioPersisted && !store.ui.audio.enabled) {
    store.ui.audio = { ...store.ui.audio, enabled: true };
    persistAudio();
  }
}

// Full screen (playtest 2, note 6): a menu key; hidden when the API is unavailable or refuses.
let fullscreenRefused = false;

function fullscreenState(): UiState['fullscreen'] {
  if (fullscreenRefused || typeof document === 'undefined' || !document.fullscreenEnabled || typeof document.documentElement.requestFullscreen !== 'function') return 'unavailable';
  return document.fullscreenElement ? 'active' : 'available';
}

// Idle help (playtest 2, note 8): 30 s without an input highlights the continuation; presentation only, never logged.
const IDLE_MS = 30_000;
let idleTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleIdle(): void {
  if (idleTimer) clearTimeout(idleTimer);
  idleTimer = null;
  if (!store.ui.hints || store.ui.reducedMotion || store.ui.idle) return;
  idleTimer = setTimeout(() => {
    idleTimer = null;
    if (store.ui.overlay || store.ui.idle) return;
    store.ui.idle = true;
    paint();
  }, IDLE_MS);
}

/** The highlight was cleared by a pointer press whose click may not repaint (empty space): the click handler repaints then. */
let idleDirty = false;

/** Any input clears the highlight; the next paint (or a deferred one for inputs that cause none) removes it from the screen. */
function noteInput(repaintIfIdle: boolean): void {
  const wasIdle = store.ui.idle;
  store.ui.idle = false;
  if (idleTimer) { clearTimeout(idleTimer); idleTimer = null; }
  if (wasIdle && repaintIfIdle) requestAnimationFrame(() => { if (!store.ui.idle) paint(); });
  else if (wasIdle) idleDirty = true;
  else scheduleIdle();
}

// ---------------------------------------------------------------------------
// Dispatch
// ---------------------------------------------------------------------------

export function dispatch(action: string, arg?: string): void {
  const ui = store.ui;
  switch (action) {
    case 'begin': {
      audioOnAtBegin();
      director.event('ui:begin');
      goToStage('dedication');
      break;
    }
    case 'skip-to-menu': {
      audioOnAtBegin();
      director.signal('skip-to-menu');
      goToStage('menu');
      break;
    }
    case 'fullscreen-toggle': {
      director.event('ui:settings-change');
      if (document.fullscreenElement) void document.exitFullscreen?.().catch(() => undefined);
      else document.documentElement.requestFullscreen?.().catch(() => { fullscreenRefused = true; paint(); });
      break;
    }
    case 'hints-toggle': {
      ui.hints = !ui.hints;
      writePref(PREF_KEYS.hints, ui.hints ? '1' : '0');
      director.event('ui:settings-change');
      break;
    }
    case 'stage-next': {
      director.event('ui:continue');
      nextStage();
      break;
    }
    case 'scroll-toggle': {
      ui.scrollPaused = !ui.scrollPaused;
      break;
    }
    case 'replay-opening': {
      ui.overlay = null;
      ui.idle = false;
      goToStage('start');
      break;
    }
    case 'sound-toggle': {
      ui.audio = { ...ui.audio, enabled: !ui.audio.enabled };
      if (ui.audio.enabled) director.unlock();
      persistAudio();
      director.event('ui:settings-change');
      break;
    }
    case 'volume-change': {
      persistAudio();
      director.event('ui:volume-change');
      break;
    }
    case 'start-new': {
      audioOnAtBegin();
      director.signal('start-new');
      director.event('ui:menu-select');
      startNewCampaign();
      break;
    }
    case 'tier-info-toggle': {
      if (ui.screen !== 'resolution') break;
      ui.tierInfo = !ui.tierInfo;
      director.event('ui:menu-select');
      break;
    }
    case 'prologue-next': {
      director.event('ui:continue');
      const plates = content.mission.prologue?.plates.length ?? 0;
      if (ui.prologue.index >= plates) enterRoom();
      else goToPlate(ui.prologue.index + 1);
      break;
    }
    case 'prologue-skip': {
      director.event('ui:continue');
      goToPlate(content.mission.prologue?.plates.length ?? 0);
      break;
    }
    case 'prologue-enter': {
      director.event('ui:continue');
      enterRoom();
      break;
    }
    case 'resolution-next': {
      if (ui.screen !== 'resolution' || !store.run) break;
      director.event('ui:continue');
      const v = describeResolution(content, store.run);
      if (ui.resolution === 'result' && v && v.people.length) ui.resolution = 'relationships';
      else toDebrief();
      break;
    }
    case 'resolution-skip': {
      if (ui.screen !== 'resolution' || !store.run) break;
      director.event('ui:continue');
      toDebrief();
      break;
    }
    case 'to-resolution': {
      if (store.run && describeResolution(content, store.run)) { ui.screen = 'resolution'; ui.resolution = 'result'; ui.tierInfo = false; }
      break;
    }
    case 'start-load': {
      audioOnAtBegin();
      director.signal('start-load');
      director.event('ui:menu-select');
      const r = loadFromBrowser(content);
      if (r.ok) { activateRun(r.run, true); ui.saveMessage = 'Save loaded.'; }
      else { ui.message = r.message; ui.saveMessage = r.message; }
      announce(ui.saveMessage ?? '');
      break;
    }
    case 'continue': {
      const node = currentNodeId();
      if (node && arg) { director.event('ui:continue'); applyInput({ kind: 'continue', node, id: arg }); }
      break;
    }
    case 'option': {
      const node = currentNodeId();
      if (node && arg) {
        director.event('ui:choose');
        applyInput({ kind: 'option', node, option: arg });
        director.signal(`choose:${arg}`);
      }
      break;
    }
    case 'question': {
      const node = currentNodeId();
      if (node && arg) applyInput({ kind: 'question', node, question: arg });
      break;
    }
    case 'pin': {
      if (!arg) break;
      const wasPinned = ui.pinned.includes(arg);
      ui.pinned = wasPinned ? ui.pinned.filter((p) => p !== arg) : [arg, ...ui.pinned];
      if (!ui.open.includes(arg)) ui.open = [...ui.open, arg];
      director.event(wasPinned ? 'ui:unpin' : 'ui:pin');
      if (!ui.pinHintSeen) { ui.pinHintSeen = true; ui.pinHintOpen = false; writePref(PREF_KEYS.pinHint, '1'); }
      break;
    }
    case 'pin-hint-dismiss': {
      ui.pinHintSeen = true;
      ui.pinHintOpen = false;
      writePref(PREF_KEYS.pinHint, '1');
      break;
    }
    case 'toggle-open': {
      if (!arg) break;
      ui.open = ui.open.includes(arg) ? ui.open.filter((p) => p !== arg) : [...ui.open, arg];
      break;
    }
    case 'open': {
      const overlay = (arg as Overlay) ?? null;
      ui.overlay = overlay;
      ui.saveMessage = null;
      if (overlay === 'binder') director.event('ui:binder-open');
      else if (overlay === 'history') director.event('ui:history-open');
      else if (ui.screen === 'opening') director.event('ui:menu-select');
      break;
    }
    case 'close-overlay': {
      if (ui.overlay === 'binder') director.event('ui:binder-close');
      else if (ui.overlay === 'history') director.event('ui:history-close');
      ui.overlay = null;
      break;
    }
    case 'text-size': {
      ui.textSize = ui.textSize === 'large' ? 'default' : 'large';
      writePref(PREF_KEYS.textSize, ui.textSize);
      director.event('ui:settings-change');
      break;
    }
    case 'save-browser': {
      if (!store.run) break;
      const r = saveToBrowser(store.run);
      ui.saveMessage = r.ok ? 'Saved to this browser.' : r.message;
      refreshContinueSave();
      announce(ui.saveMessage);
      break;
    }
    case 'load-browser': {
      audioOnAtBegin();
      const r = loadFromBrowser(content);
      if (r.ok) { activateRun(r.run, true); ui.saveMessage = 'Save loaded.'; ui.overlay = null; }
      else ui.saveMessage = r.message;
      announce(ui.saveMessage ?? '');
      break;
    }
    case 'export': {
      if (!store.run) break;
      downloadText(exportFilename(store.run), exportText(store.run));
      ui.saveMessage = 'Save exported as a JSON file.';
      break;
    }
    case 'import-text': {
      if (arg === undefined) break;
      audioOnAtBegin();
      const r = importFromText(content, arg);
      if (r.ok) { activateRun(r.run, true); ui.saveMessage = 'Import verified and loaded.'; ui.overlay = null; }
      else ui.saveMessage = `Import rejected — your current session and stored save are unchanged. ${r.message}`;
      announce(ui.saveMessage);
      break;
    }
    case 'new-campaign': {
      audioOnAtBegin();
      director.signal('start-new');
      director.event('ui:menu-select');
      startNewCampaign();
      ui.overlay = null;
      break;
    }
    case 'to-debrief': {
      ui.screen = 'debrief';
      break;
    }
    case 'to-planning': {
      director.event('ui:continue');
      ui.screen = 'planning';
      break;
    }
    case 'highlight-plan': {
      ui.highlightPlan = arg ?? null;
      director.event('ui:menu-select');
      break;
    }
    case 'confirm-plan': {
      if (ui.highlightPlan) { director.event('ui:commit'); applyInput({ kind: 'confirm_plan', id: content.followon.confirm_input, plan: ui.highlightPlan }); }
      break;
    }
    default:
      break;
  }
  paint();
}

// ---------------------------------------------------------------------------
// Paint
// ---------------------------------------------------------------------------

let lastFocus: string | null = null;
let lastScreenId: string | null = null;
let lastNodeId: string | null = null;
/** The console node the previous paint showed (the stacked layout scrolls to the top when it changes). */
let lastPaintedNode: string | null = null;
const openCapcomLines = new Set<string>();

/** Presentation-only audio signals derived from the painted state (never from the log). */
function syncAudio(): void {
  const ui = store.ui;
  const sid = screenId(ui);
  if (sid !== lastScreenId) { lastScreenId = sid; director.signal(sid); }
  // The room bed runs from the first console screen through the resolution cards, the debrief and planning; never under the prologue.
  const consoleLike = ui.screen === 'console' || ui.screen === 'resolution' || ui.screen === 'debrief' || ui.screen === 'planning';
  const node = ui.screen === 'console' ? store.run?.currentNode() : null;
  const phaseId = node?.phase.id ?? (consoleLike ? store.content.mission.phases[store.content.mission.phases.length - 1]?.id ?? null : null);
  director.setRoom(consoleLike, phaseId);
  const nodeId = node?.node.id ?? null;
  if (nodeId !== lastNodeId) {
    lastNodeId = nodeId;
    if (nodeId) {
      director.signal(`node:${nodeId}`);
      const view = store.run ? describeNode(store.run) : null;
      const crisis = (soundscapeMap as SoundscapeMap).crisis_cards ?? [];
      if (view && view.acquired_here.some((id) => crisis.includes(id))) director.event('ui:crisis-card-render');
    }
  }
  // CAPCOM lines: open tone when a line first appears, close tone when it leaves the screen.
  const present = new Set(Array.from(document.querySelectorAll<HTMLElement>('.conversation .line[data-role="CAPCOM"][data-line]')).map((el) => el.dataset.line!));
  for (const id of present) if (!openCapcomLines.has(id)) { openCapcomLines.add(id); director.event('ui:capcom-line-start'); }
  for (const id of [...openCapcomLines]) if (!present.has(id)) { openCapcomLines.delete(id); director.event('ui:capcom-line-end'); }
}

// Opening prose: a real scroll box driven at reading pace; the player can pause, scroll by hand, or continue.
let scrollFrame = 0;
let scrollLastTs = 0;
let scrollHold: ReturnType<typeof setTimeout> | null = null;

function stopProseScroll(): void {
  if (scrollFrame) cancelAnimationFrame(scrollFrame);
  scrollFrame = 0;
  scrollLastTs = 0;
  if (scrollHold) { clearTimeout(scrollHold); scrollHold = null; }
}

function driveProseScroll(): void {
  stopProseScroll();
  const ui = store.ui;
  if (ui.screen !== 'opening' || (ui.stage !== 'dedication' && ui.stage !== 'notices') || ui.reducedMotion || ui.scrollPaused || ui.overlay || ui.fade) return;
  const el = document.getElementById('op-scroll');
  if (!el) return;
  const seconds = Math.max(4, Number(el.dataset.seconds) || 30);
  const stage = ui.stage;
  const step = (ts: number): void => {
    const max = el.scrollHeight - el.clientHeight;
    if (scrollLastTs) el.scrollTop += (max / seconds) * ((ts - scrollLastTs) / 1000);
    scrollLastTs = ts;
    if (el.scrollTop >= max - 0.5) {
      // The last line has cleared the top: a 1.2 s hold, then the fade to black and the title (never while the player has paused).
      scrollFrame = 0;
      scrollHold = setTimeout(() => { scrollHold = null; if (store.ui.stage === stage && !store.ui.scrollPaused && !store.ui.overlay && !store.ui.fade) fadeToTitle(false); }, 1200);
      return;
    }
    scrollFrame = requestAnimationFrame(step);
  };
  scrollFrame = requestAnimationFrame(step);
}

function paint(): void {
  const root = document.getElementById('app');
  if (!root) return;
  const active = document.activeElement as HTMLElement | null;
  // An explicit lastFocus (set by a click or by Escape) wins over the element that happened to be active.
  const focusKey = lastFocus ?? active?.getAttribute('data-focus') ?? null;
  lastFocus = null;
  const scrollBox = document.getElementById('op-scroll');
  const keepScroll = scrollBox ? scrollBox.scrollTop : null;
  const layerBefore = layerState();
  document.documentElement.setAttribute('data-text', store.ui.textSize);
  store.ui.fullscreen = fullscreenState();
  idleDirty = false;
  evaluateStacked(root);
  if (!store.ui.stacked && store.ui.overlay === 'evidence') store.ui.overlay = null; // the column is back: the list lives there again
  root.innerHTML = render(store);
  layoutEmblem();
  driveLayer(layerBefore);
  const newScroll = document.getElementById('op-scroll');
  if (newScroll && keepScroll !== null) newScroll.scrollTop = keepScroll;
  // In the stacked layout the page scrolls: a new node is read from the top, and the automatic focus on the next key (below the fold) must not drag the page down to it.
  const stacked = store.ui.stacked;
  const nodeNow = store.ui.screen === 'console' ? store.run?.currentNode()?.node.id ?? null : null;
  if (stacked && nodeNow !== lastPaintedNode) window.scrollTo(0, 0);
  lastPaintedNode = nodeNow;
  const focusOpts: FocusOptions = { preventScroll: stacked };
  if (store.ui.overlay) {
    // A control inside the overlay keeps focus across a repaint (a pin in the evidence list); otherwise the first control.
    const inside = focusKey ? root.querySelector<HTMLElement>(`.overlay [data-focus="${CSS.escape(focusKey)}"]`) : null;
    (inside && !inside.hasAttribute('disabled') ? inside : root.querySelector<HTMLElement>('.overlay [data-focus]'))?.focus(focusOpts);
  } else if (focusKey) {
    const el = root.querySelector<HTMLElement>(`[data-focus="${CSS.escape(focusKey)}"]`);
    if (el && !el.hasAttribute('disabled')) el.focus(focusOpts);
    else root.querySelector<HTMLElement>('[data-focus-default]')?.focus(focusOpts);
  }
  syncAudio();
  driveProseScroll();
  scheduleIdle();
}

function wire(): void {
  const root = document.getElementById('app');
  if (!root) return;
  root.addEventListener('click', (ev) => {
    const target = (ev.target as HTMLElement).closest<HTMLElement>('[data-action]');
    if (!target) { if (idleDirty) paint(); return; }
    if (target.hasAttribute('disabled') || target.getAttribute('aria-disabled') === 'true') return;
    // While the scenario card dissolves into the room, no control takes a press: rapid clicks on Continue cannot reach a console key.
    if (Date.now() < guardUntil) { ev.preventDefault(); return; }
    lastFocus = target.getAttribute('data-focus');
    const [action, arg] = splitAction(target.getAttribute('data-action')!);
    dispatch(action, arg);
  });
  root.addEventListener('change', (ev) => {
    const input = ev.target as HTMLInputElement;
    if (input.matches('[data-import-file]') && input.files && input.files[0]) {
      input.files[0].text().then((text) => dispatch('import-text', text));
    } else if (input.matches('[data-volume]')) {
      lastFocus = input.getAttribute('data-focus');
      dispatch('volume-change');
    }
  });
  // Sliders move the gains live without repainting mid-drag; `change` persists and repaints.
  root.addEventListener('input', (ev) => {
    const input = ev.target as HTMLInputElement;
    if (!input.matches('[data-volume]')) return;
    const id = input.dataset.volume as keyof AudioPrefs;
    if (id === 'enabled') return;
    const v = Math.max(0, Math.min(1, Number(input.value) / 100));
    store.ui.audio = { ...store.ui.audio, [id]: v };
    director.setPrefs(store.ui.audio);
  });
  // Details disclosures are native; remember their state so a repaint keeps them.
  root.addEventListener('toggle', (ev) => {
    const d = ev.target as HTMLDetailsElement;
    if (d.matches?.('[data-details]')) store.ui.details = { ...store.ui.details, [d.dataset.details!]: d.open };
  }, true);
  // The once-only pin hint: first hover or focus on any pin glyph.
  const maybeHint = (ev: Event): void => {
    const t = (ev.target as HTMLElement).closest?.('[data-pin]');
    if (!t || store.ui.pinHintSeen || store.ui.pinHintOpen) return;
    store.ui.pinHintOpen = true;
    paint();
  };
  root.addEventListener('mouseover', maybeHint);
  root.addEventListener('focusin', maybeHint);
  root.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape' && store.ui.overlay) {
      ev.preventDefault();
      lastFocus = `open:${store.ui.overlay}`;
      dispatch('close-overlay');
      return;
    }
    if (ev.key === 'Escape' && store.ui.tierInfo) {
      ev.preventDefault();
      lastFocus = 'tier-info-toggle';
      dispatch('tier-info-toggle');
      return;
    }
    if (ev.key === 'Tab' && store.ui.overlay) {
      const focusables = Array.from(root.querySelectorAll<HTMLElement>('.overlay button, .overlay a[href], .overlay input, .overlay [tabindex="0"], .overlay summary'))
        .filter((el) => !el.hasAttribute('disabled'));
      if (focusables.length === 0) return;
      const first = focusables[0]!;
      const last = focusables[focusables.length - 1]!;
      if (ev.shiftKey && document.activeElement === first) { ev.preventDefault(); last.focus(); }
      else if (!ev.shiftKey && document.activeElement === last) { ev.preventDefault(); first.focus(); }
    }
  });
  reducedMotionQuery?.addEventListener?.('change', (e) => { store.ui.reducedMotion = e.matches; paint(); });
  document.addEventListener('fullscreenchange', () => paint());
  // Any input resets the idle timer. A pointer press is followed by a click that repaints; other inputs repaint on their own if the highlight was up.
  document.addEventListener('pointerdown', () => noteInput(false), true);
  document.addEventListener('keydown', () => noteInput(true), true);
  document.addEventListener('wheel', () => noteInput(true), { capture: true, passive: true });
  document.addEventListener('input', () => noteInput(false), true);
}

function splitAction(s: string): [string, string | undefined] {
  const i = s.indexOf(':');
  return i < 0 ? [s, undefined] : [s.slice(0, i), s.slice(i + 1)];
}

declare global {
  interface Window {
    __fno?: { store: Store; dispatch: typeof dispatch; fingerprint: string; audio: { enabled: () => boolean; unlocked: () => boolean }; idle: () => boolean; guarded: () => boolean; stacked: () => boolean };
  }
}

applyTheme(document.documentElement, store.ui.uiMode);
wire();
// A resize re-lays the emblem and the layer at once, and repaints a console screen so the stacked layout is re-evaluated.
window.addEventListener('resize', () => { layoutEmblem(); driveLayer(layerState()); if (store.ui.screen === 'console') schedulePaint(); });
if (store.ui.stage === 'menu') refreshContinueSave();
paint();
window.__fno = { store, dispatch, fingerprint: content.fingerprint, audio: { enabled: () => director.enabled, unlocked: () => director.unlocked }, idle: () => store.ui.idle, guarded: () => Date.now() < guardUntil, stacked: () => store.ui.stacked };
