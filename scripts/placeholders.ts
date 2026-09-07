/**
 * `npm run placeholders`
 *
 * Images: generates a labeled flat PNG for every manifest slot still waiting
 * for art (status to-generate or placeholder) at the declared dimensions.
 * No NASA insignia, worm, or seal; no third-party imagery. Final assets are
 * never overwritten.
 *
 * Audio: lists every manifest sound whose file is missing from public/audio/.
 * Sounds are never generated here (a missing sound plays silence in the
 * game); Freesound files are downloaded by hand under their original
 * filenames, and the Quindar tones come from `npm run gen-quindar`.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Canvas, drawText, textWidth } from './lib/png';

const root = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const manifestPath = resolve(root, 'assets', 'manifest.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as {
  assets: { id: string; filename: string; kind?: string; format?: string; width?: number; height?: number; alpha?: boolean; status: string; source_url?: string }[];
};

// Only image slots still waiting for art get a placeholder; `final` assets are never overwritten.
const pending = manifest.assets.filter((a) => a.kind !== 'audio' && (a.status === 'to-generate' || a.status === 'placeholder') && (a.format ?? 'png') === 'png');
if (pending.length === 0) console.log('placeholders: no image slots with status to-generate or placeholder; nothing to do');

for (const a of pending) {
  const width = a.width ?? 1;
  const height = a.height ?? 1;
  const alpha = a.alpha ?? false;
  const c = new Canvas(width, height, alpha);
  const isRoom = a.id.startsWith('room-');
  if (alpha) {
    c.fill(0, 0, 0, 0);
    const inset = Math.round(Math.min(width, height) * 0.04);
    c.rect(inset, inset, width - inset * 2, height - inset * 2, 78, 84, 92, 255);
    c.rect(inset + 6, inset + 6, width - inset * 2 - 12, height - inset * 2 - 12, 96, 104, 112, 255);
  } else {
    c.fill(31, 36, 44, 255);
    // Painted "overhead light" pools so the placeholder reads as a room plate, not a flat card.
    for (let i = 0; i < 4; i++) {
      const cx = Math.round(((i + 0.5) / 4) * width);
      c.rect(cx - 140, 0, 280, Math.round(height * 0.55), 40, 46, 56, 255);
    }
    c.rect(0, Math.round(height * 0.7), width, height - Math.round(height * 0.7), 24, 28, 34, 255);
  }
  const lines = [a.id, `${width}×${height}`, 'PLACEHOLDER'];
  const maxScale = isRoom ? 10 : 6;
  const margin = Math.round(width * 0.08);
  const scale = Math.max(1, Math.min(maxScale, ...lines.map((l) => Math.floor((width - margin * 2) / (l.length * 6)))));
  const lineH = 7 * scale + scale * 3;
  const total = lineH * lines.length;
  let y = Math.round(height / 2 - total / 2);
  for (const line of lines) {
    const w = textWidth(line, scale);
    const x = Math.round(width / 2 - w / 2);
    drawText(c, line, x, y, scale, 214, 206, 186);
    y += lineH;
  }
  const out = resolve(root, 'assets', a.filename);
  writeFileSync(out, c.encode());
  console.log(`wrote ${a.filename} ${width}×${height} alpha=${alpha}`);
}

// Audio: report, never generate.
const audio = manifest.assets.filter((a) => a.kind === 'audio');
const missing = audio.filter((a) => !existsSync(resolve(root, 'public', 'audio', a.filename)));
for (const a of missing) {
  const how = a.filename.startsWith('generated/')
    ? 'run npm run gen-quindar'
    : a.filename.startsWith('soundscape-cc0/')
      ? `download it from ${a.source_url ?? 'its Freesound page'} (free account) into public/audio/soundscape-cc0/ under this exact filename`
      : 'copy the original track into public/audio/';
  console.log(`MISSING audio ${a.id}: public/audio/${a.filename} — ${how}. Until then this sound plays silence.`);
}
console.log(`placeholders: audio ${audio.length - missing.length} of ${audio.length} files present${missing.length ? `, ${missing.length} missing (listed above)` : ''}`);
