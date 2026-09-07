/**
 * App bootstrap and store. The store holds the run (domain) and UI-only state
 * (pins, overlays, text size, highlighted plan). UI-only state never touches
 * the run; every domain change goes through run.apply(input).
 */
import { Run, indexContent, type ContentIndex, type Input } from '../core';
import { bundle } from './content-bundle';
import { render } from './render';
import { exportFilename, exportText, hasBrowserSave, importFromText, loadFromBrowser, saveToBrowser } from './storage';

export type Screen = 'notices' | 'console' | 'debrief' | 'planning';
export type Overlay = null | 'binder' | 'history' | 'saveload' | 'about';

export interface UiState {
  screen: Screen;
  overlay: Overlay;
  pinned: string[];
  textSize: 'default' | 'large';
  highlightPlan: string | null;
  message: string | null;
  saveMessage: string | null;
  hasBrowserSave: boolean;
  /** Which evidence bodies are expanded in the panel (UI only). */
  open: string[];
}

export interface Store {
  content: ContentIndex;
  run: Run | null;
  ui: UiState;
}

const content = indexContent(bundle);

const store: Store = {
  content,
  run: null,
  ui: {
    screen: 'notices',
    overlay: null,
    pinned: [],
    textSize: (() => { try { return localStorage.getItem('fno.textSize') === 'large' ? 'large' : 'default'; } catch { return 'default'; } })(),
    highlightPlan: null,
    message: null,
    saveMessage: null,
    hasBrowserSave: hasBrowserSave(),
    open: [],
  },
};

function announce(text: string): void {
  const live = document.getElementById('live');
  if (live) live.textContent = text;
}

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
  store.ui.highlightPlan = null;
  store.ui.message = null;
  if (run.state.mission.completed) {
    store.ui.screen = run.state.followon.committed || viaLoad ? 'planning' : 'debrief';
    // A loaded completed save lands on the planning screen; the debrief stays reachable.
    if (viaLoad && !run.state.followon.committed) store.ui.screen = 'debrief';
  } else {
    store.ui.screen = 'console';
  }
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

export function dispatch(action: string, arg?: string): void {
  const ui = store.ui;
  switch (action) {
    case 'start-new': {
      activateRun(new Run(content, { seed: 1 }), false);
      break;
    }
    case 'start-load': {
      const r = loadFromBrowser(content);
      if (r.ok) { activateRun(r.run, true); ui.saveMessage = 'Save loaded.'; }
      else { ui.message = r.message; ui.saveMessage = r.message; }
      announce(ui.saveMessage ?? '');
      break;
    }
    case 'continue': {
      const node = currentNodeId();
      if (node && arg) applyInput({ kind: 'continue', node, id: arg });
      break;
    }
    case 'option': {
      const node = currentNodeId();
      if (node && arg) applyInput({ kind: 'option', node, option: arg });
      break;
    }
    case 'question': {
      const node = currentNodeId();
      if (node && arg) applyInput({ kind: 'question', node, question: arg });
      break;
    }
    case 'pin': {
      if (!arg) break;
      ui.pinned = ui.pinned.includes(arg) ? ui.pinned.filter((p) => p !== arg) : [arg, ...ui.pinned];
      if (!ui.open.includes(arg)) ui.open = [...ui.open, arg];
      break;
    }
    case 'toggle-open': {
      if (!arg) break;
      ui.open = ui.open.includes(arg) ? ui.open.filter((p) => p !== arg) : [...ui.open, arg];
      break;
    }
    case 'open': {
      ui.overlay = (arg as Overlay) ?? null;
      ui.saveMessage = null;
      break;
    }
    case 'close-overlay': {
      ui.overlay = null;
      break;
    }
    case 'text-size': {
      ui.textSize = ui.textSize === 'large' ? 'default' : 'large';
      try { localStorage.setItem('fno.textSize', ui.textSize); } catch { /* ignore */ }
      break;
    }
    case 'save-browser': {
      if (!store.run) break;
      const r = saveToBrowser(store.run);
      ui.saveMessage = r.ok ? 'Saved to this browser.' : r.message;
      ui.hasBrowserSave = hasBrowserSave();
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
      activateRun(new Run(content, { seed: 1 }), false);
      ui.overlay = null;
      break;
    }
    case 'to-debrief': {
      ui.screen = 'debrief';
      break;
    }
    case 'to-planning': {
      ui.screen = 'planning';
      break;
    }
    case 'to-notices': {
      ui.screen = 'notices';
      break;
    }
    case 'highlight-plan': {
      ui.highlightPlan = arg ?? null;
      break;
    }
    case 'confirm-plan': {
      if (ui.highlightPlan) applyInput({ kind: 'confirm_plan', id: content.followon.confirm_input, plan: ui.highlightPlan });
      break;
    }
    default:
      break;
  }
  paint();
}

let lastFocus: string | null = null;

function paint(): void {
  const root = document.getElementById('app');
  if (!root) return;
  const active = document.activeElement as HTMLElement | null;
  // An explicit lastFocus (set by a click or by Escape) wins over the element that happened to be active.
  const focusKey = lastFocus ?? active?.getAttribute('data-focus') ?? null;
  lastFocus = null;
  document.documentElement.setAttribute('data-text', store.ui.textSize);
  root.innerHTML = render(store);
  if (store.ui.overlay) {
    const first = root.querySelector<HTMLElement>('.overlay [data-focus]');
    first?.focus();
  } else if (focusKey) {
    const el = root.querySelector<HTMLElement>(`[data-focus="${CSS.escape(focusKey)}"]`);
    if (el) el.focus();
    else root.querySelector<HTMLElement>('[data-focus-default]')?.focus();
  }
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
    }
  });
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
}

function splitAction(s: string): [string, string | undefined] {
  const i = s.indexOf(':');
  return i < 0 ? [s, undefined] : [s.slice(0, i), s.slice(i + 1)];
}

declare global {
  interface Window {
    __fno?: { store: Store; dispatch: typeof dispatch; fingerprint: string };
  }
}

wire();
paint();
window.__fno = { store, dispatch, fingerprint: content.fingerprint };
