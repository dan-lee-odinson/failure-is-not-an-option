/**
 * Encounter-based availability (FNO-PT3, content 0.5.5, doc 49 R2; Codex's availability contract and item audit):
 * what the Evidence list, the Binder, the citation links and the History panel may show is acquisition / adoption AND
 * the encounter that presents the item, derived from the run's inputs alone — a live run and a replayed save agree,
 * nothing enters the log, and every item of the audit table appears at its own scene and never before.
 */
import { describe, expect, it } from 'vitest';
import { Run, replay, describeNode, describeVisibleEvidence, visibleProcedures, describeHistory, deriveEncounters, unlockedEvidenceIds, describeCommittedDecision } from '../../core';
import { content } from './helpers';

const index = content();

function fresh(): Run {
  return new Run(index, { seed: 1 });
}
function cont(run: Run, id: string): void {
  const cur = run.currentNode()!;
  const r = run.apply({ kind: 'continue', node: cur.node.id, id });
  if (!r.ok) throw new Error(`${cur.node.id} continue ${id}: ${r.message}`);
}
function opt(run: Run, option: string): void {
  const cur = run.currentNode()!;
  const r = run.apply({ kind: 'option', node: cur.node.id, option });
  if (!r.ok) throw new Error(`${cur.node.id} option ${option}: ${r.message}`);
}
function ask(run: Run, question: string): void {
  const cur = run.currentNode()!;
  const r = run.apply({ kind: 'question', node: cur.node.id, question });
  if (!r.ok) throw new Error(`${cur.node.id} question ${question}: ${r.message}`);
}
const visible = (run: Run): string[] => describeVisibleEvidence(run).map((e) => e.id).sort();
const acquired = (run: Run): string[] => Object.keys(run.state.mission.evidence).sort();
const nodeId = (run: Run): string => run.currentNode()!.node.id;

/** The briefing through the docking report, with the given preparations. */
function toDocking(run: Run, preps: string[]): void {
  cont(run, 'g8-brief-continue');
  for (const p of preps) opt(run, `g8-prep-${p}`);
  cont(run, 'g8-prep-finish');
  expect(nodeId(run)).toBe('g8-docking-report');
}

