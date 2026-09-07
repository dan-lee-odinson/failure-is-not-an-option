import { describe, expect, it } from 'vitest';
import { canonical, describeFollowOnForRun, describeNode } from '../../core';
import { ORACLE, PREP_SETS, cont, hasFact, indexOf, newRun, opt, play, playScript, prepKey, script, trust, type Prep, type Route } from './helpers';

describe('AC-01 — Earlier prepared return', () => {
  it('recovery + contact, earlier, provenance, finish, recovery+contact plan', () => {
    const run = playScript({ prep: ['recovery', 'contact'], route: 'earlier', lesson: 'provenance', stance: 'ground', plan: 'g9-plan-recovery-contact' });
    expect(run.state.mission.completed?.outcome).toBe('g8-out-earlier-2');
    expect(run.state.mission.completed?.title).toBe('Crew recovered — earlier return, coordinated pickup');
    for (const f of ['g8-earlier-q2', 'g8-crew-recovered', 'g8-long-sea-wait', 'g8-sea-exhaustion-limited', 'g8-pickup-handoff-clean', 'g8-ack-clean', 'g9-recovery-drill-required']) {
      expect(hasFact(run, f), f).toBe(true);
    }
    expect(hasFact(run, 'g8-pickup-ownership-rework')).toBe(false);
    expect(hasFact(run, 'g8-ack-rework')).toBe(false);
    expect(trust(run, 'g8-systems')).toBe(1);
    expect(trust(run, 'g8-recovery')).toBe(0);
    const fo = describeFollowOnForRun(run)!;
    const enabled = fo.plans.filter((p) => p.enabled).map((p) => p.id).sort();
    expect(enabled).toEqual(['g9-plan-recovery-contact', 'g9-plan-recovery-systems']);
    expect(fo.plans.find((p) => p.id === 'g9-plan-systems-contact')!.reason).toBe("This mission must include the recovery drill after Gemini VIII's prolonged sea recovery.");
    expect(run.state.followon.committed).toBe('g9-plan-recovery-contact');
    expect(hasFact(run, 'g9-plan-recovery-contact-committed')).toBe(true);
    expect(hasFact(run, 'g9-plan-committed')).toBe(true);
    // one plan commitment persists
    const again = run.apply({ kind: 'confirm_plan', id: 'g9-confirm-plan', plan: 'g9-plan-recovery-systems' });
    expect(again.ok).toBe(false);
    expect(run.state.followon.committed).toBe('g9-plan-recovery-contact');
  });
});

describe('AC-02 — Later prepared return', () => {
  it('systems + contact, later, provenance, finish, systems+contact plan', () => {
    const run = playScript({ prep: ['systems', 'contact'], route: 'later', lesson: 'provenance', stance: 'ground', plan: 'g9-plan-systems-contact' });
    expect(run.state.mission.completed?.outcome).toBe('g8-out-later-2');
    for (const f of ['g8-later-q2', 'g8-extra-orbit-flown', 'g8-control-reserve-critical', 'g8-warning-handoff-clean', 'g8-ack-clean', 'g8-concentrated-pickup', 'g8-later-splashdown', 'g9-systems-drill-required']) {
      expect(hasFact(run, f), f).toBe(true);
    }
    expect(trust(run, 'g8-systems')).toBe(0);
    expect(trust(run, 'g8-recovery')).toBe(1);
    const fo = describeFollowOnForRun(run)!;
    expect(fo.plans.filter((p) => p.enabled).map((p) => p.id).sort()).toEqual(['g9-plan-recovery-systems', 'g9-plan-systems-contact']);
    expect(fo.plans.find((p) => p.id === 'g9-plan-recovery-contact')!.reason).toBe("This mission must include the systems-warning drill after Gemini VIII's reserve warning.");
  });

  it('preparation creates no physical reserve or extra asset — only performed-rehearsal facts and references', () => {
    const run = play(newRun(), script({ prep: ['systems', 'contact'], upTo: 3 }));
    expect(run.currentNode()!.node.id).toBe('g8-prep-select');
    expect(Object.keys(run.state.ledger.facts).sort()).toEqual(['g8-prepared-contact', 'g8-prepared-systems']);
    expect(Object.keys(run.state.mission.evidence).sort()).toEqual(['g8-ev-contact-primer', 'g8-ev-contact-worksheet', 'g8-ev-rule', 'g8-ev-systems-worksheet']);
    expect(run.state.ledger.quantities).toEqual({ funding: 0, operational_trust: 0, political_capital: 0, authority: 0 });
    for (const p of Object.values(run.state.ledger.people)) expect(p.trust).toBe(0);
  });
});

