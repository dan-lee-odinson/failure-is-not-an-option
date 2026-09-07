/**
 * `npm run gen-quindar`
 *
 * Writes the two Quindar tones the app plays around a CAPCOM line:
 *   public/audio/generated/quindar-open.wav   2525 Hz
 *   public/audio/generated/quindar-close.wav  2475 Hz
 * 250 ms sine, 10 ms linear ramps in and out, 44.1 kHz, 16-bit mono,
 * −12 dBFS peak. Deterministic: no random, no timestamps, so the committed
 * bytes never change and the manifest stays stable. The parameters are read
 * from app/soundscape-map.json (`generated.quindar`).
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { quindarWav, QUINDAR_FILES } from './lib/quindar';
import soundscape from '../app/soundscape-map.json';

const root = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const outDir = resolve(root, 'public', 'audio', 'generated');
mkdirSync(outDir, { recursive: true });
const q = soundscape.generated.quindar;
for (const [file, hz] of QUINDAR_FILES(q)) {
  const bytes = quindarWav(hz, q);
  writeFileSync(resolve(outDir, file), bytes);
  console.log(`wrote public/audio/generated/${file}  ${hz} Hz  ${q.duration_ms} ms  ${bytes.length} bytes`);
}
