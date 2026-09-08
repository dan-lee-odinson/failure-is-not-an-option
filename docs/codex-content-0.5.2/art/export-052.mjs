import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const sharp=createRequire(import.meta.url)('C:/Users/wolfe/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const P='C:/Users/wolfe/Documents/Claude_GPT_Shared_Workflow/Failure-is-Not-an-Option', A=P+'/art/M01-presentation-v001', R=P+'/_review-tmp/content-052';
const records=JSON.parse(fs.readFileSync(A+'/all-generation-records.json'));
fs.mkdirSync(A+'/runtime',{recursive:true});
const outputs=[];
function floodMatte(data,w,h) {
 const n=w*h, seen=new Uint8Array(n), q=new Int32Array(n);let head=0,tail=0;
 const bg=i=>{const r=data[i*4],g=data[i*4+1],b=data[i*4+2];return Math.min(r,g,b)>208&&Math.max(r,g,b)-Math.min(r,g,b)<13;};
 const add=i=>{if(!seen[i]&&bg(i)){seen[i]=1;q[tail++]=i;}};
 for(let x=0;x<w;x++){add(x);add((h-1)*w+x);}
 for(let y=0;y<h;y++){add(y*w);add(y*w+w-1);}
 while(head<tail){let i=q[head++],x=i%w,y=Math.floor(i/w);if(x)add(i-1);if(x<w-1)add(i+1);if(y)add(i-w);if(y<h-1)add(i+w);}
 for(let i=0;i<n;i++)if(seen[i])data[i*4+3]=0;
 return tail;
}
for(const r of records){
 fs.copyFileSync(r.path,A+'/sources/'+r.id+'.png');
 const portrait=['armstrong','scott','cunningham','stafford','systems','recovery'].includes(r.id);
 if(portrait){
  for(let j=0;j<2;j++){
   const expression=j?'concerned':'neutral', id='portrait-'+r.id+'-'+expression;
   const filename='fno_gemini_portrait_'+r.id+'_'+expression+'_v001.png';
   const {data,info}=await sharp(r.path).extract({left:j*768,top:0,width:768,height:1024}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
   const cleared=floodMatte(data,768,1024);
   await sharp(data,{raw:info}).png().toFile(A+'/runtime/'+filename);
   outputs.push({id,filename,width:768,height:1024,alpha:true,source:r.id,cleared});
  }
 }else{
  const id='g8-'+r.id, filename='fno_gemini_'+r.id.replace('-','_')+'_plate_v001.png', alpha=r.id.startsWith('layer-');
  if(r.id==='layer-haze') {
   const {data,info}=await sharp(r.path).resize(1920,1080,{fit:'cover'}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
   for(let i=0;i<data.length;i+=4){data[i+3]=Math.round((data[i]+data[i+1]+data[i+2])/3*data[i+3]/255);data[i]=data[i+1]=data[i+2]=255;}
   await sharp(data,{raw:info}).png().toFile(A+'/runtime/'+filename);
  }else await sharp(r.path).resize(1920,1080,{fit:'cover'}).toColourspace('srgb').png().toFile(A+'/runtime/'+filename);
  outputs.push({id,filename,width:1920,height:1080,alpha,source:r.id});
 }
}
const manifest=JSON.parse(fs.readFileSync(R+'/assets/manifest.json'));
manifest.task='FNO-M01-Codex-0.5.2';
manifest.notes+=' Content 0.5.2 adds 22 M01 presentation exports. New art is delivered for director review; final is the schema delivery flag, not approval. See 28-Prologue-and-Resolution-Treatment.md.';
for(const o of outputs){
 fs.copyFileSync(A+'/runtime/'+o.filename,R+'/assets/'+o.filename);
 manifest.assets=manifest.assets.filter(a=>a.id!==o.id);
 manifest.assets.push({id:o.id,filename:o.filename,width:o.width,height:o.height,alpha:o.alpha,color_space:'sRGB',framing:o.id.startsWith('portrait-')?'Matched neutral/concerned upper-torso bust; full head in 768x1024 cell.':o.alpha?'Transparent moving-element layer; 1920x1080 design canvas.':'Full-screen narrative illustration; subject at right with dark left space for live text.',reference_version:'26-Playtest-2-Findings; 27-Direction-Prologue-Portraits-Resolution-Cards; accepted equipment and character sheets',origin:'OpenAI built-in imagegen. '+(o.id.startsWith('portrait-')?'Atlas cell export and edge-connected neutral matte cleanup using authorized local alpha preparation.':o.alpha?'Generated alpha preserved; proportional contract-size export.':'Proportional Lanczos contract-size export.')+' Original source and prompt in art/M01-presentation-v001.',attribution:'Original AI-generated illustration under Dan’s human art direction, prepared by Codex. No agency marks. Staging and expressions are authored presentation, not documentary evidence or attributed quotations.',status:'final'});
}
fs.writeFileSync(R+'/assets/manifest.json',JSON.stringify(manifest,null,2)+'\n');
fs.writeFileSync(A+'/export-inventory.json',JSON.stringify(outputs,null,2)+'\n');
const portraits=outputs.filter(x=>x.id.startsWith('portrait-'));
let composites=[];
for(let i=0;i<portraits.length;i++){
 const img=await sharp(A+'/runtime/'+portraits[i].filename).resize(192,256).toBuffer();
 composites.push({input:img,left:(i%4)*240+24,top:Math.floor(i/4)*292+26});
 const label=Buffer.from('<svg width="240" height="26"><text x="12" y="18" font-family="sans-serif" font-size="12" fill="#ede3ca">'+portraits[i].id.replace('portrait-','')+'</text></svg>');
 composites.push({input:label,left:(i%4)*240,top:Math.floor(i/4)*292});
}
await sharp({create:{width:960,height:876,channels:3,background:'#14222b'}}).composite(composites).png().toFile(A+'/portrait-review.png');
const plates=outputs.filter(x=>!x.id.startsWith('portrait-'));
composites=[];
for(let i=0;i<plates.length;i++){
 const img=await sharp(A+'/runtime/'+plates[i].filename).resize(480,270).toBuffer();
 composites.push({input:img,left:(i%2)*480,top:Math.floor(i/2)*298+28});
 composites.push({input:Buffer.from('<svg width="480" height="28"><text x="12" y="20" font-family="sans-serif" font-size="16" fill="#ede3ca">'+plates[i].id+'</text></svg>'),left:(i%2)*480,top:Math.floor(i/2)*298});
}
await sharp({create:{width:960,height:1490,channels:3,background:'#14222b'}}).composite(composites).png().toFile(A+'/plate-review.png');
console.log(JSON.stringify({exports:outputs.length,portraits:portraits.length,plates:plates.length}));
