/** One browser-storage slot plus JSON export/import. All verification lives in core/save.ts. */
import { createSave, verifySave, type ContentIndex, type Run, type SaveFile, type VerifyResult } from '../core';

export const SLOT_KEY = 'fno.save.v1';

export function hasBrowserSave(): boolean {
  try {
    return localStorage.getItem(SLOT_KEY) !== null;
  } catch {
    return false;
  }
}

export function saveToBrowser(run: Run): { ok: true } | { ok: false; message: string } {
  try {
    localStorage.setItem(SLOT_KEY, JSON.stringify(createSave(run)));
    return { ok: true };
  } catch (e) {
    return { ok: false, message: `Browser storage failed: ${(e as Error).message}` };
  }
}

export function loadFromBrowser(content: ContentIndex): VerifyResult {
  let text: string | null = null;
  try {
    text = localStorage.getItem(SLOT_KEY);
  } catch (e) {
    return { ok: false, code: 'storage', message: `Browser storage failed: ${(e as Error).message}` };
  }
  if (text === null) return { ok: false, code: 'empty', message: 'There is no save in this browser.' };
  return importFromText(content, text);
}

export function importFromText(content: ContentIndex, text: string): VerifyResult {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, code: 'json', message: 'The file is not valid JSON.' };
  }
  return verifySave(content, data);
}

export function exportText(run: Run): string {
  const save: SaveFile = createSave(run);
  return JSON.stringify(save, null, 2);
}

/**
 * The demo's campaign is complete once the mission is closed and the Gemini IX-A plan is committed (FNO-DEMO-END): the
 * demo-complete screen follows the planning screen, and the menu's CONTINUE no longer resumes the slot. Derived from
 * the run's own state; nothing is added to a save.
 */
export function campaignComplete(run: Run): boolean {
  return run.state.mission.completed !== null && run.state.followon.committed !== null;
}

export const NO_SAVE_REASON = 'No saved campaign in this browser yet. New Campaign starts one; Load imports a file.';
export const CAMPAIGN_COMPLETE_REASON = 'This campaign is complete. New Campaign starts another; Load imports a save file.';

export type ContinueState = { ok: true } | { ok: false; reason: string; complete?: boolean };

/** Whether CONTINUE on the menu may resume the browser slot: never an empty slot, a save that fails verification, or a completed campaign (it would silently reopen the last screen). */
export function continueState(slot: VerifyResult | null): ContinueState {
  if (!slot) return { ok: false, reason: NO_SAVE_REASON };
  if (!slot.ok) return { ok: false, reason: `The saved campaign cannot be resumed: ${slot.message}` };
  if (campaignComplete(slot.run)) return { ok: false, reason: CAMPAIGN_COMPLETE_REASON, complete: true };
  return { ok: true };
}

export function exportFilename(run: Run): string {
  const n = run.identity.inputs.length;
  const done = run.state.mission.completed ? '-complete' : '';
  return `fno-gemini-8-save-${n}${done}.json`;
}
