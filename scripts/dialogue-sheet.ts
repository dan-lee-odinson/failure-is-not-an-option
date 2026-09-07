/**
 * `npm run dialogue-sheet`
 *
 * Writes docs/dialogue-sheet.md (for reading and for Codex) and
 * docs/dialogue-sheet.csv (UTF-8 with BOM, RFC 4180 quoting, an empty
 * `notes` column for markup) — every player-visible string once, in play
 * order, derived from content/ and app/ by playing every route through the
 * engine and the real renderer. Runs under vite-node because the renderer
 * uses Vite asset imports.
 */
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSheet, toCsv, toMarkdown } from './lib/dialogue-sheet';

const root = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const sheet = buildSheet(root);
writeFileSync(resolve(root, 'docs', 'dialogue-sheet.md'), toMarkdown(sheet), 'utf8');
writeFileSync(resolve(root, 'docs', 'dialogue-sheet.csv'), toCsv(sheet), 'utf8');

const kinds = new Map<string, number>();
for (const r of sheet.rows) kinds.set(r.kind, (kinds.get(r.kind) ?? 0) + 1);
const branched = sheet.rows.filter((r) => r.branch).length;
console.log(`dialogue-sheet: ${sheet.rows.length} strings (${branched} branch-only) from ${sheet.runs} routes · content ${sheet.version} · fingerprint ${sheet.fingerprint}`);
console.log('  by source: ' + ['content', 'core', 'app'].map((s) => `${s}=${sheet.rows.filter((r) => r.source === s).length}`).join(' '));
console.log('  by kind:   ' + [...kinds.entries()].sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k}=${n}`).join(' '));
if (sheet.unreachable.length) console.log(`  unreachable content strings (listed at the end of the .md): ${sheet.unreachable.length}`);
console.log('  wrote docs/dialogue-sheet.md and docs/dialogue-sheet.csv');
