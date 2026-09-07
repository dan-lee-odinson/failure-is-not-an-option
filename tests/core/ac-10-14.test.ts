import { describe, expect, it } from 'vitest';
import { canonical, cloneDeep, createSave, describeDebrief, describeFollowOn, describeFollowOnForRun, describeNode, replay, verifySave, type Ledger } from '../../core';
import { PREP_SETS, ORACLE, cont, content, hasFact, indexOf, newRun, play, playScript, prepKey, script, trust, type Lesson, type Prep, type Route, type Stance } from './helpers';

const routes: Route[] = ['earlier', 'later'];
const lessons: Lesson[] = ['provenance', 'recovery'];
const stances: Stance[] = ['blame', 'ground'];

describe('AC-10 — Causal debrief', () => {
  it('every debrief assertion traces to a recorded action and its effect', () => {
    for (const prep of PREP_SETS) for (const route of routes) for (const lesson of lessons) for (const stance of stances) {
      const run = playScript({ prep, route, lesson, stance });
      const d = describeDebrief(run)!;
      const ids = d.paragraphs.map((p) => p.id);
      const tag = `${prepKey(prep)}/${route}/${lesson}/${stance}`;
      expect(run.log.filter((e) => e.type === 'finalize'), tag).toHaveLength(1);
      expect(ids).toContain('g8-db-return');
      expect(ids.includes('g8-db-earlier'), tag).toBe(route === 'earlier');
      expect(ids.includes('g8-db-later'), tag).toBe(route === 'later');
      expect(ids.includes('g8-db-pickup-clean'), tag).toBe(prep.includes('recovery') && hasFact(run, 'g8-pickup-handoff-clean'));
      expect(ids.includes('g8-db-warning-clean'), tag).toBe(prep.includes('systems') && hasFact(run, 'g8-warning-handoff-clean'));
      expect(ids.includes('g8-db-ack-clean'), tag).toBe(prep.includes('contact') && hasFact(run, 'g8-ack-clean'));
      const rework = ['g8-pickup-ownership-rework', 'g8-ack-rework', 'g8-warning-routing-rework'].some((f) => hasFact(run, f));
      expect(ids.includes('g8-db-rework'), tag).toBe(rework);
      expect(rework, tag).toBe(ORACLE[prepKey(prep)]![route] < 2);
      expect(ids.includes('g8-db-recovery-next'), tag).toBe(route === 'earlier');
      expect(ids.includes('g8-db-systems-next'), tag).toBe(route === 'later');
      expect(ids.includes('g8-db-provenance'), tag).toBe(lesson === 'provenance');
      expect(ids.includes('g8-db-recovery-procedure'), tag).toBe(lesson === 'recovery');
      expect(ids.includes('g8-db-crew-blame'), tag).toBe(stance === 'blame');
      expect(ids.includes('g8-db-ground-accountability'), tag).toBe(stance === 'ground');
      // The consequence and reaction are quoted from recorded resolutions, not generated.
      expect(d.consequence!.resolution).toBe(run.state.mission.node_resolution['g8-return-beat-2']);
      expect(d.relationship!.resolution).toBe(run.state.mission.node_resolution['g8-relationship-response']);
      expect(d.relationship!.adjustments).toHaveLength(2);
      const text = d.paragraphs.map((p) => p.text).join(' ');
      expect(text).not.toMatch(/%|odds|chance|diagnos|knots|incompeten/i);
    }
  });

  it('scheduled IX-A plans are not labeled completed training', () => {
    const run = playScript({ prep: ['contact'], route: 'earlier' });
    const factsBefore = Object.keys(run.state.ledger.facts);
    play(run, [{ kind: 'confirm_plan', id: 'g9-confirm-plan', plan: 'g9-plan-recovery-systems' }]);
    const added = Object.keys(run.state.ledger.facts).filter((f) => !factsBefore.includes(f)).sort();
    expect(added).toEqual(['g9-plan-committed', 'g9-plan-recovery-systems-committed']);
    expect(Object.keys(run.state.ledger.facts).filter((f) => f.startsWith('g8-prepared-'))).toEqual(['g8-prepared-contact']);
  });
});

