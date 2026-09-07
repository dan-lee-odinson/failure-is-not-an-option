import { describe, expect, it } from 'vitest';
import { canonical, createSave, describeFollowOnForRun, describeNode, verifySave } from '../../core';
import { cont, content, hasFact, indexOf, newRun, opt, play, playScript, script, trust, type Lesson, type Prep, type Route } from './helpers';

const lessons: Lesson[] = ['provenance', 'recovery'];
const sixOutcomes: [Prep[], Route][] = [[[], 'earlier'], [['recovery'], 'earlier'], [['recovery', 'contact'], 'earlier'], [[], 'later'], [['systems'], 'later'], [['systems', 'contact'], 'later']];
const ASTRONAUTS = ['armstrong', 'scott', 'cunningham', 'stafford'];

describe('AC-15 — Same flight, different accountability', () => {
  it('blame and ground routes share the flight and differ only in the social state', () => {
    for (const [prep, route] of sixOutcomes) for (const lesson of lessons) {
      const blame = playScript({ prep, route, lesson, stance: 'blame' });
      const ground = playScript({ prep, route, lesson, stance: 'ground' });
      const tag = `${prep.join('+')}/${route}/${lesson}`;
      const cutB = blame.log.findIndex((x) => x.type === 'input' && x.input.kind === 'option' && x.input.option === 'g8-back-crew-criticism');
      const cutG = ground.log.findIndex((x) => x.type === 'input' && x.input.kind === 'option' && x.input.option === 'g8-own-ground-contingencies');
      expect(canonical(blame.log.slice(0, cutB)), tag).toBe(canonical(ground.log.slice(0, cutG)));
      expect(blame.state.mission.completed!.outcome).toBe(ground.state.mission.completed!.outcome);
      for (const f of Object.keys(blame.state.ledger.facts).filter((f) => f.startsWith('g8-') && !/blame|ground|corps|critic|confidence|contingency|accountability/.test(f))) {
        expect(hasFact(ground, f), `${tag} ${f}`).toBe(true);
      }
      expect([trust(blame, 'g8-systems'), trust(blame, 'g8-recovery')]).toEqual([trust(ground, 'g8-systems'), trust(ground, 'g8-recovery')]);
      const pb = describeFollowOnForRun(blame)!.plans.map((p) => p.enabled);
      const pg = describeFollowOnForRun(ground)!.plans.map((p) => p.enabled);
      expect(pb).toEqual(pg);

      expect(ASTRONAUTS.map((a) => trust(blame, a)), tag).toEqual([-2, -2, 1, 1]);
      expect(hasFact(blame, 'g8-corps-division-deepened') && hasFact(blame, 'g8-critic-support-gained')).toBe(true);
      expect(blame.state.ledger.procedures).not.toContain('proc-docked-contingencies');
      expect(hasFact(blame, 'g8-docked-contingency-work-ordered')).toBe(false);

      expect(ASTRONAUTS.map((a) => trust(ground, a)), tag).toEqual([1, 1, 0, 0]);
      expect(hasFact(ground, 'g8-crew-confidence-strengthened') && hasFact(ground, 'g8-docked-contingency-work-ordered')).toBe(true);
      expect(ground.state.ledger.procedures).toContain('proc-docked-contingencies');
      expect(hasFact(ground, 'g8-corps-division-deepened')).toBe(false);

      for (const r of [blame, ground]) expect(r.state.mission.evidence['g8-ev-postflight-context']).toBeTruthy();
      expect(content().evidence.get('g8-ev-postflight-context')!.body).toContain('cleared Armstrong and Scott');

      // social states persist into the follow-on without changing the roster or crew skill
      const fb = describeFollowOnForRun(blame)!;
      const fg = describeFollowOnForRun(ground)!;
      expect(fb.status_blocks.map((s) => s.id)).toEqual(['g9-status-corps-divided']);
      expect(fg.status_blocks.map((s) => s.id)).toEqual(['g9-status-contingency-work']);
      expect(fb.astronauts.map((a) => a.id)).toEqual(fg.astronauts.map((a) => a.id));
    }
  });
});

