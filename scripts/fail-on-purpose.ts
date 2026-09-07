/**
 * `npm run validate:fail`
 *
 * Proves the validator fails when it should. For each planted fault, copies
 * content/ and assets/ into the OS temp directory (never into the repo or a
 * synced tree), plants exactly one fault, runs the validator, and checks that
 * the expected error is reported. Exits non-zero if any planted fault goes
 * undetected. The transcript is the handoff's fail-on-purpose evidence.
 */
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Canvas } from './lib/png';
import { CONTENT_FILES, loadBundle, readJson } from './lib/load-content';
import { validateContent } from './lib/validator';

const repoRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');

interface Planted {
  name: string;
  plant: (root: string) => void;
  expect: RegExp;
}

const edit = (root: string, rel: string, fn: (doc: never) => void): void => {
  const path = resolve(root, rel);
  const doc = JSON.parse(readFileSync(path, 'utf8'));
  fn(doc as never);
  writeFileSync(path, JSON.stringify(doc, null, 2) + '\n');
};

const PLANTS: Planted[] = [
  {
    name: 'duplicate id (evidence g8-ev-rule declared twice)',
    plant: (root) => edit(root, CONTENT_FILES.evidence, (d: { evidence: unknown[] }) => { d.evidence.push(JSON.parse(JSON.stringify(d.evidence[0]))); }),
    expect: /duplicate evidence id: g8-ev-rule/,
  },
  {
    name: 'dangling reference (briefing acquires evidence that does not exist)',
    plant: (root) => edit(root, CONTENT_FILES.mission, (d: { phases: { nodes: { documents?: { evidence: string }[] }[] }[] }) => { d.phases[0]!.nodes[0]!.documents!.push({ evidence: 'g8-ev-does-not-exist' }); }),
    expect: /document references unknown evidence g8-ev-does-not-exist/,
  },
  {
    name: 'dangling reference (outcome requires a fact no effect sets)',
    plant: (root) => edit(root, CONTENT_FILES.mission, (d: { outcomes: { requires: { all: unknown[] } }[] }) => { d.outcomes[0]!.requires.all.push({ fact: 'g8-never-set' }); }),
    expect: /references fact g8-never-set, which no effect sets/,
  },
  {
    name: 'wrong-size PNG (room plate written at 1280x720)',
    plant: (root) => {
      const c = new Canvas(1280, 720, false);
      c.fill(40, 40, 40);
      writeFileSync(resolve(root, 'assets', 'fno_gemini_room_console_placeholder_v001.png'), c.encode());
    },
    expect: /is 1280×720, manifest declares 1920×1080/,
  },
  {
    name: 'two matching outcomes (g8-out-earlier-0 duplicated under a new id)',
    plant: (root) => edit(root, CONTENT_FILES.mission, (d: { outcomes: { id: string }[] }) => { const dup = JSON.parse(JSON.stringify(d.outcomes[0])); dup.id = 'g8-out-earlier-0-again'; d.outcomes.push(dup); }),
    expect: /outcomes g8-out-earlier-0 and g8-out-earlier-0-again are not provably mutually exclusive/,
  },
  {
    name: 'event with two matching resolutions (sweep)',
    plant: (root) => edit(root, CONTENT_FILES.mission, (d: { phases: { nodes: { id: string; resolutions?: { when: unknown }[] }[] }[] }) => {
      const exec = d.phases.flatMap((p) => p.nodes).find((n) => n.id === 'g8-ground-execution')!;
      exec.resolutions![1]!.when = { fact: 'g8-return-earlier-ordered' };
    }),
    expect: /sweep: .*2 resolutions match/,
  },
  {
    name: 'schema violation (a timer property on a node)',
    plant: (root) => edit(root, CONTENT_FILES.mission, (d: { phases: { nodes: Record<string, unknown>[] }[] }) => { d.phases[0]!.nodes[0]!['timer'] = 30; }),
    expect: /must NOT have additional properties/,
  },
  {
    name: 'missing PNG (manifest points at a file that is not on disk)',
    plant: (root) => edit(root, 'assets/manifest.json', (d: { assets: { filename: string }[] }) => { d.assets[1]!.filename = 'fno_gemini_portrait_missing_placeholder_v001.png'; }),
    expect: /is missing from assets/,
  },
];

let failed = 0;
for (const p of PLANTS) {
  const root = mkdtempSync(resolve(tmpdir(), 'fno-fail-'));
  try {
    cpSync(resolve(repoRoot, 'content'), resolve(root, 'content'), { recursive: true });
    cpSync(resolve(repoRoot, 'assets'), resolve(root, 'assets'), { recursive: true });
    p.plant(root);
    const raw = Object.fromEntries(Object.entries(CONTENT_FILES).map(([k, rel]) => [k, readJson(root, rel)])) as Parameters<typeof validateContent>[0]['raw'];
    const manifest = readJson(root, 'assets/manifest.json');
    const report = validateContent({ root, schemaDir: resolve(repoRoot, 'schema'), raw, manifest, assetsDir: resolve(root, 'assets'), bundle: () => loadBundle(root) });
    const hit = report.errors.find((e) => p.expect.test(e));
    if (hit) {
      console.log(`DETECTED  ${p.name}\n          -> ${hit}`);
    } else {
      failed += 1;
      console.log(`MISSED    ${p.name}\n          errors were: ${report.errors.join(' | ') || '(none)'}`);
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}
console.log(failed === 0 ? `\nvalidate:fail OK — all ${PLANTS.length} planted faults detected` : `\nvalidate:fail FAILED — ${failed} planted fault(s) went undetected`);
process.exit(failed === 0 ? 0 : 1);
