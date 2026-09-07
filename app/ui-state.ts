/**
 * UI-only state and its defaults. Nothing here touches the run, the ledger,
 * the log, or the replay: screens, opening stages, overlays, pins, text size,
 * audio preferences, and the once-only hints are presentation state that is
 * persisted per player (localStorage) and never enters a save file.
 *
 * This module has no DOM side effects so tests and the dialogue-sheet
 * generator can import it under Node.
 */
import type { ContentIndex, Run } from '../core';

export type Screen = 'opening' | 'console' | 'debrief' | 'planning';

/** Stages of the opening screen, in order. `montage` is the named empty slot for the future archival montage (07). */
export type Stage = 'start' | 'dedication' | 'notices' | 'montage' | 'title' | 'menu';
export const STAGES: readonly Stage[] = ['start', 'dedication', 'notices', 'montage', 'title', 'menu'];

export type Overlay = null | 'binder' | 'history' | 'saveload' | 'about' | 'settings';

export type UiMode = 'apollo';

export interface AudioPrefs {
  /** Off by default: silent until the player turns the master on the first time. */
  enabled: boolean;
  master: number;
  music: number;
  effects: number;
  beds: number;
}

export interface UiState {
  screen: Screen;
  stage: Stage;
  overlay: Overlay;
  /** Evidence ids pinned to the top of the Evidence panel (UI only). */
  pinned: string[];
  textSize: 'default' | 'large';
  highlightPlan: string | null;
  message: string | null;
  saveMessage: string | null;
  hasBrowserSave: boolean;
  /** Which evidence bodies are expanded in the panel (UI only). */
  open: string[];
  /** Explicit Details-disclosure overrides per option card; absent = the card's default. */
  details: Record<string, boolean>;
  /** Opening prose scroll paused by the player. */
  scrollPaused: boolean;
  /** prefers-reduced-motion at paint time: static chapters, immediate cuts. */
  reducedMotion: boolean;
  /** The once-only pin hint has been shown and dismissed (persisted per player). */
  pinHintSeen: boolean;
  /** The pin hint is being shown right now (first hover/focus on a pin glyph). */
  pinHintOpen: boolean;
  audio: AudioPrefs;
  /** Whether CONTINUE on the menu can resume a valid save, with the visible reason when it cannot. */
  continueSave: { ok: true } | { ok: false; reason: string };
  /** The opening has been viewed or skipped once on this browser (persisted per player). */
  openingSeen: boolean;
  uiMode: UiMode;
  /** `?debug` in the URL: shows the raw event record on the debrief. */
  debug: boolean;
}

export interface Store {
  content: ContentIndex;
  run: Run | null;
  ui: UiState;
}

export const DEFAULT_AUDIO: AudioPrefs = { enabled: false, master: 0.8, music: 1, effects: 1, beds: 1 };

export function defaultUi(overrides: Partial<UiState> = {}): UiState {
  return {
    screen: 'opening',
    stage: 'start',
    overlay: null,
    pinned: [],
    textSize: 'default',
    highlightPlan: null,
    message: null,
    saveMessage: null,
    hasBrowserSave: false,
    open: [],
    details: {},
    scrollPaused: false,
    reducedMotion: false,
    pinHintSeen: false,
    pinHintOpen: false,
    audio: { ...DEFAULT_AUDIO },
    continueSave: { ok: false, reason: 'There is no saved campaign in this browser.' },
    openingSeen: false,
    uiMode: 'apollo',
    debug: false,
    ...overrides,
  };
}

/** localStorage keys for per-player presentation preferences (never part of a save). */
export const PREF_KEYS = {
  textSize: 'fno.textSize',
  openingSeen: 'fno.openingSeen',
  pinHint: 'fno.pinHintSeen',
  audio: 'fno.audio',
} as const;

/** Screen id used by the cue maps for a UI state: `screen:menu`, `screen:opening-dedication`, `screen:console`, … */
export function screenId(ui: Pick<UiState, 'screen' | 'stage'>): string {
  if (ui.screen !== 'opening') return `screen:${ui.screen}`;
  return ui.stage === 'menu' ? 'screen:menu' : `screen:opening-${ui.stage}`;
}