describe('AC-16 — Accountability boundaries and evidence', () => {
  const full = script({ prep: ['contact'], route: 'later', stance: 'blame', plan: 'g9-plan-systems-contact' });
  const at = (id: string) => full.findIndex((i) => (i.kind === 'continue' && i.id === id) || (i.kind === 'option' && i.option === id) || (i.kind === 'confirm_plan' && id === 'plan'));

  it('save/import/replay at context, after stance before response, after response, finish, and plan commit', () => {
    const reference = play(newRun(), full);
    const cuts = [at('g8-adopt-provenance') + 1, at('g8-back-crew-criticism') + 1, at('g8-resolve-accountability') + 1, at('g8-finish') + 1, at('plan') + 1];
    for (const cut of cuts) {
      const partial = play(newRun(), full.slice(0, cut));
      const v = verifySave(content(), JSON.parse(JSON.stringify(createSave(partial))));
      expect(v.ok).toBe(true);
      if (!v.ok) continue;
      play(v.run, full.slice(cut));
      expect(canonical(v.run.state)).toBe(canonical(reference.state));
      expect(v.run.canonicalLog()).toBe(reference.canonicalLog());
    }
  });

  it('a pending response has the stance only and no social consequence', () => {
    const run = play(newRun(), full.slice(0, at('g8-back-crew-criticism') + 1));
    expect(run.currentNode()!.node.id).toBe('g8-accountability-receipt');
    expect(hasFact(run, 'g8-crew-blame-chosen')).toBe(true);
    expect(hasFact(run, 'g8-accountability-resolved')).toBe(false);
    for (const a of ASTRONAUTS) {
      expect(trust(run, a)).toBe(0);
      expect(run.state.ledger.people[a]!.notes).toEqual([]);
    }
    const view = describeNode(run)!;
    expect(view.node.text).toContain('Response pending.');
    expect(view.node.text).toContain("I agree with the criticism.");
  });

  it('duplicate/opposing stances, replayed responses and early finish are rejected', () => {
    const run = play(newRun(), full.slice(0, at('g8-back-crew-criticism') + 1));
    const before = canonical(run.state);
    expect(run.apply(opt('g8-accountability-decision', 'g8-own-ground-contingencies')).ok).toBe(false);
    expect(run.apply(opt('g8-accountability-decision', 'g8-back-crew-criticism')).ok).toBe(false);
    expect(run.apply(cont('g8-accountability-receipt', 'g8-finish')).ok).toBe(false);
    expect(canonical(run.state)).toBe(before);
    play(run, [cont('g8-accountability-receipt', 'g8-resolve-accountability')]);
    expect(run.apply(cont('g8-accountability-receipt', 'g8-resolve-accountability')).ok).toBe(false);
    expect(run.log.filter((e) => e.type === 'resolution' && e.node === 'g8-accountability-response')).toHaveLength(1);
    for (const a of ASTRONAUTS) expect(run.log.filter((e) => e.type === 'effect' && e.effect === 'adjust' && e.path === `people.${a}.trust`)).toHaveLength(1);
  });

  it('impossible astronaut state, both/no stance, and unsupported 0.3.0 saves are rejected', () => {
    const run = playScript({ prep: ['contact'], route: 'later', stance: 'blame' });
    const fact = { set_by: 'gemini-8', at_event: 1, label: 'forged' };
    const forge = (m: (s: ReturnType<typeof createSave>) => void) => {
      const s = createSave(run);
      m(s);
      expect(verifySave(content(), JSON.parse(JSON.stringify(s))).ok).toBe(false);
    };
    forge((s) => { s.snapshot.ledger.people['armstrong']!.trust = 5; });
    forge((s) => { s.snapshot.ledger.facts['g8-ground-accountability-chosen'] = fact; });
    forge((s) => { delete s.snapshot.ledger.facts['g8-crew-blame-chosen']; });
    forge((s) => { s.identity.content_version = '0.3.0'; });
    const r = verifySave(content(), (() => { const s = createSave(run); s.identity.content_version = '0.3.0'; return JSON.parse(JSON.stringify(s)); })());
    if (!r.ok) expect(r.message).toMatch(/0\.3\.0.*no migration/);
  });

  it('post-flight context cannot leak into the flight', () => {
    const s = script({ prep: ['contact', 'systems'], route: 'later' });
    const postIdx = indexOf(s, (i) => i.kind === 'continue' && i.id === 'g8-accountability-brief-continue');
    const run = newRun();
    for (let i = 0; i < postIdx; i++) {
      expect(run.state.mission.evidence['g8-ev-postflight-context'], `before input ${i}`).toBeUndefined();
      const node = run.currentNode()!.node.id;
      if (node === 'g8-accountability-brief') break;
      play(run, [s[i]!]);
    }
    expect(run.currentNode()!.node.id).toBe('g8-accountability-brief');
    expect(run.state.mission.evidence['g8-ev-postflight-context']).toBeTruthy();
  });

  it('exactly one baseline lesson; the ground task is valid and is not a second lesson or a completed rehearsal', () => {
    const s = script({ prep: [], route: 'earlier', lesson: 'provenance', stance: 'ground' });
    const idx = indexOf(s, (i) => i.kind === 'option' && i.option === 'g8-adopt-provenance');
    const run = play(newRun(), s.slice(0, idx + 1));
    expect(run.apply(opt('g8-lesson-decision', 'g8-adopt-recovery')).ok).toBe(false);
    play(run, s.slice(idx + 1));
    expect(run.state.ledger.procedures).toEqual(['proc-report-provenance', 'proc-docked-contingencies']);
    expect(content().procedures.get('proc-docked-contingencies')!.status).toBe('commissioned-task');
    expect(Object.keys(run.state.ledger.facts).filter((f) => f.startsWith('g8-prepared-'))).toEqual([]);
    expect(run.state.mission.completed).toBeTruthy();
  });

  it('selecting, reading, or committing an IX-A plan never repairs the corps rift or reapplies relationship changes', () => {
    const run = playScript({ prep: [], route: 'earlier', stance: 'blame' });
    const trustBefore = ASTRONAUTS.map((a) => trust(run, a));
    const factsBefore = Object.keys(run.state.ledger.facts).sort();
    play(run, [{ kind: 'confirm_plan', id: 'g9-confirm-plan', plan: 'g9-plan-recovery-contact' }]);
    expect(ASTRONAUTS.map((a) => trust(run, a))).toEqual(trustBefore);
    expect(hasFact(run, 'g8-corps-division-deepened')).toBe(true);
    const added = Object.keys(run.state.ledger.facts).filter((f) => !factsBefore.includes(f)).sort();
    expect(added).toEqual(['g9-plan-committed', 'g9-plan-recovery-contact-committed']);
    expect(run.log.filter((e) => e.type === 'effect' && e.effect === 'adjust')).toHaveLength(6);
    expect(describeFollowOnForRun(run)!.status_blocks[0]!.id).toBe('g9-status-corps-divided');
  });
});
