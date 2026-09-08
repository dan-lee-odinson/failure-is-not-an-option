import fs from 'node:fs';import{createRequire}from'node:module';
const sharp=createRequire(import.meta.url)('C:/Users/wolfe/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const P='C:/Users/wolfe/Documents/Claude_GPT_Shared_Workflow/Failure-is-Not-an-Option',A=P+'/art/M02-opening-den-v001',R=P+'/_review-tmp/content-053';
const source=P+'/art/character-sheets-v003/sheets/fno_sheet_jim-lovell_v001.png';
fs.copyFileSync(source,A+'/sources/lovell-sheet-v003-original.png');
const crops=[{expression:'neutral',left:1030,top:14,width:425,height:330},{expression:'concerned',left:1025,top:651,width:425,height:309}],out=[];
for(const c of crops){
 const {data,info}=await sharp(source).extract({left:c.left,top:c.top,width:c.width,height:c.height}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const w=info.width,h=info.height,n=w*h,seen=new Uint8Array(n),q=new Int32Array(n);let head=0,tail=0;
 const paper=i=>{let r=data[i*4],g=data[i*4+1],b=data[i*4+2];return r>194&&g>181&&b>163&&r-g<30&&g-b<33&&r>=g&&g>=b;};
 const add=i=>{if(!seen[i]&&paper(i)){seen[i]=1;q[tail++]=i;}};
 for(let x=0;x<w;x++){add(x);add((h-1)*w+x);}for(let y=0;y<h;y++){add(y*w);add(y*w+w-1);}
 while(head<tail){let i=q[head++],x=i%w,y=Math.floor(i/w);if(x)add(i-1);if(x<w-1)add(i+1);if(y)add(i-w);if(y<h-1)add(i+w);}
 for(let i=0;i<n;i++)if(seen[i])data[i*4+3]=0;
 // Preserve only the figure's connected component, dropping lettering/noise outside its ink silhouette.
 const labels=new Int32Array(n);let count=0,big=0,bigN=0;
 for(let i=0;i<n;i++)if(data[i*4+3]&&!labels[i]){
  count++;head=0;tail=0;q[tail++]=i;labels[i]=count;
  while(head<tail){const a=q[head++],x=a%w,y=Math.floor(a/w);for(const b of [x?a-1:-1,x<w-1?a+1:-1,y?a-w:-1,y<h-1?a+w:-1])if(b>=0&&data[b*4+3]&&!labels[b]){labels[b]=count;q[tail++]=b;}}
  if(tail>bigN){bigN=tail;big=count;}
 }
 for(let i=0;i<n;i++)if(labels[i]!==big)data[i*4+3]=0;
 // The pale shirt touches the paper value. Fill the scanline interior between
 // the retained outer ink contours with ORIGINAL pixels; never synthesize cloth.
 for(let y=0;y<h;y++){
  let lo=w,hi=-1;for(let x=0;x<w;x++)if(labels[y*w+x]===big){lo=Math.min(lo,x);hi=Math.max(hi,x);}
  for(let x=lo;x<=hi;x++)data[(y*w+x)*4+3]=255;
 }
 const filename='fno_gemini_portrait_lovell_'+c.expression+'_v001.png';
 // Identical proportional width and top alignment; existing drawing, no face generation.
 const cut=await sharp(data,{raw:info}).extract({left:60,top:0,width:300,height:h}).resize({width:720}).png().toBuffer();
 const meta=await sharp(cut).metadata();
 await sharp({create:{width:768,height:1024,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite([{input:cut,left:24,top:120}]).png().toFile(A+'/runtime/'+filename);
 fs.copyFileSync(A+'/runtime/'+filename,R+'/assets/'+filename);
 out.push({...c,id:'portrait-lovell-'+c.expression,filename,width:768,height:1024,alpha:true,source:'lovell-sheet-v003-original.png',processing:'Exact sheet crop, edge-connected paper matte cleanup, largest figure component, proportional resize and transparent padding. No new drawing.',rendered_height:meta.height});
}
fs.writeFileSync(A+'/lovell-export-record.json',JSON.stringify(out,null,2)+'\n');
const composite=[];
for(let i=0;i<out.length;i++)composite.push({input:await sharp(A+'/runtime/'+out[i].filename).resize(384,512).toBuffer(),left:i*384,top:0});
await sharp({create:{width:768,height:512,channels:3,background:'#122630'}}).composite(composite).png().toFile(A+'/lovell-review.png');
console.log('Two Lovell portrait cuts ready.');
