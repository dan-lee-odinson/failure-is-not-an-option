import { describe, expect, it } from 'vitest';
import { describeDebrief, type Run } from '../../core';
import { render } from '../../app/render';
import type { Store } from '../../app/main';
import { content, newRun, play, playScript, script, PREP_SETS } from './helpers';

function store(run: Run, screen: 'console' | 'debrief' | 'planning' = 'console'): Store {
  return { content: content(), run, ui: { screen, overlay: null, pinned: [], textSize: 'default', highlightPlan: null, message: null, saveMessage: null, hasBrowserSave: false, open: Object.keys(run.state.mission.evidence) } };
}

describe('0.5.1 presentation boundaries', () => {
  it('marks historical return timing and keeps alternate history only on the earlier route', () => {
    for (const route of ['earlier', 'later'] as const) {
      const inputs = script({ route });
      for (const [node, historical, alternate] of [
        ['g8-rule-decision', true, false],
        ['g8-return-brief', true, false],
        ['g8-order-receipt', false, false],
        ['g8-ground-execution', false, route === 'earlier'],
        ['g8-accountability-decision', route === 'later', route === 'earlier'],
      ] as const) {
        const cut = inputs.findIndex((i) => 'node' in i && i.node === node);
        const run = play(newRun(), inputs.slice(0, cut));
        const output = render(store(run));
        expect(output.includes('data-testid="badge-historical-choice"')).toBe(historical);
        expect(output.includes('data-testid="badge-alt-history"')).toBe(alternate);
        const visible = output.replace(/<[^>]*>/g, ' ');
        expect(visible).not.toMatch(/fictional|simulated report|AmericaSpace|Fiction register/i);
      }
    }
  });

  it('every route gets exactly its own return and accountability departure, with valid references and readable notes', () => {
    const ids = new Set(content().bundle.registry.sources.map((s) => s.id));
    for (const prep of PREP_SETS) for (const route of ['earlier', 'later'] as const) for (const stance of ['blame', 'ground'] as const) {
      const run = playScript({ prep, route, stance });
      const departures = describeDebrief(run)!.paragraphs.filter((p) => p.section === 'departures');
      expect(departures.map((p) => p.id)).toEqual([`g8-db-departure-${route}`, `g8-db-departure-${stance}`]);
      for (const p of departures) for (const id of p.provenance!.sources) expect(ids.has(id)).toBe(true);
      for (const screen of ['debrief', 'planning'] as const) {
        expect(render(store(run, screen)).includes('data-testid="badge-alt-history"')).toBe(route === 'earlier');
      }
      const output = render(store(run, 'debrief'));
      expect(output).toContain('data-testid="departures-from-record"');
      for (const match of output.matchAll(/<div class="notes">(.*?)<\/div>/g)) expect(match[1]).not.toMatch(/g[89]-/);
    }
  });
});
