/**
 * App bootstrap and store. The store holds the run (domain) and UI-only state
 * (opening stage, overlays, pins, text size, audio preferences, hints). UI
 * state never touches the run; every domain change goes through
 * run.apply(input). Audio, theme, text size, overlays and pins never enter
 * the ledger, the log, a save, or the replay.
 */
import { Run, describeNode, indexContent, type Input } from '../core';
import { bundle } from './content-bundle';
import { render } from './render';
import { exportFilename, exportText, hasBrowserSave, importFromText, loadFromBrowser, saveToBrowser } from './storage';
import { layoutEmblem } from './plate';
import { applyTheme } from './theme';
import { AudioDirector, type MusicMap, type SoundscapeMap } from './audio';
import { audioUrl } from './assets';
import { DEFAULT_AUDIO, PREF_KEYS, STAGES, defaultUi, screenId, type AudioPrefs, type Overlay, type Stage, type Store, type UiState } from './ui-state';
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
    store.ui.screen = 'debrief';
    announce('Mission closed. Debrief.');
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
  if (stage === 'menu') { markOpeningSeen(); refreshContinueSave(); }
}

function nextStage(): void {
  const i = STAGES.indexOf(store.ui.stage);
  let next = STAGES[Math.min(i + 1, STAGES.length - 1)]!;
  if (next === 'montage') next = 'title'; // the montage slot is a 0-duration pass-through in M00b
  goToStage(next);
}

function persistAudio(): void {
  writePref(PREF_KEYS.audio, JSON.stringify(store.ui.audio));
  director.setPrefs(store.ui.audio);
}

// ---------------------------------------------------------------------------
// Dispatch
// ---------------------------------------------------------------------------

export function dispatch(action: string, arg?: string): void {
  const ui = store.ui;
  switch (action) {
    case 'begin': {
      director.unlock();
      director.event('ui:begin');
      goToStage('dedication');
      break;
    }
    case 'skip-to-menu': {
      director.unlock();
      director.signal('skip-to-menu');
      goToStage('menu');
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
      director.signal('start-new');
      director.event('ui:menu-select');
      activateRun(new Run(content, { seed: 1 }), false);
      break;
    }
    case 'start-load': {
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
      const r = importFromText(content, arg);
      if (r.ok) { activateRun(r.run, true); ui.saveMessage = 'Import verified and loaded.'; ui.overlay = null; }
      else ui.saveMessage = `Import rejected — your current session and stored save are unchanged. ${r.message}`;
      announce(ui.saveMessage);
      break;
    }
    case 'new-campaign': {
      director.event('ui:menu-select');
      activateRun(new Run(content, { seed: 1 }), false);
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
const openCapcomLines = new Set<string>();

/** Presentation-only audio signals derived from the painted state (never from the log). */
function syncAudio(): void {
  const ui = store.ui;
  const sid = screenId(ui);
  if (sid !== lastScreenId) { lastScreenId = sid; director.signal(sid); }
  const consoleLike = ui.screen === 'console' || ui.screen === 'debrief' || ui.screen === 'planning';
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
  if (ui.screen !== 'opening' || (ui.stage !== 'dedication' && ui.stage !== 'notices') || ui.reducedMotion || ui.scrollPaused || ui.overlay) return;
  const el = document.getElementById('op-scroll');
  if (!el) return;
  const seconds = Math.max(4, Number(el.dataset.seconds) || 30);
  const stage = ui.stage;
  const step = (ts: number): void => {
    const max = el.scrollHeight - el.clientHeight;
    if (scrollLastTs) el.scrollTop += (max / seconds) * ((ts - scrollLastTs) / 1000);
    scrollLastTs = ts;
    if (el.scrollTop >= max - 0.5) {
      // Text has cleared: a short hold, then the next chapter (never while the player has paused).
      scrollFrame = 0;
      scrollHold = setTimeout(() => { scrollHold = null; if (store.ui.stage === stage && !store.ui.scrollPaused && !store.ui.overlay) dispatch('stage-next'); }, 1200);
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
  document.documentElement.setAttribute('data-text', store.ui.textSize);
  root.innerHTML = render(store);
  layoutEmblem();
  const newScroll = document.getElementById('op-scroll');
  if (newScroll && keepScroll !== null) newScroll.scrollTop = keepScroll;
  if (store.ui.overlay) {
    const first = root.querySelector<HTMLElement>('.overlay [data-focus]');
    first?.focus();
  } else if (focusKey) {
    const el = root.querySelector<HTMLElement>(`[data-focus="${CSS.escape(focusKey)}"]`);
    if (el && !el.hasAttribute('disabled')) el.focus();
    else root.querySelector<HTMLElement>('[data-focus-default]')?.focus();
  }
  syncAudio();
  driveProseScroll();
}

function wire(): void {
  const root = document.getElementById('app');
  if (!root) return;
  root.addEventListener('click', (ev) => {
    const target = (ev.target as HTMLElement).closest<HTMLElement>('[data-action]');
    if (!target) return;
    if (target.hasAttribute('disabled') || target.getAttribute('aria-disabled') === 'true') return;
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
}

function splitAction(s: string): [string, string | undefined] {
  const i = s.indexOf(':');
  return i < 0 ? [s, undefined] : [s.slice(0, i), s.slice(i + 1)];
}

declare global {
  interface Window {
    __fno?: { store: Store; dispatch: typeof dispatch; fingerprint: string; audio: { enabled: () => boolean; unlocked: () => boolean } };
  }
}

applyTheme(document.documentElement, store.ui.uiMode);
wire();
window.addEventListener('resize', layoutEmblem);
if (store.ui.stage === 'menu') refreshContinueSave();
paint();
window.__fno = { store, dispatch, fingerprint: content.fingerprint, audio: { enabled: () => director.enabled, unlocked: () => director.unlocked } };
