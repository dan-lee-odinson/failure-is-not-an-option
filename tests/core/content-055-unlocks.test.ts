import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import Ajv2020 from 'ajv/dist/2020';
import addFormats from 'ajv-formats';
import { describe, expect, it } from 'vitest';
import { Run, indexContent, describeFollowOnForRun, type ContentBundle, type Line } from '../../core';
import { loadBundle } from '../../scripts/lib/load-content';
import { validateUnlocks } from '../../scripts/lib/content-unlocks';
import { PREP_SETS, ROOT, script, type Route, type Lesson, type Stance } from './helpers';

const bundle = loadBundle(ROOT);
const baseline = JSON.parse(readFileSync(resolve(ROOT, 'tests/fixtures/content-055/baseline-content.json'), 'utf8'));
const baselineBundle = {
  mission: baseline['mission-gemini-8'], characters: baseline.characters.characters,
  evidence: baseline.evidence.evidence, procedures: baseline.procedures.procedures,
  followon: baseline['followon-gemini-9a'], registry: baseline.registry,
} as ContentBundle;
const addedIds = new Set(['g8-line-recovery-readback', 'g8-line-systems-readback', 'g8-line-contact-readback', 'g8-line-postflight-context']);
const ajv = new Ajv2020({ allErrors: true, strict: true, allowUnionTypes: true });
addFormats(ajv);
for (const name of readdirSync(resolve(ROOT, 'schema')).filter(n => n.endsWith('.schema.json'))) {
  ajv.addSchema(JSON.parse(readFileSync(resolve(ROOT, 'schema', name), 'utf8')));
}
function schema(kind: 'evidence' | 'procedures') {
  return ajv.getSchema(`https://fno.local/schema/${kind}.schema.json`)!;
}
function lines(b: ContentBundle): Line[] {
  return b.mission.phases.flatMap(p => p.nodes.flatMap(n => {
    if (n.type === 'event') return n.resolutions.flatMap(r => r.lines ?? []);
    if (n.type === 'briefing' || n.type === 'decision') return [...n.lines ?? [], ...(n.questions ?? []).map(q => q.answer)];
    return [];
  }));
}

describe('0.5.5 required unlock contract', () => {
  it('covers every evidence/reference and every adopted procedure, without start exemptions', () => {
    expect(bundle.evidence).toHaveLength(16);
    expect(bundle.procedures).toHaveLength(3);
    for (const item of [...bundle.evidence, ...bundle.procedures]) {
      expect(Object.keys(item.unlocked_by)).toHaveLength(1);
      expect(item.unlocked_by).not.toHaveProperty('start');
    }
    expect(validateUnlocks(bundle)).toEqual([]);
  });
  for (const kind of ['evidence', 'procedures'] as const) {
    for (const item of bundle[kind]) {
      it(`rejects missing unlocked_by: ${item.id}`, () => {
        const copy = JSON.parse(JSON.stringify(item));
        delete copy.unlocked_by;
        expect(schema(kind)({ content_version: '0.5.5', [kind]: [copy] })).toBe(false);
        expect(schema(kind).errors?.some(e => e.keyword === 'required' && e.params.missingProperty === 'unlocked_by')).toBe(true);
      });
    }
  }
  for (const invalid of [{}, { start: false }, { start: true, node: 'g8-brief' }, { node: 'g8-brief', extra: true }, { line: 'bad id' }, { preparation: 42 }]) {
    it(`rejects malformed trigger ${JSON.stringify(invalid)}`, () => {
      expect(schema('evidence')({ content_version: '0.5.5', evidence: [{ ...bundle.evidence[0], unlocked_by: invalid }] })).toBe(false);
    });
  }
  it('allows each specified union form in the schema', () => {
    for (const u of [{ start: true }, { node: 'g8-brief' }, { line: 'g8-line-crisis-relay' }, { preparation: 'g8-prep-contact' }]) {
      expect(schema('evidence')({ content_version: '0.5.5', evidence: [{ ...bundle.evidence[0], unlocked_by: u }] })).toBe(true);
    }
  });
  it('rejects dangling references, non-preparation options and duplicate line ids', () => {
    for (const [u, error] of [
      [{ node: 'g8-missing' }, 'unknown unlock node'],
      [{ line: 'g8-missing' }, 'unknown unlock line'],
      [{ preparation: 'g8-order-return' }, 'is not a preparation choice'],
    ] as const) {
      const b = structuredClone(bundle);
      b.evidence[0]!.unlocked_by = u;
      expect(validateUnlocks(b).some(e => e.includes(error))).toBe(true);
    }
    const b = structuredClone(bundle);
    const identified = lines(b).filter(l => l.id);
    identified[1]!.id = identified[0]!.id;
    expect(validateUnlocks(b).some(e => e.includes('duplicate line id'))).toBe(true);
  });
  it('gates drills on selection, loss of contact on its scene, and termination on Mara', () => {
    const ev = Object.fromEntries(bundle.evidence.map(e => [e.id, e]));
    for (const p of ['contact', 'recovery', 'systems']) {
      expect(ev[`g8-ev-${p}-worksheet`]!.unlocked_by).toEqual({ preparation: `g8-prep-${p}` });
      const readback = lines(bundle).find(l => l.id === `g8-line-${p}-readback`)!;
      expect(readback.when).toEqual({ fact: `g8-prepared-${p}` });
      expect(readback.speaker).toBeNull();
      expect(readback.text).toBe(ev[`g8-ev-${p}-readback`]!.body);
    }
    expect(ev['g8-ev-contact-primer']!.unlocked_by).toEqual({ node: 'g8-loss-of-contact' });
    expect(ev['g8-ev-rule']!.unlocked_by).toEqual({ line: 'g8-line-rcs-termination' });
    const mara = lines(bundle).find(l => l.id === 'g8-line-rcs-termination')!;
    expect(mara.speaker).toBe('g8-systems');
    expect(mara.text).toContain('terminate the mission');
  });
  it('keeps optional reports behind the actual answer and post-flight context in the later scene', () => {
    const n = indexContent(bundle).nodes;
    const ret = n.get('g8-return-brief')!.node;
    if (ret.type !== 'decision') throw new Error('wrong return node type');
    for (const [e, q, l] of [
      ['g8-ev-air', 'g8-q-recovery-risk', 'g8-line-recovery-risk-answer'],
      ['g8-ev-reserve', 'g8-q-reserve-risk', 'g8-line-reserve-risk-answer'],
    ]) {
      expect(bundle.evidence.find(x => x.id === e)!.unlocked_by).toEqual({ line: l });
      expect(ret.questions!.find(x => x.id === q)!.answer.id).toBe(l);
      expect(ret.lines?.some(x => x.id === l)).toBe(false);
    }
    const post = n.get('g8-accountability-brief')!.node;
    if (post.type !== 'briefing') throw new Error('wrong post-flight node type');
    expect(post.lines!.find(l => l.id === 'g8-line-postflight-context')!.text).toBe(bundle.evidence.find(e => e.id === 'g8-ev-postflight-context')!.body);
    expect(bundle.evidence.find(e => e.id === 'g8-ev-postflight-context')!.provenance?.note).toContain('later');
  });
});

