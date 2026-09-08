/**
 * Content validator library. Pure over its inputs so tests can call it with
 * deliberately broken content (the "fail on purpose" evidence).
 */
import Ajv2020 from 'ajv/dist/2020';
import { validatePresentation } from './presentation-contract';
import addFormats from 'ajv-formats';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { positiveFacts, references } from '../../core/conditions';
import { contentFingerprint, indexContent, type ContentIndex } from '../../core/content';
import { Run } from '../../core/engine';
import { describeFollowOn } from '../../core/followon';
import { optionAvailability } from '../../core/engine';
import type { Condition, ContentBundle, Effect, Input, Node, Resolution } from '../../core/types';

export interface ValidateOptions {
  root: string;
  schemaDir: string;
  raw: { mission: unknown; characters: unknown; evidence: unknown; procedures: unknown; followon: unknown; registry: unknown };
  manifest: unknown;
  assetsDir: string;
  bundle: () => ContentBundle;
  /** Skip the on-disk PNG checks (used by unit tests on in-memory content). */
  skipFiles?: boolean;
}

export interface ValidationReport {
  errors: string[];
  warnings: string[];
  contentVersion: string | null;
  fingerprint: string | null;
  sweep: { runs: number; outcomes: Set<string>; plans: number };
}

const SCHEMA_FOR: Record<keyof ValidateOptions['raw'], string> = {
  mission: 'mission.schema.json',
  characters: 'characters.schema.json',
  evidence: 'evidence.schema.json',
  procedures: 'procedures.schema.json',
  followon: 'followon.schema.json',
  registry: 'registry.schema.json',
};

