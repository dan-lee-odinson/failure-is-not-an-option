/**
 * `npm run validate`
 *
 * Checks every file under content/ and assets/manifest.json:
 *   1. JSON Schema (Ajv, draft 2020-12) for every content type.
 *   2. Id uniqueness within scope.
 *   3. Every reference resolves (evidence, facts, procedures, options, events,
 *      characters, portraits, sources, fiction ids).
 *   4. Outcomes are provably mutually exclusive (static) and an exhaustive
 *      generic route sweep confirms exactly one resolution per event and
 *      exactly one outcome at finalization (dynamic).
 *   5. Manifest files exist on disk with the declared dimensions and alpha.
 *
 * Exit code 1 on any error. Prints the content fingerprint on success.
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateContent, type ValidationReport } from './lib/validator';
import { loadBundle, readJson, CONTENT_FILES } from './lib/load-content';

const repoRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const rootArg = process.argv.indexOf('--root');
/** Content root to validate (defaults to this repository); schemas always come from this repository. */
const root = rootArg >= 0 && process.argv[rootArg + 1] ? resolve(process.argv[rootArg + 1]!) : repoRoot;

function main(): number {
  const raw: Record<string, unknown> = {};
  for (const [key, rel] of Object.entries(CONTENT_FILES)) {
    if (!existsSync(resolve(root, rel))) {
      console.error(`ERROR ${rel}: file is missing`);
      return 1;
    }
    try {
      raw[key] = readJson(root, rel);
    } catch (e) {
      console.error(`ERROR ${rel}: not valid JSON (${(e as Error).message})`);
      return 1;
    }
  }
  // Every file under content/ must be one of the declared content files.
  const declared = new Set(Object.values(CONTENT_FILES).map((p) => p.replace(/^content\//, '')));
  for (const f of readdirSync(resolve(root, 'content'))) {
    if (!declared.has(f)) console.error(`ERROR content/${f}: unexpected file under content/ (content is data, never code; declare it in scripts/lib/load-content.ts)`);
  }
  const manifestPath = resolve(root, 'assets', 'manifest.json');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as unknown;

  const report: ValidationReport = validateContent({
    root,
    schemaDir: resolve(repoRoot, 'schema'),
    raw: raw as Parameters<typeof validateContent>[0]['raw'],
    manifest,
    assetsDir: resolve(root, 'assets'),
    bundle: () => loadBundle(root),
  });

  for (const w of report.warnings) console.warn(`WARN  ${w}`);
  for (const e of report.errors) console.error(`ERROR ${e}`);
  if (report.errors.length > 0) {
    console.error(`\nvalidate: FAILED with ${report.errors.length} error(s)`);
    return 1;
  }
  console.log(`validate: OK (${root})`);
  console.log(`  content_version:     ${report.contentVersion}`);
  console.log(`  content_fingerprint: ${report.fingerprint}`);
  console.log(`  sweep:               ${report.sweep.runs} complete routes, ${report.sweep.outcomes.size} distinct outcomes, ${report.sweep.plans} plan commits, 0 draws`);
  return 0;
}

process.exit(main());