describe('AC-11 — Follow-on independence and real action', () => {
  it('initializes from the committed ledger and completion record alone', () => {
    for (const route of routes) for (const stance of stances) for (const lesson of lessons) {
      const run = playScript({ prep: ['contact'], route, stance, lesson });
      const ledger = cloneDeep(run.state.ledger) as Ledger;
      const completion = cloneDeep(run.state.mission.completed!);
      const view = describeFollowOn(content(), ledger, completion, null);
      expect(view.plans).toHaveLength(3);
      const enabled = view.plans.filter((p) => p.enabled);
      expect(enabled).toHaveLength(2);
      const disabled = view.plans.find((p) => !p.enabled)!;
      if (route === 'earlier') {
        expect(disabled.id).toBe('g9-plan-systems-contact');
        expect(view.constraint_text).toBe('The crew paid for the earlier return with a long sea wait. Recovery rehearsal is required. Choose the other exercise.');
      } else {
        expect(disabled.id).toBe('g9-plan-recovery-contact');
        expect(view.constraint_text).toBe('The extra orbit carried a critical-reserve warning. Systems-warning rehearsal is required. Choose the other exercise.');
      }
      // Trust displays with the authored labels; critical information stays visible regardless.
      for (const c of view.controllers) expect(c.label).toBe({ '1': 'Confidence strengthened', '0': 'Working confidence', '-1': 'Confidence strained', '-2': 'Confidence damaged' }[String(c.trust)]);
      expect(view.astronauts.map((a) => a.id)).toEqual(['armstrong', 'scott', 'cunningham', 'stafford']);
      expect(view.status_blocks.map((b) => b.id)).toEqual([stance === 'blame' ? 'g9-status-corps-divided' : 'g9-status-contingency-work']);
    }
  });

  it('procedure choice changes only the reference, never the plan constraint', () => {
    const a = describeFollowOnForRun(playScript({ prep: [], route: 'later', lesson: 'provenance' }))!;
    const b = describeFollowOnForRun(playScript({ prep: [], route: 'later', lesson: 'recovery' }))!;
    expect(a.plans.map((p) => p.enabled)).toEqual(b.plans.map((p) => p.enabled));
    expect(a.procedures).not.toEqual(b.procedures);
  });

  it('each legal plan can be confirmed exactly once; disabled plans are rejected; the commit sets one plan fact plus the marker', () => {
    for (const route of routes) {
      const base = playScript({ prep: ['contact'], route });
      const view = describeFollowOnForRun(base)!;
      for (const plan of view.plans) {
        const run = replay(content(), base.identity);
        const before = Object.keys(run.state.ledger.facts);
        const r = run.apply({ kind: 'confirm_plan', id: 'g9-confirm-plan', plan: plan.id });
        expect(r.ok, `${route} ${plan.id}`).toBe(plan.enabled);
        if (plan.enabled) {
          const added = Object.keys(run.state.ledger.facts).filter((f) => !before.includes(f)).sort();
          expect(added).toEqual([`${plan.id}-committed`, 'g9-plan-committed'].sort());
          expect(run.state.followon.committed).toBe(plan.id);
          const again = run.apply({ kind: 'confirm_plan', id: 'g9-confirm-plan', plan: plan.id });
          expect(again.ok).toBe(false);
          expect(run.log.filter((e) => e.type === 'commit_plan')).toHaveLength(1);
        } else {
          expect(Object.keys(run.state.ledger.facts)).toEqual(before);
          expect(run.state.followon.committed).toBeNull();
        }
      }
    }
  });
});

