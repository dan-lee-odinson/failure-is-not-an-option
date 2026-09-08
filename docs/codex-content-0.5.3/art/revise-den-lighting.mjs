import fs from 'node:fs';import{createRequire}from'node:module';
const sharp=createRequire(import.meta.url)('C:/Users/wolfe/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const P='C:/Users/wolfe/Documents/Claude_GPT_Shared_Workflow/Failure-is-Not-an-Option',A=P+'/art/M02-opening-den-v001',K=P+'/FNO-M00-Codex-Content-v0.5.3',R=P+'/_review-tmp/content-053';
const record=JSON.parse(fs.readFileSync(A+'/lighting-revision-record.json'));
const name='fno_opening_den_room_plate_v001.png';
fs.mkdirSync(A+'/history',{recursive:true});
fs.copyFileSync(A+'/runtime/'+name,A+'/history/den-before-lighting-revision.png');
fs.copyFileSync(A+'/den-composite-review.png',A+'/history/den-composite-before-lighting-revision.png');
fs.copyFileSync(record.path,A+'/sources/den-lamp-off.png');
await sharp(record.path).resize(1920,1080,{fit:'fill'}).removeAlpha().png().toFile(A+'/runtime/fno_opening_den_room_plate_v002.png');
fs.copyFileSync(A+'/runtime/fno_opening_den_room_plate_v002.png',A+'/runtime/'+name);
fs.copyFileSync(A+'/runtime/'+name,K+'/assets/'+name);fs.copyFileSync(A+'/runtime/'+name,R+'/assets/'+name);
async function opacityImage(file,w,h,opacity){const{data,info}=await sharp(file).resize(w,h).ensureAlpha().raw().toBuffer({resolveWithObject:true});for(let i=3;i<data.length;i+=4)data[i]=Math.round(data[i]*opacity);return sharp(data,{raw:info}).png().toBuffer();}
const smoke=await opacityImage(A+'/runtime/fno_opening_den_smoke_layer_v001.png',1152,648,.16);
const beam=await opacityImage(A+'/runtime/fno_opening_den_beam_layer_v001.png',1920,1080,.32);
const beamClip=await sharp(beam).extract({left:0,top:101,width:1776,height:979}).toBuffer();
await sharp(A+'/runtime/'+name).composite([{input:beamClip,left:144,top:0},{input:smoke,left:390,top:315}]).png().toFile(A+'/den-composite-review.png');
fs.copyFileSync(A+'/den-composite-review.png',K+'/art/den-composite-review.png');
for(const rel of ['lighting-revision-record.json','sources/den-lamp-off.png','history/den-before-lighting-revision.png','history/den-composite-before-lighting-revision.png'])fs.copyFileSync(A+'/'+rel,K+'/art/'+rel);
for(const root of [A,K+'/art']){
 const file=root+'/export-inventory.json',inventory=JSON.parse(fs.readFileSync(file));
 const den=inventory.find(x=>x.id==='opening-den');den.source='den-lamp-off.png';den.asset_revision=2;den.note='Lamp off; projector is primary light. Runtime filename retained for content 0.5.3 compatibility. Prior plate is preserved in art/history.';
 fs.writeFileSync(file,JSON.stringify(inventory,null,2)+'\n');
}
console.log('Revised den exported; existing smoke, beam and placement retained.');