export function validateContent(opts: ValidateOptions): ValidationReport {
  const errors: string[] = [];
  const warnings: string[] = [];
  const report: ValidationReport = { errors, warnings, contentVersion: null, fingerprint: null, sweep: { runs: 0, outcomes: new Set(), plans: 0 } };

  // 1. Schemas -------------------------------------------------------------
  const ajv = new Ajv2020({ allErrors: true, strict: true, allowUnionTypes: true });
  addFormats(ajv);
  for (const f of readdirSync(opts.schemaDir)) {
    if (!f.endsWith('.schema.json')) continue;
    ajv.addSchema(JSON.parse(readFileSync(resolve(opts.schemaDir, f), 'utf8')));
  }
  const schemaOk: Record<string, boolean> = {};
  for (const [key, schemaFile] of Object.entries(SCHEMA_FOR) as [keyof ValidateOptions['raw'], string][]) {
    const validate = ajv.getSchema(`https://fno.local/schema/${schemaFile}`);
    if (!validate) { errors.push(`schema ${schemaFile} is missing from ${opts.schemaDir}`); continue; }
    const ok = validate(opts.raw[key]);
    schemaOk[key] = !!ok;
    if (!ok) for (const e of validate.errors ?? []) errors.push(`content/${key}: schema ${e.instancePath || '/'} ${e.message ?? ''}${e.params && Object.keys(e.params).length ? ' ' + JSON.stringify(e.params) : ''}`);
  }
  const manifestValidate = ajv.getSchema('https://fno.local/schema/manifest.schema.json');
  if (!manifestValidate) errors.push('schema manifest.schema.json is missing');
  else if (!manifestValidate(opts.manifest)) for (const e of manifestValidate.errors ?? []) errors.push(`assets/manifest.json: schema ${e.instancePath || '/'} ${e.message ?? ''}`);

  if (Object.values(schemaOk).some((v) => !v)) return report; // cannot index malformed content

  // 2. Index (id uniqueness) ----------------------------------------------
  let bundle: ContentBundle;
  let index: ContentIndex;
  try {
    bundle = opts.bundle();
    index = indexContent(bundle);
  } catch (e) {
    errors.push(`index: ${(e as Error).message}`);
    return report;
  }
  report.contentVersion = bundle.mission.content_version;
  report.fingerprint = contentFingerprint(bundle);

  const versions = new Set([
    bundle.mission.content_version,
    (opts.raw.characters as { content_version: string }).content_version,
    (opts.raw.evidence as { content_version: string }).content_version,
    (opts.raw.procedures as { content_version: string }).content_version,
    bundle.followon.content_version,
    bundle.registry.content_version,
    (opts.manifest as { content_version: string }).content_version,
  ]);
  if (versions.size !== 1) errors.push(`content_version differs across files: ${[...versions].join(', ')}`);

  if (bundle.registry.site) {
    const blocks = bundle.registry.site.blocks;
    const order = ['hero', 'about', 'demo', 'gallery', 'coming_soon', 'bio', 'notices', 'nasa_marks', 'open_source', 'footer'];
    if (JSON.stringify(blocks.map(b => b.id)) !== JSON.stringify(order)) errors.push('registry.site: blocks must use the ten named ids in display order');
    for (const block of blocks) {
      uniq(errors, `registry.site.${block.id} item`, block.items.map(i => i.id));
      for (const item of block.items) {
        if ((item.kind === 'notice') !== (item.notice_id !== undefined)) errors.push(`registry.site.${block.id}.${item.id}: notice kind must reference a canonical notice id`);
        if (item.notice_id !== undefined && !Object.hasOwn(bundle.registry.notices, item.notice_id)) errors.push(`registry.site.${block.id}.${item.id}: unknown notice id`);
      }
    }
  }

  uniq(errors, 'debrief rule' , bundle.mission.debrief.map((r) => r.id));
  uniq(errors, 'source', bundle.registry.sources.map((s) => s.id));
  uniq(errors, 'fiction entry', bundle.registry.fiction.map((f) => f.id));
  uniq(errors, 'status block', bundle.followon.status_blocks.map((b) => b.id));
  uniq(errors, 'manifest asset', ((opts.manifest as { assets: { id: string }[] }).assets ?? []).map((a) => a.id));
  uniq(errors, 'manifest filename', ((opts.manifest as { assets: { filename: string }[] }).assets ?? []).map((a) => a.filename));
  const continueIds: string[] = [];
  for (const p of bundle.mission.phases) for (const n of p.nodes) {
    if (n.type === 'prep_choice') continueIds.push(n.finish.id);
    else if (n.type !== 'decision') continueIds.push(n.continue.id);
  }
  uniq(errors, 'continue input', continueIds);
  // Continue ids, node ids, option ids, question ids, resolution ids, plan ids and the follow-on input share the input namespace.
  uniq(errors, 'input-namespace id', [...continueIds, ...index.nodes.keys(), ...index.options.keys(), ...index.questions.keys(), ...index.resolutions.keys(), ...index.plans.keys(), bundle.followon.confirm_input]);

  // 3. References -----------------------------------------------------------
  const setFacts = new Set<string>();
  const factSetters = new Map<string, string[]>();
  const collectEffects = (effects: Effect[] | undefined, scope: string): void => {
    for (const e of effects ?? []) {
      if ('set_fact' in e) { setFacts.add(e.set_fact); factSetters.set(e.set_fact, [...(factSetters.get(e.set_fact) ?? []), scope]); }
    }
  };
  for (const { option } of index.options.values()) collectEffects(option.effects, option.id);
  for (const { resolution } of index.resolutions.values()) {
    collectEffects(resolution.effects, resolution.id);
    for (const s of resolution.sub_effects ?? []) collectEffects(s.effects, resolution.id);
    collectEffects(resolution.finally, resolution.id);
  }
  for (const p of bundle.followon.plans) collectEffects(p.effects, p.id);

  const sourceIds = new Set(bundle.registry.sources.map((s) => s.id));
  errors.push(...validatePresentation(bundle, (opts.manifest as { assets: { id: string; width?: number; height?: number; alpha?: boolean }[] }).assets ?? []));
  const fictionIds = new Set(bundle.registry.fiction.map((f) => f.id));
  const manifestIds = new Set(((opts.manifest as { assets: { id: string }[] }).assets ?? []).map((a) => a.id));

  const checkCond = (cond: Condition | undefined, where: string): void => {
    if (!cond) return;
    const refs = references(cond);
    for (const f of refs.facts) if (!setFacts.has(f)) errors.push(`${where}: condition references fact ${f}, which no effect sets`);
    for (const ev of refs.evidence) if (!index.evidence.has(ev)) errors.push(`${where}: condition references unknown evidence ${ev}`);
    for (const p of refs.procedures) if (!index.procedures.has(p)) errors.push(`${where}: condition references unknown procedure ${p}`);
    for (const o of refs.options) if (!index.options.has(o)) errors.push(`${where}: condition references unknown option ${o}`);
    for (const ev of refs.events) if (!index.eventIds.has(ev)) errors.push(`${where}: condition references unknown event ${ev}`);
  };
  const checkEffects = (effects: Effect[] | undefined, where: string): void => {
    for (const e of effects ?? []) {
      if ('add_evidence' in e && !index.evidence.has(e.add_evidence)) errors.push(`${where}: add_evidence references unknown evidence ${e.add_evidence}`);
      if ('adopt_procedure' in e && !index.procedures.has(e.adopt_procedure)) errors.push(`${where}: adopt_procedure references unknown procedure ${e.adopt_procedure}`);
      if ('adjust' in e) {
        const m = /^people\.(.+)\.trust$/.exec(e.adjust.path);
        if (m && !index.characters.has(m[1]!)) errors.push(`${where}: adjust references unknown person ${m[1]}`);
        if (m && !bundle.mission.seed_people.includes(m[1]!)) errors.push(`${where}: adjust targets ${m[1]}, who is not in seed_people`);
      }
      if ('append_note' in e) {
        if (!index.characters.has(e.append_note.person)) errors.push(`${where}: append_note references unknown person ${e.append_note.person}`);
        if (!setFacts.has(e.append_note.fact)) errors.push(`${where}: append_note references fact ${e.append_note.fact}, which no effect sets`);
      }
      if ('goto' in e && !bundle.mission.phases.some((p) => p.id === e.goto)) errors.push(`${where}: goto references unknown phase ${e.goto}`);
    }
  };
  const checkLines = (lines: import('../../core/types').Line[] | undefined, where: string): void => {
    for (const [i, l] of (lines ?? []).entries()) {
      if (l.speaker && !index.characters.has(l.speaker)) errors.push(`${where} line ${i}: unknown speaker ${l.speaker}`);
      const p = l.provenance;
      if (l.speaker === 'g8-capcom' && index.characters.get(l.speaker)?.kind === 'historical' && !p) errors.push(`${where}: historical CAPCOM line needs provenance`);
      if (p) {
        for (const id of p.sources) if (!sourceIds.has(id)) errors.push(`${where}: unknown line source ${id}`);
        for (const id of p.fiction) if (!fictionIds.has(id)) errors.push(`${where}: unknown line fiction ${id}`);
        if (p.tag !== 'procedural' && (!p.sources.includes('H7') || !p.pdf_pages.length)) errors.push(`${where}: relay needs H7 PDF pages`);
        if (p.sources.includes('H7') && (p.pdf_pages.some((page, i) => page > 113 || p.printed_pages[i] !== page - 1) || p.pdf_pages.length !== p.printed_pages.length)) errors.push(`${where}: invalid H7 page mapping`);
      }
      for (const c of l.cites ?? []) if (!index.evidence.has(c)) errors.push(`${where} line ${i}: cites unknown evidence ${c}`);
      checkCond(l.when, `${where} line ${i}`);
    }
  };
  const checkOption = (o: { id: string; evidence: string[]; requires?: Condition; supported_by?: string[]; effects: Effect[] }, where: string): void => {
    for (const ev of o.evidence) if (!index.evidence.has(ev)) errors.push(`${where}: option ${o.id} cites unknown evidence ${ev}`);
    for (const f of o.supported_by ?? []) if (!setFacts.has(f)) errors.push(`${where}: option ${o.id} supported_by fact ${f}, which no effect sets`);
    checkCond(o.requires, `${where} option ${o.id} requires`);
    checkEffects(o.effects, `${where} option ${o.id}`);
  };

  for (const id of bundle.mission.seed_people) if (!index.characters.has(id)) errors.push(`mission.seed_people: unknown character ${id}`);
  checkCond(bundle.mission.finish.requires, 'mission.finish');
  const lastPhase = bundle.mission.phases[bundle.mission.phases.length - 1]!;
  const lastNode = lastPhase.nodes[lastPhase.nodes.length - 1]!;
  const lastCont = lastNode.type === 'prep_choice' ? lastNode.finish.id : lastNode.type === 'decision' ? null : lastNode.continue.id;
  if (lastCont !== bundle.mission.finish.id) errors.push(`mission.finish.id ${bundle.mission.finish.id} must be the Continue of the last node ${lastNode.id} (found ${lastCont ?? 'none'})`);

  for (const phase of bundle.mission.phases) {
    for (const node of phase.nodes) {
      const where = `node ${node.id}`;
      if (node.type === 'briefing' || node.type === 'decision') {
        for (const d of node.documents ?? []) {
          if (!index.evidence.has(d.evidence)) errors.push(`${where}: document references unknown evidence ${d.evidence}`);
          checkCond(d.when, `${where} document ${d.evidence}`);
        }
        checkLines(node.lines, where);
        for (const q of node.questions ?? []) {
          checkLines([q.answer], `${where} question ${q.id}`);
          for (const r of q.reveals ?? []) if (!index.evidence.has(r)) errors.push(`${where} question ${q.id}: reveals unknown evidence ${r}`);
        }
      }
      if (node.type === 'briefing') for (const v of node.variants ?? []) checkCond(v.when, `${where} variant`);
      if (node.type === 'decision') for (const r of node.readout ?? []) if (!setFacts.has(r.fact)) errors.push(`${where}: readout fact ${r.fact} is never set`);
      if (node.type === 'decision' || node.type === 'prep_choice') for (const o of node.options) checkOption(o, where);
      if (node.type === 'event') {
        for (const r of node.resolutions) {
          checkCond(r.when, `${where} resolution ${r.id}`);
          checkEffects(r.effects, `${where} resolution ${r.id}`);
          for (const s of r.sub_effects ?? []) { checkCond(s.when, `${where} resolution ${r.id} sub_effect`); checkEffects(s.effects, `${where} resolution ${r.id} sub_effect`); }
          checkEffects(r.finally, `${where} resolution ${r.id} finally`);
          checkLines(r.lines, `${where} resolution ${r.id}`);
        }
      }
    }
  }
  for (const o of bundle.mission.outcomes) checkCond(o.requires, `outcome ${o.id}`);
  for (const r of bundle.mission.debrief) checkCond(r.when, `debrief ${r.id}`);
  const layout = bundle.mission.debrief_layout;
  for (const [k, nid] of [['consequence_node', layout.consequence_node], ['relationship_node', layout.relationship_node], ['accountability_node', layout.accountability_node]] as const) {
    const ref = index.nodes.get(nid);
    if (!ref) errors.push(`debrief_layout.${k}: unknown node ${nid}`);
    else if (ref.node.type !== 'event') errors.push(`debrief_layout.${k}: ${nid} is not an event node`);
  }
  for (const id of [...layout.controllers, ...layout.astronauts]) if (!index.characters.has(id)) errors.push(`debrief_layout: unknown character ${id}`);
  for (const f of layout.constraint_facts) if (!setFacts.has(f)) errors.push(`debrief_layout.constraint_facts: fact ${f} is never set`);

  for (const c of bundle.characters) {
    if (c.portrait && !manifestIds.has(c.portrait)) errors.push(`character ${c.id}: portrait ${c.portrait} is not in assets/manifest.json`);
    for (const s of c.sources ?? []) if (!sourceIds.has(s)) errors.push(`character ${c.id}: unknown source ${s}`);
  }
  for (const e of bundle.evidence) {
    for (const s of e.provenance.sources) if (!sourceIds.has(s)) errors.push(`evidence ${e.id}: unknown source ${s}`);
    for (const f of e.provenance.fiction) if (!fictionIds.has(f)) errors.push(`evidence ${e.id}: unknown fiction entry ${f}`);
    if (e.simulated && e.provenance.fiction.length === 0) errors.push(`evidence ${e.id}: simulated report must cite a fiction register entry`);
    checkCond(e.visible_when, `evidence ${e.id} visible_when`);
  }
  for (const p of bundle.procedures) {
    for (const s of p.provenance.sources) if (!sourceIds.has(s)) errors.push(`procedure ${p.id}: unknown source ${s}`);
    for (const f of p.provenance.fiction) if (!fictionIds.has(f)) errors.push(`procedure ${p.id}: unknown fiction entry ${f}`);
  }
  const fo = bundle.followon;
  if (fo.requires_completion_of !== bundle.mission.id) errors.push(`followon.requires_completion_of ${fo.requires_completion_of} does not match mission ${bundle.mission.id}`);
  for (const f of fo.constraint_facts) if (!setFacts.has(f)) errors.push(`followon.constraint_facts: fact ${f} is never set`);
  for (const c of fo.constraint) checkCond(c.when, 'followon.constraint');
  for (const id of [...fo.controllers, ...fo.astronauts]) if (!index.characters.has(id)) errors.push(`followon: unknown character ${id}`);
  for (const b of fo.status_blocks) { checkCond(b.when, `followon status ${b.id}`); if (b.procedure && !index.procedures.has(b.procedure)) errors.push(`followon status ${b.id}: unknown procedure ${b.procedure}`); }
  for (const p of fo.plans) {
    checkCond(p.available_when, `plan ${p.id} available_when`);
    for (const d of p.disabled_reasons) checkCond(d.when, `plan ${p.id} disabled_reason`);
    checkEffects(p.effects, `plan ${p.id}`);
    if (!p.effects.some((e) => 'set_fact' in e)) errors.push(`plan ${p.id}: committing must set at least one fact`);
  }

  // 4a. Static outcome exclusivity -----------------------------------------
  const classes = exclusivityClasses(bundle.mission.phases.flatMap((p) => p.nodes));
  const outs = bundle.mission.outcomes;
  for (let i = 0; i < outs.length; i++) for (let j = i + 1; j < outs.length; j++) {
    const a = positiveFacts(outs[i]!.requires);
    const b = positiveFacts(outs[j]!.requires);
    if (!provablyExclusive(a, b, classes)) errors.push(`outcomes ${outs[i]!.id} and ${outs[j]!.id} are not provably mutually exclusive (exactly-one rule, SC-09)`);
  }

  // 4b. Dynamic sweep -----------------------------------------------------
  if (errors.length === 0) {
    try {
      sweep(index, report);
    } catch (e) {
      errors.push(`sweep: ${(e as Error).message}`);
    }
  }

  // 5. Manifest files -------------------------------------------------------
  if (!opts.skipFiles) {
    for (const a of (opts.manifest as { assets: { id: string; filename: string; kind?: string; format?: string; width: number; height: number; alpha: boolean; duration_s?: number }[] }).assets ?? []) {
      if (a.kind === 'audio') {
        // Audio lives under public/audio/. A missing sound plays silence and is listed by npm run placeholders: a warning, never a failed build.
        const apath = resolve(opts.root, 'public', 'audio', a.filename);
        if (!existsSync(apath)) { warnings.push(`asset ${a.id}: public/audio/${a.filename} is missing (plays silence; npm run placeholders lists it)`); continue; }
        const buf = readFileSync(apath);
        if (a.format === 'wav') {
          const info = readWavInfo(buf);
          if (!info) { errors.push(`asset ${a.id}: ${a.filename} is not a RIFF/WAVE file`); continue; }
          if (Math.abs(info.duration - (a.duration_s ?? 0)) > 0.05) errors.push(`asset ${a.id}: ${a.filename} is ${info.duration.toFixed(3)} s long, manifest declares ${a.duration_s} s`);
        } else if (!isMp3(buf)) {
          errors.push(`asset ${a.id}: ${a.filename} is not an MP3 (no ID3 tag or frame sync)`);
        }
        continue;
      }
      const path = resolve(opts.assetsDir, a.filename);
      if (!existsSync(path)) { errors.push(`asset ${a.id}: ${a.filename} is missing from assets/ (run npm run placeholders)`); continue; }
      if (a.format === 'svg') {
        const dims = readSvgSize(readFileSync(path, 'utf8'));
        if (!dims) { errors.push(`asset ${a.id}: ${a.filename} is not an SVG with width/height on its root element`); continue; }
        if (dims.width !== a.width || dims.height !== a.height) errors.push(`asset ${a.id}: ${a.filename} is ${dims.width}×${dims.height}, manifest declares ${a.width}×${a.height}`);
        if (!a.alpha) errors.push(`asset ${a.id}: an SVG layer must declare alpha=true`);
        continue;
      }
      const ihdr = readIhdr(readFileSync(path));
      if (!ihdr) { errors.push(`asset ${a.id}: ${a.filename} is not a PNG`); continue; }
      if (ihdr.width !== a.width || ihdr.height !== a.height) errors.push(`asset ${a.id}: ${a.filename} is ${ihdr.width}×${ihdr.height}, manifest declares ${a.width}×${a.height}`);
      const hasAlpha = ihdr.colorType === 6 || ihdr.colorType === 4;
      if (hasAlpha !== a.alpha) errors.push(`asset ${a.id}: ${a.filename} alpha channel ${hasAlpha ? 'present' : 'absent'}, manifest declares alpha=${a.alpha}`);
    }
  }

  return report;
}