describe('AC-13 — Operational divergence with equal preparation', () => {
  it('for every prep set and lesson, the two orders differ in outcome, controller trust, and eligible plans', () => {
    for (const prep of PREP_SETS) for (const lesson of lessons) {
      const e = playScript({ prep, route: 'earlier', lesson });
      const l = playScript({ prep, route: 'later', lesson });
      const tag = `${prepKey(prep)}/${lesson}`;
      // same historical prefix up to the return choice
      const cutE = e.log.findIndex((x) => x.type === 'input' && x.input.kind === 'option' && x.input.option === 'g8-return-earlier');
      const cutL = l.log.findIndex((x) => x.type === 'input' && x.input.kind === 'option' && x.input.option === 'g8-return-later');
      expect(cutE, tag).toBe(cutL);
      expect(canonical(e.log.slice(0, cutE))).toBe(canonical(l.log.slice(0, cutL)));
      expect(e.state.ledger.quantities).toEqual(l.state.ledger.quantities);
      expect(hasFact(e, 'g8-crew-recovered') && hasFact(l, 'g8-crew-recovered')).toBe(true);
      expect(e.state.mission.completed!.outcome, tag).not.toBe(l.state.mission.completed!.outcome);
      expect(e.state.mission.completed!.title, tag).not.toBe(l.state.mission.completed!.title);
      expect([trust(e, 'g8-systems'), trust(e, 'g8-recovery')], tag).not.toEqual([trust(l, 'g8-systems'), trust(l, 'g8-recovery')]);
      expect(hasFact(e, 'g9-recovery-drill-required') && !hasFact(e, 'g9-systems-drill-required')).toBe(true);
      expect(hasFact(l, 'g9-systems-drill-required') && !hasFact(l, 'g9-recovery-drill-required')).toBe(true);
      const pe = describeFollowOnForRun(e)!.plans.filter((p) => p.enabled).map((p) => p.id).sort();
      const pl = describeFollowOnForRun(l)!.plans.filter((p) => p.enabled).map((p) => p.id).sort();
      expect(pe, tag).not.toEqual(pl);
      // earlier: exposure ends sooner, pays the sea wait; later: closer pickup, pays the critical-reserve extra orbit
      expect(hasFact(e, 'g8-earlier-splashdown') && hasFact(e, 'g8-long-sea-wait')).toBe(true);
      expect(hasFact(e, 'g8-extra-orbit-flown') || hasFact(e, 'g8-control-reserve-critical') || hasFact(e, 'g8-concentrated-pickup')).toBe(false);
      expect(hasFact(l, 'g8-extra-orbit-flown') && hasFact(l, 'g8-control-reserve-critical') && hasFact(l, 'g8-concentrated-pickup')).toBe(true);
      expect(hasFact(l, 'g8-long-sea-wait') || hasFact(l, 'g8-earlier-splashdown')).toBe(false);
      // preparation mitigates execution quality without removing a base cost or disabling an order
      const q = ORACLE[prepKey(prep)]!;
      expect(hasFact(e, `g8-earlier-q${q.earlier}`)).toBe(true);
      expect(hasFact(l, `g8-later-q${q.later}`)).toBe(true);
    }
  });

  it('both orders are available for every prep set at the decision', () => {
    for (const prep of PREP_SETS) {
      const s = script({ prep });
      const idx = indexOf(s, (i) => i.kind === 'option' && i.option === 'g8-return-earlier');
      const run = play(newRun(), s.slice(0, idx));
      expect(describeNode(run)!.options!.map((o) => o.available)).toEqual([true, true]);
    }
  });
});

