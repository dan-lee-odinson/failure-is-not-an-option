import { describe, expect, it } from 'vitest';
import { canonical, cloneDeep, createSave, describeEvidence, describeNode, verifySave, type SaveFile } from '../../core';
import { PREP_SETS, ask, content, indexOf, newRun, play, playScript, prepKey, script } from './helpers';

describe('AC-05 — Information boundary', () => {
  it('during the gap only received reports and acquired references are exposed', () => {
    for (const prep of PREP_SETS) {
      const s = script({ prep });
      const gapIdx = indexOf(s, (i) => i.kind === 'continue' && i.id === 'g8-gap-note-continue');
      const run = play(newRun(), s.slice(0, gapIdx));
      expect(run.currentNode()!.node.id).toBe('g8-gap-note');
      const expected = ['g8-ev-rule', 'g8-ev-contact-primer', 'g8-ev-docked', ...prep.map((p) => `g8-ev-${p}-worksheet`)].sort();
      expect(Object.keys(run.state.mission.evidence).sort(), prepKey(prep)).toEqual(expected);
      const views = describeEvidence(content(), run.state);
      expect(views.find((v) => v.id === 'g8-ev-docked')!.badge).toBe('PREVIOUS CONTACT');
      const text = JSON.stringify(describeNode(run));
      for (const leak of ['tumble', 'Reserve warning', 'exhaust', 'trust', 'critical']) expect(text.includes(leak), `${prepKey(prep)} leaks "${leak}"`).toBe(false);
      expect(Object.keys(run.state.ledger.facts).every((f) => f.startsWith('g8-prepared-'))).toBe(true);
      for (const p of Object.values(run.state.ledger.people)) expect(p.trust).toBe(0);
      // The prepared-contact appendix appears only with that preparation.
      const appendix = describeNode(run)!.lines.some((l) => l.text.startsWith('CAPCOM has left'));
      expect(appendix).toBe(prep.includes('contact'));
    }
  });

  it('at return planning both base risk summaries are visible without questions', () => {
    const s = script({ prep: ['recovery'] });
    const idx = indexOf(s, (i) => i.kind === 'option' && i.option === 'g8-return-earlier');
    const run = play(newRun(), s.slice(0, idx));
    const view = describeNode(run)!;
    expect(view.node.id).toBe('g8-return-brief');
    expect(view.questions.every((q) => !q.asked)).toBe(true);
    const ids = Object.keys(run.state.mission.evidence);
    expect(ids).toEqual(expect.arrayContaining(['g8-ev-return', 'g8-ev-air', 'g8-ev-reserve', 'g8-ev-recovery-readback']));
    expect(ids).not.toContain('g8-ev-systems-readback');
    expect(ids).not.toContain('g8-ev-contact-readback');
    expect(ids).not.toContain('g8-ev-recovered');
    expect(ids).not.toContain('g8-ev-postflight-context');
    for (const o of view.options!) {
      expect(o.attraction).toBeTruthy();
      expect(o.cost).toBeTruthy();
    }
    // Future consequences appear only with their events.
    for (const f of Object.keys(run.state.ledger.facts)) expect(/exhaustion|handoff|orbit|reserve-critical|q[012]/.test(f), f).toBe(false);
  });
});