function uniq(errors: string[], scope: string, ids: string[]): void {
  const seen = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) errors.push(`duplicate ${scope} id: ${id}`);
    seen.add(id);
  }
}

/** Facts that cannot co-occur: distinct resolutions of one event node, or distinct options of one decision node. */
function exclusivityClasses(nodes: Node[]): Set<string>[] {
  const classes: Set<string>[] = [];
  const factsOf = (effects: Effect[] | undefined): string[] => (effects ?? []).flatMap((e) => ('set_fact' in e ? [e.set_fact] : []));
  for (const n of nodes) {
    let groups: string[][] = [];
    if (n.type === 'event') groups = n.resolutions.map((r: Resolution) => [...factsOf(r.effects), ...(r.sub_effects ?? []).flatMap((s) => factsOf(s.effects)), ...factsOf(r.finally)]);
    else if (n.type === 'decision') groups = n.options.map((o) => factsOf(o.effects));
    if (groups.length < 2) continue;
    // A fact is exclusive only if it appears in exactly one group of this node.
    const count = new Map<string, number>();
    for (const g of groups) for (const f of new Set(g)) count.set(f, (count.get(f) ?? 0) + 1);
    const cls = new Set<string>();
    for (const [f, c] of count) if (c === 1) cls.add(f);
    if (cls.size >= 2) classes.push(cls);
  }
  return classes;
}

