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

export function exportFilename(run: Run): string {
  const n = run.identity.inputs.length;
  const done = run.state.mission.completed ? '-complete' : '';
  return `fno-gemini-8-save-${n}${done}.json`;
}
