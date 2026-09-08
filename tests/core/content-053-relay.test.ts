import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {describe,it,expect} from 'vitest';
import {content,ROOT,newRun,play,script,ask} from './helpers';
import {loadBundle,CONTENT_FILES,readJson} from '../../scripts/lib/load-content';
import {validateContent} from '../../scripts/lib/validator';
import {validatePresentation} from '../../scripts/lib/presentation-contract';
import type {Line,ContentBundle} from '../../core/types';
function lines(value:unknown):Line[]{
 const out:Line[]=[];
 const walk=(v:unknown)=>{if(!v||typeof v!=='object')return;if((v as Line).speaker==='g8-capcom'&&typeof(v as Line).text==='string')out.push(v as Line);for(const c of Object.values(v))walk(c);};walk(value);return out;
}
const assets=()=>JSON.parse(readFileSync(resolve(ROOT,'assets/manifest.json'),'utf8')).assets;
function check(b:ContentBundle){
 const raw=Object.fromEntries(Object.entries(CONTENT_FILES).map(([k,f])=>[k,readJson(ROOT,f)])) as Parameters<typeof validateContent>[0]['raw'];
 raw.mission=b.mission;
 return validateContent({root:ROOT,schemaDir:resolve(ROOT,'schema'),raw,manifest:{...JSON.parse(readFileSync(resolve(ROOT,'assets/manifest.json'),'utf8'))},assetsDir:resolve(ROOT,'assets'),bundle:()=>b,skipFiles:true});
}
describe('0.5.3 Lovell relay and opening content',()=>{
 it('has seven reviewable CAPCOM lines, every relay page mapped to the scan',()=>{
  const ls=lines(content().mission);expect(ls).toHaveLength(7);
  for(const l of ls){const p=l.provenance!;expect(p).toBeTruthy();expect(p.note.length).toBeGreaterThan(0);
   if(p.tag!=='procedural'){expect(p.sources).toContain('H7');expect(p.pdf_pages.length).toBeGreaterThan(0);expect(p.printed_pages).toEqual(p.pdf_pages.map(n=>n-1));}
  }
  const crisis=content().mission.phases.flatMap(p=>p.nodes).find(n=>n.id==='g8-crisis-report')!;
  expect(JSON.stringify(crisis)).toContain('relays Scott');
  expect(JSON.stringify(crisis)).not.toContain('relays Armstrong:');
 });
 it('rejects missing CAPCOM provenance and a page outside H7',()=>{
  const a=loadBundle(ROOT);delete lines(a.mission)[0]!.provenance;
  expect(check(a).errors.join('\n')).toContain('historical CAPCOM line needs provenance');
  const b=loadBundle(ROOT);lines(b.mission)[0]!.provenance!.pdf_pages=[114];
  expect(check(b).errors.join('\n')).toContain('invalid H7 page mapping');
 });
 it('the two new optional questions apply no effects and preserve evidence, cursor and outcome',()=>{
  for(const [node,id] of [['g8-crisis-report','g8-q-crew-crisis'],['g8-return-brief','g8-q-crew-return']]){
   const inputs=script(),at=inputs.findIndex(i=>'node'in i&&i.node===node);expect(at).toBeGreaterThan(0);
   const run=play(newRun(),inputs.slice(0,at));
   const before=structuredClone(run.state.ledger),ev=structuredClone(run.state.mission.evidence),cursor=run.currentNode()?.node.id;
   play(run,[ask(node!,id!)]);
   expect(run.state.ledger).toEqual(before);expect(run.state.mission.evidence).toEqual(ev);expect(run.currentNode()?.node.id).toBe(cursor);
   play(run,inputs.slice(at));
   const without=play(newRun(),inputs);
   // Questions legitimately add log entries; fact provenance indices shift.
   const semantic = (v: unknown): unknown => Array.isArray(v) ? v.map(semantic) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).filter(([k]) => k !== 'at_event').map(([k,x]) => [k,semantic(x)])) : v;
   expect(semantic(run.state.ledger)).toEqual(semantic(without.state.ledger));
   expect(semantic(run.state.mission.completed)).toEqual(semantic(without.state.mission.completed));
  }
 });
 it('retires only the composite CAPCOM manifest identity and preserves the accountability roster',()=>{
  const c=content().characters.get('g8-capcom')!;
  expect(c.name).toBe('Jim Lovell');expect(c.kind).toBe('historical');expect(c.portrait).toBe('portrait-lovell-neutral');
  expect(assets().some((a:{id:string})=>a.id==='portrait-capcom')).toBe(false);
  for(const n of content().mission.phases.flatMap(p=>p.nodes))if((n.type==='briefing'||n.type==='decision')&&n.participants)expect(n.participants.map(p=>p.id)).toEqual(['armstrong','scott','cunningham','stafford']);
 });
 it('credits carry the seven established sound attributions and preserve the pending draft',()=>{
  const credits=content().bundle.registry.credits!;
  expect(credits.map(s=>s.heading)).toEqual(['Sources','Music','Sound','Type','Archive','Made by']);
  const sound=credits.find(s=>s.heading==='Sound')!.lines;
  for(const a of assets().filter((a:{source_url?:string})=>a.source_url?.startsWith('https://freesound.org')))expect(sound).toContain(a.credit);
  expect(sound).toContain('Beep 8 count (loopable) by JonNicholas, freesound.org, CC BY 3.0');
  expect(credits.find(s=>s.heading==='Sources')!.lines).toEqual(content().bundle.registry.sources.map(s=>s.title));
  expect(credits.at(-1)!.lines.at(-1)).toBe('MIT (code) · CC BY 4.0 (original content) — see LICENSE and LICENSE-CONTENT.');
  expect(content().bundle.registry.labels.alternate_history_explanation).not.toMatch(/\(F(?:7|10)/);
  expect(content().characters.get('glen-kurtz')!.portrayal).toContain('ageless');
 });
 it('den projection and VFX references are valid and invalid geometry is rejected',()=>{
  const b=loadBundle(ROOT);expect(validatePresentation(b,assets())).toEqual([]);
  b.registry.opening_den!.projection_rect.width=2000;
  expect(validatePresentation(b,assets()).join('\n')).toContain('projection rectangle must fit');
 });
});