describe('AC-06 — Domain versus UI', () => {
  it('free questions mutate nothing in the ledger and never advance the cursor', () => {
    const s = script({ prep: ['contact'] });
    const idx = indexOf(s, (i) => i.kind === 'option' && i.option === 'g8-return-earlier');
    const run = play(newRun(), s.slice(0, idx));
    const ledgerBefore = canonical(run.state.ledger);
    const evBefore = canonical(run.state.mission.evidence);
    const cursorBefore = canonical(run.state.mission.cursor);
    play(run, [ask('g8-return-brief', 'g8-q-recovery-risk'), ask('g8-return-brief', 'g8-q-reserve-risk'), ask('g8-return-brief', 'g8-q-recovery-risk')]);
    expect(canonical(run.state.ledger)).toBe(ledgerBefore);
    expect(canonical(run.state.mission.evidence)).toBe(evBefore);
    expect(canonical(run.state.mission.cursor)).toBe(cursorBefore);
    expect(run.state.mission.questions_asked).toEqual(['g8-q-recovery-risk', 'g8-q-reserve-risk']);
  });

  it('unacquired report bodies are not exposed by the evidence view', () => {
    const run = play(newRun(), script({ upTo: 4 }));
    expect(run.currentNode()!.node.id).toBe('g8-gap-note');
    const views = describeEvidence(content(), run.state);
    expect(views.map((v) => v.id)).not.toContain('g8-ev-crisis');
    expect(content().evidence.size).toBeGreaterThan(views.length);
  });

  it('only a confirmed plan input mutates the follow-on; a disabled plan cannot be dispatched', () => {
    const run = playScript({ prep: [], route: 'earlier' });
    const before = canonical(run.state);
    const r = run.apply({ kind: 'confirm_plan', id: 'g9-confirm-plan', plan: 'g9-plan-systems-contact' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.message).toContain('must include the recovery drill');
    expect(canonical(run.state)).toBe(before);
  });
});

describe('AC-07 — Deterministic replay (see replay.test.ts for the primary test)', () => {
  it('two complete runs through the follow-on commit are byte-identical', () => {
    const a = playScript({ prep: ['contact', 'systems'], route: 'later', stance: 'blame', plan: 'g9-plan-recovery-systems' });
    const b = playScript({ prep: ['contact', 'systems'], route: 'later', stance: 'blame', plan: 'g9-plan-recovery-systems' });
    expect(a.canonicalLog()).toBe(b.canonicalLog());
    expect(canonical(a.state)).toBe(canonical(b.state));
    expect(a.state.followon.committed).toBe('g9-plan-recovery-systems');
  });
});

describe('AC-08 — Save round trip at every boundary', () => {
  const full = script({ prep: ['recovery'], route: 'earlier', lesson: 'recovery', stance: 'ground', plan: 'g9-plan-recovery-systems' });
  const boundaries: [string, (i: { kind: string; id?: string; option?: string; plan?: string }) => boolean][] = [
    ['after one prep', (i) => i.kind === 'option' && i.option === 'g8-prep-recovery'],
    ['during gap', (i) => i.kind === 'continue' && i.id === 'g8-loss-of-contact-continue'],
    ['order receipt', (i) => i.kind === 'option' && i.option === 'g8-return-earlier'],
    ['execution', (i) => i.kind === 'continue' && i.id === 'g8-execute-return'],
    ['beat 1', (i) => i.kind === 'continue' && i.id === 'g8-ground-execution-continue'],
    ['beat 2', (i) => i.kind === 'continue' && i.id === 'g8-return-beat-1-continue'],
    ['pickup before relationships', (i) => i.kind === 'continue' && i.id === 'g8-return-beat-2-continue'],
    ['after relationships', (i) => i.kind === 'continue' && i.id === 'g8-pickup-report-continue'],
    ['after lesson', (i) => i.kind === 'option' && i.option === 'g8-adopt-recovery'],
    ['completion', (i) => i.kind === 'continue' && i.id === 'g8-finish'],
    ['committed plan', (i) => i.kind === 'confirm_plan'],
  ];

  for (const [name, pred] of boundaries) {
    it(`save/import at "${name}" agrees with the uninterrupted run`, () => {
      const cut = full.findIndex((i) => pred(i as never)) + 1;
      expect(cut).toBeGreaterThan(0);
      const uninterrupted = play(newRun(), full);
      const partial = play(newRun(), full.slice(0, cut));
      const save = createSave(partial);
      const text = JSON.stringify(save);
      const verified = verifySave(content(), JSON.parse(text));
      expect(verified.ok).toBe(true);
      if (!verified.ok) return;
      const restored = verified.run;
      expect(canonical(restored.state)).toBe(canonical(partial.state));
      play(restored, full.slice(cut));
      expect(canonical(restored.state)).toBe(canonical(uninterrupted.state));
      expect(restored.canonicalLog()).toBe(uninterrupted.canonicalLog());
      // exactly-once: one execution, one relationship response, one finalize, at most one plan
      const count = (pred2: (e: { type: string; node?: string }) => boolean) => restored.log.filter((e) => pred2(e as never)).length;
      expect(count((e) => e.type === 'resolution' && e.node === 'g8-ground-execution')).toBe(1);
      expect(count((e) => e.type === 'resolution' && e.node === 'g8-relationship-response')).toBe(1);
      expect(count((e) => e.type === 'finalize')).toBe(1);
      expect(count((e) => e.type === 'commit_plan')).toBe(1);
    });
  }

  it('a save before an event does not acquire its effects early; a save after it never reapplies them', () => {
    const cut = full.findIndex((i) => i.kind === 'continue' && i.id === 'g8-execute-return');
    const before = play(newRun(), full.slice(0, cut));
    const saveBefore = verifySave(content(), JSON.parse(JSON.stringify(createSave(before))));
    expect(saveBefore.ok && !('g8-ground-execution-complete' in saveBefore.run.state.ledger.facts)).toBe(true);
    const after = play(newRun(), full.slice(0, cut + 1));
    const saveAfter = verifySave(content(), JSON.parse(JSON.stringify(createSave(after))));
    expect(saveAfter.ok).toBe(true);
    if (saveAfter.ok) {
      play(saveAfter.run, full.slice(cut + 1));
      expect(saveAfter.run.log.filter((e) => e.type === 'effect' && e.effect === 'set_fact' && e.fact === 'g8-ground-execution-complete')).toHaveLength(1);
      expect(saveAfter.run.log.filter((e) => e.type === 'effect' && e.effect === 'adjust')).toHaveLength(6);
    }
  });
});

describe('AC-09 — Invalid inputs and imports are rejected before activation', () => {
  function goodSave(): SaveFile {
    return createSave(playScript({ prep: ['contact'], route: 'later', stance: 'blame' }));
  }
  const reject = (data: unknown, code: RegExp, message?: RegExp) => {
    const r = verifySave(content(), data);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.code).toMatch(code);
      if (message) expect(r.message).toMatch(message);
    }
  };

  it('malformed saves', () => {
    reject(null, /structure/);
    reject('text', /structure/);
    reject({ format: 'other' }, /structure/, /not a Failure is Not an Option save/);
    reject({ format: 'fno-save', save_version: 2 }, /structure/);
    const s = goodSave();
    reject({ ...s, identity: { ...s.identity, inputs: [{ kind: 'option' }] } }, /structure/);
  });

  it('unsupported content versions from earlier packages', () => {
    for (const v of ['0.1.0', '0.2.0', '0.3.0', '0.4.0', '0.5.0', '0.5.1', '0.5.2', '0.5.3']) {
      const s = goodSave();
      s.identity.content_version = v;
      reject(s, /unsupported-content-version/, new RegExp(`content version ${v.replace(/\./g, '\\.')}.*supports 0\\.5\\.5`));
    }
    const s = goodSave();
    s.identity.content_fingerprint = 'deadbeef';
    reject(s, /fingerprint/);
    const t = goodSave();
    t.identity.sim_version = '0.0.1';
    reject(t, /unsupported-sim-version/);
  });

  it('unknown ids, including deleted 0.1.0/0.2.0/0.3.0 ids', () => {
    const s = goodSave();
    s.identity.inputs[1] = { kind: 'option', node: 'g8-prep-select', option: 'g8-account-review' };
    reject(s, /references/, /g8-account-review/);
    const t = goodSave();
    t.identity.inputs.push({ kind: 'option', node: 'g8-report-filing', option: 'g8-file-report' });
    reject(t, /references/);
  });

  it('wrong-node order, second order, impossible prep', () => {
    const s = goodSave();
    const i = s.identity.inputs.findIndex((x) => x.kind === 'option' && x.option === 'g8-return-later');
    s.identity.inputs.splice(i + 1, 0, { kind: 'option', node: 'g8-return-brief', option: 'g8-return-earlier' });
    reject(s, /replay/);
    const t = goodSave();
    [t.identity.inputs[3], t.identity.inputs[4]] = [t.identity.inputs[4]!, t.identity.inputs[3]!];
    reject(t, /replay/);
    const u = goodSave();
    u.identity.inputs.splice(2, 0, { kind: 'option', node: 'g8-prep-select', option: 'g8-prep-recovery' }, { kind: 'option', node: 'g8-prep-select', option: 'g8-prep-systems' });
    reject(u, /replay/);
  });

  it('forged snapshots: opposing resolution, trust, grade, constraint', () => {
    const a = goodSave();
    a.snapshot.mission.node_resolution['g8-ground-execution'] = 'g8-exec-later-2';
    reject(a, /snapshot-mismatch/);
    const b = goodSave();
    b.snapshot.ledger.people['g8-systems']!.trust = 1;
    reject(b, /snapshot-mismatch/);
    const c = goodSave();
    c.snapshot.ledger.facts['g8-later-q2'] = { set_by: 'gemini-8', at_event: 1, label: 'forged' };
    reject(c, /snapshot-mismatch/);
    const d = goodSave();
    delete d.snapshot.ledger.facts['g9-systems-drill-required'];
    d.snapshot.ledger.facts['g9-recovery-drill-required'] = { set_by: 'gemini-8', at_event: 1, label: 'forged' };
    reject(d, /snapshot-mismatch/);
    const e = goodSave();
    e.log_hash = '0'.repeat(64);
    reject(e, /log-hash-mismatch/);
  });

  it('plausible-looking facts alone never bypass replay verification, and the active run is untouched', () => {
    const active = playScript({ prep: ['recovery'], route: 'earlier' });
    const before = canonical(active.state);
    const s = goodSave();
    // Give the snapshot the "right" facts for the blame route but claim a different stance in inputs.
    const idx = s.identity.inputs.findIndex((x) => x.kind === 'option' && x.option === 'g8-back-crew-criticism');
    s.identity.inputs[idx] = { kind: 'option', node: 'g8-accountability-decision', option: 'g8-own-ground-contingencies' };
    reject(s, /snapshot-mismatch/);
    expect(canonical(active.state)).toBe(before);
    expect(canonical(cloneDeep(active.identity))).toBe(canonical(active.identity));
  });
});