describe('0.5.5 baseline change boundary', () => {
  it('preserves every existing dialogue, condition, effect, option and outcome', () => {
    const m = structuredClone(bundle.mission);
    m.content_version = '0.5.4';
    for (const p of m.phases) for (const n of p.nodes) {
      if (n.type === 'event') for (const r of n.resolutions) {
        if (r.lines) r.lines = r.lines.filter(l => !addedIds.has(l.id ?? ''));
        for (const l of r.lines ?? []) delete l.id;
      }
      else if (n.type === 'briefing' || n.type === 'decision') {
        if (n.lines) {
          n.lines = n.lines.filter(l => !addedIds.has(l.id ?? ''));
          // The accountability brief previously had no lines property.
          if (!n.lines.length) delete n.lines;
        }
        for (const l of n.lines ?? []) delete l.id;
        for (const q of n.questions ?? []) delete q.answer.id;
      }
    }
    expect(m).toEqual(baselineBundle.mission);
    expect(lines(bundle).filter(l => addedIds.has(l.id ?? ''))).toHaveLength(4);
    expect(lines(bundle).filter(l => l.id)).toHaveLength(10);
  });
  it('preserves evidence bodies and labels; procedures change only by unlock metadata', () => {
    const evidence = JSON.parse(JSON.stringify(bundle.evidence));
    evidence.forEach((e: { unlocked_by?: unknown; provenance: { note: string } }, i: number) => {
      delete e.unlocked_by;
      e.provenance.note = baselineBundle.evidence[i]!.provenance!.note;
    });
    expect(evidence).toEqual(baselineBundle.evidence);
    const procedures = JSON.parse(JSON.stringify(bundle.procedures));
    for (const p of procedures) delete p.unlocked_by;
    expect(procedures).toEqual(baselineBundle.procedures);
    expect(bundle.characters).toEqual(baselineBundle.characters);
    expect({ ...bundle.followon, content_version: '0.5.4' }).toEqual(baselineBundle.followon);
  });
  it('carries all in-force licence strings and appends exactly the approved H5 sentence', () => {
    const registry = structuredClone(bundle.registry);
    const h5 = registry.sources.find(s => s.id === 'H5')!;
    const appended = ' Article text checked against the attributed lines on 8 September 2026 (doc 44); all five positions present verbatim.';
    expect(h5.note).toBe(baselineBundle.registry.sources.find(s => s.id === 'H5')!.note + appended);
    h5.note = h5.note!.slice(0, -appended.length);
    registry.content_version = '0.5.4';
    expect(registry).toEqual(baselineBundle.registry);
    const manifest = JSON.parse(readFileSync(resolve(ROOT, 'assets/manifest.json'), 'utf8'));
    expect({ ...manifest, content_version: '0.5.4' }).toEqual(JSON.parse(readFileSync(resolve(ROOT, 'tests/fixtures/content-055/baseline-manifest.json'), 'utf8')));
    expect(JSON.stringify([bundle, manifest])).not.toMatch(/pending confirmation|not yet in force|to be chosen before publication/i);
  });
});

describe('0.5.5 mechanics equivalence against original 423e1ec content', () => {
  const oldIndex = indexContent(baselineBundle);
  const newIndex = indexContent(bundle);
  for (const prep of PREP_SETS) for (const route of ['earlier', 'later'] as Route[])
    for (const lesson of ['provenance', 'recovery'] as Lesson[])
      for (const stance of ['blame', 'ground'] as Stance[]) for (const questions of [false, true]) {
        it(`${prep.join('+') || 'none'} / ${route} / ${lesson} / ${stance} / questions=${questions}`, () => {
          const oldRun = new Run(oldIndex, { seed: 1 });
          const newRun = new Run(newIndex, { seed: 1 });
          expect(newRun.state).toEqual(oldRun.state);
          for (const input of script({ prep, route, lesson, stance, questions })) {
            expect(oldRun.apply(input)).toEqual({ ok: true });
            expect(newRun.apply(input)).toEqual({ ok: true });
            expect(newRun.state).toEqual(oldRun.state);
            // Only the run header differs (version and content fingerprint).
            expect(newRun.log.slice(1)).toEqual(oldRun.log.slice(1));
          }
          expect(describeFollowOnForRun(newRun)).toEqual(describeFollowOnForRun(oldRun));
        });
      }
});