function provablyExclusive(a: string[], b: string[], classes: Set<string>[]): boolean {
  for (const cls of classes) {
    const fa = a.filter((f) => cls.has(f));
    const fb = b.filter((f) => cls.has(f));
    if (fa.length && fb.length && fa.some((f) => !fb.includes(f)) && fb.some((f) => !fa.includes(f))) return true;
  }
  return false;
}

/**
 * Generic exhaustive explorer: at a prep_choice node every legal subset of
 * options (in file order); at a decision node every available option; at the
 * follow-on every enabled plan. Continues are forced. No content ids are
 * hard-coded.
 */
function sweep(index: ContentIndex, report: ValidationReport): void {
  const explore = (inputs: Input[]): void => {
    const run = new Run(index, { seed: 0 });
    for (const inp of inputs) {
      const r = run.apply(inp);
      if (!r.ok) throw new Error(`route ${inputs.map(describe).join(' > ')} rejected: ${r.message}`);
    }
    if (run.state.draws !== 0) throw new Error('content made a random draw');
    const cur = run.currentNode();
    if (!cur) {
      report.sweep.runs += 1;
      report.sweep.outcomes.add(run.state.mission.completed!.outcome);
      const view = describeFollowOn(index, run.state.ledger, run.state.mission.completed!, null);
      const enabled = view.plans.filter((p) => p.enabled);
      if (enabled.length === 0) throw new Error('follow-on has no enabled plan after ' + run.state.mission.completed!.outcome);
      for (const p of enabled) {
        const again = new Run(index, { seed: 0 });
        for (const inp of inputs) again.apply(inp);
        const r = again.apply({ kind: 'confirm_plan', id: index.followon.confirm_input, plan: p.id });
        if (!r.ok) throw new Error(`plan ${p.id} rejected after ${run.state.mission.completed!.outcome}: ${r.message}`);
        report.sweep.plans += 1;
      }
      return;
    }
    const { node } = cur;
    if (node.type === 'prep_choice') {
      // enumerate subsets by recursion on option order: either pick this option now (if available) or move on
      const avail = node.options.filter((o) => optionAvailability(run.state, node, o).available);
      explore([...inputs, { kind: 'continue', node: node.id, id: node.finish.id }]);
      for (const o of avail) {
        // only pick options later in file order than any already chosen, to enumerate each set once
        const lastChosen = run.state.mission.chosen.filter((c) => c.node === node.id).map((c) => node.options.findIndex((x) => x.id === c.option));
        const idx = node.options.findIndex((x) => x.id === o.id);
        if (lastChosen.length && idx < Math.max(...lastChosen)) continue;
        explore([...inputs, { kind: 'option', node: node.id, option: o.id }]);
      }
      return;
    }
    if (node.type === 'decision') {
      const avail = node.options.filter((o) => optionAvailability(run.state, node, o).available);
      if (avail.length === 0) throw new Error(`decision ${node.id} has no available option on route ${inputs.map(describe).join(' > ')}`);
      for (const o of avail) explore([...inputs, { kind: 'option', node: node.id, option: o.id }]);
      return;
    }
    explore([...inputs, { kind: 'continue', node: node.id, id: node.continue.id }]);
  };
  explore([]);
}

