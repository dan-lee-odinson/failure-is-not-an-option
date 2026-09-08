/**
 * THE REPLAY TEST. Written first; never deleted.
 *
 * Same initial ledger + ordered inputs + content fingerprint + sim version +
 * seed → byte-identical canonical event log and final ledger. (AC-07, SC-10)
 */
import { describe, expect, it } from 'vitest';
import { canonical, replay, sha256Hex } from '../../core';
import { content, newRun, play, playScript, script, PREP_SETS, type Route, type Lesson, type Stance } from './helpers';

const routes: Route[] = ['earlier', 'later'];
const lessons: Lesson[] = ['provenance', 'recovery'];
const stances: Stance[] = ['blame', 'ground'];

describe('deterministic replay', () => {
  it('two fresh runs of the same inputs are byte-identical in log and ledger', () => {
    const a = playScript({ prep: ['recovery', 'contact'], route: 'earlier', plan: 'g9-plan-recovery-contact' });
    const b = playScript({ prep: ['recovery', 'contact'], route: 'earlier', plan: 'g9-plan-recovery-contact' });
    expect(a.canonicalLog()).toBe(b.canonicalLog());
    expect(canonical(a.state.ledger)).toBe(canonical(b.state.ledger));
    expect(canonical(a.state)).toBe(canonical(b.state));
    expect(a.state.draws).toBe(0);
  });

  it('replaying the identity reproduces the log and ledger of the original run', () => {
    const original = playScript({ prep: ['systems', 'contact'], route: 'later', lesson: 'recovery', stance: 'blame', questions: true, plan: 'g9-plan-systems-contact' });
    const again = replay(content(), original.identity);
    expect(again.canonicalLog()).toBe(original.canonicalLog());
    expect(canonical(again.state.ledger)).toBe(canonical(original.state.ledger));
    expect(sha256Hex(again.canonicalLog())).toBe(sha256Hex(original.canonicalLog()));
  });

  it('every complete route through the content replays to itself', () => {
    for (const prep of PREP_SETS) for (const route of routes) for (const lesson of lessons) for (const stance of stances) {
      const plan = route === 'earlier' ? 'g9-plan-recovery-contact' : 'g9-plan-systems-contact';
      const original = playScript({ prep, route, lesson, stance, plan });
      const again = replay(content(), original.identity);
      expect(again.canonicalLog()).toBe(original.canonicalLog());
      expect(canonical(again.state)).toBe(canonical(original.state));
      expect(original.state.draws).toBe(0);
    }
  });

  it('different deliberate choices do not replay to the same ledger', () => {
    const a = playScript({ prep: ['contact'], route: 'earlier' });
    const b = playScript({ prep: ['contact'], route: 'later' });
    expect(canonical(a.state.ledger)).not.toBe(canonical(b.state.ledger));
    expect(a.canonicalLog()).not.toBe(b.canonicalLog());
  });

  it('the seed is stored and logged, and the content makes zero draws', () => {
    const run = play(newRun(42), script({ route: 'later' }));
    const header = run.log[0]!;
    expect(header.type).toBe('run');
    if (header.type === 'run') {
      expect(header.seed).toBe(42);
      expect(header.content_version).toBe('0.5.2');
      expect(header.content_fingerprint).toBe(content().fingerprint);
    }
    expect(run.state.draws).toBe(0);
    expect(run.log.some((e) => (e as { type: string }).type === 'draw')).toBe(false);
  });

  it('the log carries no timestamps or wall-clock data', () => {
    const run = playScript({ prep: ['recovery'] });
    const text = run.canonicalLog();
    expect(text).not.toMatch(/"(timestamp|time|date|now)"/);
  });
});
