/**
 * Interface theme (doc 19 §6): the Apollo kit is the first of two skins.
 * The root element carries data-ui-mode; the kit's colours live in CSS under
 * [data-ui-mode="apollo"]; the label-free control faces are manifest SVGs
 * whose URLs are resolved here and exposed as CSS custom properties, so a
 * Modern skin is a second set of tokens and faces with no logic change.
 * No engine, content, eligibility or app decision logic reads the mode.
 */
import { assetUrl } from './assets';
import type { UiMode } from './ui-state';

/** The single availability constant. The settings control for the mode stays hidden until this is true. */
export const MODERN_UI_AVAILABLE = false;

export const FACE_FAMILIES = ['key', 'action', 'selector', 'arrow'] as const;
export const FACE_STATES = ['default', 'hover', 'pressed', 'selected', 'disabled'] as const;
export type FaceFamily = (typeof FACE_FAMILIES)[number];
export type FaceState = (typeof FACE_STATES)[number];

/** Manifest id of a kit face. */
export function faceAssetId(mode: UiMode, family: FaceFamily, state: FaceState): string {
  return `${mode}-${family}-${state}`;
}

/** Manifest id of a mode lamp face. */
export function lampAssetId(mode: UiMode, lamp: 'historical' | 'alternate'): string {
  return `${mode}-lamp-${lamp}`;
}

/** CSS custom properties for the current mode: `--face-key-default: url("…")` and the two lamps. */
export function themeVariables(mode: UiMode): Record<string, string> {
  const vars: Record<string, string> = {};
  for (const family of FACE_FAMILIES) for (const state of FACE_STATES) {
    const url = assetUrl(faceAssetId(mode, family, state));
    vars[`--face-${family}-${state}`] = url ? `url("${url}")` : 'none';
  }
  for (const lamp of ['historical', 'alternate'] as const) {
    const url = assetUrl(lampAssetId(mode, lamp));
    vars[`--lamp-${lamp}`] = url ? `url("${url}")` : 'none';
  }
  return vars;
}

/** Stamp the mode on the root and publish the face URLs. Idempotent; call once at boot and whenever the mode changes. */
export function applyTheme(root: HTMLElement, mode: UiMode): void {
  root.setAttribute('data-ui-mode', mode);
  for (const [name, value] of Object.entries(themeVariables(mode))) root.style.setProperty(name, value);
}