function describe(i: Input): string {
  return i.kind === 'option' ? i.option : i.kind === 'continue' ? i.id : i.kind === 'question' ? i.question : i.plan;
}

/** Sample rate, channels, bits and duration from a RIFF/WAVE header (PCM, float, or extensible). */
export function readWavInfo(buf: Buffer): { sampleRate: number; channels: number; bits: number; duration: number } | null {
  if (buf.length < 12 || buf.toString('ascii', 0, 4) !== 'RIFF' || buf.toString('ascii', 8, 12) !== 'WAVE') return null;
  let pos = 12;
  let fmt: { sampleRate: number; channels: number; bits: number; blockAlign: number } | null = null;
  let dataSize: number | null = null;
  while (pos + 8 <= buf.length) {
    const id = buf.toString('ascii', pos, pos + 4);
    const size = buf.readUInt32LE(pos + 4);
    if (id === 'fmt ' && pos + 24 <= buf.length) {
      fmt = { channels: buf.readUInt16LE(pos + 10), sampleRate: buf.readUInt32LE(pos + 12), blockAlign: buf.readUInt16LE(pos + 20), bits: buf.readUInt16LE(pos + 22) };
    } else if (id === 'data') {
      dataSize = Math.min(size, buf.length - pos - 8);
      break;
    }
    pos += 8 + size + (size % 2);
  }
  if (!fmt || dataSize === null || fmt.blockAlign === 0 || fmt.sampleRate === 0) return null;
  return { sampleRate: fmt.sampleRate, channels: fmt.channels, bits: fmt.bits, duration: dataSize / fmt.blockAlign / fmt.sampleRate };
}

