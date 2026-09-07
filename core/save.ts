/**
 * Save files. A save is the run identity (initial ledger, versions, seed,
 * ordered inputs) plus a state snapshot and a hash of the canonical log.
 * Loading replays the inputs in isolation and only activates the result when
 * the replayed state and log agree with the snapshot (SC-10, AC-09, AC-14).
 */

import { canonical, cloneDeep } from './canonical';
import { SIM_VERSION, type ContentIndex } from './content';
import { EngineError, Run, replay } from './engine';
import { sha256Hex } from './sha256';
import type { Input, RunIdentity, RunState } from './types';

export const SAVE_FORMAT = 'fno-save';
export const SAVE_VERSION = 1;

export interface SaveFile {
  format: typeof SAVE_FORMAT;
  save_version: typeof SAVE_VERSION;
  identity: RunIdentity;
  snapshot: RunState;
  log_hash: string;
}

export function createSave(run: Run): SaveFile {
  return {
    format: SAVE_FORMAT,
    save_version: SAVE_VERSION,
    identity: cloneDeep(run.identity),
    snapshot: cloneDeep(run.state),
    log_hash: sha256Hex(run.canonicalLog()),
  };
}

export type VerifyResult = { ok: true; run: Run } | { ok: false; code: string; message: string };

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function inputShape(v: unknown): v is Input {
  if (!isObject(v) || typeof v['kind'] !== 'string') return false;
  switch (v['kind']) {
    case 'option': return typeof v['node'] === 'string' && typeof v['option'] === 'string';
    case 'question': return typeof v['node'] === 'string' && typeof v['question'] === 'string';
    case 'continue': return typeof v['node'] === 'string' && typeof v['id'] === 'string';
    case 'confirm_plan': return typeof v['id'] === 'string' && typeof v['plan'] === 'string';
    default: return false;
  }
}

/** Structural check only; returns a message on failure. */
export function checkStructure(data: unknown): string | null {
  if (!isObject(data)) return 'save is not an object';
  if (data['format'] !== SAVE_FORMAT) return 'not a Failure is Not an Option save file';
  if (data['save_version'] !== SAVE_VERSION) return `unsupported save format version ${String(data['save_version'])}`;
  const id = data['identity'];
  if (!isObject(id)) return 'save has no identity block';
  if (!isObject(id['initial_ledger'])) return 'identity.initial_ledger is missing';
  for (const k of ['content_version', 'content_fingerprint', 'sim_version']) {
    if (typeof id[k] !== 'string') return `identity.${k} is missing`;
  }
  if (typeof id['seed'] !== 'number' || !Number.isInteger(id['seed'])) return 'identity.seed must be an integer';
  if (!Array.isArray(id['inputs'])) return 'identity.inputs must be an array';
  for (let i = 0; i < id['inputs'].length; i++) {
    if (!inputShape(id['inputs'][i])) return `identity.inputs[${i}] is malformed`;
  }
  if (!isObject(data['snapshot'])) return 'snapshot is missing';
  if (typeof data['log_hash'] !== 'string') return 'log_hash is missing';
  return null;
}

/** Reference check: every id an input names must exist in this content. */
export function checkReferences(content: ContentIndex, inputs: Input[]): string | null {
  for (let i = 0; i < inputs.length; i++) {
    const inp = inputs[i]!;
    if (inp.kind === 'confirm_plan') {
      if (inp.id !== content.followon.confirm_input) return `inputs[${i}]: unknown follow-on input ${inp.id}`;
      if (!content.plans.has(inp.plan)) return `inputs[${i}]: unknown plan ${inp.plan}`;
      continue;
    }
    if (!content.nodes.has(inp.node)) return `inputs[${i}]: unknown node ${inp.node}`;
    if (inp.kind === 'option' && !content.options.has(inp.option)) return `inputs[${i}]: unknown option ${inp.option}`;
    if (inp.kind === 'question' && !content.questions.has(inp.question)) return `inputs[${i}]: unknown question ${inp.question}`;
    if (inp.kind === 'continue') {
      const ref = content.nodes.get(inp.node)!;
      const n = ref.node;
      const cont = n.type === 'prep_choice' ? n.finish.id : n.type === 'decision' ? null : n.continue.id;
      if (cont !== inp.id) return `inputs[${i}]: unknown continue ${inp.id} at ${inp.node}`;
    }
  }
  return null;
}

/**
 * Full verification: structure → versions → references → replay equivalence.
 * On success returns a fresh, replayed Run the caller may activate.
 */
export function verifySave(content: ContentIndex, data: unknown): VerifyResult {
  const structural = checkStructure(data);
  if (structural) return { ok: false, code: 'structure', message: structural };
  const save = data as SaveFile;
  const id = save.identity;
  if (id.content_version !== content.mission.content_version) {
    return {
      ok: false, code: 'unsupported-content-version',
      message: `This save was made with content version ${id.content_version}. This build supports ${content.mission.content_version} only; no migration is provided.`,
    };
  }
  if (id.content_fingerprint !== content.fingerprint) {
    return { ok: false, code: 'content-fingerprint-mismatch', message: 'This save was made with different content files (fingerprint mismatch). It cannot be loaded into this build.' };
  }
  if (id.sim_version !== SIM_VERSION) {
    return { ok: false, code: 'unsupported-sim-version', message: `This save was made with simulation version ${id.sim_version}; this build is ${SIM_VERSION}.` };
  }
  const refs = checkReferences(content, id.inputs);
  if (refs) return { ok: false, code: 'references', message: `The save references content that does not exist: ${refs}.` };

  let run: Run;
  try {
    run = replay(content, id);
  } catch (e) {
    if (e instanceof EngineError) return { ok: false, code: 'replay:' + e.code, message: `The save's recorded inputs do not replay: ${e.message}.` };
    throw e;
  }
  if (canonical(run.state) !== canonical(save.snapshot)) {
    return { ok: false, code: 'snapshot-mismatch', message: 'The save\'s stored state does not match the replay of its recorded inputs. The save was rejected.' };
  }
  const hash = sha256Hex(run.canonicalLog());
  if (hash !== save.log_hash) {
    return { ok: false, code: 'log-hash-mismatch', message: 'The save\'s event-log hash does not match the replayed log. The save was rejected.' };
  }
  return { ok: true, run };
}
