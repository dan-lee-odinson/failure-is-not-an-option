/**
 * Resolution cards (FNO-M01, content 0.5.2, treatment 28 §5): the view-model
 * for the two player-paced cards shown between the outcome record and the
 * debrief. Read-only: it reads the completed run's outcome and the trust
 * changes already written to the log; it never applies, replays or re-derives
 * an effect, so showing, skipping or revisiting a card changes nothing.
 *
 * The relationship row is the net trust change from the run's initial ledger
 * to the ledger at scenario completion (the finalize entry), so a plan
 * committed later in Gemini IX-A planning can never move it. A missing initial
 * trust is zero, as the engine seeds it. Positive → the neutral portrait and
 * the content's trust_up label; negative → concerned and trust_down; zero →
 * omitted. Order: the debrief layout's controllers, then its astronauts.
 */
import type { ContentIndex, LogEntry, ResultTier, RunIdentity, RunState } from '../core';

export interface RelationshipChange {
  id: string;
  name: string;
  display: string;
  delta: number;
  expression: 'neutral' | 'concerned';
  /** Manifest id of the portrait for the expression, or null when the character has no pair. */
  portrait: string | null;
  label: string;
}

export interface ResolutionView {
  outcome: { id: string; title: string };
  tier: ResultTier;
  /** The content's meaning of the tier (M02): shown on request from the ⓘ key and as the tier's tooltip. */
  meaning: string | null;
  /** Manifest id of the plate. */
  plate: string;
  result_line: string;
  heading: string;
  relationships_heading: string;
  people: RelationshipChange[];
}

/** The minimum of a Run the view needs (so tests can hand in a trimmed log). */
export interface RunLike {
  state: RunState;
  identity: RunIdentity;
  log: readonly LogEntry[];
}

/** Trust of `id` at scenario completion: the last adjust before the finalize entry, else the initial ledger's value (0 when unseeded). */
export function trustAtCompletion(run: RunLike, id: string): { before: number; after: number } {
  const before = run.identity.initial_ledger.people[id]?.trust ?? 0;
  const finalize = run.log.find((e) => e.type === 'finalize');
  const limit = finalize ? finalize.seq : Number.POSITIVE_INFINITY;
  let after = before;
  for (const e of run.log) {
    if (e.seq >= limit) break;
    if (e.type === 'effect' && e.effect === 'adjust' && e.path === `people.${id}.trust`) after = e.after;
  }
  return { before, after };
}

export function describeResolution(content: ContentIndex, run: RunLike): ResolutionView | null {
  const done = run.state.mission.completed;
  const labels = content.mission.resolution_presentation;
  if (!done || !labels) return null;
  const outcome = content.outcomes.get(done.outcome);
  if (!outcome?.tier || !outcome.result_line || !outcome.plate) return null;
  if (!labels.tiers.some((t) => t.id === outcome.tier)) return null;
  const layout = content.mission.debrief_layout;
  const people: RelationshipChange[] = [];
  for (const id of [...layout.controllers, ...layout.astronauts]) {
    const c = content.characters.get(id);
    if (!c) continue;
    const { before, after } = trustAtCompletion(run, id);
    const delta = after - before;
    if (delta === 0) continue;
    const expression = delta > 0 ? 'neutral' : 'concerned';
    people.push({ id, name: c.name, display: c.display, delta, expression, portrait: c.portraits?.[expression] ?? null, label: delta > 0 ? labels.trust_up : labels.trust_down });
  }
  return {
    outcome: { id: outcome.id, title: outcome.title },
    tier: outcome.tier,
    meaning: labels.tiers.find((t) => t.id === outcome.tier)?.meaning ?? null,
    plate: outcome.plate,
    result_line: outcome.result_line,
    heading: labels.heading,
    relationships_heading: labels.relationships_heading,
    people,
  };
}
