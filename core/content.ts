import { canonical } from './canonical';
import { sha256Hex } from './sha256';
import type {
  Character, ContentBundle, Evidence, FollowOn, Mission, Node, Option, Outcome, Phase, Plan, Procedure, Question, Resolution,
} from './types';

/** Simulation version. Bump when the engine's observable behaviour changes. */
export const SIM_VERSION = '0.1.0';

/** SHA-256 over the canonical JSON of the whole content bundle. */
export function contentFingerprint(bundle: ContentBundle): string {
  return sha256Hex(canonical(bundle));
}

export interface NodeRef {
  phase: Phase;
  phaseIndex: number;
  node: Node;
  nodeIndex: number;
}

export interface ContentIndex {
  bundle: ContentBundle;
  mission: Mission;
  followon: FollowOn;
  fingerprint: string;
  nodes: Map<string, NodeRef>;
  options: Map<string, { option: Option; node: Node }>;
  questions: Map<string, { question: Question; node: Node }>;
  resolutions: Map<string, { resolution: Resolution; node: Node }>;
  evidence: Map<string, Evidence>;
  characters: Map<string, Character>;
  procedures: Map<string, Procedure>;
  outcomes: Map<string, Outcome>;
  plans: Map<string, Plan>;
  /** Every id a condition may reference as an event: event node ids and resolution ids. */
  eventIds: Set<string>;
}

/** Build lookup maps. Duplicate ids throw — the validator reports them; the engine refuses to run on them. */
export function indexContent(bundle: ContentBundle): ContentIndex {
  const nodes = new Map<string, NodeRef>();
  const options = new Map<string, { option: Option; node: Node }>();
  const questions = new Map<string, { question: Question; node: Node }>();
  const resolutions = new Map<string, { resolution: Resolution; node: Node }>();
  const eventIds = new Set<string>();
  const seenPhase = new Set<string>();

  const put = <T>(map: Map<string, T>, id: string, value: T, scope: string): void => {
    if (map.has(id)) throw new Error(`duplicate ${scope} id: ${id}`);
    map.set(id, value);
  };

  bundle.mission.phases.forEach((phase, phaseIndex) => {
    if (seenPhase.has(phase.id)) throw new Error(`duplicate phase id: ${phase.id}`);
    seenPhase.add(phase.id);
    phase.nodes.forEach((node, nodeIndex) => {
      put(nodes, node.id, { phase, phaseIndex, node, nodeIndex }, 'node');
      if (node.type === 'prep_choice' || node.type === 'decision') {
        for (const option of node.options) put(options, option.id, { option, node }, 'option');
      }
      if (node.type === 'briefing' || node.type === 'decision') {
        for (const q of node.questions ?? []) put(questions, q.id, { question: q, node }, 'question');
      }
      if (node.type === 'event') {
        eventIds.add(node.id);
        for (const r of node.resolutions) {
          put(resolutions, r.id, { resolution: r, node }, 'resolution');
          eventIds.add(r.id);
        }
      }
    });
  });

  const evidence = new Map<string, Evidence>();
  for (const e of bundle.evidence) put(evidence, e.id, e, 'evidence');
  const characters = new Map<string, Character>();
  for (const c of bundle.characters) put(characters, c.id, c, 'character');
  const procedures = new Map<string, Procedure>();
  for (const p of bundle.procedures) put(procedures, p.id, p, 'procedure');
  const outcomes = new Map<string, Outcome>();
  for (const o of bundle.mission.outcomes) put(outcomes, o.id, o, 'outcome');
  const plans = new Map<string, Plan>();
  for (const p of bundle.followon.plans) put(plans, p.id, p, 'plan');

  return {
    bundle,
    mission: bundle.mission,
    followon: bundle.followon,
    fingerprint: contentFingerprint(bundle),
    nodes, options, questions, resolutions, evidence, characters, procedures, outcomes, plans, eventIds,
  };
}