/** An MP3 starts with an ID3v2 tag or an MPEG frame sync (0xFFE). */
export function isMp3(buf: Buffer): boolean {
  if (buf.length < 4) return false;
  if (buf.toString('ascii', 0, 3) === 'ID3') return true;
  return buf[0] === 0xff && (buf[1]! & 0xe0) === 0xe0;
}

export function readIhdr(buf: Buffer): { width: number; height: number; colorType: number } | null {
  const sig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (buf.length < 33) return null;
  for (let i = 0; i < 8; i++) if (buf[i] !== sig[i]) return null;
  if (buf.toString('ascii', 12, 16) !== 'IHDR') return null;
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20), colorType: buf[25]! };
}

/** Width/height from an SVG root element (attributes, else the viewBox). */
export function readSvgSize(text: string): { width: number; height: number } | null {
  const head = text.slice(0, 2000);
  const root = /<svg\b[^>]*>/i.exec(head)?.[0];
  if (!root) return null;
  const attr = (name: string): number | null => {
    const m = new RegExp(`\\b${name}="([0-9.]+)(px)?"`).exec(root);
    return m ? Number(m[1]) : null;
  };
  const w = attr('width');
  const h = attr('height');
  if (w !== null && h !== null) return { width: w, height: h };
  const vb = /\bviewBox="([0-9.\-]+)[ ,]+([0-9.\-]+)[ ,]+([0-9.]+)[ ,]+([0-9.]+)"/.exec(root);
  if (vb) return { width: Number(vb[3]), height: Number(vb[4]) };
  return null;
}
