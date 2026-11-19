// Reading examples are separate from the whole-note chord editor and from audio.
const NS='http://www.w3.org/2000/svg';
export function drawTechniqueNotation(host,notation,name){
 const V=globalThis.Vex?.Flow||globalThis.Vex;
 if(!V?.Renderer){host.textContent='谱例暂未载入；下方文字记谱说明仍可阅读。';return;}
 const ex=notation.example,kind=ex.kind;
 const fallback={single:[['a/4']],sequence:[['a/4'],['b/4'],['a/4'],['b/4']],chord:[['a/4','e/5']],tremolo:[['a/4']],graceRoll:[['a/4'],['a/4'],['a/4'],['a/4']],vibrato:[['a/4']],bend:[['a/4'],['b/4']],slur:[['a/4'],['b/4']],gliss:[['a/4'],['e/5']],trill:[['a/4']],harmonic:[['a/4']],noise:[['b/4/X2']],percussion:[['b/4/X2'],['b/4/X2'],['b/4/X2']]};
 const raw=ex.notes||fallback[kind]||fallback.single;
 const specs=raw.map(n=>typeof n==='string'?{keys:[n]}:Array.isArray(n)?{keys:n}:n);
 host.replaceChildren();
 const renderer=new V.Renderer(host,V.Renderer.Backends.SVG);renderer.resize(420,204);
 const ctx=renderer.getContext();ctx.setFillStyle('#3b5141').setStrokeStyle('#53634d');
 const unpitched=kind==='noise'||kind==='percussion';
 const stave=new V.Stave(18,62,384);stave.addClef(unpitched?'percussion':'treble').setContext(ctx).draw();
 const notes=specs.map((spec,i)=>{
  let keys=spec.keys||['a/4'];if(unpitched)keys=keys.map(k=>k.includes('/X')?k:k+'/X2');
  const note=new V.StaveNote({clef:unpitched?'percussion':'treble',keys,duration:spec.duration||ex.duration||(specs.length===1?'h':'q'),stem_direction:1});
  keys.forEach((key,j)=>{const a=key.split('/')[0].slice(1);if(['#','b','n'].includes(a))note.addModifier(new V.Accidental(a),j);});
  if(kind==='tremolo'||ex.tremolo)note.addModifier(new V.Tremolo(3),0);
  note.setStave(stave).setContext(ctx);return note;
 });
 const voice=new V.Voice({num_beats:4,beat_value:4}).setStrict(false).addTickables(notes);
 new V.Formatter().joinVoices([voice]).format([voice],278);
 const start=specs.length===1?176:107,end=specs.length===1?176:340;
 notes.forEach((note,i)=>{const x=start+(end-start)*i/Math.max(1,notes.length-1);note.getTickContext().setX(x-stave.getNoteStartX());note.draw();});
 const svg=host.querySelector('svg');svg.setAttribute('viewBox','0 0 420 204');svg.removeAttribute('width');svg.removeAttribute('height');svg.style.width='100%';svg.style.height='auto';svg.setAttribute('role','img');svg.setAttribute('aria-label',`${name}五线谱标记示例：${ex.text}。${notation.label}`);
 const add=(tag,attrs,text)=>{const el=document.createElementNS(NS,tag);Object.entries(attrs).forEach(([k,v])=>el.setAttribute(k,v));if(text!==undefined)el.textContent=text;svg.append(el);return el;};
 const label=(x,y,text,attrs={})=>add('text',{x,y,fill:'#59654d','font-family':'-apple-system, sans-serif','font-size':13,...attrs},text);
 const path=(d,attrs={})=>add('path',{d,fill:'none',stroke:'#6e7657','stroke-width':1.4,...attrs});
 const points=notes.map(n=>({x:n.getAbsoluteX()+6,y:n.getYs()[0]}));const noteYs=notes.flatMap(n=>n.getYs()),topY=Math.min(0,...noteYs.map(y=>y-55)),bottomY=Math.max(204,...noteYs.map(y=>y+55));svg.setAttribute('viewBox',`0 ${topY} 420 ${bottomY-topY}`);
 label(24,30,ex.text||name,{'font-size':14,fill:'#8b6040'});
 if(kind==='harmonic')points.forEach(p=>add('circle',{cx:p.x,cy:78,r:4.4,fill:'none',stroke:'#3b5141','stroke-width':1.4}));
 const wave=(x,y,width)=>{let d=`M ${x} ${y}`;for(let i=0;i<width;i+=12)d+=` q 3 -5 6 0 t 6 0`;path(d);};
 if(kind==='vibrato')wave(points[0].x-10,77,110);
 if(kind==='trill'){label(points[0].x-6,78,'tr',{'font-family':'Georgia,serif','font-style':'italic','font-weight':600,'font-size':22});wave(points[0].x+18,75,84);}
 if(kind==='slur'&&points.length>1){const a=points[0],b=points.at(-1),y=Math.max(a.y,b.y)+14;path(`M ${a.x} ${y} Q ${(a.x+b.x)/2} ${y+28} ${b.x} ${y}`);}
 if(kind==='bend'&&points.length>1){const a=points[0],b=points.at(-1),x=b.x-15,y=b.y-5;path(`M ${a.x+16} ${a.y-4} Q ${(a.x+b.x)/2} ${a.y-4} ${x} ${y}`);path(`M ${x-7} ${y+5} L ${x} ${y} L ${x-8} ${y-2}`);label((a.x+b.x)/2,75,ex.interval||'连续升高',{'text-anchor':'middle','font-size':10});}
 if(kind==='gliss'&&points.length>1){const a=points[0],b=points.at(-1);path(`M ${a.x+14} ${a.y-3} L ${b.x-15} ${b.y+3}`);label((a.x+b.x)/2,81,'gliss.',{'text-anchor':'middle','font-size':11,'font-style':'italic'});}
 if(kind==='graceRoll'){label(232,75,'四指依次',{'text-anchor':'middle','font-size':10});path('M 103 159 Q 222 188 347 159');}
 if(ex.traditionalMarks)points.forEach((p,i)=>{const mark=ex.traditionalMarks[i];if(!mark)return;const up=mark.includes('tiao'),count=mark.startsWith('double')?2:1;for(let j=0;j<count;j++){const x=p.x+(j-(count-1)/2)*7;path(up?`M ${x-3} 80 L ${x+3} 67`:`M ${x-3} 67 L ${x+3} 80`,{'stroke-width':1.8});}});
 if(ex.noteLabels)points.forEach((p,i)=>label(p.x,181,ex.noteLabels[i]||'',{'text-anchor':'middle','font-size':10}));
 if(ex.caption){const lines=[''];let length=0;for(const c of ex.caption){const size=c.charCodeAt(0)>255?1:.55;if(length+size>36){lines.push('');length=0;}lines[lines.length-1]+=c;length+=size;}lines.forEach((line,i)=>label(210,lines.length>1?182+i*14:190,line,{'text-anchor':'middle','font-size':10,fill:'#92917a'}));}
}