describe('AC-14 — Boundaries, invalid chains and follow-on persistence', () => {
  const allResolutions: [Prep[], Route][] = [[[], 'earlier'], [['recovery'], 'earlier'], [['recovery', 'contact'], 'earlier'], [[], 'later'], [['systems'], 'later'], [['systems', 'contact'], 'later']];

  it('save before/after execution and before/after relationships on all six resolutions; import/replay through the follow-on', () => {
    for (const [prep, route] of allResolutions) {
      const plan = route === 'earlier' ? 'g9-plan-recovery-contact' : 'g9-plan-systems-contact';
      const full = script({ prep, route, plan });
      const points = ['g8-execute-return', 'g8-ground-execution-continue', 'g8-pickup-report-continue', 'g8-relationship-response-continue'].map((id) => full.findIndex((i) => i.kind === 'continue' && i.id === id));
      const reference = play(newRun(), full);
      for (const p of points) {
        for (const cut of [p, p + 1]) {
          const partial = play(newRun(), full.slice(0, cut));
          const v = verifySave(content(), JSON.parse(JSON.stringify(createSave(partial))));
          expect(v.ok).toBe(true);
          if (!v.ok) continue;
          play(v.run, full.slice(cut));
          expect(canonical(v.run.state)).toBe(canonical(reference.state));
          expect(v.run.log.filter((e) => e.type === 'resolution' && e.node === 'g8-ground-execution')).toHaveLength(1);
          expect(v.run.log.filter((e) => e.type === 'effect' && e.effect === 'adjust')).toHaveLength(6);
          expect(v.run.log.filter((e) => e.type === 'commit_plan')).toHaveLength(1);
        }
      }
    }
  });

  it('invalid chains in a snapshot are rejected without touching the session', () => {
    const base = playScript({ prep: ['recovery'], route: 'earlier' });
    const before = canonical(base.state);
    const forge = (mutate: (s: ReturnType<typeof createSave>) => void) => {
      const s = createSave(base);
      mutate(s);
      const r = verifySave(content(), JSON.parse(JSON.stringify(s)));
      expect(r.ok).toBe(false);
      expect(canonical(base.state)).toBe(before);
    };
    const fact = { set_by: 'gemini-8', at_event: 1, label: 'forged' };
    forge((s) => { s.snapshot.ledger.facts['g8-return-later-ordered'] = fact; });                       // both orders
    forge((s) => { delete s.snapshot.ledger.facts['g8-return-earlier-ordered']; });                     // no order
    forge((s) => { s.snapshot.ledger.facts['g8-earlier-q2'] = fact; });                                 // both grades
    forge((s) => { delete s.snapshot.ledger.facts['g8-earlier-q1']; });                                 // no grade
    forge((s) => { s.snapshot.ledger.facts['g8-entry-handoff-clean'] = fact; });                        // crossed consequence
    forge((s) => { s.snapshot.ledger.facts['g9-systems-drill-required'] = fact; });                     // both drills
    forge((s) => { delete s.snapshot.ledger.facts['g9-recovery-drill-required']; });                    // no drill
    forge((s) => { s.snapshot.ledger.people['g8-recovery']!.notes = []; });                              // mismatched notes
    forge((s) => { s.snapshot.ledger.facts['g8-ack-clean'] = fact; });                                  // forged unperformed-rehearsal benefit
    forge((s) => { s.snapshot.ledger.people['g8-systems']!.trust = 2; });                                // forged trust
  });

  it('premature recovered evidence, early finish, and an unavailable IX-A confirm are rejected', () => {
    const s = script({ prep: [], route: 'later' });
    const atReceipt = indexOf(s, (i) => i.kind === 'continue' && i.id === 'g8-execute-return');
    const run = play(newRun(), s.slice(0, atReceipt));
    const save = createSave(run);
    save.snapshot.mission.evidence['g8-ev-recovered'] = { at_event: 3, phase: 'g8-recovery', stage: 'x', channel: 'houston', node: 'g8-order-receipt' };
    expect(verifySave(content(), JSON.parse(JSON.stringify(save))).ok).toBe(false);
    // early finish
    const early = run.apply(cont('g8-order-receipt', 'g8-finish'));
    expect(early.ok).toBe(false);
    const laterScript = script({ prep: [], route: 'later' });
    const atResolve = indexOf(laterScript, (i) => i.kind === 'continue' && i.id === 'g8-resolve-accountability');
    const full = play(newRun(), laterScript.slice(0, atResolve));
    expect(full.currentNode()!.node.id).toBe('g8-accountability-receipt');
    expect(full.apply(cont('g8-accountability-receipt', 'g8-finish')).ok).toBe(false);
    // unavailable confirm
    const done = playScript({ prep: [], route: 'later' });
    expect(done.apply({ kind: 'confirm_plan', id: 'g9-confirm-plan', plan: 'g9-plan-recovery-contact' }).ok).toBe(false);
  });

  it('no UI read, procedure adoption or reload clears an operational cost; completion is immutable after the plan commit', () => {
    for (const lesson of lessons) {
      const run = playScript({ prep: [], route: 'earlier', lesson });
      expect(hasFact(run, 'g8-sea-exhaustion-severe')).toBe(true);
      expect(trust(run, 'g8-recovery')).toBe(-2);
      const completion = cloneDeep(run.state.mission.completed);
      const reloaded = verifySave(content(), JSON.parse(JSON.stringify(createSave(run))));
      expect(reloaded.ok).toBe(true);
      if (!reloaded.ok) continue;
      play(reloaded.run, [{ kind: 'confirm_plan', id: 'g9-confirm-plan', plan: 'g9-plan-recovery-systems' }]);
      expect(reloaded.run.state.mission.completed).toEqual(completion);
      expect(hasFact(reloaded.run, 'g8-sea-exhaustion-severe')).toBe(true);
      expect(trust(reloaded.run, 'g8-recovery')).toBe(-2);
    }
  });
});
