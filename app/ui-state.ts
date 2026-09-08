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

/** `prologue` runs once after NEW CAMPAIGN; `resolution` sits between the outcome record and the debrief (FNO-M01). */
export type Screen = 'opening' | 'prologue' | 'console' | 'resolution' | 'debrief' | 'planning';

/**
 * Stages of the opening screen, in order (FNO-DEPLOY, docs 30 §7–8 / 38 §2 / 40): Start (Begin) → the film (the opening
 * cut to 2:18, the projector filling the frame) → the credits on the den wall (the dedication, the notices and the
 * registry's credit sections over the live den layers) → the hero title → the menu. The M00c prose scroll is retired:
 * its texts are the first sections of the wall credits.
 */
export type Stage = 'start' | 'film' | 'credits' | 'title' | 'menu';
export const STAGES: readonly Stage[] = ['start', 'film', 'credits', 'title', 'menu'];

/** The run-out after the last credit line clears: the beam dies, the den darkens, black, then the title dissolves in. */
export type Runout = 'none' | 'beam' | 'dark' | 'black';

/** `evidence` is the evidence list as an overlay panel in the stacked layout (M02). */
export type Overlay = null | 'binder' | 'history' | 'saveload' | 'about' | 'settings' | 'evidence';

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
  /** The wall credits' scroll paused by the player. */
  scrollPaused: boolean;
  /** The wall credits as a static, keyboard-scrollable block (after Skip during the film, or under reduced motion) instead of the timed scroll. */
  creditsStatic: boolean;
  /** Where the run-out is (credits stage only). */
  runout: Runout;
  /** The 700 ms dissolve from the black den into the title (instead of the 1.5 s / 0.4 s fades). */
  fadeDen: boolean;
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
  /** Opening transition in progress: the prose fading to black, or the hero title fading in. */
  fade: null | 'out' | 'in';
  /** The quick (0.4 s) version, when the player pressed Continue. */
  fadeQuick: boolean;
  /** 30 s without an input: the continuation key takes a muted highlight, a decision shows its hint. Presentation only. */
  idle: boolean;
  /** HINTS: SHOW / HIDE (persisted per player). */
  hints: boolean;
  /** The Fullscreen API's state for the menu key. */
  fullscreen: 'available' | 'active' | 'unavailable';
  /**
   * Prologue position: `index` counts the plates in order, the last index being the scenario card; `prev` is the plate
   * still showing beneath the incoming one during the crossfade (null otherwise), with the fraction of its layer motion
   * already played so it holds still where it was. Presentation only.
   */
  prologue: { index: number; prev: number | null; prevProgress: number };
  /** Which resolution card is up: the result, or the changed relationships. */
  resolution: 'result' | 'relationships';
  /** The scenario card dissolving into the room (700 ms) over the first console screen; never under reduced motion. */
  dissolve: boolean;
  /**
   * Stacked play layout (M02): the conversation panel takes the content width and the evidence column collapses to a
   * status-bar key, chosen when the dialogue area would be shorter than four lines of body text. Presentation only,
   * never persisted; re-evaluated on resize, text size and node change.
   */
  stacked: boolean;
  /** The tier's meaning strip on the resolution result card is open (M02). */
  tierInfo: boolean;
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
    creditsStatic: false,
    runout: 'none',
    fadeDen: false,
    reducedMotion: false,
    pinHintSeen: false,
    pinHintOpen: false,
    audio: { ...DEFAULT_AUDIO },
    continueSave: { ok: false, reason: 'There is no saved campaign in this browser.' },
    openingSeen: false,
    uiMode: 'apollo',
    debug: false,
    fade: null,
    fadeQuick: false,
    idle: false,
    hints: true,
    fullscreen: 'unavailable',
    prologue: { index: 0, prev: null, prevProgress: 0 },
    resolution: 'result',
    dissolve: false,
    stacked: false,
    tierInfo: false,
    ...overrides,
  };
}

/** localStorage keys for per-player presentation preferences (never part of a save). */
export const PREF_KEYS = {
  textSize: 'fno.textSize',
  openingSeen: 'fno.openingSeen',
  pinHint: 'fno.pinHintSeen',
  audio: 'fno.audio',
  hints: 'fno.hints',
} as const;

/** Screen id used by the cue maps for a UI state: `screen:menu`, `screen:opening-film`, `screen:opening-credits`, `screen:prologue`, `screen:console`, `screen:resolution`, … */
export function screenId(ui: Pick<UiState, 'screen' | 'stage'>): string {
  if (ui.screen !== 'opening') return `screen:${ui.screen}`;
  return ui.stage === 'menu' ? 'screen:menu' : `screen:opening-${ui.stage}`;
}
