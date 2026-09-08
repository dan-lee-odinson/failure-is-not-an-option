import fs from 'node:fs';import{createRequire}from'node:module';
const sharp=createRequire(import.meta.url)('C:/Users/wolfe/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const P='C:/Users/wolfe/Documents/Claude_GPT_Shared_Workflow/Failure-is-Not-an-Option',A=P+'/art/M02-opening-den-v001',R=P+'/_review-tmp/content-053';
const records=JSON.parse(fs.readFileSync(A+'/all-generation-records.json'));
for(const r of records)fs.copyFileSync(r.path,A+'/sources/'+r.id+'.png');
const exports=[];
for(const [source,id,filename,alpha] of [
 ['den','opening-den','fno_opening_den_room_plate_v001.png',false],
 ['smoke','opening-den-smoke','fno_opening_den_smoke_layer_v001.png',true],
 ['beam-final','opening-den-beam','fno_opening_den_beam_layer_v001.png',true]
]){
 const src=records.find(r=>r.id===source).path;
 let work=sharp(src).resize(1920,1080,{fit:'cover'}).toColourspace('srgb');
 if(alpha){
  const{data,info}=await work.ensureAlpha().raw().toBuffer({resolveWithObject:true});
  for(let i=0;i<data.length;i+=4){const v=Math.max(data[i],data[i+1],data[i+2]);data[i+3]=Math.round(v*data[i+3]/255);data[i]=255;data[i+1]=247;data[i+2]=231;}
  work=sharp(data,{raw:info});
 }
 await work.png().toFile(A+'/runtime/'+filename);fs.copyFileSync(A+'/runtime/'+filename,R+'/assets/'+filename);
 exports.push({id,filename,width:1920,height:1080,alpha,source:source+'.png'});
}
const lovell=JSON.parse(fs.readFileSync(A+'/lovell-export-record.json'));
const inv=[...lovell,...exports];fs.writeFileSync(A+'/export-inventory.json',JSON.stringify(inv,null,2)+'\n');
const manifest=JSON.parse(fs.readFileSync(R+'/assets/manifest.json'));
for(const e of exports)manifest.assets.push({...Object.fromEntries(['id','filename','width','height','alpha'].map(k=>[k,e[k]])),color_space:'sRGB',framing:e.id==='opening-den'?'Over-the-shoulder Glen at left, home film projector and clean wall at right; runtime projection rectangle recorded in registry.opening_den.':'Full-canvas transparent VFX texture; placement/opacity in registry.opening_den.',reference_version:'30 section 8; 31 section 2; accepted room and Glen character sheet',origin:'OpenAI built-in imagegen. '+(e.alpha?'Luminance/alpha export with warm-white RGB; black matte removed.':'Proportional contract-size export.')+' Sources and exact prompts retained in art/.',attribution:'Original game artwork under Dan’s direction, prepared by Codex. Glen retains his ageless identity; no agency marks, brands or dates.',status:'final'});
fs.writeFileSync(R+'/assets/manifest.json',JSON.stringify(manifest,null,2)+'\n');
const reg=JSON.parse(fs.readFileSync(R+'/content/registry.json'));
reg.opening_den={
 background:'opening-den',projection_rect:{x:830,y:115,width:928,height:522},
 smoke:{asset:'opening-den-smoke',placement:{x:390,y:315,width:1152,height:648,opacity:0.16},motion:{kind:'rise',direction:'up',seconds:12,from:{x:0,y:0},to:{x:0,y:-55}}},
 smoke_loop:{seconds:12,crossfade_seconds:3},
 beam:{asset:'opening-den-beam',placement:{x:144,y:-101,width:1920,height:1080,opacity:0.32}},
 note:'Design coordinates are 1920x1080. projection_rect is a clear 16:9 inset inside the illustrated wall; preserve the wall border. Smoke loops with overlapping fades, not a visible position jump. Beam flicker and camera movement belong to montage assembly; no cue change.'
};
fs.writeFileSync(R+'/content/registry.json',JSON.stringify(reg,null,2)+'\n');fs.writeFileSync(A+'/den-layout.json',JSON.stringify(reg.opening_den,null,2)+'\n');
const base=A+'/runtime/'+exports[0].filename;
async function opacityImage(file,w,h,opacity){const{data,info}=await sharp(file).resize(w,h).ensureAlpha().raw().toBuffer({resolveWithObject:true});for(let i=3;i<data.length;i+=4)data[i]=Math.round(data[i]*opacity);return sharp(data,{raw:info}).png().toBuffer();}
const smoke=await opacityImage(A+'/runtime/'+exports[1].filename,1152,648,0.16);
const beam=await opacityImage(A+'/runtime/'+exports[2].filename,1920,1080,0.32);
// Clip the shifted beam to the fixed design frame for this static composition proof.
const beamClip=await sharp(beam).extract({left:0,top:101,width:1776,height:979}).toBuffer();
await sharp(base).composite([{input:beamClip,left:144,top:0},{input:smoke,left:390,top:315}]).png().toFile(A+'/den-composite-review.png');
console.log('Five runtime exports and den placement data ready.');

