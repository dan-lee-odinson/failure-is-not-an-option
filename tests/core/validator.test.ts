/**
 * The validator must fail on purpose before it is trusted. Each case plants
 * one fault in an in-memory copy of the real content and asserts the specific
 * error the validator reports for it. (Build order §5 step 2.)
 */
import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { cloneDeep } from '../../core';
import { validateContent, type ValidationReport } from '../../scripts/lib/validator';
import { CONTENT_FILES, readJson } from '../../scripts/lib/load-content';
import type { ContentBundle } from '../../core/types';

const ROOT = resolve(__dirname, '..', '..');

interface Raw {
  mission: ContentBundle['mission'];
  characters: { content_version: string; characters: ContentBundle['characters'] };
  evidence: { content_version: string; evidence: ContentBundle['evidence'] };
  procedures: { content_version: string; procedures: ContentBundle['procedures'] };
  followon: ContentBundle['followon'];
  registry: ContentBundle['registry'];
}

function loadRaw(): Raw {
  return {
    mission: readJson(ROOT, CONTENT_FILES.mission) as Raw['mission'],
    characters: readJson(ROOT, CONTENT_FILES.characters) as Raw['characters'],
    evidence: readJson(ROOT, CONTENT_FILES.evidence) as Raw['evidence'],
    procedures: readJson(ROOT, CONTENT_FILES.procedures) as Raw['procedures'],
    followon: readJson(ROOT, CONTENT_FILES.followon) as Raw['followon'],
    registry: readJson(ROOT, CONTENT_FILES.registry) as Raw['registry'],
  };
}

function run(raw: Raw, manifest?: unknown, skipFiles = true): ValidationReport {
  const m = manifest ?? JSON.parse(readFileSync(resolve(ROOT, 'assets', 'manifest.json'), 'utf8'));
  return validateContent({
    root: ROOT,
    schemaDir: resolve(ROOT, 'schema'),
    raw,
    manifest: m,
    assetsDir: resolve(ROOT, 'assets'),
    skipFiles,
    bundle: () => ({
      mission: raw.mission,
      characters: raw.characters.characters,
      evidence: raw.evidence.evidence,
      procedures: raw.procedures.procedures,
      followon: raw.followon,
      registry: raw.registry,
    }),
  });
}

describe('validator on the real content', () => {
  it('passes, including the on-disk manifest check', () => {
    const r = run(loadRaw(), undefined, false);
    expect(r.errors).toEqual([]);
    expect(r.contentVersion).toBe('0.5.1');
    expect(r.fingerprint).toMatch(/^[0-9a-f]{64}$/);
    expect(r.sweep.runs).toBe(56);
    expect(r.sweep.outcomes.size).toBe(6);
    expect(r.sweep.plans).toBe(112);
  });
});

