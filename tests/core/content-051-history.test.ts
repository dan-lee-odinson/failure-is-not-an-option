import { describe, expect, it } from 'vitest';
import { alternateHistoryActive, canonical, evaluate, indexContent, replay, Run, type Condition } from '../../core';
import { content, newRun, play, script, PREP_SETS } from './helpers';

function withMarker(marker: boolean | Condition | undefined, phase = 5): Run {
  const bundle = structuredClone(content().bundle);
  for (const p of bundle.mission.phases) delete p.alternate_history;
  if (marker !== undefined) bundle.mission.phases[phase]!.alternate_history = marker;
  return new Run(indexContent(bundle), { seed: 1 });
}

describe('0.5.1 conditional history contract', () => {
  it('switches at earlier-order execution on every route and survives replay at every input boundary without mutation', () => {
    for (const prep of PREP_SETS) for (const route of ['earlier', 'later'] as const)
      for (const lesson of ['provenance', 'recovery'] as const) for (const stance of ['blame', 'ground'] as const) {
        const inputs = script({ prep, route, lesson, stance });
        const cut = inputs.findIndex((i) => i.kind === 'continue' && i.id === 'g8-execute-return');
        const run = newRun();
        for (let count = 0; count <= inputs.length; count++) {
          const expected = route === 'earlier' && count > cut;
          const before = canonical({ state: run.state, log: run.log, identity: run.identity });
          expect(alternateHistoryActive(run)).toBe(expected);
          expect(canonical({ state: run.state, log: run.log, identity: run.identity })).toBe(before);
          expect(alternateHistoryActive(replay(run.content, run.identity))).toBe(expected);
          if (count < inputs.length) play(run, [inputs[count]!]);
        }
      }
  });

  it('absent and false do not activate; true activates only once its phase is entered', () => {
    for (const marker of [undefined, false, true]) {
      const run = withMarker(marker);
      expect(alternateHistoryActive(run)).toBe(false);
      play(run, script({ route: 'later' }));
      expect(alternateHistoryActive(run)).toBe(marker === true);
    }
  });

  it('keeps activation after a negated condition becomes false, including reconstruction from replay', () => {
    const marker = { not: { chose: 'g8-return-later' } };
    const run = withMarker(marker, 4);
    const inputs = script({ route: 'later' });
    const cut = inputs.findIndex((i) => i.kind === 'option' && i.option === 'g8-return-later');
    play(run, inputs.slice(0, cut));
    expect(alternateHistoryActive(run)).toBe(true);
    play(run, inputs.slice(cut));
    expect(evaluate(marker, run.state)).toBe(false);
    expect(alternateHistoryActive(run)).toBe(true);
    expect(alternateHistoryActive(replay(run.content, run.identity))).toBe(true);
  });

  it('reuses all existing condition primitives and compound grammar', () => {
    const completed = play(newRun(), script({ prep: ['contact'], route: 'later' }));
    const conditions: Condition[] = [
      { fact: Object.keys(completed.state.ledger.facts)[0]! },
      { evidence: Object.keys(completed.state.mission.evidence)[0]! },
      { procedure: completed.state.ledger.procedures[0]! },
      { event_seen: completed.state.mission.events_seen[0]! },
      { all: [{ chose: 'g8-return-later' }, { not: { chose: 'g8-return-earlier' } }] },
      { any: [{ chose: 'g8-return-earlier' }, { chose: 'g8-return-later' }] },
    ];
    for (const condition of conditions) {
      const run = withMarker(condition, 0);
      play(run, script({ prep: ['contact'], route: 'later' }));
      expect(alternateHistoryActive(run)).toBe(true);
    }
  });
});