describe('encounter-based availability (R2)', () => {
  it('a fresh run shows nothing: the rule and the primer are acquired at the briefing but locked, the Binder is empty, History is bare', () => {
    const run = fresh();
    expect(nodeId(run)).toBe('g8-brief');
    expect(acquired(run)).toEqual(['g8-ev-contact-primer', 'g8-ev-rule']);
    expect(visible(run)).toEqual([]);
    expect(visibleProcedures(run)).toEqual([]);
    const h = describeHistory(index, run, false);
    expect(h.explanation).toBe(false);
    expect(h.prologueNote).toBe(false);
    expect(h.capcomNote).toBe(false);
    expect(h.sources.filter((s) => s.title)).toEqual([]);
    // The citation links of the briefing's lines and the preparation options name no locked item.
    const view = describeNode(run)!;
    for (const l of view.lines) expect(l.cites).toEqual([]);
    cont(run, 'g8-brief-continue');
    for (const o of describeNode(run)!.options ?? []) expect(o.evidence).toEqual([]);
  });

  it('each preparation worksheet appears with its own rehearsal and never without it; the unchosen drill stays absent', () => {
    for (const preps of [['contact'], ['recovery'], ['systems'], ['contact', 'recovery'], []]) {
      const run = fresh();
      cont(run, 'g8-brief-continue');
      for (const p of preps) {
        opt(run, `g8-prep-${p}`);
        expect(visible(run)).toContain(`g8-ev-${p}-worksheet`);
      }
      const expected = preps.map((p) => `g8-ev-${p}-worksheet`).sort();
      expect(visible(run)).toEqual(expected);
      const enc = deriveEncounters(run);
      expect([...enc.preparations].sort()).toEqual(preps.map((p) => `g8-prep-${p}`).sort());
    }
  });

  it('the primer at loss of contact, the docking report with Lovell, the rule and the stabilization receipt with Mara — each at its scene, not before', () => {
    const run = fresh();
    toDocking(run, ['contact']);
    expect(visible(run)).toEqual(['g8-ev-contact-worksheet', 'g8-ev-docked']); // g8-line-docking-confirmation displayed here
    expect(describeHistory(index, run, false).capcomNote).toBe(true); // Lovell has spoken
    cont(run, 'g8-docking-report-continue');
    expect(nodeId(run)).toBe('g8-loss-of-contact');
    expect(visible(run)).toContain('g8-ev-contact-primer');
    expect(visible(run)).not.toContain('g8-ev-rule');
    cont(run, 'g8-loss-of-contact-continue');
    cont(run, 'g8-gap-note-continue');
    expect(nodeId(run)).toBe('g8-crisis-report');
    expect(visible(run)).toContain('g8-ev-crisis');
    expect(visible(run)).not.toContain('g8-ev-rule');
    cont(run, 'g8-crisis-report-continue');
    expect(nodeId(run)).toBe('g8-stabilization-report');
    expect(visible(run)).toContain('g8-ev-rule');
    expect(visible(run)).toContain('g8-ev-stabilized');
  });

  it('the return cards: the planning report with Elias, the air and reserve cards only after their own questions, the readbacks only with their rehearsals', () => {
    const play = (preps: string[], questions: string[]): { run: Run; ids: string[] } => {
      const run = fresh();
      toDocking(run, preps);
      cont(run, 'g8-docking-report-continue');
      cont(run, 'g8-loss-of-contact-continue');
      cont(run, 'g8-gap-note-continue');
      cont(run, 'g8-crisis-report-continue');
      cont(run, 'g8-stabilization-report-continue');
      opt(run, 'g8-order-return');
      expect(nodeId(run)).toBe('g8-return-brief');
      for (const q of questions) ask(run, q);
      return { run, ids: visible(run) };
    };
    const none = play([], []);
    expect(none.ids).toContain('g8-ev-return');
    expect(none.ids).not.toContain('g8-ev-air');
    expect(none.ids).not.toContain('g8-ev-reserve');
    for (const rb of ['recovery', 'systems', 'contact']) expect(none.ids).not.toContain(`g8-ev-${rb}-readback`);
    const asked = play(['recovery', 'systems'], ['g8-q-reserve-risk']);
    expect(asked.ids).toContain('g8-ev-reserve');
    expect(asked.ids).not.toContain('g8-ev-air'); // the recovery-risk question was not asked
    expect(asked.ids).toContain('g8-ev-recovery-readback');
    expect(asked.ids).toContain('g8-ev-systems-readback');
    expect(asked.ids).not.toContain('g8-ev-contact-readback');
    // The air card arrives with its own answer and stays; the unasked question keeps its card hidden to the end.
    ask(asked.run, 'g8-q-recovery-risk');
    expect(visible(asked.run)).toContain('g8-ev-air');
  });

  it('the recovery, the post-flight context, the standing procedure and the commissioned task each arrive at their scene on their branch', () => {
    const finish = (lesson: 'provenance' | 'recovery', stance: 'ground' | 'crew'): Run => {
      const run = fresh();
      toDocking(run, ['recovery']);
      cont(run, 'g8-docking-report-continue');
      cont(run, 'g8-loss-of-contact-continue');
      cont(run, 'g8-gap-note-continue');
      cont(run, 'g8-crisis-report-continue');
      cont(run, 'g8-stabilization-report-continue');
      opt(run, 'g8-order-return');
      opt(run, 'g8-return-earlier');
      cont(run, 'g8-execute-return');
      cont(run, 'g8-ground-execution-continue');
      cont(run, 'g8-return-beat-1-continue');
      cont(run, 'g8-return-beat-2-continue');
      expect(nodeId(run)).toBe('g8-pickup-report');
      expect(visible(run)).toContain('g8-ev-recovered');
      cont(run, 'g8-pickup-report-continue');
      cont(run, 'g8-relationship-response-continue');
      expect(nodeId(run)).toBe('g8-lesson-decision');
      expect(visibleProcedures(run)).toEqual([]); // the lesson node presented, nothing adopted yet
      expect(visible(run)).not.toContain('g8-ev-postflight-context');
      opt(run, `g8-adopt-${lesson}`);
      expect(visibleProcedures(run)).toEqual([lesson === 'provenance' ? 'proc-report-provenance' : 'proc-recovery-crosscheck']);
      expect(nodeId(run)).toBe('g8-accountability-brief');
      expect(visible(run)).toContain('g8-ev-postflight-context'); // g8-line-postflight-context displayed here
      cont(run, 'g8-accountability-brief-continue');
      opt(run, stance === 'ground' ? 'g8-own-ground-contingencies' : 'g8-back-crew-criticism');
      cont(run, 'g8-resolve-accountability');
      cont(run, 'g8-finish');
      expect(run.state.mission.completed).not.toBeNull();
      return run;
    };
    const ground = finish('provenance', 'ground');
    expect(visibleProcedures(ground)).toEqual(['proc-report-provenance', 'proc-docked-contingencies']);
    const crew = finish('recovery', 'crew');
    expect(visibleProcedures(crew)).toEqual(['proc-recovery-crosscheck']);
    // History after the mission: every source's title and note, the explanation, the CAPCOM note.
    const h = describeHistory(index, ground, false);
    expect(h.explanation).toBe(true);
    expect(h.capcomNote).toBe(true);
    expect(h.sources.every((s) => s.title && s.note)).toBe(true);
  });

  it('History before the mission ends: only cited titles, no notes; the facility note only when the plates were walked; the explanation only once play has left the record', () => {
    const run = fresh();
    toDocking(run, []);
    const h = describeHistory(index, run, false);
    expect(h.prologueNote).toBe(false);
    expect(h.explanation).toBe(false);
    const titled = h.sources.filter((s) => s.title).map((s) => s.id);
    expect(titled).toContain('H7'); // Lovell's relay line cites H7
    expect(titled).toContain('H3'); // the docking report card cites H3
    expect(h.sources.filter((s) => s.note)).toEqual([]);
    const walked = describeHistory(index, run, true);
    expect(walked.prologueNote).toBe(true);
    expect(walked.sources.find((s) => s.id === 'H10')).toEqual({ id: 'H10', title: true, note: true }); // the renaming, cited only by the prologue
    expect(walked.sources.find((s) => s.id === 'H1')?.note).toBe(false); // the plates cite H1 too, but play cites it as well: its note waits
    expect(walked.sources.find((s) => s.id === 'H6')?.title).toBe(false); // cited by nothing yet
    // Play leaves the record (the earlier return; the later order follows the historical timing): the explanation appears
    // once the marked phase is entered, not before.
    cont(run, 'g8-docking-report-continue');
    cont(run, 'g8-loss-of-contact-continue');
    cont(run, 'g8-gap-note-continue');
    cont(run, 'g8-crisis-report-continue');
    cont(run, 'g8-stabilization-report-continue');
    opt(run, 'g8-order-return');
    opt(run, 'g8-return-earlier');
    expect(describeHistory(index, run, false).explanation).toBe(false);
    cont(run, 'g8-execute-return');
    expect(describeNode(run)!.phase.alternate_history).toBe(true);
    expect(describeHistory(index, run, false).explanation).toBe(true);
    const later = fresh();
    toDocking(later, []);
    cont(later, 'g8-docking-report-continue');
    cont(later, 'g8-loss-of-contact-continue');
    cont(later, 'g8-gap-note-continue');
    cont(later, 'g8-crisis-report-continue');
    cont(later, 'g8-stabilization-report-continue');
    opt(later, 'g8-order-return');
    opt(later, 'g8-return-later');
    cont(later, 'g8-execute-return');
    expect(describeHistory(index, later, false).explanation).toBe(false);
  });

  it('a replayed save shows exactly what the live run shows, and deriving encounters never touches the run', () => {
    const run = fresh();
    toDocking(run, ['contact', 'systems']);
    cont(run, 'g8-docking-report-continue');
    cont(run, 'g8-loss-of-contact-continue');
    cont(run, 'g8-gap-note-continue');
    ask(run, 'g8-q-crew-crisis');
    const logBefore = run.canonicalLog();
    const stateBefore = run.canonicalState();
    const live = { evidence: visible(run), procedures: visibleProcedures(run), enc: deriveEncounters(run) };
    expect(run.canonicalLog()).toBe(logBefore);
    expect(run.canonicalState()).toBe(stateBefore);
    const again = replay(index, run.identity);
    expect(visible(again)).toEqual(live.evidence);
    expect(visibleProcedures(again)).toEqual(live.procedures);
    const e2 = deriveEncounters(again);
    expect([...e2.nodes]).toEqual([...live.enc.nodes]);
    expect([...e2.lines]).toEqual([...live.enc.lines]);
    expect([...e2.preparations]).toEqual([...live.enc.preparations]);
    expect(again.canonicalLog()).toBe(logBefore);
    expect(unlockedEvidenceIds(again)).toEqual(new Set(live.evidence));
    expect(describeCommittedDecision(again)).toBeNull();
  });
});
