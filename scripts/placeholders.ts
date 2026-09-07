/**
 * `npm run placeholders`
 *
 * Generates a labeled flat PNG for every slot in assets/manifest.json at the
 * declared dimensions, showing the asset id, its dimensions, and the word
 * PLACEHOLDER. No NASA insignia, worm, or seal; no third-party imagery.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Canvas, drawText, textWidth } from './lib/png';

const root = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const manifestPath = resolve(root, 'assets', 'manifest.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as {
  assets: { id: string; filename: string; width: number; height: number; alpha: boolean }[];
};

for (const a of manifest.assets) {
  const c = new Canvas(a.width, a.height, a.alpha);
  const isRoom = a.id.startsWith('room-');
  if (a.alpha) {
    c.fill(0, 0, 0, 0);
    const inset = Math.round(Math.min(a.width, a.height) * 0.04);
    c.rect(inset, inset, a.width - inset * 2, a.height - inset * 2, 78, 84, 92, 255);
    c.rect(inset + 6, inset + 6, a.width - inset * 2 - 12, a.height - inset * 2 - 12, 96, 104, 112, 255);
  } else {
    c.fill(31, 36, 44, 255);
    // Painted "overhead light" pools so the placeholder reads as a room plate, not a flat card.
    for (let i = 0; i < 4; i++) {
      const cx = Math.round(((i + 0.5) / 4) * a.width);
      c.rect(cx - 140, 0, 280, Math.round(a.height * 0.55), 40, 46, 56, 255);
    }
    c.rect(0, Math.round(a.height * 0.7), a.width, a.height - Math.round(a.height * 0.7), 24, 28, 34, 255);
  }
  const lines = [a.id, `${a.width}×${a.height}`, 'PLACEHOLDER'];
  const maxScale = isRoom ? 10 : 6;
  const margin = Math.round(a.width * 0.08);
  const scale = Math.max(1, Math.min(maxScale, ...lines.map((l) => Math.floor((a.width - margin * 2) / (l.length * 6)))));
  const lineH = 7 * scale + scale * 3;
  const total = lineH * lines.length;
  let y = Math.round(a.height / 2 - total / 2);
  for (const line of lines) {
    const w = textWidth(line, scale);
    const x = Math.round(a.width / 2 - w / 2);
    drawText(c, line, x, y, scale, 214, 206, 186);
    y += lineH;
  }
  const out = resolve(root, 'assets', a.filename);
  writeFileSync(out, c.encode());
  console.log(`wrote ${a.filename} ${a.width}×${a.height} alpha=${a.alpha}`);
}