describe('AC-03 — Unprepared capability and cost', () => {
  it('both options available with no preparation; distinct severe costs', () => {
    const base = script({ prep: [], route: 'earlier', lesson: 'recovery' });
    const atDecision = indexOf(base, (i) => i.kind === 'option' && i.option === 'g8-return-earlier');
    const run = play(newRun(), base.slice(0, atDecision));
    const view = describeNode(run)!;
    expect(view.node.id).toBe('g8-return-brief');
    expect(view.options!.map((o) => o.available)).toEqual([true, true]);
    expect(view.readout!.map((r) => r.ready)).toEqual([false, false, false]);
    // Basic evidence is always there.
    for (const ev of ['g8-ev-return', 'g8-ev-air', 'g8-ev-reserve', 'g8-ev-rule']) expect(run.state.mission.evidence[ev]).toBeTruthy();

    const earlier = playScript({ prep: [], route: 'earlier', lesson: 'recovery' });
    const later = playScript({ prep: [], route: 'later', lesson: 'recovery' });
    expect(hasFact(earlier, 'g8-sea-exhaustion-severe')).toBe(true);
    expect([trust(earlier, 'g8-systems'), trust(earlier, 'g8-recovery')]).toEqual([1, -2]);
    expect(hasFact(later, 'g8-entry-handoff-compressed')).toBe(true);
    expect([trust(later, 'g8-systems'), trust(later, 'g8-recovery')]).toEqual([-2, 1]);
    expect(hasFact(earlier, 'g8-crew-recovered')).toBe(true);
    expect(hasFact(later, 'g8-crew-recovered')).toBe(true);
    expect(earlier.state.mission.completed!.title).not.toBe(later.state.mission.completed!.title);
    expect(hasFact(earlier, 'g9-recovery-drill-required')).toBe(true);
    expect(hasFact(later, 'g9-systems-drill-required')).toBe(true);
    // No implied astronaut incompetence: the crew relationships are untouched by the return.
    for (const r of [earlier, later]) {
      const beforePost = r.log.filter((e) => e.type === 'effect' && e.effect === 'adjust' && /armstrong|scott/.test(e.path) && e.cause.startsWith('g8-rel-'));
      expect(beforePost).toHaveLength(0);
    }
  });
});

