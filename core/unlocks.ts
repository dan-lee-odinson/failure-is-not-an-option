/**
 * Encounter-based availability (content 0.5.5; doc 49 notes 6–7, ruling R2; Codex's availability contract).
 *
 * What the player has met in play is derived from the run's recorded inputs alone: the inputs are replayed through the
 * engine on a scratch run and, at every input boundary, the presented node, the lines it actually displayed under their
 * conditions (for an event, the selected resolution's lines only), the answers actually asked and the preparations
 * actually chosen are recorded. Nothing here mutates the run, adds an input or a log entry, so a live run and a
 * replayed save give the same encounters, and the replay stays byte-identical. Consumers cache by input count.
 */
import { evaluate } from './conditions';
import type { ContentIndex } from './content';
import { Run } from './engine';
import type { Line, Unlock } from './types';

export interface Encounters {
  /** Nodes the cursor has stood on (the scene was presented). */
  nodes: Set<string>;
  /** Stable ids of lines and answers actually displayed. */
  lines: Set<string>;
  /** Preparation options actually chosen. */
  preparations: Set<string>;
  /** Characters who have spoken a displayed line. */
  speakers: Set<string>;
  /** Historical sources cited by the provenance of displayed lines. */
  sources: Set<string>;
  /** Inputs the derivation covered (the cache key). */
  inputs: number;
}

const cache = new WeakMap<Run, Encounters>();

function note(enc: Encounters, l: Line): void {
  if (l.id) enc.lines.add(l.id);
  if (l.speaker) enc.speakers.add(l.speaker);
  for (const s of l.provenance?.sources ?? []) enc.sources.add(s);
}

function record(enc: Encounters, content: ContentIndex, r: Run): void {
  const state = r.state;
  for (const c of state.mission.chosen) {
    if (content.nodes.get(c.node)?.node.type === 'prep_choice') enc.preparations.add(c.option);
  }
  const cur = r.currentNode();
  if (!cur) return;
  const { node } = cur;
  enc.nodes.add(node.id);
  if (node.type === 'briefing' || node.type === 'decision') {
    for (const l of node.lines ?? []) if (!l.when || evaluate(l.when, state)) note(enc, l);
    for (const q of node.questions ?? []) if (state.mission.questions_asked.includes(q.id)) note(enc, q.answer);
  } else if (node.type === 'event') {
    const rid = state.mission.node_resolution[node.id];
    const res = rid ? content.resolutions.get(rid)?.resolution : undefined;
    for (const l of res?.lines ?? []) note(enc, l);
  }
}

/** The encounters of a run, derived by replaying its inputs; cached per run and input count. */
export function deriveEncounters(run: Run): Encounters {
  const hit = cache.get(run);
  if (hit && hit.inputs === run.identity.inputs.length) return hit;
  const content = run.content;
  const enc: Encounters = { nodes: new Set(), lines: new Set(), preparations: new Set(), speakers: new Set(), sources: new Set(), inputs: run.identity.inputs.length };
  const scratch = new Run(content, { seed: run.identity.seed, initial_ledger: run.identity.initial_ledger });
  record(enc, content, scratch);
  for (const input of run.identity.inputs) {
    const r = scratch.apply(input);
    if (!r.ok) break; // a run that does not replay is a save the app has already refused; show nothing beyond what did replay
    record(enc, content, scratch);
  }
  cache.set(run, enc);
  return enc;
}

/** Whether an unlock has been met by the encounters so far. */
export function unlockMet(u: Unlock | undefined, enc: Encounters): boolean {
  if (!u) return false;
  if ('start' in u) return u.start === true;
  if ('node' in u) return enc.nodes.has(u.node);
  if ('line' in u) return enc.lines.has(u.line);
  return enc.preparations.has(u.preparation);
}