describe('validator fails on purpose', () => {
  it('duplicate id', () => {
    const raw = loadRaw();
    const ev = raw.evidence.evidence;
    ev.push(cloneDeep(ev[0]!));
    const r = run(raw);
    expect(r.errors.some((e) => /duplicate evidence id: g8-ev-rule/.test(e))).toBe(true);
  });

  it('dangling reference (evidence)', () => {
    const raw = loadRaw();
    const brief = raw.mission.phases[0]!.nodes[0]!;
    if (brief.type === 'briefing') brief.documents!.push({ evidence: 'g8-ev-does-not-exist' });
    const r = run(raw);
    expect(r.errors.some((e) => /unknown evidence g8-ev-does-not-exist/.test(e))).toBe(true);
  });

  it('dangling reference (fact never set)', () => {
    const raw = loadRaw();
    raw.mission.outcomes[0]!.requires = { all: [{ fact: 'g8-never-set' }] };
    const r = run(raw);
    expect(r.errors.some((e) => /references fact g8-never-set, which no effect sets/.test(e))).toBe(true);
  });

  it('two matching outcomes', () => {
    const raw = loadRaw();
    const dup = cloneDeep(raw.mission.outcomes[0]!);
    dup.id = 'g8-out-earlier-0-again';
    raw.mission.outcomes.push(dup);
    const r = run(raw);
    expect(r.errors.some((e) => /outcomes g8-out-earlier-0 and g8-out-earlier-0-again are not provably mutually exclusive/.test(e))).toBe(true);
  });

  it('an outcome that no route can reach fails the sweep', () => {
    const raw = loadRaw();
    // Make out-earlier-0 also require a later-route fact: no route satisfies it, so earlier-q0 runs match zero outcomes.
    const o = raw.mission.outcomes[0]!;
    if ('all' in o.requires) o.requires.all.push({ fact: 'g8-later-splashdown' });
    const r = run(raw);
    expect(r.errors.some((e) => /sweep: .*0 outcomes match/.test(e))).toBe(true);
  });

  it('an event with two matching resolutions fails the sweep', () => {
    const raw = loadRaw();
    const exec = raw.mission.phases.flatMap((p) => p.nodes).find((n) => n.id === 'g8-ground-execution');
    if (exec?.type === 'event') exec.resolutions[1]!.when = { fact: 'g8-return-earlier-ordered' };
    const r = run(raw);
    expect(r.errors.some((e) => /sweep: .*2 resolutions match/.test(e))).toBe(true);
  });

  it('wrong-size PNG', () => {
    const raw = loadRaw();
    const manifest = JSON.parse(readFileSync(resolve(ROOT, 'assets', 'manifest.json'), 'utf8')) as { assets: { width: number }[] };
    manifest.assets[0]!.width = 1921;
    const r = run(raw, manifest, false);
    expect(r.errors.some((e) => /is 1920×1080, manifest declares 1921×1080/.test(e))).toBe(true);
  });

  it('missing PNG', () => {
    const raw = loadRaw();
    const manifest = JSON.parse(readFileSync(resolve(ROOT, 'assets', 'manifest.json'), 'utf8')) as { assets: { filename: string }[] };
    manifest.assets[1]!.filename = 'fno_gemini_portrait_missing_placeholder_v001.png';
    const r = run(raw, manifest, false);
    expect(r.errors.some((e) => /is missing from assets/.test(e))).toBe(true);
  });

  it('audio duration mismatch and non-audio bytes', () => {
    const raw = loadRaw();
    const manifest = JSON.parse(readFileSync(resolve(ROOT, 'assets', 'manifest.json'), 'utf8')) as { assets: { id: string; duration_s?: number; filename: string }[] };
    manifest.assets.find((a) => a.id === 'sfx-quindar-open')!.duration_s = 1;
    const r = run(raw, manifest, false);
    expect(r.errors.some((e) => /sfx-quindar-open: .*is 0\.250 s long, manifest declares 1 s/.test(e))).toBe(true);
    const m2 = JSON.parse(readFileSync(resolve(ROOT, 'assets', 'manifest.json'), 'utf8')) as { assets: { id: string; filename: string }[] };
    m2.assets.find((a) => a.id === 'sfx-quindar-close')!.filename = 'generated/does-not-exist.wav';
    const r2 = run(raw, m2, false);
    expect(r2.errors).toEqual([]);
    expect(r2.warnings.some((w) => /sfx-quindar-close: public\/audio\/generated\/does-not-exist\.wav is missing/.test(w))).toBe(true);
  });

  it('schema violation (unknown node property)', () => {
    const raw = loadRaw();
    (raw.mission.phases[0]!.nodes[0] as unknown as Record<string, unknown>)['timer'] = 30;
    const r = run(raw);
    expect(r.errors.some((e) => /schema .*must NOT have additional properties/.test(e))).toBe(true);
  });

  it('content_version mismatch across files', () => {
    const raw = loadRaw();
    raw.registry.content_version = '0.3.0';
    const r = run(raw);
    expect(r.errors.some((e) => /content_version differs across files/.test(e))).toBe(true);
  });

  it('unknown speaker', () => {
    const raw = loadRaw();
    const node = raw.mission.phases[1]!.nodes[0]!;
    if (node.type === 'briefing') node.lines![0]!.speaker = 'g8-nobody';
    const r = run(raw);
    expect(r.errors.some((e) => /unknown speaker g8-nobody/.test(e))).toBe(true);
  });

  it('portrait not in manifest', () => {
    const raw = loadRaw();
    raw.characters.characters.find((c) => c.id === 'g8-capcom')!.portrait = 'portrait-nobody';
    const r = run(raw);
    expect(r.errors.some((e) => /portrait portrait-nobody is not in assets\/manifest.json/.test(e))).toBe(true);
  });
});