describe('AC-04 — Preparation boundaries and execution grades', () => {
  it('duplicate prep, third prep, and early finish', () => {
    const run = play(newRun(), [cont('g8-brief'), opt('g8-prep-select', 'g8-prep-contact')]);
    const before = canonical(run.state);
    const dup = run.apply(opt('g8-prep-select', 'g8-prep-contact'));
    expect(dup.ok).toBe(false);
    if (!dup.ok) expect(dup.message).toContain('Completed');
    expect(canonical(run.state)).toBe(before);
    expect(run.state.mission.attention).toBe(1);
    play(run, [opt('g8-prep-select', 'g8-prep-recovery')]);
    expect(run.state.mission.attention).toBe(0);
    const view = describeNode(run)!;
    const systems = view.options!.find((o) => o.id === 'g8-prep-systems')!;
    expect(systems.available).toBe(false);
    expect(systems.reason).toBe('No preparation opportunities remaining.');
    expect(view.options!.find((o) => o.id === 'g8-prep-contact')!.reason).toBe('Completed');
    const third = run.apply(opt('g8-prep-select', 'g8-prep-systems'));
    expect(third.ok).toBe(false);
    expect(run.state.mission.attention).toBe(0);
    // early finish with zero selections is legal
    const zero = play(newRun(), [cont('g8-brief'), cont('g8-prep-select', 'g8-prep-finish')]);
    expect(zero.currentNode()!.node.id).toBe('g8-docking-report');
    expect(Object.keys(zero.state.ledger.facts)).toEqual([]);
  });

  it('exactly one execution grade per route and prep set, matching the authored matrix', () => {
    for (const prep of PREP_SETS) for (const route of ['earlier', 'later'] as Route[]) {
      const run = playScript({ prep, route });
      const q = ORACLE[prepKey(prep)]![route];
      const grades = ['0', '1', '2'].filter((g) => hasFact(run, `g8-${route}-q${g}`));
      expect(grades, `${prepKey(prep)}/${route}`).toEqual([String(q)]);
      const other = route === 'earlier' ? 'later' : 'earlier';
      expect(['0', '1', '2'].some((g) => hasFact(run, `g8-${other}-q${g}`))).toBe(false);
      expect(hasFact(run, 'g8-ground-execution-complete')).toBe(true);
      expect(run.log.filter((e) => e.type === 'resolution' && e.node === 'g8-ground-execution')).toHaveLength(1);
    }
  });

  it('q1 subcases log the correct clean handoff and the correct remaining rework', () => {
    const cases: [Prep[], Route, string[], string[]][] = [
      [['recovery'], 'earlier', ['g8-pickup-handoff-clean', 'g8-ack-rework'], ['g8-ack-clean', 'g8-pickup-ownership-rework']],
      [['contact'], 'earlier', ['g8-ack-clean', 'g8-pickup-ownership-rework'], ['g8-pickup-handoff-clean', 'g8-ack-rework']],
      [['systems'], 'later', ['g8-warning-handoff-clean', 'g8-ack-rework'], ['g8-ack-clean', 'g8-warning-routing-rework']],
      [['contact'], 'later', ['g8-ack-clean', 'g8-warning-routing-rework'], ['g8-warning-handoff-clean', 'g8-ack-rework']],
      [['recovery', 'systems'], 'earlier', ['g8-pickup-handoff-clean', 'g8-ack-rework'], ['g8-ack-clean']],
      [['recovery', 'systems'], 'later', ['g8-warning-handoff-clean', 'g8-ack-rework'], ['g8-ack-clean']],
      [['systems'], 'earlier', ['g8-pickup-ownership-rework', 'g8-ack-rework'], ['g8-pickup-handoff-clean', 'g8-ack-clean']],
      [['recovery'], 'later', ['g8-warning-routing-rework', 'g8-ack-rework'], ['g8-warning-handoff-clean', 'g8-ack-clean']],
    ];
    for (const [prep, route, present, absent] of cases) {
      const run = playScript({ prep, route });
      for (const f of present) expect(hasFact(run, f), `${prepKey(prep)}/${route} should set ${f}`).toBe(true);
      for (const f of absent) expect(hasFact(run, f), `${prepKey(prep)}/${route} should not set ${f}`).toBe(false);
    }
  });

  it('reading (asking free questions) never changes the grade, facts, trust, notes or procedures', () => {
    // Questions are recorded domain inputs with no effects, so log sequence numbers shift;
    // everything the ledger *says* must be identical.
    const projection = (r: ReturnType<typeof playScript>) => canonical({
      facts: Object.fromEntries(Object.entries(r.state.ledger.facts).map(([k, v]) => [k, { set_by: v.set_by, label: v.label }])),
      people: r.state.ledger.people,
      procedures: r.state.ledger.procedures,
      quantities: r.state.ledger.quantities,
      outcome: r.state.mission.completed?.outcome,
      resolutions: r.state.mission.node_resolution,
    });
    for (const prep of PREP_SETS) {
      const quiet = playScript({ prep, route: 'later' });
      const chatty = playScript({ prep, route: 'later', questions: true });
      expect(projection(chatty)).toBe(projection(quiet));
      expect(chatty.log.filter((e) => e.type === 'effect')).toHaveLength(quiet.log.filter((e) => e.type === 'effect').length);
    }
  });
});
