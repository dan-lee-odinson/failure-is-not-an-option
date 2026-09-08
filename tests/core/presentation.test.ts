import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {describe,it,expect} from 'vitest';
import {loadBundle} from '../../scripts/lib/load-content';
import {validatePresentation} from '../../scripts/lib/presentation-contract';
import {ROOT, content, newRun, play, script, PREP_SETS} from './helpers';
const bundle=()=>loadBundle(ROOT);
const assets=()=>JSON.parse(readFileSync(resolve(ROOT,'assets/manifest.json'),'utf8')).assets;
describe('M01 presentation contract',()=>{
 it('covers all six safe recoveries with three distinct tiers and no failed crew label',()=>{
  const b=bundle();
  expect(validatePresentation(b,assets())).toEqual([]);
  expect(b.mission.outcomes).toHaveLength(6);
  for(const o of b.mission.outcomes) {
   expect(o.kind).toBe('abort-safe');
   expect(o.tier).toBe(o.id.endsWith('-2')?'SUCCESS':o.id.endsWith('-1')?'MIXED':'COSTLY');
   expect(o.result_line).toBeTruthy();
  }
 });
 it('all changed relationships have both expressions across every run and stance',()=>{
  const seen=new Set<string>();
  for(const prep of PREP_SETS) for(const route of ['earlier','later'] as const) for(const lesson of ['provenance','recovery'] as const) for(const stance of ['blame','ground'] as const){
   const run=play(newRun(),script({prep,route,lesson,stance}));
   for(const c of content().characters.values()){
    const delta=(run.state.ledger.people[c.id]?.trust??0)-(run.identity.initial_ledger.people[c.id]?.trust??0);
    if(!delta)continue;
    seen.add(c.id);
    expect(c.portraits?.[delta>0?'neutral':'concerned']).toBeTruthy();
   }
  }
  expect([...seen].sort()).toEqual(['armstrong','cunningham','g8-recovery','g8-systems','scott','stafford'].sort());
 });
 it('rejects dangling portrait and background references and wrong alpha declarations',()=>{
  const b=bundle(); b.characters.find(c=>c.id==='armstrong')!.portraits!.concerned='missing';
  expect(validatePresentation(b,assets()).join('\n')).toContain('unknown presentation asset missing');
  const c=bundle(); c.mission.prologue!.plates[0]!.background='missing';
  expect(validatePresentation(c,assets()).join('\n')).toContain('unknown presentation asset missing');
  const a=assets();a.find((x:{id:string})=>x.id==='g8-layer-docked').alpha=false;
  expect(validatePresentation(bundle(),a).join('\n')).toContain('must be 1920x1080 alpha=true');
 });
 it('rejects unknown caption sources, contradictory motion and duplicate participants',()=>{
  const b=bundle();const p=b.mission.prologue!.plates[0]!;
  p.sources=['H999'];p.moving_element.motion.to={...p.moving_element.motion.from};
  const n=b.mission.phases.flatMap(p=>p.nodes).find(n=>n.id==='g8-accountability-brief')!;
  if(n.type==='briefing')n.participants!.push(n.participants![0]!);
  const errors=validatePresentation(b,assets()).join('\n');
  expect(errors).toContain('unknown presentation source H999');
  expect(errors).toContain('motion direction disagrees');
  expect(errors).toContain('duplicate participant');
 });
 it('does not turn participants into invented historical speakers',()=>{
  const b=bundle();
  const historical=new Set(b.characters.filter(c=>c.kind==='historical').map(c=>c.id));
  for(const n of b.mission.phases.flatMap(p=>p.nodes)){
   if(n.type==='briefing'||n.type==='decision')for(const line of n.lines??[])expect(historical.has(line.speaker??'')).toBe(false);
  }
 });
});
